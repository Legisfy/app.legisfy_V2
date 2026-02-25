-- ==============================
-- MIGRAÇÃO SIMPLIFICADA PARA ALINHAR ESTRUTURA LEGISFY
-- ==============================

-- 1. Criar nova estrutura de tabelas sem migração de dados primeiro
-- 2. Implementar RLS adequado
-- 3. Criar funções essenciais

-- ==============================
-- PASO 1: ESTRUTURA DE TABELAS NOVA
-- ==============================

-- Criar enum para app_role se não existir
DO $$ BEGIN
    CREATE TYPE app_role_enum AS ENUM ('ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para office se não existir
DO $$ BEGIN
    CREATE TYPE office_enum AS ENUM ('VEREADOR', 'DEPUTADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para institution_type se não existir
DO $$ BEGIN
    CREATE TYPE institution_type_enum AS ENUM ('CAMARA_MUNICIPAL', 'ASSEMBLEIA_LEGISLATIVA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para membership_role se não existir
DO $$ BEGIN
    CREATE TYPE membership_role_enum AS ENUM ('POLITICO', 'CHEFE_DE_GABINETE', 'ASSESSOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para membership_status se não existir
DO $$ BEGIN
    CREATE TYPE membership_status_enum AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================
-- TABELA STATES
-- ==============================
CREATE TABLE IF NOT EXISTS public.states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    uf TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrar dados de estados
INSERT INTO public.states (name, uf)
SELECT nome, sigla FROM public.estados
ON CONFLICT (uf) DO NOTHING;

-- ==============================
-- TABELA CITIES
-- ==============================
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID NOT NULL REFERENCES public.states(id),
    name TEXT NOT NULL,
    ibge_code TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(state_id, name)
);

-- Migrar dados de cidades
INSERT INTO public.cities (state_id, name, ibge_code)
SELECT s.id, c.nome, c.ibge_code
FROM public.cidades c
JOIN public.estados e ON c.estado_id = e.id
JOIN public.states s ON e.sigla = s.uf
ON CONFLICT (state_id, name) DO NOTHING;

-- ==============================
-- TABELA USERS (mapping 1:1 com auth.users)
-- ==============================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    phone_whatsapp TEXT UNIQUE,
    app_role app_role_enum,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrar dados de profiles para users (apenas se não existirem)
INSERT INTO public.users (id, full_name, email, avatar_url, phone_whatsapp, created_at, updated_at)
SELECT 
    user_id,
    full_name,
    (SELECT email FROM auth.users WHERE id = user_id LIMIT 1),
    avatar_url,
    whatsapp,
    created_at,
    updated_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- ==============================
-- TABELA PERMISSIONS
-- ==============================
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir permissões básicas
INSERT INTO public.permissions (code, name, description) VALUES
('AGENDA', 'Agenda', 'Gerenciar eventos e agenda'),
('COMUNICACAO', 'Comunicação', 'Gerenciar comunicação e assessoria'),
('DOCUMENTOS', 'Documentos', 'Gerenciar documentos e modelos'),
('ELEITORES', 'Eleitores', 'Gerenciar base de eleitores'),
('INDICACOES', 'Indicações', 'Gerenciar indicações parlamentares'),
('DEMANDAS', 'Demandas', 'Gerenciar demandas da população'),
('IDEIAS', 'Ideias', 'Gerenciar banco de ideias')
ON CONFLICT (code) DO NOTHING;

-- ==============================
-- FUNÇÕES AUXILIARES PARA RLS
-- ==============================

-- Função para verificar se é admin da plataforma
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->>'app_role') = 'ADMIN',
    false
  );
$$;

-- Função para verificar se usuário pertence ao gabinete (compatível com estrutura atual)
CREATE OR REPLACE FUNCTION public.user_belongs_to_cabinet(target_cabinet_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.gabinete_usuarios gu
    WHERE gu.user_id = auth.uid() 
    AND gu.gabinete_id = target_cabinet_id 
    AND gu.ativo = true
  );
$$;

-- ==============================
-- IMPLEMENTAR RLS NAS TABELAS EXISTENTES
-- ==============================

-- RLS para ELEITORES (usando estrutura atual)
ALTER TABLE public.eleitores ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "admin_bypass_eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "members_select_eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "members_insert_eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "members_update_eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "members_delete_eleitores" ON public.eleitores;

-- Política de bypass para admin
CREATE POLICY "admin_bypass_eleitores" ON public.eleitores
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Política para membros do gabinete
CREATE POLICY "members_select_eleitores" ON public.eleitores
FOR SELECT 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "members_insert_eleitores" ON public.eleitores
FOR INSERT 
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "members_update_eleitores" ON public.eleitores
FOR UPDATE 
USING (user_belongs_to_cabinet(gabinete_id))
WITH CHECK (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "members_delete_eleitores" ON public.eleitores
FOR DELETE 
USING (user_belongs_to_cabinet(gabinete_id));

-- ==============================
-- RLS para INDICACOES
-- ==============================
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_bypass_indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "members_select_indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "members_insert_indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "members_update_indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "members_delete_indicacoes" ON public.indicacoes;

CREATE POLICY "admin_bypass_indicacoes" ON public.indicacoes
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "members_select_indicacoes" ON public.indicacoes
FOR SELECT 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "members_insert_indicacoes" ON public.indicacoes
FOR INSERT 
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "members_update_indicacoes" ON public.indicacoes
FOR UPDATE 
USING (user_belongs_to_cabinet(gabinete_id))
WITH CHECK (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "members_delete_indicacoes" ON public.indicacoes
FOR DELETE 
USING (user_belongs_to_cabinet(gabinete_id));

-- ==============================
-- RLS para DEMANDAS
-- ==============================
ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_bypass_demandas" ON public.demandas;
DROP POLICY IF EXISTS "members_select_demandas" ON public.demandas;
DROP POLICY IF EXISTS "members_insert_demandas" ON public.demandas;
DROP POLICY IF EXISTS "members_update_demandas" ON public.demandas;
DROP POLICY IF EXISTS "members_delete_demandas" ON public.demandas;

CREATE POLICY "admin_bypass_demandas" ON public.demandas
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "members_select_demandas" ON public.demandas
FOR SELECT 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "members_insert_demandas" ON public.demandas
FOR INSERT 
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "members_update_demandas" ON public.demandas
FOR UPDATE 
USING (user_belongs_to_cabinet(gabinete_id))
WITH CHECK (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "members_delete_demandas" ON public.demandas
FOR DELETE 
USING (user_belongs_to_cabinet(gabinete_id));

-- ==============================
-- RLS para IDEIAS
-- ==============================
ALTER TABLE public.ideias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_bypass_ideias" ON public.ideias;
DROP POLICY IF EXISTS "members_select_ideias" ON public.ideias;
DROP POLICY IF EXISTS "members_insert_ideias" ON public.ideias;
DROP POLICY IF EXISTS "members_update_ideias" ON public.ideias;
DROP POLICY IF EXISTS "members_delete_ideias" ON public.ideias;

CREATE POLICY "admin_bypass_ideias" ON public.ideias
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "members_select_ideias" ON public.ideias
FOR SELECT 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "members_insert_ideias" ON public.ideias
FOR INSERT 
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "members_update_ideias" ON public.ideias
FOR UPDATE 
USING (user_belongs_to_cabinet(gabinete_id))
WITH CHECK (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "members_delete_ideias" ON public.ideias
FOR DELETE 
USING (user_belongs_to_cabinet(gabinete_id));

-- ==============================
-- RLS para EVENTOS
-- ==============================
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_bypass_eventos" ON public.eventos;
DROP POLICY IF EXISTS "members_select_eventos" ON public.eventos;
DROP POLICY IF EXISTS "members_insert_eventos" ON public.eventos;
DROP POLICY IF EXISTS "members_update_eventos" ON public.eventos;
DROP POLICY IF EXISTS "members_delete_eventos" ON public.eventos;

CREATE POLICY "admin_bypass_eventos" ON public.eventos
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "members_select_eventos" ON public.eventos
FOR SELECT 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "members_insert_eventos" ON public.eventos
FOR INSERT 
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "members_update_eventos" ON public.eventos
FOR UPDATE 
USING (user_belongs_to_cabinet(gabinete_id))
WITH CHECK (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "members_delete_eventos" ON public.eventos
FOR DELETE 
USING (user_belongs_to_cabinet(gabinete_id));

-- ==============================
-- FUNÇÃO PARA OBTER GABINETE ATIVO
-- ==============================
CREATE OR REPLACE FUNCTION public.get_active_cabinet()
RETURNS TABLE(cabinet_id UUID, cabinet_name TEXT, user_role TEXT)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
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

-- ==============================
-- TRIGGERS DE UPDATED_AT
-- ==============================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at nas novas tabelas
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY['states', 'cities', 'users', 'permissions'];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at_%s ON public.%s', table_name, table_name);
        EXECUTE format('CREATE TRIGGER trg_updated_at_%s
            BEFORE UPDATE ON public.%s
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', table_name, table_name);
    END LOOP;
END
$$;