-- Fix the default value for token column in principal_invitations table
-- Remove the schema prefix since pgcrypto functions should be available in public schema
ALTER TABLE public.principal_invitations 
ALTER COLUMN token SET DEFAULT encode(gen_random_bytes(32), 'hex');

-- Test that the function works by creating a test function that uses it
CREATE OR REPLACE FUNCTION public.test_gen_random_bytes()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT encode(gen_random_bytes(32), 'hex');
$$;

-- Test the function (this will fail if pgcrypto is not properly installed)
SELECT public.test_gen_random_bytes() as test_result;