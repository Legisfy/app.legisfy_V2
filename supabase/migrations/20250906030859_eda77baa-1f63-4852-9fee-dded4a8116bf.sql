-- Step 1: Drop existing foreign key to institutions
ALTER TABLE public.invitations
DROP CONSTRAINT IF EXISTS invitations_institution_id_fkey;

-- Step 2: Correct existing invitation records where institution_id was wrongly set to gabinete_id
UPDATE public.invitations i
SET institution_id = g.camara_id
FROM public.gabinetes g
WHERE i.gabinete_id = g.id
  AND (i.institution_id IS NULL OR i.institution_id = i.gabinete_id);

-- Step 3: Add new foreign key to camaras
ALTER TABLE public.invitations
ADD CONSTRAINT invitations_institution_id_fkey
FOREIGN KEY (institution_id)
REFERENCES public.camaras(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;