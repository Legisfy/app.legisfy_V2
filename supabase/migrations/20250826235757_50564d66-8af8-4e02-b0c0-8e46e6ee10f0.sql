-- Add missing fields to invitations table and create proper relationship
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS gabinete_id UUID REFERENCES public.gabinetes(id);

-- Update existing invitations to link with gabinetes based on institution_id
UPDATE public.invitations 
SET gabinete_id = (
  SELECT g.id 
  FROM public.gabinetes g 
  WHERE g.camara_id = invitations.institution_id 
  LIMIT 1
)
WHERE gabinete_id IS NULL;