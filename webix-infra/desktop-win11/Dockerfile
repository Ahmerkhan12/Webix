# syntax=docker/dockerfile:1
FROM antigravity-desktop:v1
# ============================================================
# Webix Desktop — Windows 11 Theme
# Image: webix-desktop:win11
#
# Applies the Fluent/Graphite-BS theme to XFCE so the desktop
# looks like Windows 11. No VM — same lightweight Docker container.
# ============================================================

USER root

# Install theme dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    sassc \
    libglib2.0-dev-bin \
    gtk2-engines-murrine \
    gtk2-engines-pixbuf \
    gnome-themes-extra \
    && rm -rf /var/lib/apt/lists/*

# Install Windows 11 style GTK theme (Fluent-gtk-theme)
RUN git clone --depth=1 https://github.com/vinceliuice/Fluent-gtk-theme.git /tmp/fluent-theme \
    && cd /tmp/fluent-theme \
    && bash install.sh --dest /usr/share/themes --name Fluent --color dark --size compact \
    && rm -rf /tmp/fluent-theme

# Install Windows 11 style icon pack (Fluent icon theme)
RUN git clone --depth=1 https://github.com/vinceliuice/Fluent-icon-theme.git /tmp/fluent-icons \
    && cd /tmp/fluent-icons \
    && bash install.sh --dest /usr/share/icons \
    && rm -rf /tmp/fluent-icons

# Apply theme for the webix user
USER webix

RUN <<EOF
# Create necessary directories
mkdir -p $HOME/.config/xfce4/xfconf/xfce-perchannel-xml

# Set GTK theme, icon theme, and font to match Windows 11 aesthetic
cat > $HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xsettings.xml <<'EOT'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xsettings" version="1.0">
  <property name="Net" type="empty">
    <property name="ThemeName" type="string" value="Fluent-dark-compact"/>
    <property name="IconThemeName" type="string" value="Fluent-dark"/>
  </property>
  <property name="Gtk" type="empty">
    <property name="FontName" type="string" value="Segoe UI 10"/>
    <property name="CursorThemeName" type="string" value="DMZ-White"/>
  </property>
</channel>
EOT

# Set XFWM4 (window manager) theme
cat > $HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xfwm4.xml <<'EOT'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfwm4" version="1.0">
  <property name="general" type="empty">
    <property name="theme" type="string" value="Fluent-dark-compact"/>
    <property name="title_font" type="string" value="Segoe UI Bold 9"/>
    <property name="button_layout" type="string" value="O|HMC"/>
  </property>
</channel>
EOT

# Set taskbar to bottom (Windows style)
cat > $HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml <<'EOT'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-panel" version="1.0">
  <property name="configver" type="int" value="2"/>
  <property name="panels" type="array">
    <value type="int" value="1"/>
  </property>
  <property name="panel-1" type="empty">
    <property name="position" type="string" value="p=8;x=960;y=1080"/>
    <property name="length" type="uint" value="100"/>
    <property name="position-locked" type="bool" value="true"/>
    <property name="size" type="uint" value="40"/>
  </property>
</channel>
EOT
EOF

USER root
ENTRYPOINT ["/entrypoint.sh"]
