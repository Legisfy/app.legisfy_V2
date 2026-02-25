-- Permitir que membros do gabinete possam visualizar o registro do seu gabinete (para carregar logomarca e nome)
CREATE POLICY IF NOT EXISTS "Members can view their gabinetes"
ON public.gabinetes
FOR SELECT
USING (public.user_belongs_to_cabinet(id) OR public.is_platform_admin());