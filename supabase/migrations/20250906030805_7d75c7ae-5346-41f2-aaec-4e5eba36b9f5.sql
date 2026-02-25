-- Fix invitations.institution_id foreign key to reference camaras instead of institutions
ALTER TABLE public.invitations
DROP CONSTRAINT IF EXISTS invitations_institution_id_fkey;

ALTER TABLE public.invitations
ADD CONSTRAINT invitations_institution_id_fkey
FOREIGN KEY (institution_id)
REFERENCES public.camaras(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;