-- Criar tipos enum necessários
CREATE TYPE public.cargo_enum AS ENUM ('politico', 'chefe_gabinete', 'assessor', 'atendente');
CREATE TYPE public.status_indicacao_enum AS ENUM ('CRIADA', 'FORMALIZADA', 'PROTOCOLO', 'PENDENTE', 'ATENDIDA');
CREATE TYPE public.status_demanda_enum AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA');
CREATE TYPE public.origem_enum AS ENUM ('whatsapp', 'app', 'site');
CREATE TYPE public.tipo_midia_enum AS ENUM ('audio', 'imagem', 'pdf', 'outro');

-- Tabela de instituições
CREATE TABLE public.instituicoes_whatsapp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de gabinetes
CREATE TABLE public.gabinetes_whatsapp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    instituicao_id UUID NOT NULL REFERENCES public.instituicoes_whatsapp(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de usuários WhatsApp
CREATE TABLE public.usuarios_whatsapp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    whatsapp_e164 TEXT NOT NULL UNIQUE,
    cargo public.cargo_enum NOT NULL DEFAULT 'atendente',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de eleitores WhatsApp
CREATE TABLE public.eleitores_whatsapp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT,
    endereco TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de indicações WhatsApp
CREATE TABLE public.indicacoes_whatsapp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status public.status_indicacao_enum NOT NULL DEFAULT 'CRIADA',
    pdf_url TEXT,
    protocolo TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de demandas WhatsApp
CREATE TABLE public.demandas_whatsapp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status public.status_demanda_enum NOT NULL DEFAULT 'ABERTA',
    anexos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de ideias WhatsApp
CREATE TABLE public.ideias_whatsapp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    origem public.origem_enum NOT NULL DEFAULT 'whatsapp',
    anexos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mídias WhatsApp
CREATE TABLE public.midias_whatsapp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios_whatsapp(id) ON DELETE CASCADE,
    tipo public.tipo_midia_enum NOT NULL,
    url TEXT NOT NULL,
    metadados JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de auditoria WhatsApp
CREATE TABLE public.audit_log_whatsapp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES public.usuarios_whatsapp(id) ON DELETE SET NULL,
    gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
    acao TEXT NOT NULL,
    payload_resumido JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conversas WhatsApp (para gerenciar sessões)
CREATE TABLE public.whatsapp_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    usuario_id UUID REFERENCES public.usuarios_whatsapp(id) ON DELETE CASCADE,
    gabinete_id UUID REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações do agente IA
CREATE TABLE public.whatsapp_agent_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ativo BOOLEAN NOT NULL DEFAULT true,
    numero_oficial TEXT,
    prompt_sistema TEXT NOT NULL DEFAULT 'Você é o Agente IA da Legisfy. Identifique o usuário pelo número de WhatsApp e só mostre dados do gabinete dele, respeitando permissões. Responda curto, em português. Se faltar dado, faça perguntas objetivas. Nunca mostre dados de outros gabinetes.',
    mensagem_boas_vindas TEXT NOT NULL DEFAULT 'Olá! Sou o assistente virtual da Legisfy. Como posso ajudá-lo hoje?',
    tempo_max_resposta INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.whatsapp_agent_config (id) VALUES (gen_random_uuid());

-- Índices para performance
CREATE INDEX idx_usuarios_whatsapp_e164 ON public.usuarios_whatsapp(whatsapp_e164);
CREATE INDEX idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone_number);
CREATE INDEX idx_whatsapp_conversations_active ON public.whatsapp_conversations(active, last_activity);
CREATE INDEX idx_audit_log_gabinete ON public.audit_log_whatsapp(gabinete_id, created_at);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_instituicoes_whatsapp_updated_at
    BEFORE UPDATE ON public.instituicoes_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gabinetes_whatsapp_updated_at
    BEFORE UPDATE ON public.gabinetes_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_whatsapp_updated_at
    BEFORE UPDATE ON public.usuarios_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eleitores_whatsapp_updated_at
    BEFORE UPDATE ON public.eleitores_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_indicacoes_whatsapp_updated_at
    BEFORE UPDATE ON public.indicacoes_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_demandas_whatsapp_updated_at
    BEFORE UPDATE ON public.demandas_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideias_whatsapp_updated_at
    BEFORE UPDATE ON public.ideias_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_agent_config_updated_at
    BEFORE UPDATE ON public.whatsapp_agent_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();