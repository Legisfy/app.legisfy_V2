-- Criar hierarquia geográfica e estrutura de gabinetes
CREATE TYPE public.user_role_type as enum ('admin_plataforma', 'politico', 'chefe_gabinete', 'assessor');
CREATE TYPE public.gabinete_status as enum ('ativo', 'inativo', 'suspenso');
CREATE TYPE public.camara_tipo as enum ('municipal', 'estadual', 'federal');

-- Estados
CREATE TABLE public.estados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  sigla text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Cidades
CREATE TABLE public.cidades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  estado_id uuid NOT NULL REFERENCES public.estados(id) ON DELETE CASCADE,
  ibge_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Câmaras
CREATE TABLE public.camaras (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  tipo camara_tipo NOT NULL,
  cidade_id uuid NOT NULL REFERENCES public.cidades(id) ON DELETE CASCADE,
  endereco text,
  telefone text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Gabinetes
CREATE TABLE public.gabinetes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  camara_id uuid NOT NULL REFERENCES public.camaras(id) ON DELETE CASCADE,
  politico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chefe_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status gabinete_status NOT NULL DEFAULT 'ativo',
  descricao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(politico_id) -- Um político pode ter apenas um gabinete
);

-- Usuários do gabinete (many-to-many)
CREATE TABLE public.gabinete_usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id uuid NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  convidado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  data_entrada timestamp with time zone NOT NULL DEFAULT now(),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(gabinete_id, user_id) -- Um usuário não pode estar duplicado no mesmo gabinete
);

-- Conexões WhatsApp
CREATE TABLE public.whatsapp_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_number text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  verification_code text,
  verification_expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id), -- Um usuário pode ter apenas uma conexão WhatsApp ativa
  UNIQUE(whatsapp_number) -- Um número não pode estar conectado a múltiplos usuários
);

-- Sistema de gamificação - Pontuações
CREATE TABLE public.pontuacoes_assessores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gabinete_id uuid NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  pontos integer NOT NULL DEFAULT 0,
  eleitores_cadastrados integer NOT NULL DEFAULT 0,
  demandas_resolvidas integer NOT NULL DEFAULT 0,
  indicacoes_criadas integer NOT NULL DEFAULT 0,
  ideias_implementadas integer NOT NULL DEFAULT 0,
  mes_referencia date NOT NULL, -- Formato YYYY-MM-01
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, gabinete_id, mes_referencia)
);

-- Sistema de ranking mensal
CREATE TABLE public.rankings_mensais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id uuid NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  posicao integer NOT NULL,
  pontos_total integer NOT NULL,
  mes_referencia date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(gabinete_id, user_id, mes_referencia),
  UNIQUE(gabinete_id, posicao, mes_referencia)
);

-- Atualizar tabela profiles para incluir role
ALTER TABLE public.profiles 
ADD COLUMN whatsapp text,
ADD COLUMN is_whatsapp_verified boolean DEFAULT false,
ADD COLUMN main_role user_role_type DEFAULT 'assessor';

-- Adicionar gabinete_id às tabelas existentes
ALTER TABLE public.eleitores ADD COLUMN gabinete_id uuid REFERENCES public.gabinetes(id) ON DELETE CASCADE;
ALTER TABLE public.demandas ADD COLUMN gabinete_id uuid REFERENCES public.gabinetes(id) ON DELETE CASCADE;
ALTER TABLE public.indicacoes ADD COLUMN gabinete_id uuid REFERENCES public.gabinetes(id) ON DELETE CASCADE;
ALTER TABLE public.ideias ADD COLUMN gabinete_id uuid REFERENCES public.gabinetes(id) ON DELETE CASCADE;
ALTER TABLE public.eventos ADD COLUMN gabinete_id uuid REFERENCES public.gabinetes(id) ON DELETE CASCADE;
ALTER TABLE public.assessores ADD COLUMN gabinete_id uuid REFERENCES public.gabinetes(id) ON DELETE CASCADE;

-- Atualizar gabinete_id como NOT NULL (após popular com dados)
ALTER TABLE public.eleitores ALTER COLUMN gabinete_id SET NOT NULL;
ALTER TABLE public.demandas ALTER COLUMN gabinete_id SET NOT NULL;
ALTER TABLE public.indicacoes ALTER COLUMN gabinete_id SET NOT NULL;
ALTER TABLE public.ideias ALTER COLUMN gabinete_id SET NOT NULL;
ALTER TABLE public.eventos ALTER COLUMN gabinete_id SET NOT NULL;
ALTER TABLE public.assessores ALTER COLUMN gabinete_id SET NOT NULL;

-- Enable RLS em todas as novas tabelas
ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camaras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gabinetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gabinete_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontuacoes_assessores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings_mensais ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário pertence ao gabinete
CREATE OR REPLACE FUNCTION public.user_belongs_to_gabinete(target_gabinete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.gabinete_usuarios 
    WHERE user_id = auth.uid() 
    AND gabinete_id = target_gabinete_id 
    AND ativo = true
  );
