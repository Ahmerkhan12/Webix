-- Migration: 20260518_add_install_events.sql
-- Tracks every software install/remove event per user.
-- Used for: analytics, storage monitoring, abuse detection, and dashboard display.

CREATE TABLE IF NOT EXISTS user_install_events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action       TEXT NOT NULL CHECK (action IN ('install', 'remove', 'downloaded', 'quota_exceeded')),
  method       TEXT NOT NULL CHECK (method IN ('apt', 'deb', 'appimage', 'script')),
  package_name TEXT NOT NULL,
  filepath     TEXT,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user queries (dashboard, analytics)
CREATE INDEX idx_install_events_user_id ON user_install_events(user_id);
-- Index for admin/abuse monitoring queries
CREATE INDEX idx_install_events_action  ON user_install_events(action);

-- Enable RLS
ALTER TABLE user_install_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own install events
CREATE POLICY "Users can view own install events"
  ON user_install_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (backend with SUPABASE_SERVICE_KEY) has full access
-- This is how the backend webhook inserts records
CREATE POLICY "Service role has full access"
  ON user_install_events FOR ALL
  USING (auth.role() = 'service_role');
