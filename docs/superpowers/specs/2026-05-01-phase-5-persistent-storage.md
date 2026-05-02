# Phase 5: Persistent Storage & Resource Management

## 🚀 Overview
Phase 5 focuses on transforming the Webix desktop from a temporary playground into a persistent workstation. We will implement per-user Docker volumes and enforce resource limits based on subscription tiers.

## 🏗️ Architecture

### 1. Persistent Volumes (PV)
- **Mapping**: Each user will have a dedicated Docker Volume named `webix-home-{{user_id}}`.
- **Mount Point**: This volume will be mounted to `/home/ubuntu` inside the container.
- **Persistence**: Data saved in the home directory will persist even if the container is stopped or deleted.

### 2. Backend Logic (Node.js)
- **Container Creation**: Update `sessionController.js` to include the `--volume` flag.
- **Volume Management**: Logic to ensure the volume is created if it doesn't exist during the first launch.
- **Resource Constraints**:
    - **Free**: 1 CPU, 2GB RAM.
    - **Pro**: 4 CPU, 8GB RAM.
    - **Enterprise**: Custom.

### 3. Frontend Enhancements
- **Storage Metrics**: Show "Storage Used" vs "Storage Limit" in the Settings view.
- **Resource Badge**: Visual confirmation of the CPU/RAM allocated to the current session.

## ✅ Success Criteria
- [ ] User files in `/home/ubuntu` survive a session restart.
- [ ] Different users have completely isolated storage.
- [ ] Container launches with correct CPU/RAM limits based on the `profiles.subscription_tier`.
- [ ] Storage usage is visible in the Settings dashboard.
