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

---

## 🛑 Issue: `novnc_proxy` not found
**Symptom:** `/entrypoint.sh: line 27: /usr/share/novnc/utils/novnc_proxy: No such file or directory`
**Solution:** In Ubuntu 22.04, the `novnc` package installs the proxy script directly to `/usr/bin/novnc_proxy` rather than the `utils/` directory. *(Fix currently in progress)*

---

## 🛑 Issue: XFCE session cleanly exited too early
**Symptom:** `Session startup via '/home/webix/.vnc/xstartup' cleanly exited too early (< 3 seconds)!`
**Solution:** The VNC server failed to start the desktop environment, likely because the `xstartup` script is missing executable permissions, or a core X11 dependency is missing. *(Fix currently in progress)*
