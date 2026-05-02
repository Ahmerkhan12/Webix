const Docker = require('dockerode');
const http = require('http');

// Connect to Docker daemon (defaults to socket on Linux/Mac, or named pipe on Windows)
const docker = new Docker();

// Removed manual port counter, we will let Docker assign random ports dynamically.

const crypto = require('crypto');

// Helper to wait until a URL is reachable
function waitForURL(url, maxRetries = 40, delayMs = 500) {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          res.resume();
          retry();
        }
      }).on('error', () => {
        retry();
      });
      req.setTimeout(delayMs, () => {
        req.destroy();
      });
    };

    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error(`Timeout waiting for URL: ${url}`));
      } else {
        setTimeout(check, delayMs);
      }
    };

    check();
  });
}

// Resource limits per subscription tier — PROFIT-AWARE
// Server basis: Hetzner CPX41 ~$50/mo, 16GB RAM, 8 vCPU
// Concurrency assumption: ~25% of subscribers active at once
const TIER_RESOURCES = {
  free: { memory: 512 * 1024 * 1024, nanoCpus: 500_000_000, storage: '5G', persistent: false }, // 512MB, 0.5 CPU, ephemeral
  hobbyist: { memory: 1 * 1024 * 1024 * 1024, nanoCpus: 1_000_000_000, storage: '20G', persistent: true }, // 1GB, 1 CPU — $5/mo
  developer: { memory: 4 * 1024 * 1024 * 1024, nanoCpus: 2_000_000_000, storage: '50G', persistent: true }, // 4GB, 2 CPU — $15/mo
  enterprise: { memory: 16 * 1024 * 1024 * 1024, nanoCpus: 8_000_000_000, storage: '500G', persistent: true }, // 16GB, 8 CPU — Custom
};

/**
 * Ensures a named Docker volume exists for the user.
 * Creates it if it doesn't yet exist.
 */
async function ensureUserVolume(userId) {
  const volumeName = `webix-home-${userId}`;
  try {
    // Try to inspect — if it throws, it doesn't exist yet
    await docker.getVolume(volumeName).inspect();
    console.log(`[Volume] Existing volume found: ${volumeName}`);
  } catch {
    // Volume not found — create it
    await docker.createVolume({ Name: volumeName });
    console.log(`[Volume] Created new volume: ${volumeName}`);
  }
  return volumeName;
}

/**
 * Create and start a new desktop container with dynamic resources and themes
 */
async function createContainer(userId, tier, options = {}) {
  const sessionPassword = crypto.randomBytes(8).toString('hex');
  const resources = TIER_RESOURCES[tier] || TIER_RESOURCES.free;

  // 1. Calculate Final Resources (Base + Add-ons)
  const addonRAM = (options.ram_addon_mb || 0) * 1024 * 1024;

  const finalMemory = resources.memory + addonRAM;

  // 2. Select Image based on OS Theme
  let imageName = 'antigravity-desktop:v1'; // Default
  if (options.os_theme === 'win11') imageName = 'webix-desktop:win11';
  if (options.os_theme === 'macos') imageName = 'webix-desktop:macos';

  // Only persistent tiers (Basic, Pro, Enterprise) get a Docker volume.
  // Free tier is ephemeral — all files are deleted when the session ends.
  const volumeName = resources.persistent ? await ensureUserVolume(userId) : null;
  const volumeBinds = volumeName
    ? [`${volumeName}:/home/ubuntu`]
    : [];

  if (resources.persistent) {
    console.log(`[Volume] Persistent storage enabled for user ${userId} (tier: ${tier})`);
  } else {
    console.log(`[Volume] Ephemeral session for user ${userId} (tier: free) — files will not persist`);
  }

  try {
    const container = await docker.createContainer({
      Image: 'antigravity-desktop:v1',
      Labels: {
        'webix.owner': userId,
        'webix.tier': tier
      },
      Env: [
        `VNC_PASSWORD=${sessionPassword}`,
        'VNC_RESOLUTION=1280x720'
      ],
      HostConfig: {
        PortBindings: {
          '6080/tcp': [{ HostPort: '0' }] // '0' = random available port
        },
        // Persistent Volume: only for paid tiers
        Binds: volumeBinds,
        ShmSize: 536870912, // 512MB shared memory
        Memory: resources.memory,
        NanoCPUs: resources.nanoCpus,
        StorageOpt: { size: resources.storage } // rootfs limit per tier
      }
    });

    await container.start();

    const data = await container.inspect();
    const assignedPort = data.NetworkSettings.Ports['6080/tcp'][0].HostPort;

    await waitForURL(`http://localhost:${assignedPort}/vnc.html`);

    const finalUrl = `http://localhost:${assignedPort}/vnc.html?autoconnect=true&password=${sessionPassword}&resize=remote`;

    console.log(`[Session] Container started for user ${userId} (tier: ${tier}) on port ${assignedPort}`);

    return {
      id: container.id,
      port: assignedPort,
      url: finalUrl,
      tier,
      volumeName
    };
  } catch (error) {
    console.error('Error creating container:', error);
    throw error;
  }
}

/**
 * Stops and removes a container by ID
 */
async function stopContainer(containerId) {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove();
    return true;
  } catch (error) {
    // If it's already stopped/removed, we might get a 404
    console.error(`Error stopping container ${containerId}:`, error.message);
    throw error;
  }
}

/**
 * Gets the status of a container
 */
async function getContainerStatus(containerId) {
  try {
    const container = docker.getContainer(containerId);
    const data = await container.inspect();
    return {
      id: data.Id,
      state: data.State.Status, // 'running', 'exited', etc.
      startedAt: data.State.StartedAt
    };
  } catch (error) {
    console.error(`Error getting status for ${containerId}:`, error.message);
    throw error;
  }
}

module.exports = {
  createContainer,
  stopContainer,
  getContainerStatus
};
