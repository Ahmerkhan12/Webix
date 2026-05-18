# syntax=docker/dockerfile:1
FROM antigravity-desktop:v1
# ============================================================
# Webix Desktop — macOS Theme
# Image: webix-desktop:macos
#
# Applies the WhiteSur GTK theme + Plank dock to XFCE so the
# desktop looks like macOS Big Sur/Ventura. No VM required.
# ============================================================

USER root

# Install theme dependencies + Plank dock
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    sassc \
    libglib2.0-dev-bin \
    gtk2-engines-murrine \
    gtk2-engines-pixbuf \
    plank \
    fonts-cantarell \
    bc \
    && rm -rf /var/lib/apt/lists/*

# Install WhiteSur GTK theme (macOS Big Sur style)
RUN git clone --depth=1 https://github.com/vinceliuice/WhiteSur-gtk-theme.git /tmp/whitesur-gtk \
    && cd /tmp/whitesur-gtk \
    && ./install.sh -d /usr/share/themes \
    && rm -rf /tmp/whitesur-gtk

# Install WhiteSur icon theme (macOS style icons)
RUN git clone --depth=1 https://github.com/vinceliuice/WhiteSur-icon-theme.git /tmp/whitesur-icons \
    && cd /tmp/whitesur-icons \
    && bash install.sh --dest /usr/share/icons \
    && rm -rf /tmp/whitesur-icons

# Apply theme config for the webix user
USER webix

RUN <<EOF
# Create necessary directories
mkdir -p $HOME/.config/xfce4/xfconf/xfce-perchannel-xml \
         $HOME/.config/plank/dock1/launchers \
         $HOME/.config/autostart

# macOS style GTK + icon theme
cat > $HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xsettings.xml <<'EOT'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xsettings" version="1.0">
  <property name="Net" type="empty">
    <property name="ThemeName" type="string" value="WhiteSur-Dark"/>
    <property name="IconThemeName" type="string" value="WhiteSur-dark"/>
  </property>
  <property name="Gtk" type="empty">
    <property name="FontName" type="string" value="Cantarell 11"/>
    <property name="CursorThemeName" type="string" value="DMZ-White"/>
  </property>
</channel>
EOT

# macOS style window manager (buttons on the left like macOS)
cat > $HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xfwm4.xml <<'EOT'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfwm4" version="1.0">
  <property name="general" type="empty">
    <property name="theme" type="string" value="WhiteSur-Dark"/>
    <property name="title_font" type="string" value="Cantarell Bold 10"/>
    <property name="button_layout" type="string" value="CMH|O"/>
  </property>
</channel>
EOT

# Hide the XFCE panel (Plank dock replaces it)
cat > $HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml <<'EOT'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-panel" version="1.0">
  <property name="configver" type="int" value="2"/>
  <property name="panels" type="array">
    <value type="int" value="1"/>
  </property>
  <property name="panel-1" type="empty">
    <property name="position" type="string" value="p=6;x=960;y=22"/>
    <property name="length" type="uint" value="100"/>
    <property name="position-locked" type="bool" value="true"/>
    <property name="size" type="uint" value="28"/>
  </property>
</channel>
EOT

# Plank dock config (bottom macOS-style dock)
cat > $HOME/.config/plank/dock1/settings <<'EOT'
[PlankDockPreferences]
HideMode=0
Monitor=
Position=3
Alignment=3
ItemAlignment=3
LockItems=false
AutoPinned=true
HideDelay=0
UnhideDelay=0
ShowHovered=true
ZoomPercent=150
ZoomEnabled=true
Offset=0
IconSize=48
Theme=Transparent
EOT

# Add autostart entry for Plank dock
cat > $HOME/.config/autostart/plank.desktop <<'EOT'
[Desktop Entry]
Type=Application
Name=Plank
Exec=plank
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOT
EOF

USER root
ENTRYPOINT ["/entrypoint.sh"]
