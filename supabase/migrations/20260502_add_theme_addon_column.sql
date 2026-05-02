-- Add add-on tracking for Hobbyist users
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS has_theme_addon boolean DEFAULT false;
