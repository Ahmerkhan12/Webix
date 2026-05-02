# User Management & Session Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full user management system including profiles, persistent session history, and usage analytics.

**Architecture:** Extend Supabase with `profiles` and `sessions` tables. Update the Node.js backend to track Docker lifecycles in the DB. Add a Settings UI for profile and security management.

**Tech Stack:** React, Supabase (PostgreSQL + Auth), Node.js, Dockerode.

---

### Task 1: Database Initialization
**Files:**
- Create: `supabase/migrations/20260501_init_user_management.sql`

- [ ] **Step 1: Define SQL for tables and RLS**
```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  container_id text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'failed')),
  port integer,
  created_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, subscription_tier)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'free');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

- [ ] **Step 2: Commit SQL**
```bash
git add supabase/migrations/20260501_init_user_management.sql
git commit -m "db: init profiles and sessions tables"
```

---

### Task 2: Registration & Profile Integration
**Files:**
- Modify: `webix-frontend/src/pages/Register.tsx`
- Modify: `webix-frontend/src/context/AuthContext.tsx`

- [ ] **Step 1: Add Name field to Registration UI**
```tsx
// Inside Register.tsx
const [fullName, setFullName] = useState('')

// Update handleRegister
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName
    }
  }
})
```

- [ ] **Step 2: Update AuthContext to include Profile data**
```tsx
// Inside AuthContext.tsx
const [profile, setProfile] = useState<any>(null)

useEffect(() => {
  if (user) {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
    }
    fetchProfile()
  }
}, [user])
```

- [ ] **Step 3: Commit**
```bash
git add webix-frontend/src/pages/Register.tsx webix-frontend/src/context/AuthContext.tsx
git commit -m "feat: capture full name on registration"
```

---

### Task 3: Backend Session Tracking Logic
**Files:**
- Modify: `webix-backend/src/routes/sessionRoutes.js`
- Modify: `webix-backend/src/services/dockerService.js`

- [ ] **Step 1: Log session start in DB**
```javascript
// Inside sessionRoutes.js POST /
const session = await dockerService.createContainer(req.user.id);
await supabase.from('sessions').insert({
  user_id: req.user.id,
  container_id: session.id,
  port: session.port,
  status: 'active'
});
```

- [ ] **Step 2: Log session termination in DB**
```javascript
// Inside sessionRoutes.js DELETE /:id
await dockerService.stopContainer(req.params.id);
await supabase.from('sessions')
  .update({ status: 'stopped', ended_at: new Date() })
  .eq('container_id', req.params.id);
```

- [ ] **Step 3: Commit**
```bash
git add webix-backend/src/routes/sessionRoutes.js
git commit -m "feat: track session lifecycle in database"
```

---

### Task 4: Dashboard Settings & History UI
**Files:**
- Create: `webix-frontend/src/components/SettingsView.tsx`
- Modify: `webix-frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create SettingsView component**
Create a component that shows User Info, Tier, and Session History table.

- [ ] **Step 2: Integrate into Dashboard**
Add a "Settings" tab/toggle in the Dashboard layout.

- [ ] **Step 3: Commit**
```bash
git add webix-frontend/src/components/SettingsView.tsx webix-frontend/src/pages/Dashboard.tsx
git commit -m "ui: add settings and session history view"
```

---

### Task 5: Usage Analytics & Device Tracking
**Files:**
- Modify: `webix-frontend/src/components/SettingsView.tsx`

- [ ] **Step 1: Calculate usage time**
Sum up `ended_at - created_at` from the `sessions` list.

- [ ] **Step 2: Add Device list**
Use `supabase.auth.getUserIdentities()` or track `User-Agent` in the sessions table.

- [ ] **Step 3: Commit**
```bash
git add webix-frontend/src/components/SettingsView.tsx
git commit -m "feat: add usage analytics and device tracking"
```
