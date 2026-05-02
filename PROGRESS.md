# Webix Project Progress

## 📊 Overview
| Phase | Title | Status |
| :--- | :--- | :--- |
| 1 | Core Desktop Service | ✅ Completed |
| 2 | Backend VNC Routing | ✅ Completed |
| 3 | Landing Page & Auth | ✅ Completed |
| 4 | Advanced User Management | ✅ Completed |
| 5 | Persistent Storage | ✅ Completed |
| 6 | Payment Integration | ⏳ Pending |

## ✅ Recent Achievements (Phase 4)
- **Profile Picture System**: Integrated Supabase Storage with local file uploads.
- **Premium UI**: Added Profile Dropdown, GSAP transitions, and HSL custom colors.
- **Data Sync**: Implemented real-time synchronization between Supabase Auth and Profiles table.
- **Security**: Added password reset flows and RLS policies for storage.

## 🛠️ Bug Fixes & Refinement
- Fixed "avatar_url missing" schema cache issue in Supabase.
- Fixed "Property 'message' does not exist" TypeScript collision in Register.tsx.
- Optimized Dashboard scrollbars and responsive layout padding.
- Fixed Settings navigation with a new "Back to Dashboard" control.

## ✅ Phase 5 Achievements
- **Persistent Docker Volumes**: Each user gets a dedicated `webix-home-{userId}` volume mounted to `/home/ubuntu`. Files, folders, and configs survive session restarts.
- **Tier-Based Resources**: Container CPU/RAM limits are now dynamically applied based on the user's `subscription_tier` (Free/Pro/Enterprise).
- **Auto-Provisioning**: Volume is created automatically on first session, reused on every subsequent one.
- **Pricing Section**: Added a full Pricing/Subscription section to the landing page showing all three tiers.

## ✅ Phase 6: Monetization & Resources
- **Resource Allocation Strategy**: Finalized 4-tier system (Free, Hobbyist, Developer, Pro Max) aligned with Hetzner CPX41 hardware profitability.
- **Dynamic Resource Limits**: Backend (`dockerService.js`) dynamically combines base tier memory with `ram_addon_mb`.
- **Premium Themes (Reskins)**: Docker infrastructure refactored to support Windows 11 and macOS themes via fast-booting XFCE image tags (0% extra compute cost).
- **Customization UI**: Settings dashboard updated with a real-time Resource Allocation Summary and a Customization panel to toggle Themes and RAM Boosts.
- **Database Rules**: `profiles` table updated with add-on columns and strict `os_theme` validation constraints.

## ✅ Recent Polish & Analytics
- **Usage Tracking**: Backend tracks `created_at` and `ended_at` timestamps for sessions, ensuring precise minute-level tracking even if Docker throws errors during shutdown.
- **Monthly Limit Enforcement**: Free tier users are locked at 10 hours (600 minutes) per month. The backend dynamically filters sessions by the current calendar month and throws a 403 error when limits are exceeded.
- **Snappy Session Controls**: "End Session" button moved to a sleek, collapsible left-side panel. UI response is instantaneous (optimistic update) while Docker shutdown happens aggressively in the background (`t: 1` timeout).
- **Legacy Account Auto-Migration**: Settings save process upgraded from `.update()` to `.upsert()` to automatically create database profiles for early users who bypassed the SQL trigger.

## ⚠️ Known Gaps (Planned for Later)

### Gap 1: Installed Packages Are Not Persistent
- **Problem**: If a user runs `apt install <package>` inside a session, that package is gone on the next session because it's installed into the container's rootfs (not the volume).
- **Impact**: Low — pre-installed tools (VS Code, Git, Python, Firefox) cover most use cases.
- **Fix Options (Phase 7)**:
  - **Option A (Recommended)**: Pre-bake commonly requested tools into the `webix-desktop` Docker image so they're always available.
  - **Option B**: Support a `~/.setup.sh` dotfile that auto-runs on login to re-install user-defined packages.

### Gap 2: Storage Usage Metrics Not Visible Yet
- **Problem**: The Settings view doesn't yet show how much of the 10GB rootfs or volume the user has used.
- **Fix**: Query Docker volume disk usage via `docker system df -v` and expose it via a new backend endpoint.

## 🚀 Next Steps (Phase 7: Checkout & Metrics)
- Stripe Webhooks integration to link payment success to DB add-on updates.
- Storage usage metrics visible in the Settings dashboard.
- Auto-shutdown on session inactivity to reduce server costs.
