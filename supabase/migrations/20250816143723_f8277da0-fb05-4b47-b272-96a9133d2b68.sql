-- ==============================
-- MIGRAÇÃO CORRIGIDA PARA ALINHAR ESTRUTURA LEGISFY
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
-- 1. TABELA STATES (mapeando estados existentes)
-- ==============================
CREATE TABLE IF NOT EXISTS public.states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    uf TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrar dados de estados para states
INSERT INTO public.states (name, uf)
SELECT nome, sigla FROM public.estados
ON CONFLICT (uf) DO NOTHING;

-- ==============================
-- 2. TABELA CITIES (mapeando cidades existentes)
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

-- Migrar dados de cidades para cities
INSERT INTO public.cities (state_id, name, ibge_code)
SELECT s.id, c.nome, c.ibge_code
FROM public.cidades c
JOIN public.estados e ON c.estado_id = e.id
JOIN public.states s ON e.sigla = s.uf
ON CONFLICT (state_id, name) DO NOTHING;

-- ==============================
-- 3. TABELA INSTITUTIONS (mapeando camaras existentes) - CORRIGIDA
-- ==============================
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type institution_type_enum NOT NULL DEFAULT 'CAMARA_MUNICIPAL',
    state_id UUID NOT NULL REFERENCES public.states(id),
    city_id UUID REFERENCES public.cities(id),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    presidente TEXT,
    logomarca_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrar dados de camaras para institutions - CORRIGIDA para incluir state_id
INSERT INTO public.institutions (id, name, state_id, city_id, endereco, telefone, email, presidente, logomarca_url, created_at, updated_at)
SELECT 
    cam.id,
    cam.nome,
    s.id as state_id,
    cit.id as city_id,
    cam.endereco,
    cam.telefone,
    cam.email,
    cam.presidente,
    cam.logomarca_url,
    cam.created_at,
    cam.updated_at
FROM public.camaras cam
JOIN public.cidades cid ON cam.cidade_id = cid.id
JOIN public.estados est ON cid.estado_id = est.id
JOIN public.states s ON est.sigla = s.uf
JOIN public.cities cit ON cit.state_id = s.id AND cit.name = cid.nome
ON CONFLICT (id) DO NOTHING;

-- ==============================
-- 4. TABELA USERS (mapping 1:1 com auth.users)
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

-- Migrar dados de profiles para users
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
-- 5. TABELA POLITICIANS
-- ==============================
CREATE TABLE IF NOT EXISTS public.politicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id),
    office office_enum NOT NULL DEFAULT 'VEREADOR',
    institution_id UUID NOT NULL REFERENCES public.institutions(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 6. TABELA CABINETS (mapeando gabinetes existentes)
-- ==============================
CREATE TABLE IF NOT EXISTS public.cabinets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id UUID REFERENCES public.politicians(id),
    institution_id UUID NOT NULL REFERENCES public.institutions(id),
    name TEXT NOT NULL,
    logo_url TEXT,
    descricao TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrar gabinetes existentes para cabinets
INSERT INTO public.cabinets (id, institution_id, name, logo_url, descricao, status, created_at, updated_at)
SELECT 
    id,
    camara_id as institution_id,
    nome,
    logomarca_url,
    descricao,
    CASE 
        WHEN status::text = 'ativo' THEN 'ACTIVE'
        ELSE 'DISABLED'
    END,
    created_at,
    updated_at
FROM public.gabinetes
ON CONFLICT (id) DO NOTHING;

-- ==============================
-- 7. TABELA MEMBERSHIPS (nova estrutura para gabinete_usuarios)
-- ==============================
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    cabinet_id UUID NOT NULL REFERENCES public.cabinets(id),
    role membership_role_enum NOT NULL,
    status membership_status_enum DEFAULT 'ACTIVE',
    invited_by UUID REFERENCES public.users(id),
    joined_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, cabinet_id)
);

-- Migrar gabinete_usuarios para memberships
INSERT INTO public.memberships (user_id, cabinet_id, role, status, joined_at, created_at, updated_at)
SELECT 
    user_id,
    gabinete_id as cabinet_id,
    CASE 
        WHEN role::text = 'politico' THEN 'POLITICO'::membership_role_enum
        WHEN role::text = 'chefe_gabinete' THEN 'CHEFE_DE_GABINETE'::membership_role_enum
        ELSE 'ASSESSOR'::membership_role_enum
    END,
    CASE 
        WHEN ativo THEN 'ACTIVE'::membership_status_enum
        ELSE 'DISABLED'::membership_status_enum
    END,
    data_entrada,
    created_at,
    updated_at
FROM public.gabinete_usuarios
WHERE EXISTS (SELECT 1 FROM public.users WHERE id = gabinete_usuarios.user_id)
AND EXISTS (SELECT 1 FROM public.cabinets WHERE id = gabinete_usuarios.gabinete_id)
ON CONFLICT (user_id, cabinet_id) DO NOTHING;

