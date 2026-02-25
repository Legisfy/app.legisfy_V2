-- Adicionar campos necessários à tabela indicacoes
ALTER TABLE public.indicacoes 
ADD COLUMN IF NOT EXISTS endereco_rua text,
ADD COLUMN IF NOT EXISTS endereco_bairro text,
ADD COLUMN IF NOT EXISTS endereco_cep text,
ADD COLUMN IF NOT EXISTS fotos_urls text[],
ADD COLUMN IF NOT EXISTS latitude numeric(10,7),
ADD COLUMN IF NOT EXISTS longitude numeric(10,7);