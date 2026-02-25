-- Add contract value to camaras table
ALTER TABLE public.camaras 
ADD COLUMN IF NOT EXISTS valor_contrato DECIMAL(15,2);