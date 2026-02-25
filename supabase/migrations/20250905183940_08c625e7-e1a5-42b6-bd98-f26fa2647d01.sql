-- Fix the auto_confirm_authorized_users function to remove reference to non-existent field
CREATE OR REPLACE FUNCTION public.auto_confirm_authorized_users()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth', 'public'
AS $function$
BEGIN
  -- Se o email está na lista de emails autorizados ou admin_emails, confirmar automaticamente
  IF EXISTS (
    SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email)
  ) OR EXISTS (
    SELECT 1 FROM public.politicos_autorizados WHERE lower(email) = lower(NEW.email) AND is_active = true
  ) THEN
    -- Marcar como confirmado imediatamente (removido email_confirm_token que não existe mais)
    NEW.email_confirmed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$function$;