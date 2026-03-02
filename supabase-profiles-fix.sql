-- ============================================
-- FIX: No profile row → caption_votes insert fails
-- ============================================
-- caption_votes.profile_id references profiles(id).
-- If no row exists in profiles for your user, votes cannot be saved.
--
-- Run these in Supabase SQL Editor.
-- ============================================

-- ---------------------------------------------------------------
-- 1) ONE-TIME FIX: Create a profile for your current user
-- ---------------------------------------------------------------
-- Option A: If you're running this while "impersonating" the user
--   (e.g. in a secure context where auth.uid() is set), run:
--
--   INSERT INTO public.profiles (id)
--   VALUES (auth.uid())
--   ON CONFLICT (id) DO NOTHING;
--
-- Option B: Get your user ID from the dashboard first:
--   Dashboard → Authentication → Users → copy your user's UUID.
--   Then run (replace YOUR_USER_UUID with that value):
--
--   INSERT INTO public.profiles (id)
--   VALUES ('YOUR_USER_UUID'::uuid)
--   ON CONFLICT (id) DO NOTHING;
--
-- If your `profiles` table has other NOT NULL columns, add them:
--   e.g. INSERT INTO public.profiles (id, display_name)
--        VALUES ('YOUR_USER_UUID'::uuid, 'My Name');


-- ---------------------------------------------------------------
-- 2) TRIGGER: Auto-create profile for new signups (so this doesn't happen again)
-- ---------------------------------------------------------------
-- Adjust the INSERT to match your profiles table columns.
-- If profiles only has `id`, the minimal version is below.
-- If profiles has more required columns, add them with defaults.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop the trigger if it already exists (avoid duplicate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------
-- 3) BACKFILL: Create profiles for existing auth users who don't have one
-- ---------------------------------------------------------------
-- Run this once to create profiles for everyone who already signed up.
-- If profiles has other NOT NULL columns, add them with defaults in the INSERT.

INSERT INTO public.profiles (id)
SELECT u.id FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
