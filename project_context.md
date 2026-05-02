# Webix — Project Context & Requirements

## 🚀 Overview
Webix is a "Linux Desktop in Browser" service designed to provide users with a functional, cloud-based Linux environment accessible purely through a web browser. The project follows a multi-phase roadmap from a core MVP to a scalable, production-ready system.

---

## 🏗️ Architecture Stack
- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js (Express), Supabase (PostgreSQL + Auth)
- **Infrastructure**: Docker, Nginx, VPS (DigitalOcean/Hostinger)
- **Streaming**: noVNC (initial), Apache Guacamole (future)

---

## 🧱 Implementation Roadmap

### Phase 0: Foundation
- Setup project repositories: `webix-frontend`, `webix-backend`, `webix-infra`.
- Environment setup: Docker, Node.js, MongoDB, Nginx.

### Phase 1: Linux Desktop in Browser (Core MVP)
- Create Base Docker Image (Ubuntu + XFCE + VNC server).
- Add Browser Streaming via noVNC.
- Optimize container for RAM and performance.

### Phase 2: Backend Control System
- Automate container creation per user.
- Build APIs: `POST /create-session`, `POST /stop-session`, `GET /session/:id`.
- Docker integration for container management.

### Phase 3: Frontend Dashboard
- User-friendly interface (Login/Register, Dashboard).
- "Start/Stop Desktop" controls.
- Interactive desktop view (via iframe).

### Phase 4: Auth + User Management
- JWT authentication.
- MongoDB for user data and session state.

### Phase 5: Persistent Storage
- User data persistence using Docker volumes (`-v /users/123:/home/user`).

### Phase 6: Resource Management
- RAM and CPU limits per user (Free/Basic/Pro plans).

### Phase 7: Domain + Proxy Setup
- Nginx reverse proxy for clean URLs (`user123.webix.com`).

### Phase 8: Session Management
- Auto-shutdown after inactivity to reduce costs.

### Phase 9: Deployment
- Live MVP on VPS using Docker Compose and Nginx.

### Phase 10: Scale (Post-MVP)
- Redis for session tracking.
- Load balancers and Kubernetes for auto-scaling.
- Replace noVNC with Apache Guacamole for better performance.

### Phase 11 & 12: Security & Billing
- Container isolation and security monitoring.
- Stripe integration for subscriptions.

---

## 🎯 Current Focus

**Phase 1 — Core MVP (Completed)**: 
- Building the `webix-desktop` Docker image.
- Enabling browser access via `http://server-ip:6080`.

**Phase 3 — Frontend Dashboard (Completed)**: 
- Connected the `Dashboard.tsx` to the Node.js Docker API.
- Implemented GSAP animated overlay for desktop UI.
- Desktop successfully rendering via `noVNC` iframe.

**Phase 4 — Auth + User Management (Completed)**:
- Integrated Supabase Authentication with Profile management.
- Implemented storage-based profile pictures and full database synchronization.
- Added session tracking and a premium "Pro Max" dashboard UI.
- Finalized account settings including password resets and tier tracking.

**Phase 5 — Persistent Storage (Completed)**:
- Implementing Docker Volume mounting to ensure user data survives session restarts.
- Set up per-user storage isolation via dedicated volume naming conventions (`webix-home-{userId}`).
- Integrated resource limits (CPU/RAM) into the container launch logic based on user tiers.

**Phase 6 — Resource Management & Polish (Completed)**:
- Usage tracking implemented with aggressive, background-first DB updates and monthly resets (10h Free limit).
- Session End controls redesigned to a sleek, collapsible side-panel for zero workspace obstruction.
- Smooth transition states implemented in UI (GSAP) with optimistic rendering on session end.
- Added Profile row auto-migration (`.upsert`) for legacy users to fix sync bugs.

**Phase 7 — Billing, Metrics & Security (Completed)**:
- End-to-end Stripe Checkout integration with webhook-driven tier upgrades.
- Real-time Persistent Storage usage metrics (GB) exposed to Settings dashboard.
- Backend Mutex locking implemented to prevent session race conditions.
- Secured frontend API communication via environment variables.

**Phase 8 — Auto-Shutdown & Infrastructure (Active Focus)**:
- Implementing background workers for idle session cleanup.
- Preparing production Nginx configuration and domain routing.

## 🧠 Reality Check (Hard Points)
- **Volume Lifecycle**: Managing volume cleanup while preventing accidental data loss.
- **Resource Gating**: Ensuring real-time enforcement of CPU/RAM limits without killing active user sessions.
- **Scaling**: Managing hundreds of concurrent volumes on a single host.

## ⚠️ Known Gaps & Deferred Work

### Installed Packages Not Persistent (Deferred to Phase 6)
- **Problem**: `apt install` packages are installed into the container's rootfs layer, which is destroyed when the session ends. Only `/home/ubuntu` (the volume) survives.
- **Impact**: Low — VS Code, Git, Python, Firefox, and other dev tools are pre-baked into the image.
- **Planned Fix**:
  - **Option A** *(Recommended)*: Pre-bake commonly requested community tools into the `antigravity-desktop` Docker image.
  - **Option B**: Auto-execute a user-defined `~/.setup.sh` script on container start to re-install custom packages.

### Storage Usage Metrics (Deferred to Phase 6)
- **Problem**: Users can't currently see how much disk space they've used within the Settings dashboard.
- **Planned Fix**: Expose a `/api/sessions/storage` endpoint that queries Docker volume disk usage and return it to the frontend.

