-- Fix the invitations table foreign key constraint
-- Drop the current foreign key constraint for institution_id
ALTER TABLE public.invitations 
DROP CONSTRAINT IF EXISTS invitations_institution_id_fkey;

-- Add the correct foreign key constraint referencing camaras table
ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_institution_id_fkey 
FOREIGN KEY (institution_id) REFERENCES public.camaras(id) ON DELETE CASCADE;