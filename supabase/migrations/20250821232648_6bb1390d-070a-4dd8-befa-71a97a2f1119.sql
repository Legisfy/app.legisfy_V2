-- Helper function to safely get the current user's email (avoids direct auth.users access in RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Replace problematic policy that queried auth.users directly
DROP POLICY IF EXISTS "Users can view own invitations only" ON public.invitations;
CREATE POLICY "Users can view own invitations only"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(public.get_current_user_email())
  OR is_platform_admin()
);
