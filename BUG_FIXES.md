# Bug Fixes & Known Issues

This file documents errors encountered during development, along with their solutions, to prevent us from having to solve the same problem twice.

---

## Issue: Docker Desktop Not Running
**Symptom:** Pytest fails with `docker.errors.DockerException: Error while fetching server API version`.
**Solution:** Docker daemon is offline. Start Docker Desktop before running tests or `docker-compose up`.

---

## Issue: Missing vncpasswd command in Ubuntu 22.04 container
**Symptom:** `/entrypoint.sh: line 18: vncpasswd: command not found`
**Actual Fix:** `entrypoint.sh` had Windows (CRLF) line endings causing the command to be read as `vncpasswd\r`. Converted to Linux (LF) line endings.

---

## Issue: novnc_proxy not found
**Symptom:** `/entrypoint.sh: line 27: /usr/share/novnc/utils/novnc_proxy: No such file or directory`
**Actual Fix:** Ubuntu 22.04 `novnc` does not ship with `novnc_proxy`. Replaced with direct `websockify` usage: `exec websockify --web /usr/share/novnc 6080 localhost:5901`.

---

## Issue: XFCE session cleanly exited too early
**Symptom:** `Session startup via '/home/webix/.vnc/xstartup' cleanly exited too early (< 3 seconds)!`
**Actual Fix:** The `xstartup` script was backgrounding the desktop (`startxfce4 &`). TigerVNC terminates the X server if the script exits. Removed the `&` to keep it in the foreground.

---

## Issue: Desktop iframe ignores mouse clicks
**Symptom:** User cannot interact with the desktop or move the cursor inside the noVNC overlay.
**Solution:** The CSS had `pointer-events: none` on the overlay. Updated the GSAP animation in `Dashboard.tsx` to set `pointerEvents: 'all'` when opening and `'none'` when closing.

---

## Issue: noVNC stops at "Connect" screen
**Symptom:** The user is prompted to click "Connect" and enter a password rather than seeing the desktop immediately.
**Solution:** Added URL query parameters `?autoconnect=true&password=webix123&resize=remote` in `dockerService.js` to bypass the connection prompt and auto-scale the desktop.

---

## Issue: Port already allocated
**Symptom:** API returns `500 server error - driver failed programming external connectivity... port is already allocated`.
**Solution:** Replaced hardcoded port counter with Docker dynamic port assignment (`HostPort: '0'`) and inspect the container after boot to retrieve the assigned port.

---

## Issue: Supabase PGRST116 Missing Profile & Silent Settings Failures
**Symptom:** Frontend crashed with `PGRST116: The result contains 0 rows`. Profile picture uploads silently failed.
**Solution:** Changed `.single()` to `.maybeSingle()` for profile fetches. Swapped `.update()` to `.upsert()` in `SettingsView.tsx`. Added an `INSERT` RLS policy to `profiles`.

---

## Issue: Backend TypeError supabase.from is not a function
**Symptom:** Backend API crashed with `supabase.from is not a function`.
**Solution:** Fixed the import syntax in `sessionRoutes.js`: `const { supabase } = require('../lib/supabase')`.

---

## Issue: End Session Button Obstructing Workspace
**Symptom:** The floating "End Session" button overlapped the virtual desktop window controls.
**Solution:** Redesigned to a collapsible sliding side-panel using CSS transforms (`translateX(-100%)`).

---

## Issue: Usage Analytics Frozen at 0h 0m
**Symptom:** Total usage time was not incrementing. `ended_at` remained null. UI hung for 10 seconds.
**Solution:** Reversed the operation order: update DB *before* stopping Docker. Added `t: 1` to force stop the container immediately.

---

## Issue: Free Plan Usage Not Resetting
**Symptom:** Free tier users (10h limit) would eventually be locked out forever as usage accumulated across months.
**Solution:** Updated usage calculations to filter sessions by `created_at >= startOfMonth` in both backend and frontend.

---

## CRITICAL BUG: Persistent Volume Mounted to Wrong Path
**Discovered:** 2026-05-18
**Symptom:** Files saved by paid-tier users do not survive session restarts. The Docker volume exists but nothing persists.
**Root Cause:** `dockerService.js` mounts the volume to `/home/ubuntu`, but the container user is `webix` with home at `/home/webix`. Files go into an unmounted dead path.
```js
// BROKEN:
[`${volumeName}:/home/ubuntu`]
// FIXED:
[`${volumeName}:/home/webix`]
```
**Status:** Fixed in Phase 9 implementation (2026-05-18).

---

## Issue: Inline APT Wrapper Caused 2-5 Min Session Startup Delay
**Discovered:** 2026-05-18
**Symptom:** After a user installed any software (e.g., VLC), every subsequent session start took 2-5 minutes waiting for `apt install` to re-download and reinstall packages.
**Root Cause:** The Phase 8 `~/.setup.sh` approach re-ran `apt install` from scratch on every container boot.
**Fix:** Replaced with `docker commit` snapshot approach. After each install, the backend commits the container as `webix-snapshot-{userId}:latest`. Next session starts from this snapshot — binaries already present, startup stays ~5 seconds.
**Status:** Fixed in Phase 9 implementation (2026-05-18).
