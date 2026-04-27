# 🚀 Webix

**Linux Desktop in the Browser.**

Webix is a cloud-based service that provides users with a fully functional Linux desktop environment accessible directly from their web browser. No plugins, no local installations—just a web link to a powerful desktop.

---

## 🏗️ Architecture

- **Frontend:** React, Tailwind CSS (Dashboard & Interface)
- **Backend:** Node.js, Express, MongoDB (User Management, Orchestration)
- **Infrastructure:** Docker, Nginx (Container Management, Reverse Proxy)
- **Streaming:** noVNC (HTML5 VNC Client)

## 📁 Repository Structure

- `/webix-infra`: Dockerfiles, `docker-compose.yml`, and testing scripts for the core containerized desktop image.
- `/webix-backend`: (Coming soon) Node.js orchestration API to manage user containers.
- `/webix-frontend`: (Coming soon) React dashboard for users.

## 🚀 Getting Started

*(Instructions will be added as the Phase 1 MVP is finalized.)*

### Prerequisites
- Docker and Docker Compose
- Python 3 (for running the automated test suite)

## 📝 Roadmap

1. **Phase 1 (MVP)**: Create the base Docker container (Ubuntu + XFCE + VNC + noVNC).
2. **Phase 2**: Build the Node.js backend to automate container spin-up/spin-down.
3. **Phase 3**: Develop the React frontend dashboard.
4. **Phase 4+**: Authentication, persistent storage (Docker volumes), and auto-scaling.

## 📄 License
MIT License
