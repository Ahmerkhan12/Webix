# 🐛 Bug Fixes & Known Issues

This file documents errors encountered during development, along with their solutions, to prevent us from having to solve the same problem twice.

---

## 🛑 Issue: Docker Desktop Not Running
**Symptom:** Pytest fails with `docker.errors.DockerException: Error while fetching server API version: (2, 'CreateFile', 'The system cannot find the file specified.') on //./pipe/docker_engine`.
**Solution:** This means the Docker daemon is offline. Ensure Docker Desktop is started on the Windows host machine before running the test suite or `docker-compose up`.

---

## 🛑 Issue: Missing `vncpasswd` command in Ubuntu 22.04 container
**Symptom:** `/entrypoint.sh: line 18: vncpasswd: command not found`
**Solution:** The `tigervnc-standalone-server` package does not always include the `vncpasswd` utility by default in its path, or it might require the `tigervnc-tools` or `tightvncserver` package instead depending on the Ubuntu repository. *(Fix currently in progress)*
**Actual Fix:** The real issue was that `entrypoint.sh` had Windows (CRLF) line endings causing the command to be read as `vncpasswd\r`. Converted to Linux (LF) line endings.

---

## 🛑 Issue: `novnc_proxy` not found
**Symptom:** `/entrypoint.sh: line 27: /usr/share/novnc/utils/novnc_proxy: No such file or directory`
**Solution:** In Ubuntu 22.04, the `novnc` package installs the proxy script directly to `/usr/bin/novnc_proxy` rather than the `utils/` directory. *(Fix currently in progress)*
**Actual Fix:** Ubuntu 22.04 `novnc` doesn't ship with `novnc_proxy`. Replaced it with direct `websockify` usage: `exec websockify --web /usr/share/novnc 6080 localhost:5901`.

---

## 🛑 Issue: XFCE session cleanly exited too early
**Symptom:** `Session startup via '/home/webix/.vnc/xstartup' cleanly exited too early (< 3 seconds)!`
**Solution:** The VNC server failed to start the desktop environment, likely because the `xstartup` script is missing executable permissions, or a core X11 dependency is missing. *(Fix currently in progress)*
**Actual Fix:** The `xstartup` script was backgrounding the desktop (`startxfce4 &`). TigerVNC terminates the X server if the script exits. Removed the `&` to keep it in the foreground.

---

## 🛑 Issue: Desktop iframe ignores mouse clicks
**Symptom:** User cannot interact with the desktop or move the cursor inside the noVNC overlay.
**Solution:** The CSS had `pointer-events: none` on the overlay. Updated the GSAP animation in `Dashboard.tsx` to set `pointerEvents: 'all'` when opening and `'none'` when closing.

---

## 🛑 Issue: noVNC stops at "Connect" screen
**Symptom:** The user is prompted to click "Connect" and enter a password rather than seeing the desktop immediately.
**Solution:** Added URL query parameters `?autoconnect=true&password=webix123&resize=remote` in `dockerService.js` to bypass the connection prompt and auto-scale the desktop.

---

## 🛑 Issue: Bind for 0.0.0.0:608x failed: port is already allocated
**Symptom:** API returns `500 server error - driver failed programming external connectivity... port is already allocated` when clicking "Start Session".
**Solution:** The backend was using a hardcoded counter (`currentPort++`) which would collide if a previous container didn't shut down or nodemon restarted. Replaced the manual counter with Docker's dynamic port assignment by setting `HostPort: '0'` and inspecting the container after boot to retrieve the dynamically assigned port.

---

## 🛑 Issue: Supabase "PGRST116" Missing Profile & Silent Settings Failures
**Symptom:** Accounts created before the database trigger was finalized lacked a `profiles` row. Frontend crashed with `PGRST116: The result contains 0 rows`. Profile picture uploads silently failed to display because `.update()` returned 0 rows affected.
**Solution:** Changed `.single()` to `.maybeSingle()` for profile fetches to allow graceful fallback. Swapped `.update()` to `.upsert()` in `SettingsView.tsx` so legacy accounts get their profile row created automatically on save. Added an `INSERT` RLS policy to `profiles` to allow this.

---

## 🛑 Issue: Backend TypeError `supabase.from is not a function`
**Symptom:** Backend API crashed with `supabase.from is not a function` when attempting to fetch profiles.
**Solution:** Fixed the import syntax in `sessionRoutes.js` to correctly destructure the Supabase client: `const { supabase } = require('../lib/supabase')`.

---

## 🛑 Issue: End Session Button Obstructing Workspace
**Symptom:** The floating "End Session" button in the top-right corner overlapped the standard close/minimize window controls of the virtual desktop.
**Solution:** Redesigned the button into a collapsible, sliding side-panel on the left edge of the screen, using CSS transforms (`translateX(-100%)`) to keep it completely hidden until the user needs it.

---

## 🛑 Issue: Usage Analytics Frozen at 0h 0m (Hanging Session End)
**Symptom:** Total usage time was not incrementing. Database `ended_at` remained null. Clicking "End Session" felt sluggish and hung for 10 seconds.
**Solution:** Docker's `stopContainer` default graceful timeout (10s) delayed or threw an error (if already stopped), preventing the DB `update` query from executing. Reversed the operation order to update the DB *before* stopping Docker. Added `t: 1` to force stop the container quickly, making the UI instantly responsive.

---

## 🛑 Issue: Free Plan Usage Not Resetting
**Symptom:** Free tier users have a 10h limit, but total usage wasn't resetting, meaning they would eventually be locked out forever.
**Solution:** Enforced the 10-hour limit in `POST /api/sessions`. Updated both the backend (`sessionRoutes.js`) and frontend (`SettingsView.tsx`) usage calculations to dynamically filter and sum only sessions created on or after the 1st day of the current calendar month (`startOfMonth`).
