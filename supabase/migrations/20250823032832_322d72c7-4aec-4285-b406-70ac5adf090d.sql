-- First create the enum type correctly
DO $$ BEGIN
  CREATE TYPE indication_tag_type AS ENUM (
    'infraestrutura_obras',
    'educacao', 
    'saude',
    'seguranca',
    'assistencia_social',
    'esporte_lazer',
    'cultura',
    'meio_ambiente',
    'animais_zoonose'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the indication tags table
CREATE TABLE IF NOT EXISTS public.indication_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  tag_type indication_tag_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.indication_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Everyone can view indication tags" ON public.indication_tags;
DROP POLICY IF EXISTS "Platform admins can manage indication tags" ON public.indication_tags;

CREATE POLICY "Everyone can view indication tags" ON public.indication_tags
  FOR SELECT USING (true);

CREATE POLICY "Platform admins can manage indication tags" ON public.indication_tags
  FOR ALL USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- Clear existing data
DELETE FROM public.indication_tags;

-- Insert predefined tags with organized colors and icons

-- INFRAESTRUTURA E OBRAS (Blue theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Iluminação Pública', 'INFRAESTRUTURA E OBRAS', 'Lightbulb', '#3b82f6', 'infraestrutura_obras'),
('Pavimentação / Asfalto', 'INFRAESTRUTURA E OBRAS', 'Road', '#1e40af', 'infraestrutura_obras'),
('Calçamento', 'INFRAESTRUTURA E OBRAS', 'SquareStack', '#1e3a8a', 'infraestrutura_obras'),
('Saneamento Básico', 'INFRAESTRUTURA E OBRAS', 'Droplets', '#2563eb', 'infraestrutura_obras'),
('Limpeza Urbana', 'INFRAESTRUTURA E OBRAS', 'Trash2', '#3730a3', 'infraestrutura_obras'),
('Drenagem / Esgoto', 'INFRAESTRUTURA E OBRAS', 'Waves', '#1d4ed8', 'infraestrutura_obras'),
('Abastecimento de Água', 'INFRAESTRUTURA E OBRAS', 'GlassWater', '#2dd4bf', 'infraestrutura_obras'),
('Transporte Público', 'INFRAESTRUTURA E OBRAS', 'Bus', '#0891b2', 'infraestrutura_obras'),
('Trânsito e Mobilidade', 'INFRAESTRUTURA E OBRAS', 'Car', '#0e7490', 'infraestrutura_obras');

-- EDUCAÇÃO (Green theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Escola Municipal', 'EDUCAÇÃO', 'School', '#22c55e', 'educacao'),
('Creche', 'EDUCAÇÃO', 'Baby', '#16a34a', 'educacao'),
('Merenda Escolar', 'EDUCAÇÃO', 'UtensilsCrossed', '#15803d', 'educacao'),
('Transporte Escolar', 'EDUCAÇÃO', 'Bus', '#166534', 'educacao'),
('Material Didático', 'EDUCAÇÃO', 'BookOpen', '#14532d', 'educacao');

-- SAÚDE (Red theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Posto de Saúde / UBS', 'SAÚDE', 'Building2', '#ef4444', 'saude'),
('Hospital', 'SAÚDE', 'Hospital', '#dc2626', 'saude'),
('Ambulância / SAMU', 'SAÚDE', 'Ambulance', '#b91c1c', 'saude'),
('Medicamentos', 'SAÚDE', 'Pill', '#991b1b', 'saude'),
('Consultas / Exames', 'SAÚDE', 'Stethoscope', '#7f1d1d', 'saude');

-- SEGURANÇA (Orange theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Guarda Municipal', 'SEGURANÇA', 'Shield', '#f97316', 'seguranca'),
('Polícia Militar', 'SEGURANÇA', 'ShieldCheck', '#ea580c', 'seguranca'),
('Iluminação (segurança pública)', 'SEGURANÇA', 'Lightbulb', '#dc2626', 'seguranca'),
('Tráfego / Radar', 'SEGURANÇA', 'Camera', '#c2410c', 'seguranca');

-- ASSISTÊNCIA SOCIAL (Purple theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Apoio a Famílias Carentes', 'ASSISTÊNCIA SOCIAL', 'Heart', '#a855f7', 'assistencia_social'),
('Programas Sociais', 'ASSISTÊNCIA SOCIAL', 'Users', '#9333ea', 'assistencia_social'),
('Moradia Popular', 'ASSISTÊNCIA SOCIAL', 'Home', '#7c3aed', 'assistencia_social'),
('Idosos / Crianças / PCD', 'ASSISTÊNCIA SOCIAL', 'Accessibility', '#6d28d9', 'assistencia_social');

-- ESPORTE E LAZER (Cyan theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Quadras / Campos', 'ESPORTE E LAZER', 'Gamepad2', '#06b6d4', 'esporte_lazer'),
('Academias Populares', 'ESPORTE E LAZER', 'Dumbbell', '#0891b2', 'esporte_lazer'),
('Eventos Esportivos', 'ESPORTE E LAZER', 'Trophy', '#0e7490', 'esporte_lazer'),
('Espaços de Lazer', 'ESPORTE E LAZER', 'Trees', '#155e75', 'esporte_lazer');

-- CULTURA (Pink theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Festas Populares', 'CULTURA', 'PartyPopper', '#ec4899', 'cultura'),
('Patrimônio Cultural', 'CULTURA', 'Landmark', '#db2777', 'cultura'),
('Projetos Culturais', 'CULTURA', 'Palette', '#be185d', 'cultura');

-- MEIO AMBIENTE (Green theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Arborização', 'MEIO AMBIENTE', 'TreePine', '#059669', 'meio_ambiente'),
('Coleta de Lixo', 'MEIO AMBIENTE', 'Recycle', '#047857', 'meio_ambiente'),
('Reciclagem', 'MEIO AMBIENTE', 'RotateCcw', '#065f46', 'meio_ambiente'),
('Preservação Ambiental', 'MEIO AMBIENTE', 'Leaf', '#064e3b', 'meio_ambiente');

-- ANIMAIS/ZOONOSE (Brown theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Animais/Zoonose', 'ANIMAIS/ZOONOSE', 'Dog', '#a16207', 'animais_zoonose');

-- Update the indicacoes table to include tag reference and new fields
ALTER TABLE public.indicacoes 
ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES public.indication_tags(id),
ADD COLUMN IF NOT EXISTS responsavel_nome TEXT;