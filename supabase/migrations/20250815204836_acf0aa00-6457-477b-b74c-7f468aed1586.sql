-- Habilitar RLS na tabela admin_emails
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Criar política para que apenas admins da plataforma possam gerenciar emails de admin
CREATE POLICY "Platform admins can manage admin emails"
ON public.admin_emails
FOR ALL
TO authenticated
USING (is_platform_admin())
WITH CHECK (is_platform_admin());