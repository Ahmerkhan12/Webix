# Webix Project Progress

## 📊 Overview
| Phase | Title | Status |
| :--- | :--- | :--- |
| 1 | Core Desktop Service | ✅ Completed |
| 2 | Backend VNC Routing | ✅ Completed |
| 3 | Landing Page & Auth | ✅ Completed |
| 4 | Advanced User Management | ✅ Completed |
| 5 | Persistent Storage | ✅ Completed |
| 6 | Payment Integration | ✅ Completed |
| 7 | Session Security & Metrics | ✅ Completed |
| 8 | Auto-Shutdown & Scaling | ⏳ Pending |

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

## ✅ Phase 7: Billing, Metrics & Security
- **Stripe Checkout Funnel**: Implemented a frictionless end-to-end payment loop from the Landing Page pricing table to Stripe hosted checkout.
- **Dynamic Plan Upgrades**: Integrated Stripe Webhooks to automatically update user `subscription_tier` in Supabase upon successful payment.
- **Storage Usage Metrics**: Created a real-time storage tracker that runs a container-side `du` command to report exact GB usage of persistent volumes to the UI.
- **Race Condition Hardening**: Added a server-side Mutex lock in `sessionRoutes.js` to prevent concurrent container spawning (Sybil protection).
- **Environment Safety**: Transitioned all frontend API calls to use `VITE_API_URL` environment variables, removing hardcoded local references.

## ⚠️ Known Gaps (Planned for Later)

### Gap 1: Installed Packages Are Not Persistent
- **Problem**: If a user runs `apt install <package>` inside a session, that package is gone on the next session because it's installed into the container's rootfs (not the volume).
- **Impact**: Low — pre-installed tools (VS Code, Git, Python, Firefox) cover most use cases.
- **Fix Options (Phase 8)**:
  - **Option A (Recommended)**: Pre-bake commonly requested tools into the `webix-desktop` Docker image.
  - **Option B**: Support a `~/.setup.sh` dotfile that auto-runs on login to re-install user-defined packages.

## 🚀 Next Steps (Phase 8: Auto-Shutdown & Scaling)
- Auto-shutdown on session inactivity or maximum duration (1h for free users) to reduce server costs.
- Domain + Reverse Proxy setup via Nginx for production deployment.
- CI/CD pipeline for automated Docker image builds.

