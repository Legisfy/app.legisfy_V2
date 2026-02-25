-- Habilitar RLS na tabela admin_emails
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que apenas admins vejam a tabela
CREATE POLICY "Only platform admins can view admin emails"
ON public.admin_emails
FOR SELECT
USING (is_platform_admin());

-- Criar política para permitir que apenas admins modifiquem a tabela
CREATE POLICY "Only platform admins can modify admin emails"
ON public.admin_emails
FOR ALL
USING (is_platform_admin());