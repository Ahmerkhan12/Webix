# Webix Project Progress

## Overview
| Phase | Title | Status |
| :--- | :--- | :--- |
| 1 | Core Desktop Service | Completed |
| 2 | Backend VNC Routing | Completed |
| 3 | Landing Page & Auth | Completed |
| 4 | Advanced User Management | Completed |
| 5 | Persistent Storage | Completed |
| 6 | Payment Integration | Completed |
| 7 | Session Security & Metrics | Completed |
| 8 | Auto-Shutdown & Scaling | Completed |
| 9 | Software Install Tracking | IN PROGRESS |

---

## Phase 1-4: Foundation & Core MVP (Completed)
- Base Docker image: Ubuntu 22.04 + XFCE + TigerVNC + noVNC
- Backend APIs: session create/stop/status with dockerode
- React frontend dashboard with GSAP animations and noVNC iframe
- Supabase Auth with profile management, profile pictures, RLS policies

## Phase 5: Persistent Storage (Completed)
- Per-user Docker volume `webix-home-{userId}` created on first session
- Tier-based CPU/RAM limits (Free/Hobbyist/Developer/Enterprise)
- NOTE: Bug discovered — volume was mounted to `/home/ubuntu` instead of `/home/webix`. Fixed in Phase 9.

## Phase 6: Monetization & Resources (Completed)
- 4-tier resource system (Free/Hobbyist/Developer/Enterprise) aligned to Hetzner CPX41 hardware costs
- Windows 11 and macOS visual themes (XFCE reskins, zero extra compute cost)
- Settings dashboard: Resource Allocation Summary, Theme selector, RAM add-ons
- `profiles` table extended with `os_theme`, `storage_addon_gb`, `ram_addon_mb`

## Phase 7: Billing, Metrics & Security (Completed)
- End-to-end Stripe Checkout integration with webhook-driven tier upgrades
- Real-time storage usage metrics via container-side `du` command
- Server-side Mutex lock to prevent concurrent container spawning (race condition / Sybil protection)
- Frontend API calls use `VITE_API_URL` environment variable

## Phase 8: Auto-Shutdown & Infrastructure (Completed)
- Session auto-shutdown worker (`sessionWorker.js`): stops containers after 10min idle or 1h for free users
- Heartbeat endpoint `POST /api/sessions/:id/heartbeat` to track active sessions
- Supabase migration `20260505_add_session_heartbeat.sql` adds `last_active_at` column
- `webix-backend/Dockerfile` and `webix-frontend/Dockerfile` created for production deployment
- `docker-compose.prod.yml` and Nginx config added for reverse proxy setup
- Attempted `~/.setup.sh` package reinstall on session start (later superseded in Phase 9 due to UX issues)

---

## Phase 9: Software Install Tracking (IN PROGRESS — 2026-05-18)

### Problem Being Solved
When a user installs software via `apt install` or downloads a `.deb`/`.AppImage` from Firefox,
it disappears on the next session because system paths are not in the persistent volume.
The previous Phase 8 workaround (re-running apt install on boot) caused 2-5 minute startup delays.

### Solution: docker commit Snapshot Approach
- After any install event, the backend runs `docker commit` on the user's container
- Creates a personal image `webix-snapshot-{userId}:latest`
- Next session starts from this snapshot — software already installed — startup stays ~5 seconds

### Files Being Created
- `webix-infra/desktop/scripts/dpkg-hook.sh` — APT post-invoke hook, logs installs, fires webhook
- `webix-infra/desktop/scripts/download-watcher.sh` — inotifywait daemon watching ~/Downloads
- `webix-infra/desktop/apt-hook/99webix-tracker` — APT config to call the hook
- `supabase/migrations/20260518_add_install_events.sql` — analytics table
- `webix-backend/src/routes/internalRoutes.js` — internal webhook endpoint + docker commit logic

### Files Being Modified
- `webix-infra/desktop/Dockerfile` — add inotify-tools, libnotify-bin, bc, dpkg-dev; copy scripts
- `webix-backend/src/services/dockerService.js`:
  - FIX: `/home/ubuntu` -> `/home/webix` in volume bind (critical bug)
  - ADD: `USER_ID`, `STORAGE_LIMIT_GB`, `BACKEND_PORT` env vars to container
  - ADD: prefer `webix-snapshot-{userId}` image over base image if snapshot exists
  - REMOVE: hacky inline apt-wrapper setup script block
- `webix-backend/src/index.js` — mount `/api/internal` routes (no JWT auth)

### Bugs Fixed in This Phase
- Volume mount path bug: `/home/ubuntu` -> `/home/webix`
- Startup delay bug: apt reinstall approach replaced by docker commit snapshots
