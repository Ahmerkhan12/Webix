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
