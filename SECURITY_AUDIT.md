# 🛡️ Webix Security Audit & Hardening Plan

This document tracks known security vulnerabilities and their resolution status, particularly from the perspective of malicious users (Free Tier abuse, Container Escapes, DoS attacks).

## 🛑 1. Unencrypted Traffic (Man-in-the-Middle)
- **Vulnerability:** noVNC traffic and the VNC password in the URL are currently transmitted over plaintext HTTP.
- **Impact:** Critical (Credential theft, session hijacking).
- **Status:** ⏳ **Deferred to Deployment** - Will be resolved via Nginx Reverse Proxy with SSL/TLS termination.

## 🛑 2. Host DoS via Fork Bombs & I/O Starvation
- **Vulnerability:** Docker containers do not have a PID limit or I/O rate limits. A user can run a fork bomb (`:(){ :|:& };:`) to exhaust host PIDs, or write in an infinite loop to starve disk I/O, crashing the host VPS.
- **Impact:** High (Service outage for all users).
- **Status:** ✅ **Resolved** - Added `PidsLimit` and `BlkioWeight` constraints in `dockerService.js`.

## 🛑 3. Container Escape via Root Access
- **Vulnerability:** Standard Docker shares the host kernel. Granting `root` inside the container without capability drops allows kernel-level exploits to break out into the host OS.
- **Impact:** Critical (Total infrastructure compromise).
- **Status:** ✅ **Resolved** - Added `SecurityOpt: ['no-new-privileges:true']` and aggressively dropped dangerous kernel capabilities (`SYS_ADMIN`, `SYS_MODULE`, `SYS_PTRACE`, `NET_RAW`, etc.) in `dockerService.js`.

## 🛑 4. Billing & Session Race Conditions
- **Vulnerability:** Concurrent `POST /api/sessions` requests can bypass the "active session" check before the DB commits the first session, resulting in multiple spawned containers for a single user.
- **Impact:** Medium (Resource exhaustion, free tier abuse).
- **Status:** ✅ **Resolved** - Implemented a `sessionLocks` in-memory Mutex in `sessionRoutes.js` that blocks concurrent requests for the same `userId` during container creation.

## 🛑 5. Open Port Scanning
- **Vulnerability:** Docker binds noVNC ports to `0.0.0.0`, meaning anyone can scan the VPS IP and attempt to brute-force the VNC password directly, bypassing the Webix frontend.
- **Impact:** High (Unauthorized desktop access).
- **Status:** ⏳ **Deferred to Deployment** - Will be resolved by binding containers to `127.0.0.1` and using Nginx/Firewall as a gatekeeper.
