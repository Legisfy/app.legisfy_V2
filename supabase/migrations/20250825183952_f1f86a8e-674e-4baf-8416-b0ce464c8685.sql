-- Update the constraint to include 'Reclamação' as a valid type
ALTER TABLE feedback_ouvidoria DROP CONSTRAINT feedback_ouvidoria_tipo_check;

ALTER TABLE feedback_ouvidoria ADD CONSTRAINT feedback_ouvidoria_tipo_check 
CHECK (tipo = ANY (ARRAY['Elogio'::text, 'Dúvida'::text, 'Sugestão'::text, 'Problema'::text, 'Reclamação'::text]));