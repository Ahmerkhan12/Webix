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

/**
 * Spins up a new Webix desktop container
 */
async function createContainer(userId) {
  // Generate a secure random password for this specific session
  const sessionPassword = crypto.randomBytes(8).toString('hex');
  
  try {
    const container = await docker.createContainer({
      Image: 'antigravity-desktop:v1',
      Labels: {
        'webix.owner': userId
      },
      Env: [
        `VNC_PASSWORD=${sessionPassword}`,
        'VNC_RESOLUTION=1280x720'
      ],
      HostConfig: {
        PortBindings: {
          '6080/tcp': [{ HostPort: '0' }] // '0' tells Docker to assign a random available port
        },
        ShmSize: 536870912, // 512MB
        Memory: 2147483648, // 2GB
        NanoCPUs: 1000000000, // 1 CPU
        StorageOpt: { size: '10G' } // Limits rootfs to 10GB (Requires XFS with pquota in production)
      }
    });

    await container.start();
    
    // Inspect the container to find out which random port Docker actually assigned
    const data = await container.inspect();
    const assignedPort = data.NetworkSettings.Ports['6080/tcp'][0].HostPort;
    
    // Wait for the container's noVNC proxy to actually be serving before returning
    await waitForURL(`http://localhost:${assignedPort}/vnc.html`);
    
    // Construct the final URL with query parameters for auto-connect
    const finalUrl = `http://localhost:${assignedPort}/vnc.html?autoconnect=true&password=${sessionPassword}&resize=remote`;
    
    return {
      id: container.id,
      port: assignedPort,
      url: finalUrl
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
