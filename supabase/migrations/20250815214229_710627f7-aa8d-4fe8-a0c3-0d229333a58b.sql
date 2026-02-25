-- Fix RLS policies for estados table to allow users to read states
-- while keeping admin-only write access

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Platform admins can manage estados" ON public.estados;

-- Create separate policies for read and write operations
-- Users can read states (for dropdowns, etc.)
CREATE POLICY "Users can view estados" 
ON public.estados 
FOR SELECT 
USING (true);

-- Only platform admins can modify states
CREATE POLICY "Platform admins can insert estados" 
ON public.estados 
FOR INSERT 
WITH CHECK (is_platform_admin());

CREATE POLICY "Platform admins can update estados" 
ON public.estados 
FOR UPDATE 
USING (is_platform_admin());

CREATE POLICY "Platform admins can delete estados" 
ON public.estados 
FOR DELETE 
USING (is_platform_admin());

-- Also fix cidades table with similar issue
DROP POLICY IF EXISTS "Platform admins can manage cidades" ON public.cidades;

-- Users can read cities
CREATE POLICY "Users can view cidades" 
ON public.cidades 
FOR SELECT 
USING (true);

-- Only platform admins can modify cities
CREATE POLICY "Platform admins can insert cidades" 
ON public.cidades 
FOR INSERT 
WITH CHECK (is_platform_admin());

CREATE POLICY "Platform admins can update cidades" 
ON public.cidades 
FOR UPDATE 
USING (is_platform_admin());

CREATE POLICY "Platform admins can delete cidades" 
ON public.cidades 
FOR DELETE 
USING (is_platform_admin());