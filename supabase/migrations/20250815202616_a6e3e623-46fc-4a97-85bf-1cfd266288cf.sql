-- Create storage bucket for gabinete logos
INSERT INTO storage.buckets (id, name, public) VALUES ('gabinete-logos', 'gabinete-logos', true);

-- Create storage policies for gabinete logos
CREATE POLICY "Users can view gabinete logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gabinete-logos');

CREATE POLICY "Politicians can upload gabinete logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gabinete-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Politicians can update their gabinete logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'gabinete-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Politicians can delete their gabinete logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'gabinete-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create convites table for invitations
CREATE TABLE public.convites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role_type NOT NULL DEFAULT 'assessor',
  convidado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  aceito BOOLEAN DEFAULT false,
  data_convite TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_aceite TIMESTAMP WITH TIME ZONE,
  data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on convites
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

-- Create policies for convites
CREATE POLICY "Politicians can view their gabinete invites" 
ON public.convites 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes 
    WHERE gabinetes.id = convites.gabinete_id 
    AND (gabinetes.politico_id = auth.uid() OR gabinetes.chefe_id = auth.uid())
  )
);

CREATE POLICY "Politicians can create invites" 
ON public.convites 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gabinetes 
    WHERE gabinetes.id = convites.gabinete_id 
    AND gabinetes.politico_id = auth.uid()
  ) AND convidado_por = auth.uid()
);

CREATE POLICY "Politicians can update their invites" 
ON public.convites 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes 
    WHERE gabinetes.id = convites.gabinete_id 
    AND (gabinetes.politico_id = auth.uid() OR gabinetes.chefe_id = auth.uid())
  )
);

-- Add trigger for updated_at on convites
CREATE TRIGGER update_convites_updated_at
  BEFORE UPDATE ON public.convites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add logomarca_url to gabinetes table
ALTER TABLE public.gabinetes ADD COLUMN IF NOT EXISTS logomarca_url TEXT;