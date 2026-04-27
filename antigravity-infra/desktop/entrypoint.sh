#!/bin/bash

# Ensure VNC_PASSWORD is set
if [ -z "$VNC_PASSWORD" ]; then
    echo "ERROR: VNC_PASSWORD environment variable is not set."
    exit 1
fi

echo "[INFO] Starting Webix Desktop Container..."

# Clean up stale locks
echo "[INFO] Cleaning up stale X11 locks..."
rm -rf /tmp/.X1-lock /tmp/.X11-unix/X1

# Set VNC password
echo "[INFO] Setting VNC password..."
mkdir -p ~/.vnc
echo "$VNC_PASSWORD" | vncpasswd -f > ~/.vnc/passwd
chmod 600 ~/.vnc/passwd

# Start VNC server
echo "[INFO] Starting VNC server on :1 with resolution ${VNC_RESOLUTION:-1280x720}..."
vncserver :1 -geometry ${VNC_RESOLUTION:-1280x720} -depth 24 -localhost

# Start noVNC proxy
echo "[INFO] Starting noVNC proxy on port 6080..."
exec /usr/bin/novnc_proxy --vnc localhost:5901 --listen 6080 --web /usr/share/novnc
