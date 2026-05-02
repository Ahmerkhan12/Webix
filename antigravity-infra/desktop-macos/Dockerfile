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
    && rm -rf /var/lib/apt/lists/*

# Install WhiteSur GTK theme (macOS Big Sur style)
RUN git clone --depth=1 https://github.com/vinceliuice/WhiteSur-gtk-theme.git /tmp/whitesur-gtk \
    && cd /tmp/whitesur-gtk \
    && bash install.sh --dest /usr/share/themes --color Dark \
    && rm -rf /tmp/whitesur-gtk

# Install WhiteSur icon theme (macOS style icons)
RUN git clone --depth=1 https://github.com/vinceliuice/WhiteSur-icon-theme.git /tmp/whitesur-icons \
    && cd /tmp/whitesur-icons \
    && bash install.sh --dest /usr/share/icons \
    && rm -rf /tmp/whitesur-icons

# Apply theme config for the webix user
USER webix

RUN mkdir -p $HOME/.config/xfce4/xfconf/xfce-perchannel-xml \
             $HOME/.config/plank/dock1/launchers

# macOS style GTK + icon theme
RUN cat > $HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xsettings.xml << 'EOF'
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
EOF

# macOS style window manager (buttons on the left like macOS)
RUN cat > $HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xfwm4.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfwm4" version="1.0">
  <property name="general" type="empty">
    <property name="theme" type="string" value="WhiteSur-Dark"/>
    <property name="title_font" type="string" value="Cantarell Bold 10"/>
    <property name="button_layout" type="string" value="CMH|O"/>
  </property>
</channel>
EOF

# Hide the XFCE panel (Plank dock replaces it)
RUN cat > $HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml << 'EOF'
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
EOF

# Plank dock config (bottom macOS-style dock)
RUN cat > $HOME/.config/plank/dock1/settings << 'EOF'
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
EOF

# Add autostart entry for Plank dock
RUN mkdir -p $HOME/.config/autostart && \
    cat > $HOME/.config/autostart/plank.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Plank
Exec=plank
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

USER root
ENTRYPOINT ["/entrypoint.sh"]
