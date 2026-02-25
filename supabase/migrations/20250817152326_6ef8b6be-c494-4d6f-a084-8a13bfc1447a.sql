-- Fix platform admin detection to allow RLS-managed inserts/updates on camaras
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  -- 1) Check profiles.main_role set by handle_new_user trigger
  SELECT (main_role = 'admin_plataforma'::user_role_type)
  INTO v_is_admin
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF COALESCE(v_is_admin, false) THEN
    RETURN true;
  END IF;

  -- 2) Fallback: check if user's email is in admin_emails
  BEGIN
    PERFORM 1
    FROM public.admin_emails ae
    JOIN auth.users u ON u.id = auth.uid()
    WHERE lower(ae.email) = lower(u.email);

    IF FOUND THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN others THEN
    -- If auth.users is not accessible for any reason, ignore and continue
    NULL;
  END;

  -- 3) Backward compatibility: support JWT custom claim app_role = 'ADMIN'
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->>'app_role') = 'ADMIN',
    false
  );
END;
$$;