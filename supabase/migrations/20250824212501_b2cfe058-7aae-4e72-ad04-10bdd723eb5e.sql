-- Add missing fields to eleitores table
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS sex text;
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS cep text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_eleitores_sex ON public.eleitores(sex);
CREATE INDEX IF NOT EXISTS idx_eleitores_profession ON public.eleitores(profession);

-- Add comment to track changes
COMMENT ON COLUMN public.eleitores.sex IS 'Sexo do eleitor: masculino, feminino, nao_binario';
COMMENT ON COLUMN public.eleitores.profession IS 'Profissão do eleitor';
COMMENT ON COLUMN public.eleitores.cep IS 'CEP do endereço do eleitor';