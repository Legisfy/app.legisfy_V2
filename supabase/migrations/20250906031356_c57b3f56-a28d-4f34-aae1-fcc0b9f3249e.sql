-- Ensure RLS and permissive access for proper roles on invitations
-- 1) Enable RLS (idempotent-safe)
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 2) Allow inserts by politico, chefe, or platform admin of the target gabinete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'invitations' 
      AND policyname = 'invites_insert_by_politico_or_chefe_or_admin'
  ) THEN
    CREATE POLICY "invites_insert_by_politico_or_chefe_or_admin"
    ON public.invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (
      is_platform_admin()
      OR EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = invitations.gabinete_id
          AND g.politico_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = invitations.gabinete_id
          AND gm.user_id = auth.uid()
          AND gm.role = 'chefe'
      )
    );
  END IF;
END$$;

-- 3) Allow read by platform admin, cabinet members, or the invited email owner
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'invitations' 
      AND policyname = 'invites_select_by_admin_member_or_owner_email'
  ) THEN
    CREATE POLICY "invites_select_by_admin_member_or_owner_email"
    ON public.invitations
    FOR SELECT
    TO authenticated
    USING (
      is_platform_admin()
      OR EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = invitations.gabinete_id
          AND g.politico_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = invitations.gabinete_id
          AND gm.user_id = auth.uid()
      )
      OR (lower(invitations.email) = lower(public.get_current_user_email()))
    );
  END IF;
END$$;

-- 4) Allow updates when performed by platform admin, politico/chefe of gabinete, or invited email owner (for acceptance flows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'invitations' 
      AND policyname = 'invites_update_by_admin_owner_or_member'
  ) THEN
    CREATE POLICY "invites_update_by_admin_owner_or_member"
    ON public.invitations
    FOR UPDATE
    TO authenticated
    USING (
      is_platform_admin()
      OR EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = invitations.gabinete_id
          AND g.politico_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = invitations.gabinete_id
          AND gm.user_id = auth.uid()
          AND gm.role IN ('chefe','politico','assessor')
      )
      OR (lower(invitations.email) = lower(public.get_current_user_email()))
    )
    WITH CHECK (
      is_platform_admin()
      OR EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = invitations.gabinete_id
          AND g.politico_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = invitations.gabinete_id
          AND gm.user_id = auth.uid()
          AND gm.role IN ('chefe','politico','assessor')
      )
      OR (lower(invitations.email) = lower(public.get_current_user_email()))
    );
  END IF;
END$$;

-- 5) (Optional) Allow delete by politico/chefe/admin of gabinete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'invitations' 
      AND policyname = 'invites_delete_by_politico_chefe_or_admin'
  ) THEN
    CREATE POLICY "invites_delete_by_politico_chefe_or_admin"
    ON public.invitations
    FOR DELETE
    TO authenticated
    USING (
      is_platform_admin()
      OR EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = invitations.gabinete_id
          AND g.politico_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = invitations.gabinete_id
          AND gm.user_id = auth.uid()
          AND gm.role = 'chefe'
      )
    );
  END IF;
END$$;