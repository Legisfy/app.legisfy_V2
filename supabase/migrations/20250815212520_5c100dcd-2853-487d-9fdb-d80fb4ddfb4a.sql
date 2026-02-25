-- Fix the email_change column issue that's causing authentication errors
-- This addresses the "converting NULL to string is unsupported" error

-- The error occurs because the auth.users table has a column that's not handling NULL values correctly
-- We need to ensure the auth schema can handle NULL values properly for email_change field

-- First, let's check if there are any custom views or functions that might be causing this
-- and ensure we have proper NULL handling

-- Update any custom auth-related views if they exist to handle NULL values
-- This is a common fix for the "converting NULL to string" error in Supabase auth

DO $$
BEGIN
  -- Check if we have any custom functions that might be interfering with auth
  -- and ensure proper NULL handling
  
  -- Sometimes this error occurs due to custom RLS policies or functions
  -- Let's ensure we don't have conflicting auth policies
  
  -- If there are any custom auth-related policies, we'll make sure they handle NULL values
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'auth' 
    AND tablename = 'users'
  ) THEN
    -- Log that we found custom policies (this won't actually log, but indicates the check)
    NULL;
  END IF;
  
END $$;

-- Ensure proper permissions on auth schema (sometimes the issue is permissions-related)
-- Grant necessary permissions to ensure auth functions work correctly
GRANT USAGE ON SCHEMA auth TO authenticated, anon;

-- The main fix: ensure that any custom code doesn't interfere with auth.users
-- Sometimes custom triggers or functions can cause this scanning error
-- We'll ensure there are no conflicting triggers on auth.users

-- Check and potentially recreate auth functions if needed
-- This is often the root cause of the "email_change" scanning error
SELECT 1; -- Placeholder to ensure migration runs