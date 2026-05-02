const express = require('express');
const router = express.Router();
const dockerService = require('../services/dockerService');
const authenticate = require('../middleware/auth');
const { supabase } = require('../lib/supabase');

// In-memory mutex to prevent race conditions during session creation
const sessionLocks = new Set();

// Apply authentication to all session routes
router.use(authenticate);

// POST /api/sessions - Create a new desktop session (with auto-resume)
router.post('/', async (req, res) => {
  const userId = req.user.id;

  // Prevent concurrent requests from the same user (Race Condition / Sybil Attack prevention)
  if (sessionLocks.has(userId)) {
    return res.status(429).json({ error: 'Session creation already in progress. Please wait.' });
  }

  sessionLocks.add(userId);

  try {

    // 1. Fetch the user's subscription tier and add-ons
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, os_theme, storage_addon_gb, ram_addon_mb')
      .eq('id', userId)
      .maybeSingle();

    console.log(`[Session] POST /api/sessions invoked for user ${userId}. Profile found:`, !!profile);

    const tier = profile?.subscription_tier ?? 'free';
    const options = {
      os_theme: profile?.os_theme ?? 'ubuntu',
      storage_addon_gb: profile?.storage_addon_gb ?? 0,
      ram_addon_mb: profile?.ram_addon_mb ?? 0
    };

    // 1.5. Calculate usage for Free tier and enforce 10-hour limit
    if (tier === 'free') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: pastSessions } = await supabase
        .from('sessions')
        .select('created_at, ended_at')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())
        .not('ended_at', 'is', null);

      let totalMinutes = 0;
      if (pastSessions) {
        pastSessions.forEach(s => {
          totalMinutes += (new Date(s.ended_at) - new Date(s.created_at)) / 60000;
        });
      }

      if (totalMinutes >= 600) {
        return res.status(403).json({ error: 'Free tier limit (10 hours) reached. Please upgrade to a paid plan.' });
      }
    }

    // 2. Check for an already-active session (prevent duplicate containers)
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSession) {
      // Verify the container actually still exists in Docker
      try {
        const containerStatus = await dockerService.getContainerStatus(existingSession.container_id);
        if (containerStatus.state === 'running') {
          console.log(`[Session] Auto-resuming existing session for user ${userId}`);
          return res.status(200).json({
            message: 'Existing session resumed',
            session: {
              id: existingSession.container_id,
              port: existingSession.port,
              url: existingSession.url
            }
          });
        }
      } catch {
        // Container is gone but DB still says active — mark it as failed
        await supabase.from('sessions')
          .update({ status: 'failed', ended_at: new Date().toISOString() })
          .eq('id', existingSession.id);
      }
    }

    // 3. Create a fresh container
    const session = await dockerService.createContainer(userId, tier, options);

    // 4. Log full session details to DB
    await supabase.from('sessions').insert({
      user_id: userId,
      container_id: session.id,
      port: session.port,
      url: session.url,
      tier: tier,
      volume_name: session.volumeName ?? null,
      status: 'active'
    });

    res.status(201).json({
      message: 'Session created successfully',
      session
    });
  } catch (error) {
    console.error(`[Session Error] Failed to create session for user ${req.user?.id}:`, error);
    res.status(500).json({ error: 'Failed to create session', details: error.message || error });
  } finally {
    sessionLocks.delete(userId);
  }
});

// GET /api/sessions - Get session history for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, container_id, port, status, tier, created_at, ended_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ sessions: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
});

// GET /api/sessions/usage - Get persistent storage usage for the user
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.id;
    const usageBytes = await dockerService.getVolumeUsage(userId);
    res.json({ usageBytes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate storage usage' });
  }
});

// GET /api/sessions/:id - Get a single session's container status from Docker
router.get('/:id', async (req, res) => {
  try {
    const status = await dockerService.getContainerStatus(req.params.id);
    res.json({ status });
  } catch (error) {
    res.status(404).json({ error: 'Session not found or error retrieving status' });
  }
});

// DELETE /api/sessions/:id - Terminate a session
router.delete('/:id', async (req, res) => {
  try {
    // Update DB with stop time FIRST so we don't lose usage analytics if Docker fails
    await supabase.from('sessions')
      .update({ 
        status: 'stopped', 
        ended_at: new Date().toISOString() 
      })
      .eq('container_id', req.params.id);

    try {
      await dockerService.stopContainer(req.params.id);
    } catch (dockerErr) {
      console.warn(`[Docker] Non-fatal error stopping container ${req.params.id}: ${dockerErr.message}`);
    }

    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to terminate session', details: error.message });
  }
});

module.exports = router;