$$;

-- Função para verificar se usuário é admin da plataforma
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  );
$$;

-- Políticas RLS para hierarquia geográfica (admins podem ver tudo)
CREATE POLICY "Platform admins can manage estados" ON public.estados
  FOR ALL USING (public.is_platform_admin());

CREATE POLICY "Platform admins can manage cidades" ON public.cidades
  FOR ALL USING (public.is_platform_admin());

CREATE POLICY "Platform admins can manage camaras" ON public.camaras
  FOR ALL USING (public.is_platform_admin());

-- Políticas para gabinetes
CREATE POLICY "Users can view their own gabinete" ON public.gabinetes
  FOR SELECT USING (
    public.is_platform_admin() OR 
    EXISTS (
      SELECT 1 FROM public.gabinete_usuarios 
      WHERE gabinete_id = id AND user_id = auth.uid() AND ativo = true
    )
  );

CREATE POLICY "Politicians can create gabinetes" ON public.gabinetes
  FOR INSERT WITH CHECK (politico_id = auth.uid());

CREATE POLICY "Politicians and chiefs can update their gabinete" ON public.gabinetes
  FOR UPDATE USING (
    public.is_platform_admin() OR 
    politico_id = auth.uid() OR 
    chefe_id = auth.uid()
  );

-- Políticas para gabinete_usuarios
CREATE POLICY "Users can view gabinete members" ON public.gabinete_usuarios
  FOR SELECT USING (
    public.is_platform_admin() OR
    public.user_belongs_to_gabinete(gabinete_id)
  );

CREATE POLICY "Politicians and chiefs can manage gabinete users" ON public.gabinete_usuarios
  FOR ALL USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.gabinetes g 
      WHERE g.id = gabinete_id 
      AND (g.politico_id = auth.uid() OR g.chefe_id = auth.uid())
    )
  );

-- Políticas para WhatsApp connections
CREATE POLICY "Users can manage their own whatsapp" ON public.whatsapp_connections
  FOR ALL USING (user_id = auth.uid() OR public.is_platform_admin());

-- Políticas para gamificação
CREATE POLICY "Users can view gabinete rankings" ON public.pontuacoes_assessores
  FOR SELECT USING (
    public.is_platform_admin() OR
    public.user_belongs_to_gabinete(gabinete_id)
  );

CREATE POLICY "System can insert/update pontuacoes" ON public.pontuacoes_assessores
  FOR ALL USING (
    public.is_platform_admin() OR
    public.user_belongs_to_gabinete(gabinete_id)
  );

CREATE POLICY "Users can view gabinete rankings" ON public.rankings_mensais
  FOR SELECT USING (
    public.is_platform_admin() OR
    public.user_belongs_to_gabinete(gabinete_id)
  );

-- Atualizar políticas existentes para usar gabinete_id
DROP POLICY IF EXISTS "Users can view their own eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Users can create their own eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Users can update their own eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Users can delete their own eleitores" ON public.eleitores;

CREATE POLICY "Users can view gabinete eleitores" ON public.eleitores
  FOR SELECT USING (
    public.is_platform_admin() OR
    public.user_belongs_to_gabinete(gabinete_id)
  );

