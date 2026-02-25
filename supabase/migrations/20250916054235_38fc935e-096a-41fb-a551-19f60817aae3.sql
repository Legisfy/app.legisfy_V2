-- Corrigir políticas RLS para comunicados
-- A tabela comunicados precisa permitir que admins criem e gerenciem comunicados

-- Primeiro, criar/atualizar políticas para comunicados
DROP POLICY IF EXISTS "comunicados_admin_access" ON public.comunicados;
CREATE POLICY "comunicados_admin_access" 
ON public.comunicados 
FOR ALL 
USING (
  -- Permite acesso se o usuário é admin da plataforma
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.main_role = 'admin_plataforma'::user_role_type
  )
);

-- Política para visualização pública de comunicados ativos (para login banner)
DROP POLICY IF EXISTS "comunicados_public_view" ON public.comunicados;
CREATE POLICY "comunicados_public_view" 
ON public.comunicados 
FOR SELECT 
USING (
  ativo = true 
  AND (data_inicio IS NULL OR data_inicio <= now())
  AND (data_fim IS NULL OR data_fim >= now())
);

-- Corrigir política RLS para mocoes_votos 
-- A política atual só verifica gabinete_members, mas precisa incluir também o dono do gabinete

DROP POLICY IF EXISTS "mocoes_votos_all" ON public.mocoes_votos;
CREATE POLICY "mocoes_votos_access" 
ON public.mocoes_votos 
FOR ALL 
USING (
  -- Permite se usuário é dono do gabinete
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = mocoes_votos.gabinete_id 
    AND g.politico_id = auth.uid()
  )
  OR
  -- Permite se usuário é membro do gabinete
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = mocoes_votos.gabinete_id 
    AND gm.user_id = auth.uid()
  )
  OR
  -- Permite se é admin da plataforma
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.main_role = 'admin_plataforma'::user_role_type
  )
);

-- Adicionar política para admin acessar todos os dados para dashboard
-- Camaras
DROP POLICY IF EXISTS "camaras_admin_access" ON public.camaras;
CREATE POLICY "camaras_admin_access" 
ON public.camaras 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.main_role = 'admin_plataforma'::user_role_type
  )
);

-- Gabinetes - permitir admin ver todos
DROP POLICY IF EXISTS "gabinetes_admin_access" ON public.gabinetes;
CREATE POLICY "gabinetes_admin_access" 
ON public.gabinetes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.main_role = 'admin_plataforma'::user_role_type
  )
);