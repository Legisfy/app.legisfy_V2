-- Add status column to meu_assessor_ia table
ALTER TABLE meu_assessor_ia 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'em_aprendizado';

-- Add check constraint for valid status values
ALTER TABLE meu_assessor_ia 
ADD CONSTRAINT meu_assessor_ia_status_check 
CHECK (status IN ('em_aprendizado', 'ativo', 'desconectado'));