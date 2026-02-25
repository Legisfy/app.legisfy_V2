-- Create enum for motion categories
CREATE TYPE public.motion_category AS ENUM ('voto_de_louvor', 'mocao_de_aplauso', 'voto_de_pesar');

-- Create enum for motion status
CREATE TYPE public.motion_status AS ENUM ('proposto', 'aprovado', 'entregue');

-- Create table for motions and votes
CREATE TABLE public.mocoes_votos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL,
  user_id UUID NOT NULL,
  eleitor_id UUID,
  category public.motion_category NOT NULL,
  title TEXT NOT NULL,
  justification TEXT NOT NULL,
  ceremony_date DATE,
  status public.motion_status NOT NULL DEFAULT 'proposto',
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mocoes_votos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Gabinete members can view motions" 
ON public.mocoes_votos 
FOR SELECT 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Gabinete members can create motions" 
ON public.mocoes_votos 
FOR INSERT 
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "Gabinete members can update motions" 
ON public.mocoes_votos 
FOR UPDATE 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Gabinete members can delete motions" 
ON public.mocoes_votos 
FOR DELETE 
USING (user_belongs_to_cabinet(gabinete_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mocoes_votos_updated_at
BEFORE UPDATE ON public.mocoes_votos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();