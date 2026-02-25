-- Criar função para confirmar emails automaticamente para usuários pré-autorizados
CREATE OR REPLACE FUNCTION public.auto_confirm_authorized_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o email está na lista de emails autorizados ou admin_emails, confirmar automaticamente
  IF EXISTS (
    SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email)
  ) OR EXISTS (
    SELECT 1 FROM public.politicos_autorizados WHERE lower(email) = lower(NEW.email)
  ) THEN
    -- Marcar como confirmado imediatamente
    NEW.email_confirmed_at = NOW();
    NEW.email_confirm_token = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'auth', 'public';