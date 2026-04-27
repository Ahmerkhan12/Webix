const Docker = require('dockerode');

// Connect to Docker daemon (defaults to socket on Linux/Mac, or named pipe on Windows)
const docker = new Docker();

// In Phase 2, we use a simple counter for host ports. 
// In production, we would use a more robust pool or let Docker assign random ports.
let currentPort = 6081;

/**
 * Spins up a new Webix desktop container
 */
async function createContainer() {
  const hostPort = currentPort++;
  
  try {
    const container = await docker.createContainer({
      Image: 'webix-desktop:v1',
      Env: [
        'VNC_PASSWORD=webix123',
        'VNC_RESOLUTION=1280x720'
      ],
      HostConfig: {
        PortBindings: {
          '6080/tcp': [{ HostPort: hostPort.toString() }]
        },
        ShmSize: 536870912, // 512MB
        Memory: 2147483648, // 2GB
        NanoCPUs: 1000000000 // 1 CPU
      }
    });

    await container.start();
    
    return {
      id: container.id,
      port: hostPort,
      url: `http://localhost:${hostPort}/vnc.html`
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
