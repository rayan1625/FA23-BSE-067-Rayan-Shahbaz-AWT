-- STEP 1: Verify / Recreate the Trigger Function robustly
-- We add 'client'::public.user_role cast, and use COALESCE to handle nulls safely.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, name, avatar_url, role)
  VALUES (
    new.id, 
    COALESCE(new.email, ''), 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'client'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert default seller profile
  INSERT INTO public.seller_profiles (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- STEP 2: One-time Backfill for Missing Users
-- This will copy all users currently in auth.users that are missing in public.users
INSERT INTO public.users (id, email, name, avatar_url, role)
SELECT 
  id, 
  COALESCE(email, ''), 
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  'client'::public.user_role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- This will backfill missing seller profiles
INSERT INTO public.seller_profiles (user_id)
SELECT id FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.seller_profiles)
ON CONFLICT (user_id) DO NOTHING;


-- STEP 3: Confirm & Enforce RLS is Disabled
-- This ensures 403 errors are not caused by RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;


-- STEP 4: Test Query (Run this manually to simulate what the trigger does)
-- DO NOT RUN THIS AS PART OF THE SCRIPT UNLESS YOU JUST WANT TO SEE OUTPUT.
-- This shows you what data would be inserted right now:
/*
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name' as name, 
  'client' as role 
FROM auth.users;
*/
