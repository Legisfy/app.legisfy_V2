-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Criar tabela de eleitores
CREATE TABLE public.eleitores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  social_media TEXT,
  tags TEXT[],
  profile_photo_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para eleitores
ALTER TABLE public.eleitores ENABLE ROW LEVEL SECURITY;

-- Políticas para eleitores
CREATE POLICY "Users can view their own eleitores" 
ON public.eleitores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own eleitores" 
ON public.eleitores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own eleitores" 
ON public.eleitores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own eleitores" 
ON public.eleitores 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar tabela de demandas
CREATE TABLE public.demandas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eleitor_id UUID REFERENCES public.eleitores(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'resolvida', 'cancelada')),
  comments TEXT,
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  categoria TEXT,
  data_limite DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para demandas
ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;

-- Políticas para demandas
CREATE POLICY "Users can view their own demandas" 
ON public.demandas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own demandas" 
ON public.demandas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own demandas" 
ON public.demandas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own demandas" 
ON public.demandas 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar tabela de indicações
CREATE TABLE public.indicacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eleitor_id UUID REFERENCES public.eleitores(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cargo_publico', 'beneficio_social', 'servico_publico', 'projeto', 'outro')),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovada', 'rejeitada', 'implementada')),
  justificativa TEXT,
  orgao_responsavel TEXT,
  prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  data_limite DATE,
  valor_estimado DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para indicações
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para indicações
CREATE POLICY "Users can view their own indicacoes" 
ON public.indicacoes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own indicacoes" 
ON public.indicacoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own indicacoes" 
ON public.indicacoes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own indicacoes" 
ON public.indicacoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar tabela de assessores
CREATE TABLE public.assessores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  departamento TEXT,
  email TEXT NOT NULL,
  telefone TEXT,
  data_contratacao DATE NOT NULL DEFAULT CURRENT_DATE,
  salario DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'exonerado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para assessores
ALTER TABLE public.assessores ENABLE ROW LEVEL SECURITY;

-- Políticas para assessores
CREATE POLICY "Users can view their own assessores" 
ON public.assessores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessores" 
ON public.assessores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessores" 
ON public.assessores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessores" 
ON public.assessores 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar tabela de eventos da agenda
CREATE TABLE public.eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  local TEXT,
  tipo TEXT DEFAULT 'reuniao' CHECK (tipo IN ('reuniao', 'evento_publico', 'compromisso', 'audiencia', 'sessao', 'outro')),
  participantes TEXT[],
  status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado')),
  cor TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para eventos
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Políticas para eventos
CREATE POLICY "Users can view their own eventos" 
ON public.eventos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own eventos" 
ON public.eventos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own eventos" 
ON public.eventos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own eventos" 
ON public.eventos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar tabela de ideias
CREATE TABLE public.ideias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'em_desenvolvimento', 'aprovada', 'implementada', 'rejeitada')),
  prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  impacto_estimado TEXT,
  recursos_necessarios TEXT,
  prazo_estimado TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para ideias
ALTER TABLE public.ideias ENABLE ROW LEVEL SECURITY;

-- Políticas para ideias
CREATE POLICY "Users can view their own ideias" 
ON public.ideias 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ideias" 
ON public.ideias 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideias" 
ON public.ideias 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideias" 
ON public.ideias 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar função para atualizar timestamps automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eleitores_updated_at
  BEFORE UPDATE ON public.eleitores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_demandas_updated_at
  BEFORE UPDATE ON public.demandas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_indicacoes_updated_at
  BEFORE UPDATE ON public.indicacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessores_updated_at
  BEFORE UPDATE ON public.assessores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideias_updated_at
  BEFORE UPDATE ON public.ideias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Criar trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar índices para melhor performance
CREATE INDEX idx_eleitores_user_id ON public.eleitores(user_id);
CREATE INDEX idx_eleitores_neighborhood ON public.eleitores(neighborhood);
CREATE INDEX idx_eleitores_tags ON public.eleitores USING GIN(tags);

CREATE INDEX idx_demandas_user_id ON public.demandas(user_id);
CREATE INDEX idx_demandas_status ON public.demandas(status);
CREATE INDEX idx_demandas_eleitor_id ON public.demandas(eleitor_id);

CREATE INDEX idx_indicacoes_user_id ON public.indicacoes(user_id);
CREATE INDEX idx_indicacoes_status ON public.indicacoes(status);
CREATE INDEX idx_indicacoes_tipo ON public.indicacoes(tipo);

CREATE INDEX idx_assessores_user_id ON public.assessores(user_id);
CREATE INDEX idx_assessores_status ON public.assessores(status);

CREATE INDEX idx_eventos_user_id ON public.eventos(user_id);
CREATE INDEX idx_eventos_data_inicio ON public.eventos(data_inicio);

CREATE INDEX idx_ideias_user_id ON public.ideias(user_id);
CREATE INDEX idx_ideias_status ON public.ideias(status);
CREATE INDEX idx_ideias_tags ON public.ideias USING GIN(tags);