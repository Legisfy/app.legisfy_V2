-- Add observacoes field to indicacoes table
ALTER TABLE public.indicacoes 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.indicacoes.observacoes IS 'Internal observations and notes about the indication';