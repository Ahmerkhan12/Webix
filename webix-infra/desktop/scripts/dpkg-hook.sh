#!/bin/bash
# =============================================================
# Webix APT/DPKG Post-Invoke Hook
# Installed at: /usr/local/bin/dpkg-hook.sh
# Called by:    /etc/apt/apt.conf.d/99webix-tracker
#
# Fires after every apt install / apt remove / dpkg -i.
# 1. Logs the event to the persistent install log
# 2. Enforces storage quota (removes package if limit exceeded)
# 3. Fires a webhook to the backend (which runs docker commit)
# =============================================================

PACKAGE_NAME="$1"
ACTION="$2"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
LOG_FILE="/home/webix/.webix/installed_packages.log"
WEBHOOK_URL="http://172.17.0.1:${BACKEND_PORT:-3000}/api/internal/install-event"

# Guard: skip if no package name (dpkg calls hook for all packages, some may be empty)
[ -z "$PACKAGE_NAME" ] && exit 0

# Ensure the .webix dir exists in the persistent volume
mkdir -p /home/webix/.webix

# 1. Append to persistent install log (survives session restarts via Docker volume)
echo "${ACTION}|apt|${PACKAGE_NAME}|${PACKAGE_NAME}|${TIMESTAMP}" >> "$LOG_FILE"

# 2. Storage quota enforcement — only check on install to avoid double-remove loops
if [ "$ACTION" = "install" ]; then
  USED_BYTES=$(du -sb /home/webix 2>/dev/null | awk '{print $1}')
  LIMIT_BYTES=$(( ${STORAGE_LIMIT_GB:-20} * 1073741824 ))

  if [ "${USED_BYTES:-0}" -gt "${LIMIT_BYTES}" ]; then
    # Quota exceeded — undo the install
    DEBIAN_FRONTEND=noninteractive apt-get remove -y "$PACKAGE_NAME" 2>/dev/null

    # Notify user via desktop notification (non-fatal if no display)
    DISPLAY=:1 notify-send "Webix Storage" \
      "Cannot install $PACKAGE_NAME — storage limit (${STORAGE_LIMIT_GB:-20}GB) reached!" \
      --icon=dialog-error 2>/dev/null || true

    echo "quota_exceeded|apt|${PACKAGE_NAME}|${PACKAGE_NAME}|${TIMESTAMP}" >> "$LOG_FILE"
    exit 0
  fi
fi

# 3. Notify backend (fire and forget — non-blocking)
# Backend will: log to Supabase + run docker commit to snapshot the container
curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  --connect-timeout 2 \
  --max-time 3 \
  -d "{
    \"userId\": \"${USER_ID}\",
    \"action\": \"${ACTION}\",
    \"method\": \"apt\",
    \"package\": \"${PACKAGE_NAME}\",
    \"filepath\": null,
    \"timestamp\": \"${TIMESTAMP}\"
  }" > /dev/null 2>&1 &

exit 0
