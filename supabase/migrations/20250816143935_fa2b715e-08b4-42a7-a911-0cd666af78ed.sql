-- ==============================
-- CORRIGIR PROBLEMAS DE SEGURANÇA - RLS
-- ==============================

-- Habilitar RLS em todas as tabelas que ainda não têm
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- ==============================
-- RLS POLICIES PARA STATES
-- ==============================
DROP POLICY IF EXISTS "admin_can_manage_states" ON public.states;
DROP POLICY IF EXISTS "public_can_read_states" ON public.states;

-- Admin pode gerenciar estados
CREATE POLICY "admin_can_manage_states" ON public.states
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Usuários autenticados podem ler estados
CREATE POLICY "public_can_read_states" ON public.states
FOR SELECT 
USING (auth.role() = 'authenticated');

-- ==============================
-- RLS POLICIES PARA CITIES
-- ==============================
DROP POLICY IF EXISTS "admin_can_manage_cities" ON public.cities;
DROP POLICY IF EXISTS "public_can_read_cities" ON public.cities;

-- Admin pode gerenciar cidades
CREATE POLICY "admin_can_manage_cities" ON public.cities
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Usuários autenticados podem ler cidades
CREATE POLICY "public_can_read_cities" ON public.cities
FOR SELECT 
USING (auth.role() = 'authenticated');

-- ==============================
-- RLS POLICIES PARA USERS
-- ==============================
DROP POLICY IF EXISTS "admin_can_manage_users" ON public.users;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;

-- Admin pode gerenciar todos os usuários
CREATE POLICY "admin_can_manage_users" ON public.users
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Usuários podem ver seu próprio perfil
CREATE POLICY "users_can_view_own_profile" ON public.users
FOR SELECT 
USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "users_can_update_own_profile" ON public.users
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Usuários podem inserir seu próprio perfil (para registros)
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.users;
CREATE POLICY "users_can_insert_own_profile" ON public.users
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ==============================
-- RLS POLICIES PARA PERMISSIONS
-- ==============================
DROP POLICY IF EXISTS "admin_can_manage_permissions" ON public.permissions;
DROP POLICY IF EXISTS "authenticated_can_read_permissions" ON public.permissions;

-- Admin pode gerenciar permissões
CREATE POLICY "admin_can_manage_permissions" ON public.permissions
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Usuários autenticados podem ler permissões
CREATE POLICY "authenticated_can_read_permissions" ON public.permissions
FOR SELECT 
USING (auth.role() = 'authenticated');

-- ==============================
-- CORRIGIR SEARCH PATH DAS FUNÇÕES EXISTENTES
-- ==============================

-- Atualizar função is_platform_admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->>'app_role') = 'ADMIN',
    false
  );
$$;

-- Atualizar função user_belongs_to_cabinet
CREATE OR REPLACE FUNCTION public.user_belongs_to_cabinet(target_cabinet_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.gabinete_usuarios gu
    WHERE gu.user_id = auth.uid() 
    AND gu.gabinete_id = target_cabinet_id 
    AND gu.ativo = true
  );
$$;

-- Atualizar função get_active_cabinet
CREATE OR REPLACE FUNCTION public.get_active_cabinet()
RETURNS TABLE(cabinet_id UUID, cabinet_name TEXT, user_role TEXT)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    gu.gabinete_id as cabinet_id,
    g.nome as cabinet_name,
    gu.role::text as user_role
  FROM public.gabinete_usuarios gu
  JOIN public.gabinetes g ON g.id = gu.gabinete_id
  WHERE gu.user_id = auth.uid() 
  AND gu.ativo = true
  ORDER BY gu.data_entrada DESC;
$$;

-- Atualizar função handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ==============================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ==============================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_states_uf ON public.states(uf);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON public.cities(state_id);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(code);

-- Índices para as tabelas existentes que melhoram performance do RLS
CREATE INDEX IF NOT EXISTS idx_eleitores_gabinete_id ON public.eleitores(gabinete_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_gabinete_id ON public.indicacoes(gabinete_id);
CREATE INDEX IF NOT EXISTS idx_demandas_gabinete_id ON public.demandas(gabinete_id);
CREATE INDEX IF NOT EXISTS idx_ideias_gabinete_id ON public.ideias(gabinete_id);
CREATE INDEX IF NOT EXISTS idx_eventos_gabinete_id ON public.eventos(gabinete_id);
CREATE INDEX IF NOT EXISTS idx_gabinete_usuarios_user_id ON public.gabinete_usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_gabinete_usuarios_gabinete_id ON public.gabinete_usuarios(gabinete_id);