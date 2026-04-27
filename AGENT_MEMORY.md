# 🤖 AI Agent Memory & Project Context

**Purpose:** This file serves as the persistent memory and context for AI agents working on this project. The AI should read this file at the beginning of sessions to understand the project state, progress, and upcoming implementations without requiring the user to repeat the context.

---

## 🚀 Project Overview: Webix
Webix is a "Linux Desktop in Browser" service designed to provide users with a functional, cloud-based Linux environment accessible purely through a web browser.

**Tech Stack:**
- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js (Express), MongoDB
- **Infrastructure**: Docker, Nginx, VPS (DigitalOcean/Hostinger)
- **Streaming**: noVNC (initial), Apache Guacamole (future)

---

## 📈 Current Progress

**Status:** IN PROGRESS (Phase 1: Core MVP)

**Completed:**
- Initial project architecture definition.
- `docker-compose.yml` structure for the infrastructure layer.
- Drafted `entrypoint.sh` for starting Xvfb, x11vnc, and novnc.
- Drafted `Dockerfile` for the Ubuntu + XFCE + VNC base image.

**Currently Working On:**
- Finalizing the `webix-desktop` Docker image.
- Ensuring the container successfully boots and streams the Linux desktop via `http://localhost:6080`.
- Debugging VNC and noVNC startup sequence in `entrypoint.sh`.

---

## 🛣️ Upcoming Implementations (Roadmap)

1. **Phase 2: Backend Control System**
   - Automate container creation per user.
   - Build API endpoints (`/create-session`, `/stop-session`, `/session/:id`).
   - Integrate Docker Engine API for container lifecycle management.

2. **Phase 3: Frontend Dashboard**
   - Basic React interface for users to login and view their dashboard.
   - Implement "Start/Stop Desktop" controls.
   - Embed the desktop stream via iframe.

3. **Phase 4: Auth & Persistence**
   - JWT authentication via Node.js/MongoDB.
   - User data persistence using Docker volumes mapping.

4. **Phase 5 & Beyond: Scalability & Resource Management**
   - RAM and CPU limits per user.
   - Nginx reverse proxy routing.
   - Auto-shutdown after inactivity.

---

## 🧠 User Preferences & Development Rules

- **Code Placement:** Code should be written in `d:\ahmer work\side_project\`. Subdirectories exist for `webix-infra`, `webix-backend`, etc.
- **Operating System:** The user is on Windows, but the deployment targets are Docker/Linux. Commands should account for Windows paths when run locally (e.g., PowerShell).
- **Updates:** As progress is made, the AI must update the **Current Progress** and **Upcoming Implementations** sections of this file to maintain an accurate state.
