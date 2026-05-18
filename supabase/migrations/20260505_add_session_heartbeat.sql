-- Add columns to sessions table for heartbeat and tracking
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS tier text,
  ADD COLUMN IF NOT EXISTS volume_name text,
  ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now();
