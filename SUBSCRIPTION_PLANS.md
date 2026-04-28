# Webix Subscription Plans & Monetization Strategy

This document outlines the proposed subscription tiers for the Webix platform. Because the core architecture utilizes Docker containers, we have granular, kernel-level control over the computational resources assigned to each user. This enables a robust freemium model where users can be seamlessly upgraded to higher tiers.

---

## 💎 Subscription Tiers

### Tier 1: Free / Trial Plan
Designed for casual users, students, or users wanting to test the platform before committing to a purchase.

- **Pricing:** $0 / month
- **RAM Allocation:** 512MB - 1GB
- **CPU Allocation:** 0.5 Cores (Strictly throttled to prevent crypto-mining abuse)
- **Storage:** 5GB
- **Storage Persistence:** **Ephemeral** (The container is destroyed and all files are permanently deleted as soon as the session ends)
- **Session Limit:** Maximum 1-hour continuous session before automatic termination.
- **Network Speed:** Throttled (e.g., 10Mbps) to prevent bandwidth abuse.

### Tier 2: Basic / Hobbyist Plan
Designed for light software development, standard web browsing, and users who need to save their files between sessions.

- **Pricing:** ~$5.00 - $10.00 / month
- **RAM Allocation:** 2GB - 4GB
- **CPU Allocation:** 2 Cores
- **Storage:** 20GB
- **Storage Persistence:** **Persistent** (Files are saved to a dedicated Docker Volume mapped to the user's ID, so their desktop state remains exactly as they left it).
- **Session Limit:** Unlimited continuous usage.
- **Network Speed:** Standard (e.g., 100Mbps).

### Tier 3: Pro / Developer Plan
Designed for power users, developers running heavy IDEs natively in the browser, or data scientists requiring significant compute power.

- **Pricing:** ~$20.00+ / month
- **RAM Allocation:** 8GB - 16GB+
- **CPU Allocation:** 4+ Cores
- **Storage:** 50GB+ (Fast NVMe SSD backed)
- **Storage Persistence:** **Persistent** (Includes automated daily backups/snapshots).
- **Session Limit:** Unlimited continuous usage.
- **Network Speed:** Uncapped Gigabit connection.
- **Bonus Features:** Allow users to run Docker *inside* their Webix desktop (Docker-in-Docker), granting them administrative root access for advanced workflows.

---

## 🖥️ Future OS Options & Themes (Upsell Opportunities)

Offering different operating systems is a massive selling point. We can approach this in two ways:

### 1. The "Reskin" Approach (Extremely Cheap & Fast)
Since we are using XFCE (a highly customizable Linux desktop), we don't actually need to run Windows or macOS to give users that experience. We can simply apply heavily modified themes:
- **Windows 10/11 UI:** We can install a theme like *Kali Undercover* or *Twister OS* which perfectly mimics the Windows taskbar, start menu, and file explorer. 
- **macOS UI:** We can apply the *WhiteSur* GTK theme and a macOS-style bottom dock (like Plank) so the Linux desktop looks and behaves identically to macOS Big Sur.
- **Why this is great:** It keeps the system as a lightweight Docker container (fast startup, low RAM) but gives the user the exact aesthetic they want.

### 2. The "True VM" Approach (Premium Add-on)
If users need *actual* Windows (to run `.exe` files) or *actual* macOS (to run Xcode), we have to upgrade from Docker containers to **Virtual Machines (QEMU/KVM) inside Docker**.
- **True Windows 11:** We can run a Windows VM via a project like `dockur/windows`. 
  - *Cost consideration:* Windows requires significantly more resources (minimum 4GB RAM just to boot smoothly). We could charge a **$10/month "Windows License & Compute" surcharge** for this option.
- **True macOS:** Running macOS on non-Apple hardware technically violates Apple's EULA, but projects like `Docker-OSX` make it possible. It is extremely resource-heavy and would likely require a high-tier subscription.

---

## 🛠️ Technical Implementation Path

To enforce these tiers on the backend, we will map Stripe/Payment statuses to Docker constraints during the `POST /api/sessions` call. 

When generating the container in `dockerService.js`, the backend will fetch the user's tier from the database and apply the following dynamic properties to the `HostConfig`:

```javascript
HostConfig: {
  // Enforce RAM limits
  Memory: userPlan.ramBytes,             // e.g., 2147483648 for 2GB
  
  // Enforce CPU limits
  NanoCPUs: userPlan.cpuNano,            // e.g., 2000000000 for 2 Cores
  
  // Enforce Storage Limits (Requires XFS with pquota on server)
  StorageOpt: { size: userPlan.storage }, // e.g., '20G'
  
  // Map Persistent Storage (if applicable)
  Binds: userPlan.isPersistent 
    ? [`/server/volumes/user_${userId}:/home/webix`] 
    : []
}
```

## 🛡️ Security & Abuse Considerations
1. **Free Tier Abuse:** Free tiers are often targeted by crypto-miners. We must strictly enforce `NanoCPUs` to ensure mining is entirely unprofitable and doesn't drain the host server.
2. **Bandwidth:** Torrents and heavy downloads can spike hosting costs. We can use Docker network limits or `tc` (traffic control) to throttle outbound speeds on lower tiers.
