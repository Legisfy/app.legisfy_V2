-- Fix infinite recursion in gabinetes RLS policies
-- Drop all existing policies first
DROP POLICY IF EXISTS "Politicians and chiefs can update their gabinete" ON public.gabinetes;
DROP POLICY IF EXISTS "Politicians can create gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Users can view gabinetes they are members of" ON public.gabinetes;
DROP POLICY IF EXISTS "Users can view their own gabinete" ON public.gabinetes;
DROP POLICY IF EXISTS "Users can view their own gabinetes as owner" ON public.gabinetes;

-- Create new, non-recursive policies
-- Allow politicians to create gabinetes
CREATE POLICY "Politicians can create their own gabinetes"
ON public.gabinetes
FOR INSERT
WITH CHECK (politico_id = auth.uid());

-- Allow politicians and owners to view their gabinetes
CREATE POLICY "Users can view gabinetes they own or are politicians of"
ON public.gabinetes
FOR SELECT
USING (
  politico_id = auth.uid() 
  OR owner_user_id = auth.uid()
  OR chefe_id = auth.uid()
  OR is_platform_admin()
);

-- Allow viewing through membership (without recursion)
CREATE POLICY "Members can view their gabinetes"
ON public.gabinetes
FOR SELECT
USING (
  id IN (
    SELECT gabinete_id 
    FROM public.gabinete_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow politicians, owners and chiefs to update
CREATE POLICY "Owners and politicians can update gabinetes"
ON public.gabinetes
FOR UPDATE
USING (
  politico_id = auth.uid() 
  OR owner_user_id = auth.uid()
  OR chefe_id = auth.uid()
  OR is_platform_admin()
);

-- Allow platform admins full access
CREATE POLICY "Platform admins have full access to gabinetes"
ON public.gabinetes
FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());