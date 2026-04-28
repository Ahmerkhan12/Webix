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

**Phase 4 — Auth + User Management (Active Focus)**:
- Implement Supabase for authentication (JWT).
- Setup Supabase PostgreSQL to track registered users and subscription tiers.
- Link Docker session creation to authenticated user IDs.

---

## 🧠 Reality Check (Hard Points)
- Scaling costs and performance tuning.
- Abuse prevention (crypto mining, malware).
- Resource isolation between users.
