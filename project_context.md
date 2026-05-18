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

## ⚠️ Known Gaps & Active Work

### Phase 9: Software Install Tracking (IN PROGRESS — 2026-05-18)
- **Problem**: When a user installs software via `apt install` or downloads a `.deb`/`.AppImage` from Firefox, it disappears on the next session because system paths (`/usr/bin`, `/usr/share`) are NOT in the persistent volume.
- **Solution Architecture**:
  - **APT Hook** (`/etc/apt/apt.conf.d/99webix-tracker`): Fires `dpkg-hook.sh` after every package install/remove. Logs to `/home/webix/.webix/installed_packages.log`.
  - **Download Watcher** (`inotifywait`): Watches `~/Downloads` for `.deb` and `.AppImage` files dropped by Firefox. Auto-installs `.deb` and makes `.AppImage` executable with desktop shortcut.
  - **`docker commit` Snapshot**: After every install, the backend commits the user's running container as `webix-snapshot-{userId}:latest`. Next session starts from this snapshot — **zero reinstall wait time**.
  - **Webhook**: Scripts inside the container call `http://172.17.0.1:3000/api/internal/install-event` to record events in Supabase `user_install_events` table for analytics.
- **Critical Bug Being Fixed Simultaneously**: The persistent volume is currently mounted to `/home/ubuntu` instead of `/home/webix`, meaning persistence is effectively broken for all users.

### Storage Quota Enforcement (Part of Phase 9)
- Storage limit per tier is enforced inside the container via `du -sb /home/webix` check in hook scripts before any install.

