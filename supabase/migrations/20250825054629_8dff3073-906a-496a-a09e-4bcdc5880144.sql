-- Criar tabela para metas do gabinete
CREATE TABLE public.gabinete_metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('eleitores', 'demandas', 'ideias', 'indicacoes')),
  meta INTEGER NOT NULL CHECK (meta > 0),
  premio TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para configurações de pontuação do gabinete
CREATE TABLE public.gabinete_pontuacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL,
  acao TEXT NOT NULL,
  pontos INTEGER NOT NULL CHECK (pontos >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.gabinete_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gabinete_pontuacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para gabinete_metas
CREATE POLICY "Users can view metas from their gabinete" 
ON public.gabinete_metas 
FOR SELECT 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Users can create metas for their gabinete" 
ON public.gabinete_metas 
FOR INSERT 
WITH CHECK (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Users can update metas from their gabinete" 
ON public.gabinete_metas 
FOR UPDATE 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Users can delete metas from their gabinete" 
ON public.gabinete_metas 
FOR DELETE 
USING (user_belongs_to_cabinet(gabinete_id));

-- Políticas de RLS para gabinete_pontuacoes
CREATE POLICY "Users can view pontuacoes from their gabinete" 
ON public.gabinete_pontuacoes 
FOR SELECT 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Users can create pontuacoes for their gabinete" 
ON public.gabinete_pontuacoes 
FOR INSERT 
WITH CHECK (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Users can update pontuacoes from their gabinete" 
ON public.gabinete_pontuacoes 
FOR UPDATE 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Users can delete pontuacoes from their gabinete" 
ON public.gabinete_pontuacoes 
FOR DELETE 
USING (user_belongs_to_cabinet(gabinete_id));

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_gabinete_metas_updated_at
BEFORE UPDATE ON public.gabinete_metas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gabinete_pontuacoes_updated_at
BEFORE UPDATE ON public.gabinete_pontuacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();