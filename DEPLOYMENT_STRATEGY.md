# Webix Deployment Strategy

Deploying a system that dynamically provisions Docker containers and streams Linux desktops over WebSockets requires a robust architecture. Based on our `project_context.md`, we will follow a phased approach, starting with a powerful single-server MVP and eventually scaling out.

Here is exactly how we are going to deploy Webix to production.

## 1. Server Provisioning & OS Setup
For the MVP, we need a single beefy Virtual Private Server (VPS) or Bare Metal server (e.g., Hetzner, DigitalOcean, or AWS EC2).
- **Operating System:** Ubuntu 22.04 LTS or Debian 12.
- **Filesystem (Critical):** The main partition where Docker stores its data (`/var/lib/docker`) MUST be formatted as **XFS** with `pquota` (Project Quotas) enabled. This is what allows our `StorageOpt: { size: '10G' }` code to actually enforce the 10GB limit per user.
- **Resources:** At least 16GB-32GB RAM and multiple CPU cores, as each container requires ~1-2GB RAM to run a smooth desktop.

## 2. Dynamic WebSocket Proxying (The Network Challenge)
Currently, your frontend connects directly to `localhost:6081` when a container spins up. In production, we cannot expose thousands of random ports through the firewall, nor can we use `localhost` (since that resolves to the user's local laptop).

**The Solution:** We will implement a dynamic reverse proxy.
- **Nginx or Traefik:** We can use Traefik, which natively listens to Docker events. When our Node.js backend spins up `antigravity-desktop:v1`, Traefik automatically detects it and creates a secure route (e.g., `https://webix.com/desktop/user-123`).
- **Node.js Proxying:** Alternatively, we can use a package like `http-proxy-middleware` inside your Express backend. The frontend connects to `wss://api.webix.com/connect?port=6081`, and the backend proxies the WebSocket traffic securely to the local Docker container.

## 3. Deployment Flow (MVP Phase)

We will use **Docker Compose** to manage the core infrastructure:

1. **Frontend Container:** A lightweight Nginx container serving the built Vite/React assets.
2. **Backend Container:** The Node.js Express server.
   - *Note:* The backend container will need access to the host's Docker socket (`-v /var/run/docker.sock:/var/run/docker.sock`) so it has permission to spawn the desktop containers on the host.
3. **Database:** A MongoDB container to handle user data and session states.
4. **Desktop Containers (Dynamically spawned):** Spawned directly on the host network or a dedicated Docker bridge network by the backend.

## 4. Security & Isolation
- **No Privileged Mode:** Desktop containers will run unprivileged to prevent sandbox escapes.
- **Resource Limits:** Hard limits on Memory (2GB), CPU (1 Core), and Storage (10GB) using Docker's native constraints (which we've already started implementing in `dockerService.js`).
- **Network Isolation:** Desktop containers will be placed on an isolated Docker network without access to the Backend/Database networks, so a malicious user cannot attack the main database from inside their Linux desktop.

## 5. Scaling Beyond MVP (Phase 10+)
Once a single server runs out of RAM (e.g., 30 concurrent users on a 64GB server), we will hit a bottleneck.
To scale horizontally:
1. **Kubernetes (K8s) or Docker Swarm:** Instead of `dockerode` talking to a local socket, the backend will talk to a Kubernetes API to spawn pods across multiple servers in a cluster.
2. **Redis:** A centralized Redis instance will track which server holds which user's session so the proxy knows where to route traffic.
3. **Apache Guacamole:** We will eventually replace `noVNC` with Guacamole, which is much more performant, uses less bandwidth, and supports clipboard sharing and audio out of the box.

## 6. Proposed Subscription Plans (Phase 6 & 11)
Since Docker allows us to hard-limit resources per container, we can easily monetize the platform by offering tiered plans based on computational power and persistence.

### Tier 1: Free / Trial Plan
- **RAM:** 512MB - 1GB
- **CPU:** 0.5 Cores
- **Storage:** 5GB (Ephemeral - deleted when session ends)
- **Session Limit:** Max 1 hour per session.
- **Use Case:** Students, quick web browsing, testing scripts.

### Tier 2: Basic / Hobbyist Plan (~$5-$10/month)
- **RAM:** 2GB - 4GB
- **CPU:** 2 Cores
- **Storage:** 20GB (Persistent - saved to a dedicated Docker Volume)
- **Session Limit:** Unlimited.
- **Use Case:** Light software development, everyday browsing.

### Tier 3: Pro / Developer Plan (~$20+/month)
- **RAM:** 8GB+
- **CPU:** 4+ Cores
- **Storage:** 50GB+ (Persistent & SSD Backed)
- **Network:** Uncapped Bandwidth
- **Use Case:** Heavy compiling, data science, running heavy IDEs natively in the browser.

*Implementation Note:* We will implement this by passing dynamic variables into our `dockerService.js` `HostConfig` based on the user's JWT token/Stripe subscription status.
