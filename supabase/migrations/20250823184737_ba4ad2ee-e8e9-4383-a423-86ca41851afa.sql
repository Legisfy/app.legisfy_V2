-- Remove the old status check constraint
ALTER TABLE public.indicacoes DROP CONSTRAINT IF EXISTS indicacoes_status_check;

-- Add new status check constraint with the correct flow values
ALTER TABLE public.indicacoes ADD CONSTRAINT indicacoes_status_check 
CHECK (status = ANY (ARRAY['criada'::text, 'formalizada'::text, 'protocolada'::text, 'pendente'::text, 'atendida'::text]));