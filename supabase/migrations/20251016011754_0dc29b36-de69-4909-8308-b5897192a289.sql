-- Adicionar coluna tag_id para indicações (para permitir tags customizadas)
ALTER TABLE public.indicacoes ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES public.indication_tags(id);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_indicacoes_tag_id ON public.indicacoes(tag_id);

-- Comentário explicativo
COMMENT ON COLUMN public.indicacoes.tag_id IS 'Referencia UUID para indication_tags ou gabinete_custom_tags, permitindo tags customizadas';

-- Nota: Mantemos a coluna 'tag' (ENUM) por enquanto para retrocompatibilidade
-- Em uma próxima migração, podemos migrar os dados do ENUM para tag_id e remover a coluna 'tag'