const { supabase } = require('../lib/supabase');
const dockerService = require('../services/dockerService');

// Config
const CHECK_INTERVAL_MS = 60 * 1000; // Run every minute
const MAX_IDLE_MINUTES = 10; // Shutdown after 10 minutes of no heartbeat
const FREE_TIER_MAX_MINUTES = 60; // 1 hour max session length for free tier

async function checkSessions() {
  console.log('[Worker] Running session auto-shutdown check...');

  try {
    // 1. Fetch all active sessions
    const { data: activeSessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    for (const session of activeSessions) {
      const now = new Date();
      const lastActiveAt = new Date(session.last_active_at || session.created_at);
      const createdAt = new Date(session.created_at);

      const idleMinutes = (now - lastActiveAt) / 60000;
      const totalMinutes = (now - createdAt) / 60000;

      let shouldStop = false;
      let reason = '';

      // Check 1: Inactivity (No Heartbeat)
      if (idleMinutes > MAX_IDLE_MINUTES) {
        shouldStop = true;
        reason = `Idle for > ${MAX_IDLE_MINUTES} minutes`;
      }

      // Check 2: Max duration for Free tier
      if (!shouldStop && session.tier === 'free' && totalMinutes > FREE_TIER_MAX_MINUTES) {
        shouldStop = true;
        reason = `Free tier duration limit reached (> ${FREE_TIER_MAX_MINUTES} mins)`;
      }

      if (shouldStop) {
        console.log(`[Worker] Stopping session ${session.id} (Container: ${session.container_id}). Reason: ${reason}`);
        
        // Mark as stopped in DB FIRST to ensure usage is tracked accurately
        await supabase.from('sessions')
          .update({ 
            status: 'stopped', 
            ended_at: now.toISOString() 
          })
          .eq('id', session.id);

        // Stop in Docker
        try {
          await dockerService.stopContainer(session.container_id);
          console.log(`[Worker] Successfully stopped container ${session.container_id}`);
        } catch (dockerErr) {
          console.warn(`[Worker] Warning: Failed to stop container ${session.container_id}: ${dockerErr.message}`);
        }
      } else {
        // Verify it's still running in Docker
        try {
          const status = await dockerService.getContainerStatus(session.container_id);
          if (status.state !== 'running') {
            console.log(`[Worker] Session ${session.id} marked as active but container is ${status.state}. Fixing DB state.`);
            await supabase.from('sessions')
              .update({ 
                status: 'stopped', 
                ended_at: now.toISOString() 
              })
              .eq('id', session.id);
          }
        } catch (dockerErr) {
            console.log(`[Worker] Session ${session.id} marked active but container missing. Fixing DB state.`);
            await supabase.from('sessions')
              .update({ 
                status: 'failed', 
                ended_at: now.toISOString() 
              })
              .eq('id', session.id);
        }
      }
    }
  } catch (err) {
    console.error('[Worker] Error during session check:', err);
  }
}

function startWorker() {
  console.log(`[Worker] Session auto-shutdown worker started (Interval: ${CHECK_INTERVAL_MS / 1000}s).`);
  checkSessions();
  setInterval(checkSessions, CHECK_INTERVAL_MS);
}

module.exports = { startWorker };
