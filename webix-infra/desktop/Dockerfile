FROM ubuntu:22.04

# Prevent interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Set environment variables for VNC and noVNC
ENV DISPLAY=:1
ENV VNC_PORT=5901
ENV NOVNC_PORT=6080
ENV HOME=/home/webix

# Install core dependencies, XFCE, and tracking utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    xfce4 \
    xfce4-goodies \
    xfce4-terminal \
    tigervnc-standalone-server \
    tigervnc-common \
    tigervnc-tools \
    novnc \
    websockify \
    dbus-x11 \
    x11-xserver-utils \
    sudo \
    wget \
    curl \
    ca-certificates \
    gnupg \
    git \
    python3 \
    inotify-tools \
    libnotify-bin \
    bc \
    dpkg-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Firefox
RUN apt-get update && apt-get install -y --no-install-recommends \
    firefox \
    && rm -rf /var/lib/apt/lists/*

# Install VS Code
RUN wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg \
    && install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg \
    && echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list \
    && rm -f packages.microsoft.gpg \
    && apt-get update && apt-get install -y --no-install-recommends \
    code \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m -s /bin/bash webix && \
    echo "webix ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set up working directory
WORKDIR $HOME

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy install tracking scripts (run as root before USER webix)
COPY scripts/dpkg-hook.sh          /usr/local/bin/dpkg-hook.sh
COPY scripts/download-watcher.sh   /usr/local/bin/download-watcher.sh
COPY apt-hook/99webix-tracker      /etc/apt/apt.conf.d/99webix-tracker
RUN chmod +x /usr/local/bin/dpkg-hook.sh /usr/local/bin/download-watcher.sh

# Create Downloads and .webix dirs in skeleton (auto-copied to /home/webix on useradd)
RUN mkdir -p /etc/skel/Downloads /etc/skel/.webix

# Switch to the non-root user
USER webix

# Configure VNC — xstartup launches download-watcher daemon, then XFCE
RUN mkdir -p $HOME/.vnc && \
    touch $HOME/.Xresources && \
    printf '#!/bin/sh\n# Start download watcher daemon (watches ~/Downloads for .deb/.AppImage files)\n/usr/local/bin/download-watcher.sh >> /home/webix/.webix/watcher.log 2>&1 &\n# Start XFCE desktop\nstartxfce4\n' > $HOME/.vnc/xstartup && \
    chmod +x $HOME/.vnc/xstartup

# Expose noVNC port
EXPOSE $NOVNC_PORT

# Healthcheck to verify noVNC is running
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:6080/vnc.html || exit 1

ENTRYPOINT ["/entrypoint.sh"]
