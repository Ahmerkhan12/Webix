-- Hardening and Expanding Profiles for Monetization
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS os_theme text DEFAULT 'ubuntu',
  ADD COLUMN IF NOT EXISTS ram_addon_mb integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_addon_gb integer DEFAULT 0,
  ADD CONSTRAINT profiles_subscription_tier_check 
    CHECK (subscription_tier IN ('free', 'hobbyist', 'developer', 'promax'));

-- Ensure RLS allows the backend (service role) to update these without restriction
-- but also allow the user to update their own os_theme and name
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
