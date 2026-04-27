# 2026-04-26 Webix Frontend Design Spec

## Overview
A 2-screen React frontend for the Webix "Linux Desktop in Browser" platform.
Dark Industrial aesthetic with Three.js 3D backgrounds and GSAP animations.

## Screens
1. **Landing Page** — Hero with 3D wireframe globe, headline, CTA
2. **Dashboard** — Session controls, 3D particle field, fullscreen desktop takeover

## Stack
- Vite + React
- Three.js via @react-three/fiber + @react-three/drei
- GSAP for all transitions and micro-animations
- Vanilla CSS with custom properties

## Key Interactions
- Magnetic CTA button (GSAP hover)
- Character stagger reveal on headline (GSAP)
- Session start → iframe fullscreen takeover (GSAP timeline)
- Session end → fade back to dashboard

## API Integration
- POST /api/sessions → create container, get URL
- DELETE /api/sessions/:id → stop container
