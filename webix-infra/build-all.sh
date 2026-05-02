#!/bin/bash
# ============================================================
# Webix Desktop — Build All Theme Images
# Run this on your Linux VPS/server, NOT on Windows
# ============================================================

set -e  # Exit on any error

echo "========================================"
echo " Building Webix Desktop Images"
echo "========================================"

# Step 1: Build the base image first (must exist before themes can extend it)
echo ""
echo "[1/3] Building base image: antigravity-desktop:v1"
docker build -t antigravity-desktop:v1 ./desktop/
echo "✅ Base image built"

# Step 2: Build Windows 11 theme
echo ""
echo "[2/3] Building Windows 11 theme: webix-desktop:win11"
docker build -t webix-desktop:win11 ./desktop-win11/
echo "✅ Windows 11 theme built"

# Step 3: Build macOS theme
echo ""
echo "[3/3] Building macOS theme: webix-desktop:macos"
docker build -t webix-desktop:macos ./desktop-macos/
echo "✅ macOS theme built"

echo ""
echo "========================================"
echo " All images built successfully!"
echo " Available images:"
docker images | grep -E "antigravity-desktop|webix-desktop"
echo "========================================"
