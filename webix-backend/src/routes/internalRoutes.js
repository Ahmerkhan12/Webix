const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const { createClient } = require('@supabase/supabase-js');

const docker = new Docker();

// Use the service role key — bypasses RLS so the backend can write on behalf of any user
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * POST /api/internal/install-event
 *
 * Called by dpkg-hook.sh and download-watcher.sh running INSIDE user containers.
 * This endpoint is NOT protected by JWT auth — it is only reachable from the
 * Docker bridge network (172.17.0.1), not from the public internet.
 * Never add this route to Nginx's public-facing config.
 *
 * Flow:
 *  1. Responds immediately (200 OK) so the hook script isn't blocked
 *  2. Logs the event to Supabase user_install_events table
 *  3. For apt/deb installs: runs `docker commit` to snapshot the container
 *     so the next session starts with software already installed (zero reinstall wait)
 */
router.post('/install-event', async (req, res) => {
  const {
    userId,
    action,
    method,
    package: packageName,
    filepath,
    timestamp
  } = req.body;

  // Basic validation
  if (!userId || !action || !method || !packageName) {
    return res.status(400).json({ error: 'Missing required fields: userId, action, method, package' });
  }

  // Respond immediately — don't make the in-container hook script wait
  res.json({ ok: true });

  // ── 1. Log to Supabase (non-blocking, after response) ────────────────────
  try {
    const { error } = await supabase.from('user_install_events').insert({
      user_id: userId,
      action,
      method,
      package_name: packageName,
      filepath: filepath || null,
      timestamp: timestamp || new Date().toISOString()
    });

    if (error) {
      console.error('[InstallEvent] Supabase insert error:', error.message);
    } else {
      console.log(`[InstallEvent] Logged: user=${userId} action=${action} method=${method} pkg=${packageName}`);
    }
  } catch (err) {
    console.error('[InstallEvent] Supabase unexpected error:', err.message);
  }

  // ── 2. docker commit snapshot (only for apt/deb installs) ────────────────
  // AppImages live in the persistent volume as files — they don't need a commit.
  // quota_exceeded and downloaded events also don't need a commit.
  if (action !== 'install' || !['apt', 'deb'].includes(method)) {
    return; // Nothing more to do
  }

  try {
    // Find the user's running container by label
    const containers = await docker.listContainers({
      filters: JSON.stringify({ label: [`webix.owner=${userId}`] })
    });

    if (containers.length === 0) {
      console.warn(`[Snapshot] No running container found for user ${userId}. Skipping commit.`);
      return;
    }

    const containerId = containers[0].Id;
    const container = docker.getContainer(containerId);
    const snapshotRepo = `webix-snapshot-${userId}`;

    console.log(`[Snapshot] Committing container ${containerId.slice(0, 12)} as ${snapshotRepo}:latest after installing: ${packageName}`);

    // docker commit — creates a new image layer from the current container filesystem state
    await container.commit({
      repo: snapshotRepo,
      tag: 'latest',
      comment: `Auto-snapshot after installing: ${packageName}`,
      author: 'webix-backend'
    });

    console.log(`[Snapshot] Successfully committed ${snapshotRepo}:latest for user ${userId}`);

  } catch (commitErr) {
    // Non-fatal — user will still have their install in this session.
    // Worst case: if session restarts before another install triggers a new commit,
    // they lose that package. But the persistent log still has the record.
    console.warn(`[Snapshot] docker commit failed for user ${userId}:`, commitErr.message);
  }
});

module.exports = router;
