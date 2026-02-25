-- Fix critical security vulnerability in two_factor_codes table
-- Currently the table allows public access with policy "Allow service role to manage 2FA codes" using expression "true"
-- This allows anyone to read all email addresses and verification codes

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Allow service role to manage 2FA codes" ON public.two_factor_codes;

-- Create secure RLS policies that protect user data

-- 1. Allow users to read only their own verification codes (matching their auth email)
CREATE POLICY "Users can read own verification codes" 
ON public.two_factor_codes 
FOR SELECT 
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 2. Allow users to update their own codes to mark as used
CREATE POLICY "Users can mark own codes as used" 
ON public.two_factor_codes 
FOR UPDATE 
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND NOT used -- Only allow updating unused codes
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND used = true -- Only allow marking as used
);

-- 3. Allow service role to insert and manage codes (for edge functions)
CREATE POLICY "Service role can manage verification codes" 
ON public.two_factor_codes 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 4. Allow authenticated service to insert codes for users
CREATE POLICY "System can insert verification codes" 
ON public.two_factor_codes 
FOR INSERT 
WITH CHECK (
  -- Only allow inserts if the email belongs to an existing user
  EXISTS (
    SELECT 1 FROM auth.users WHERE email = two_factor_codes.email
  )
);

-- Add comment explaining the security fix
COMMENT ON TABLE public.two_factor_codes IS 'Two-factor authentication codes. Access restricted to users own codes only for security.';