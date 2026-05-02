# Webix Deployment Strategy

Deploying a system that dynamically provisions Docker containers and streams Linux desktops over WebSockets requires a robust architecture. Based on our `project_context.md`, we will follow a phased approach, starting with a powerful single-server MVP and eventually scaling out.

Here is exactly how we are going to deploy Webix to production.

## 1. Recommended MVP Stack (Hetzner + Cloudflare)
For the MVP, we will use a single powerful VPS and leverage Cloudflare's edge network for security and speed.

- **Primary Server:** **Hetzner CPX41** (~$50/mo)
  - 16GB RAM / 8 vCPU / 240GB NVMe
  - Operating System: Ubuntu 22.04 LTS
- **Storage Layer:** **XFS with pquota** enabled for `/var/lib/docker` (mandatory for `StorageOpt` limits).
- **Edge Layer:** **Cloudflare Free Tier**
  - CDN for frontend assets.
  - DDoS protection for the API.
  - **Cloudflare Tunnel (`cloudflared`)** to securely expose VNC/API traffic without opening firewall ports.

| Component | Provider | Cost |
| :--- | :--- | :--- |
| **Compute / Containers** | Hetzner CPX41 | ~$50/mo |
| **Edge / Security / Tunnel** | Cloudflare | $0 (Free) |
| **Auth / Database** | Supabase | $0 (Free Tier) |
| **TOTAL MVP COST** | | **~$50/mo** |

## 2. Secure Access via Cloudflare Tunnel
Instead of exposing thousands of random ports (6080, 6081, etc.) through the server's firewall, we will use **Cloudflare Tunnel**.

1.  **The Tunnel**: A `cloudflared` agent runs on the Hetzner host.
2.  **Dynamic Routing**: The backend creates a unique internal port for each container.
3.  **Secure Proxy**: The backend (or a local Traefik instance) directs traffic from a single subdomain (e.g., `*.webix.com`) through the tunnel to the specific container port.
4.  **Benefits**: Zero open inbound ports, automatic SSL, and built-in DDoS protection.

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