-- ==============================
-- 8. TABELA PERMISSIONS
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
-- 9. TABELA ASSESSOR_PERMISSIONS
-- ==============================
CREATE TABLE IF NOT EXISTS public.assessor_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(membership_id, permission_id)
);

-- ==============================
-- 10. NOVA TABELA INVITATIONS (melhorada)
-- ==============================
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invited_email TEXT NOT NULL,
    cabinet_id UUID NOT NULL REFERENCES public.cabinets(id),
    role membership_role_enum NOT NULL,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by UUID NOT NULL REFERENCES public.users(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 11. ATUALIZAR TABELAS EXISTENTES COM CABINET_ID
-- ==============================

-- Atualizar eleitores
UPDATE public.eleitores 
SET cabinet_id = gabinete_id 
WHERE cabinet_id IS NULL AND gabinete_id IS NOT NULL;

-- Atualizar indicacoes
UPDATE public.indicacoes 
SET cabinet_id = gabinete_id 
WHERE cabinet_id IS NULL AND gabinete_id IS NOT NULL;

-- Atualizar demandas
UPDATE public.demandas 
SET cabinet_id = gabinete_id 
WHERE cabinet_id IS NULL AND gabinete_id IS NOT NULL;

-- Atualizar ideias
UPDATE public.ideias 
SET cabinet_id = gabinete_id 
WHERE cabinet_id IS NULL AND gabinete_id IS NOT NULL;

-- Atualizar eventos
UPDATE public.eventos 
SET cabinet_id = gabinete_id 
WHERE cabinet_id IS NULL AND gabinete_id IS NOT NULL;

-- ==============================
-- 12. FUNÇÕES AUXILIARES
-- ==============================

-- Função para verificar se usuário pertence ao gabinete
CREATE OR REPLACE FUNCTION public.user_belongs_to_cabinet(target_cabinet_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND cabinet_id = target_cabinet_id 
    AND status = 'ACTIVE'
  );
$$;

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

-- Função para obter gabinete ativo do usuário
CREATE OR REPLACE FUNCTION public.get_active_cabinet()
RETURNS TABLE(cabinet_id UUID, cabinet_name TEXT, user_role TEXT)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.cabinet_id,
    c.name,
    m.role::text
  FROM public.memberships m
  JOIN public.cabinets c ON c.id = m.cabinet_id
  WHERE m.user_id = auth.uid() 
  AND m.status = 'ACTIVE'
  ORDER BY m.joined_at DESC;
$$;

-- Função para aceitar convites
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitation_record public.invitations%ROWTYPE;
    cabinet_record public.cabinets%ROWTYPE;
    result JSONB;
BEGIN
    -- Buscar convite válido
    SELECT * INTO invitation_record
    FROM public.invitations
    WHERE token = invitation_token
    AND expires_at > now()
    AND accepted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Convite inválido ou expirado');
    END IF;
    
    -- Buscar gabinete
    SELECT * INTO cabinet_record
    FROM public.cabinets
    WHERE id = invitation_record.cabinet_id;
    
    -- Criar membership
    INSERT INTO public.memberships (user_id, cabinet_id, role, status, invited_by)
    VALUES (auth.uid(), invitation_record.cabinet_id, invitation_record.role, 'ACTIVE', invitation_record.invited_by)
    ON CONFLICT (user_id, cabinet_id) DO UPDATE SET
        role = invitation_record.role,
        status = 'ACTIVE',
        updated_at = now();
    
    -- Marcar convite como aceito
    UPDATE public.invitations
    SET accepted_at = now(), updated_at = now()
    WHERE id = invitation_record.id;
    
    RETURN jsonb_build_object(
        'success', true,
        'cabinet_id', cabinet_record.id,
        'cabinet_name', cabinet_record.name,
        'role', invitation_record.role
    );
END;
$$;

-- ==============================
-- 13. TRIGGER PARA ÚNICO CHEFE POR GABINETE
-- ==============================
CREATE OR REPLACE FUNCTION enforce_single_chief()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'CHEFE_DE_GABINETE' AND NEW.status = 'ACTIVE' THEN
        IF EXISTS (
            SELECT 1 FROM public.memberships
            WHERE cabinet_id = NEW.cabinet_id
            AND role = 'CHEFE_DE_GABINETE'
            AND status = 'ACTIVE'
            AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
        ) THEN
            RAISE EXCEPTION 'Já existe um Chefe de Gabinete ativo para este gabinete.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_single_chief ON public.memberships;
CREATE TRIGGER trg_single_chief
    BEFORE INSERT OR UPDATE ON public.memberships
    FOR EACH ROW EXECUTE FUNCTION enforce_single_chief();

-- ==============================
-- 14. TRIGGER PARA UPDATED_AT
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
    table_names TEXT[] := ARRAY['states', 'cities', 'institutions', 'users', 'politicians', 'cabinets', 'memberships', 'invitations'];
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