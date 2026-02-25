-- Ensure RLS and policies for profiles to allow platform admins to view users
-- Enable RLS on profiles (safe if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow platform admins to view all profiles
DO $$ BEGIN
  CREATE POLICY "Platform admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (is_platform_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow users to view their own profile (useful across the app)
DO $$ BEGIN
  CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;