-- Fix infinite recursion by replacing recursive SELECT policy on gabinetes
BEGIN;

-- Drop existing SELECT policy that references gabinete_usuarios directly
DROP POLICY IF EXISTS "Users can view their own gabinete" ON public.gabinetes;

-- Recreate SELECT policy using SECURITY DEFINER helper to avoid recursion
CREATE POLICY "Users can view their own gabinete"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (
  public.is_platform_admin()
  OR politico_id = auth.uid()
  OR chefe_id = auth.uid()
  OR public.user_belongs_to_gabinete(id)
);

COMMIT;