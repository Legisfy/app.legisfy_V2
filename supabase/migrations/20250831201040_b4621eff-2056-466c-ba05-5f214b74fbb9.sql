-- Create a helper RPC to fetch gabinete members with profile data, safely
CREATE OR REPLACE FUNCTION public.get_gabinete_members_with_profiles(gab_id uuid)
RETURNS TABLE(user_id uuid, role text, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
  SELECT gm.user_id,
         gm.role,
         p.full_name,
         p.avatar_url
  FROM public.gabinete_members gm
  LEFT JOIN public.profiles p ON p.user_id = gm.user_id
  WHERE gm.gabinete_id = gab_id
    AND (
      public.user_belongs_to_cabinet(gab_id)
      OR public.is_platform_admin()
      OR EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = gab_id AND g.politico_id = auth.uid()
      )
    );
$$;

-- Note: Access is constrained by the WHERE clause; function runs as SECURITY DEFINER.