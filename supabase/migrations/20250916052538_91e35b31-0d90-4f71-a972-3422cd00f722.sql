-- Fix the infinite recursion in RLS policies
-- The problem is that policies are referencing tables that also have policies

-- First, drop the problematic policies
DROP POLICY IF EXISTS "gabinetes_direct_access" ON public.gabinetes;
DROP POLICY IF EXISTS "profiles_access" ON public.profiles;
DROP POLICY IF EXISTS "gab_members_sel" ON public.gabinete_members;
DROP POLICY IF EXISTS "gabinete_members_own_record" ON public.gabinete_members;
DROP POLICY IF EXISTS "gabinete_members_politico_manage" ON public.gabinete_members;

-- Create much simpler policies without recursion
CREATE POLICY "gabinetes_simple" 
ON public.gabinetes 
FOR ALL 
USING (politico_id = auth.uid());

CREATE POLICY "profiles_simple"
ON public.profiles
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "gabinete_members_simple"
ON public.gabinete_members
FOR ALL
USING (user_id = auth.uid());