# Phase 4 Extension: User Management & Session Tracking

## 🚀 Overview
This specification covers the implementation of user profiles, subscription tier tracking, and a comprehensive session history system for the Webix platform. This builds upon the core authentication system established in Phase 4.

## 🏗️ Architecture

### 1. Database Schema (PostgreSQL via Supabase)

#### `profiles` Table
Stores extended user information and tier status.
- `id`: uuid (Primary Key, references auth.users)
- `subscription_tier`: text (default: 'free', values: ['free', 'pro', 'enterprise'])
- `full_name`: text (captured during registration)
- `updated_at`: timestamp with time zone

#### `sessions` Table
Tracks every Docker container lifecycle.
- `id`: uuid (Primary Key)
- `user_id`: uuid (references auth.users)
- `container_id`: text (Docker container ID)
- `status`: text (default: 'active', values: ['active', 'stopped', 'failed'])
- `port`: integer (assigned VNC port)
- `created_at`: timestamp with time zone (default: now())
- `ended_at`: timestamp with time zone (nullable)

### 2. Backend Logic (Node.js)

#### Session Creation Flow (`POST /api/sessions`)
1. Authenticate user via Supabase JWT.
2. Query `sessions` table for any record with `user_id = UID` AND `status = 'active'`.
3. If an active session exists:
    - Verify container still exists in Docker.
    - If valid, return existing session details (Auto-resume).
    - If container is missing but DB says active, mark DB record as 'failed' and proceed to step 4.
4. If no active session:
    - Create new Docker container via `dockerService`.
    - Insert new record into `sessions` table.
    - Return new session details.

#### Session Termination Flow (`DELETE /api/sessions/:id`)
1. Stop/Remove Docker container.
2. Update `sessions` record: set `status = 'stopped'` and `ended_at = now()`.

### 3. Frontend UI (React)

#### Dashboard Enhancements
- **Settings/Account Tab**: A new view within the Dashboard.
- **Tier Badge**: Display the user's current subscription level.
- **Session History Table**: A clean list showing previous sessions (Start time, Duration, Status).
- **Profile Management**: UI to update `full_name`.
- **Security**: Option to trigger a password reset/change from within the settings.
- **Usage Analytics**: Visual indicator (progress bar/stat) showing "Total Hours Used" vs "Tier Limit".
- **Active Devices**: List of current active sessions/devices with a "Log out all" option.

#### Registration Update
- **Name Field**: Add "Full Name" to `Register.tsx` and pass it to Supabase `user_metadata`.

## 🛠️ Security
- Enable Row Level Security (RLS) on `profiles` and `sessions` tables so users can only read/write their own data.
- Backend service role will have bypass access to manage containers across all users.

## ✅ Success Criteria
- [ ] Users can see their "Free" tier status on the dashboard.
- [ ] Every "Start Desktop" action creates a record in the `sessions` table.
- [ ] Every "Stop Desktop" action updates the `ended_at` timestamp.
- [ ] Users can view their past 5 sessions in a history list.
- [ ] Dashboard shows total usage time calculated from the `sessions` table.
- [ ] Users can see their current login device in the security settings.