CREATE POLICY "Users can create gabinete eleitores" ON public.eleitores
  FOR INSERT WITH CHECK (
    public.user_belongs_to_gabinete(gabinete_id) AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can update gabinete eleitores" ON public.eleitores
  FOR UPDATE USING (
    public.is_platform_admin() OR
    public.user_belongs_to_gabinete(gabinete_id)
  );

CREATE POLICY "Users can delete gabinete eleitores" ON public.eleitores
  FOR DELETE USING (
    public.is_platform_admin() OR
    public.user_belongs_to_gabinete(gabinete_id)
  );

-- Repetir para demandas, indicações, ideias, eventos, assessores
DROP POLICY IF EXISTS "Users can view their own demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users can create their own demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users can update their own demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users can delete their own demandas" ON public.demandas;

CREATE POLICY "Users can view gabinete demandas" ON public.demandas
  FOR SELECT USING (public.user_belongs_to_gabinete(gabinete_id));

CREATE POLICY "Users can create gabinete demandas" ON public.demandas
  FOR INSERT WITH CHECK (public.user_belongs_to_gabinete(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "Users can update gabinete demandas" ON public.demandas
  FOR UPDATE USING (public.user_belongs_to_gabinete(gabinete_id));

CREATE POLICY "Users can delete gabinete demandas" ON public.demandas
  FOR DELETE USING (public.user_belongs_to_gabinete(gabinete_id));

-- Aplicar mesmas políticas para indicações
DROP POLICY IF EXISTS "Users can view their own indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "Users can create their own indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "Users can update their own indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "Users can delete their own indicacoes" ON public.indicacoes;

CREATE POLICY "Users can view gabinete indicacoes" ON public.indicacoes
  FOR SELECT USING (public.user_belongs_to_gabinete(gabinete_id));

CREATE POLICY "Users can create gabinete indicacoes" ON public.indicacoes
  FOR INSERT WITH CHECK (public.user_belongs_to_gabinete(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "Users can update gabinete indicacoes" ON public.indicacoes
  FOR UPDATE USING (public.user_belongs_to_gabinete(gabinete_id));

CREATE POLICY "Users can delete gabinete indicacoes" ON public.indicacoes
  FOR DELETE USING (public.user_belongs_to_gabinete(gabinete_id));

-- Aplicar mesmas políticas para ideias
DROP POLICY IF EXISTS "Users can view their own ideias" ON public.ideias;
DROP POLICY IF EXISTS "Users can create their own ideias" ON public.ideias;
DROP POLICY IF EXISTS "Users can update their own ideias" ON public.ideias;
DROP POLICY IF EXISTS "Users can delete their own ideias" ON public.ideias;

CREATE POLICY "Users can view gabinete ideias" ON public.ideias
  FOR SELECT USING (public.user_belongs_to_gabinete(gabinete_id));

CREATE POLICY "Users can create gabinete ideias" ON public.ideias
  FOR INSERT WITH CHECK (public.user_belongs_to_gabinete(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "Users can update gabinete ideias" ON public.ideias
  FOR UPDATE USING (public.user_belongs_to_gabinete(gabinete_id));

CREATE POLICY "Users can delete gabinete ideias" ON public.ideias
  FOR DELETE USING (public.user_belongs_to_gabinete(gabinete_id));

-- Aplicar mesmas políticas para eventos
DROP POLICY IF EXISTS "Users can view their own eventos" ON public.eventos;
DROP POLICY IF EXISTS "Users can create their own eventos" ON public.eventos;
DROP POLICY IF EXISTS "Users can update their own eventos" ON public.eventos;
DROP POLICY IF EXISTS "Users can delete their own eventos" ON public.eventos;

CREATE POLICY "Users can view gabinete eventos" ON public.eventos
  FOR SELECT USING (public.user_belongs_to_gabinete(gabinete_id));

CREATE POLICY "Users can create gabinete eventos" ON public.eventos
  FOR INSERT WITH CHECK (public.user_belongs_to_gabinete(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "Users can update gabinete eventos" ON public.eventos
  FOR UPDATE USING (public.user_belongs_to_gabinete(gabinete_id));

CREATE POLICY "Users can delete gabinete eventos" ON public.eventos
  FOR DELETE USING (public.user_belongs_to_gabinete(gabinete_id));

-- Aplicar mesmas políticas para assessores
DROP POLICY IF EXISTS "Users can view their own assessores" ON public.assessores;
DROP POLICY IF EXISTS "Users can create their own assessores" ON public.assessores;
DROP POLICY IF EXISTS "Users can update their own assessores" ON public.assessores;
DROP POLICY IF EXISTS "Users can delete their own assessores" ON public.assessores;

CREATE POLICY "Users can view gabinete assessores" ON public.assessores
  FOR SELECT USING (public.user_belongs_to_gabinete(gabinete_id));

CREATE POLICY "Users can create gabinete assessores" ON public.assessores
  FOR INSERT WITH CHECK (public.user_belongs_to_gabinete(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "Users can update gabinete assessores" ON public.assessores
  FOR UPDATE USING (public.user_belongs_to_gabinete(gabinete_id));

CREATE POLICY "Users can delete gabinete assessores" ON public.assessores
  FOR DELETE USING (public.user_belongs_to_gabinete(gabinete_id));

-- Triggers para updated_at em novas tabelas
CREATE TRIGGER update_estados_updated_at
  BEFORE UPDATE ON public.estados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cidades_updated_at
  BEFORE UPDATE ON public.cidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_camaras_updated_at
  BEFORE UPDATE ON public.camaras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gabinetes_updated_at
  BEFORE UPDATE ON public.gabinetes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gabinete_usuarios_updated_at
  BEFORE UPDATE ON public.gabinete_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON public.whatsapp_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pontuacoes_assessores_updated_at
  BEFORE UPDATE ON public.pontuacoes_assessores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular ranking mensal
CREATE OR REPLACE FUNCTION public.calculate_monthly_ranking(target_gabinete_id uuid, target_month date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletar ranking existente do mês
  DELETE FROM public.rankings_mensais 
  WHERE gabinete_id = target_gabinete_id AND mes_referencia = target_month;
  
  -- Inserir novo ranking baseado nas pontuações
  INSERT INTO public.rankings_mensais (gabinete_id, user_id, posicao, pontos_total, mes_referencia)
  SELECT 
    target_gabinete_id,
    user_id,
    ROW_NUMBER() OVER (ORDER BY pontos DESC) as posicao,
    pontos as pontos_total,
    target_month
  FROM public.pontuacoes_assessores
  WHERE gabinete_id = target_gabinete_id 
  AND mes_referencia = target_month
  ORDER BY pontos DESC;
END;
$$;