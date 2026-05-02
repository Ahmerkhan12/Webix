# 🚀 Webix Subscription & Monetization Strategy

This document outlines the official pricing tiers and add-on structure for the Webix platform.

---

## 💎 Core Subscription Tiers

| Tier | Price | CPU | RAM | Storage | Features |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | $0 | 0.5 | 512MB | 5GB | Ephemeral sessions, Shared network |
| **Hobbyist** | $5/mo | 1 Core | 1GB | 20GB | Persistent storage, Standard network |
| **Developer** | $15/mo | 2 Cores | 4GB | 50GB | Backups, Uncapped network, Root access |
| **Pro Max** | Custom | 8+ Cores | 16GB+ | 500GB+ | Dedicated host, Docker-in-Docker, SLA |

---

## 🖥️ OS Theme Add-ons (Hobbyist+)
Users can choose a different desktop OS appearance. These are lightweight XFCE reskins (No VM overhead).

| Add-on | Price | Image Used |
| :--- | :--- | :--- |
| **Windows 11 Theme** | +$3/month | `webix-desktop:win11` |
| **macOS Theme** | +$3/month | `webix-desktop:macos` |
| **Both (Bundle)** | +$5/month | User toggle |

**Why we can charge for this:**
- Zero extra server cost — same RAM/CPU, just a different image tag.
- Users associate "Windows" and "macOS" with familiarity and productivity.
- Pure profit add-on.

---

## 🚀 RAM Boost Add-on (Hobbyist+)
Increase your container's performance with additional dedicated memory.

| Add-on | Price | Best For |
| :--- | :--- | :--- |
| **+2GB RAM Boost** | +$5/month | Heavy Browsing / Multi-tasking |
| **+4GB RAM Boost** | +$8/month | Compiling / IDE performance |

**Why we can charge for this:**
- High-demand for multi-tasking (multiple browser tabs, VS Code extensions).
- Predictable cost management (we know exactly how much RAM to reserve).
- High margin on low-concurrency users.

---

## 📦 Storage Add-on (Hobbyist+)
Additional persistent block storage for your home directory.

| Add-on | Price | Implementation |
| :--- | :--- | :--- |
| **+50 GB Storage** | +$5/month | Docker Volume Resize / XFS Quota |

**Why we can charge for this:**
- Hetzner block storage costs ~$0.05/GB/mo → pure margin at $0.10/GB/mo charged.

---

## 🖥️ Future OS Options & Themes (Upsell Opportunities)

### 1. The "Reskin" Approach (Cheap & Fast)
Already implemented via Docker theme images. Low cost, high visual impact.

### 2. The "Real VM" Approach (Premium)
- **Tech:** KVM / QEMU inside a privileged container or on bare metal.
- **Goal:** Run actual Windows 10/11 or macOS (Docker-OSX).
- **Price:** $25+/mo.
- **Benefit:** Full hardware compatibility, actual OS kernel.

### 3. GPU Passthrough (The "Gaming/AI" Tier)
- **Tech:** NVIDIA Container Toolkit.
- **Price:** $50-$100/mo.
- **Goal:** Allow users to run Blender, Davinci Resolve, or local LLMs.
- **Cost:** Requires dedicated GPU servers (expensive).

---

## 🛠️ Implementation Plan (Phase 6)

1.  **Profiles Table Update**:
    - `os_theme`: `['ubuntu', 'win11', 'macos']`
    - `storage_addon_gb`: `integer`
    - `ram_addon_mb`: `integer`
2.  **Backend (`dockerService.js`)**:
    - Logic: `FinalRAM = BaseRAM + AddonRAM`
    - Logic: `FinalStorage = BaseStorage + AddonStorage`
    - Selection: Map `os_theme` to the correct Docker image tag.
3.  **Dashboard UI**:
    - Add a "Resource Summary" card showing current specs.
    - Add "Upgrade" buttons next to each resource.
4.  **Stripe**:
    - Create individual Product IDs for each add-on.
    - Handle webhooks to update the Supabase `profiles` table.
