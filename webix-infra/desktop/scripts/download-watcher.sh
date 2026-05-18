#!/bin/bash
# =============================================================
# Webix Download Watcher — Background Daemon
# Installed at: /usr/local/bin/download-watcher.sh
# Started by:   ~/.vnc/xstartup when XFCE desktop launches
#
# Watches ~/Downloads for files dropped by Firefox.
# Handles:
#   .deb      — auto-installs with dpkg + apt-get -f
#   .AppImage — makes executable, creates .desktop shortcut
#   .sh/.run  — makes executable only (security: no auto-run)
# =============================================================

WATCH_DIR="/home/webix/Downloads"
LOCAL_BIN="/home/webix/.local/bin"
APPLICATIONS_DIR="/home/webix/.local/share/applications"
LOG_FILE="/home/webix/.webix/installed_packages.log"
WEBHOOK_URL="http://172.17.0.1:${BACKEND_PORT:-3000}/api/internal/install-event"

# Ensure required dirs exist
mkdir -p "$WATCH_DIR" "$LOCAL_BIN" "$APPLICATIONS_DIR" /home/webix/.webix

echo "[download-watcher] Started. Watching: $WATCH_DIR" >> /home/webix/.webix/watcher.log

# inotifywait loop — fires on file close_write or move_in (covers browser saves and moves)
inotifywait -m -e close_write -e moved_in \
  "$WATCH_DIR" \
  --format '%f' 2>/dev/null |

while read -r filename; do
  filepath="${WATCH_DIR}/${filename}"
  extension="${filename##*.}"
  timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  echo "[download-watcher] Detected: $filename (.$extension)" >> /home/webix/.webix/watcher.log

  # Skip temp/partial download files (Firefox uses .part suffix)
  [[ "$filename" == *.part ]] && continue
  [ ! -f "$filepath" ] && continue

  # ── Storage quota check (applies to ALL file types) ──────────────────
  FILE_BYTES=$(stat -c%s "$filepath" 2>/dev/null || echo 0)
  USED_BYTES=$(du -sb /home/webix 2>/dev/null | awk '{print $1}')
  LIMIT_BYTES=$(( ${STORAGE_LIMIT_GB:-20} * 1073741824 ))

  if [ $(( ${USED_BYTES:-0} + ${FILE_BYTES:-0} )) -gt "${LIMIT_BYTES}" ]; then
    DISPLAY=:1 notify-send "Webix Storage" \
      "Not enough storage for '$filename'. Free up space first." \
      --icon=dialog-error 2>/dev/null || true
    rm -f "$filepath"
    echo "quota_exceeded|download|${filename}|${filepath}|${timestamp}" >> "$LOG_FILE"
    continue
  fi

  # ── Handle .deb packages ─────────────────────────────────────────────
  if [ "$extension" = "deb" ]; then
    DISPLAY=:1 notify-send "Webix" "Installing ${filename}..." \
      --icon=system-software-install 2>/dev/null || true

    # Install the .deb, then fix any broken dependencies
    DEBIAN_FRONTEND=noninteractive dpkg -i "$filepath" 2>> /home/webix/.webix/watcher.log
    DEBIAN_FRONTEND=noninteractive apt-get install -f -y 2>> /home/webix/.webix/watcher.log

    echo "install|deb|${filename}|${filepath}|${timestamp}" >> "$LOG_FILE"

    DISPLAY=:1 notify-send "Webix" "${filename} installed successfully!" \
      --icon=dialog-information 2>/dev/null || true

    # Notify backend → logs to Supabase + triggers docker commit snapshot
    curl -s -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      --connect-timeout 2 --max-time 3 \
      -d "{
        \"userId\": \"${USER_ID}\",
        \"action\": \"install\",
        \"method\": \"deb\",
        \"package\": \"${filename}\",
        \"filepath\": \"${filepath}\",
        \"timestamp\": \"${timestamp}\"
      }" > /dev/null 2>&1 &

  # ── Handle .AppImage files ────────────────────────────────────────────
  elif [ "$extension" = "AppImage" ]; then
    chmod +x "$filepath"
    APP_NAME="${filename%.AppImage}"

    # Create a .desktop entry so app appears in the XFCE application menu
    cat > "${APPLICATIONS_DIR}/${APP_NAME}.desktop" << EOF
[Desktop Entry]
Name=${APP_NAME}
Exec=${filepath}
Type=Application
Categories=Utility;
Terminal=false
Icon=application-x-executable
EOF
    # Refresh application menu
    update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true

    echo "install|appimage|${filename}|${filepath}|${timestamp}" >> "$LOG_FILE"

    DISPLAY=:1 notify-send "Webix" "${APP_NAME} is ready to use!" \
      --icon=dialog-information 2>/dev/null || true

    # AppImages live in the persistent volume as files — no docker commit needed.
    # They survive session restarts automatically. Just log to Supabase.
    curl -s -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      --connect-timeout 2 --max-time 3 \
      -d "{
        \"userId\": \"${USER_ID}\",
        \"action\": \"install\",
        \"method\": \"appimage\",
        \"package\": \"${filename}\",
        \"filepath\": \"${filepath}\",
        \"timestamp\": \"${timestamp}\"
      }" > /dev/null 2>&1 &

  # ── Handle .sh / .run installer scripts ──────────────────────────────
  elif [ "$extension" = "sh" ] || [ "$extension" = "run" ]; then
    # Security: make executable but DO NOT auto-run — user must run manually
    chmod +x "$filepath"
    echo "downloaded|script|${filename}|${filepath}|${timestamp}" >> "$LOG_FILE"

    DISPLAY=:1 notify-send "Webix" "${filename} is ready. Right-click to run." \
      --icon=dialog-information 2>/dev/null || true
  fi

done
