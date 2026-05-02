-- RPC for atomic RAM increment
CREATE OR REPLACE FUNCTION increment_ram(user_id uuid, amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET ram_addon_mb = COALESCE(ram_addon_mb, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for atomic Storage increment
CREATE OR REPLACE FUNCTION increment_storage(user_id uuid, amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET storage_addon_gb = COALESCE(storage_addon_gb, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
