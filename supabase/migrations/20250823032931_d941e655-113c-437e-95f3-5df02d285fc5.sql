-- Create indication tags table with predefined categories and organize by colors and icons

-- Create the enum type for tag types first
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

-- Drop existing table if exists and recreate with proper structure
DROP TABLE IF EXISTS public.indication_tags CASCADE;

-- Create the indication tags table
CREATE TABLE public.indication_tags (
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
CREATE POLICY "Everyone can view indication tags" ON public.indication_tags
  FOR SELECT USING (true);

CREATE POLICY "Platform admins can manage indication tags" ON public.indication_tags
  FOR ALL USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- Insert predefined tags with organized colors and icons

-- INFRAESTRUTURA E OBRAS (Blue theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Iluminação Pública', 'INFRAESTRUTURA E OBRAS', 'Lightbulb', '#3b82f6', 'infraestrutura_obras'::indication_tag_type),
('Pavimentação / Asfalto', 'INFRAESTRUTURA E OBRAS', 'Road', '#1e40af', 'infraestrutura_obras'::indication_tag_type),
('Calçamento', 'INFRAESTRUTURA E OBRAS', 'SquareStack', '#1e3a8a', 'infraestrutura_obras'::indication_tag_type),
('Saneamento Básico', 'INFRAESTRUTURA E OBRAS', 'Droplets', '#2563eb', 'infraestrutura_obras'::indication_tag_type),
('Limpeza Urbana', 'INFRAESTRUTURA E OBRAS', 'Trash2', '#3730a3', 'infraestrutura_obras'::indication_tag_type),
('Drenagem / Esgoto', 'INFRAESTRUTURA E OBRAS', 'Waves', '#1d4ed8', 'infraestrutura_obras'::indication_tag_type),
('Abastecimento de Água', 'INFRAESTRUTURA E OBRAS', 'GlassWater', '#2dd4bf', 'infraestrutura_obras'::indication_tag_type),
('Transporte Público', 'INFRAESTRUTURA E OBRAS', 'Bus', '#0891b2', 'infraestrutura_obras'::indication_tag_type),
('Trânsito e Mobilidade', 'INFRAESTRUTURA E OBRAS', 'Car', '#0e7490', 'infraestrutura_obras'::indication_tag_type);

-- EDUCAÇÃO (Green theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Escola Municipal', 'EDUCAÇÃO', 'School', '#22c55e', 'educacao'::indication_tag_type),
('Creche', 'EDUCAÇÃO', 'Baby', '#16a34a', 'educacao'::indication_tag_type),
('Merenda Escolar', 'EDUCAÇÃO', 'UtensilsCrossed', '#15803d', 'educacao'::indication_tag_type),
('Transporte Escolar', 'EDUCAÇÃO', 'Bus', '#166534', 'educacao'::indication_tag_type),
('Material Didático', 'EDUCAÇÃO', 'BookOpen', '#14532d', 'educacao'::indication_tag_type);

-- SAÚDE (Red theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Posto de Saúde / UBS', 'SAÚDE', 'Building2', '#ef4444', 'saude'::indication_tag_type),
('Hospital', 'SAÚDE', 'Hospital', '#dc2626', 'saude'::indication_tag_type),
('Ambulância / SAMU', 'SAÚDE', 'Ambulance', '#b91c1c', 'saude'::indication_tag_type),
('Medicamentos', 'SAÚDE', 'Pill', '#991b1b', 'saude'::indication_tag_type),
('Consultas / Exames', 'SAÚDE', 'Stethoscope', '#7f1d1d', 'saude'::indication_tag_type);

-- SEGURANÇA (Orange theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Guarda Municipal', 'SEGURANÇA', 'Shield', '#f97316', 'seguranca'::indication_tag_type),
('Polícia Militar', 'SEGURANÇA', 'ShieldCheck', '#ea580c', 'seguranca'::indication_tag_type),
('Iluminação (segurança pública)', 'SEGURANÇA', 'Lightbulb', '#dc2626', 'seguranca'::indication_tag_type),
('Tráfego / Radar', 'SEGURANÇA', 'Camera', '#c2410c', 'seguranca'::indication_tag_type);

-- ASSISTÊNCIA SOCIAL (Purple theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Apoio a Famílias Carentes', 'ASSISTÊNCIA SOCIAL', 'Heart', '#a855f7', 'assistencia_social'::indication_tag_type),
('Programas Sociais', 'ASSISTÊNCIA SOCIAL', 'Users', '#9333ea', 'assistencia_social'::indication_tag_type),
('Moradia Popular', 'ASSISTÊNCIA SOCIAL', 'Home', '#7c3aed', 'assistencia_social'::indication_tag_type),
('Idosos / Crianças / PCD', 'ASSISTÊNCIA SOCIAL', 'Accessibility', '#6d28d9', 'assistencia_social'::indication_tag_type);

-- ESPORTE E LAZER (Cyan theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Quadras / Campos', 'ESPORTE E LAZER', 'Gamepad2', '#06b6d4', 'esporte_lazer'::indication_tag_type),
('Academias Populares', 'ESPORTE E LAZER', 'Dumbbell', '#0891b2', 'esporte_lazer'::indication_tag_type),
('Eventos Esportivos', 'ESPORTE E LAZER', 'Trophy', '#0e7490', 'esporte_lazer'::indication_tag_type),
('Espaços de Lazer', 'ESPORTE E LAZER', 'Trees', '#155e75', 'esporte_lazer'::indication_tag_type);

-- CULTURA (Pink theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Festas Populares', 'CULTURA', 'PartyPopper', '#ec4899', 'cultura'::indication_tag_type),
('Patrimônio Cultural', 'CULTURA', 'Landmark', '#db2777', 'cultura'::indication_tag_type),
('Projetos Culturais', 'CULTURA', 'Palette', '#be185d', 'cultura'::indication_tag_type);

-- MEIO AMBIENTE (Green theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Arborização', 'MEIO AMBIENTE', 'TreePine', '#059669', 'meio_ambiente'::indication_tag_type),
('Coleta de Lixo', 'MEIO AMBIENTE', 'Recycle', '#047857', 'meio_ambiente'::indication_tag_type),
('Reciclagem', 'MEIO AMBIENTE', 'RotateCcw', '#065f46', 'meio_ambiente'::indication_tag_type),
('Preservação Ambiental', 'MEIO AMBIENTE', 'Leaf', '#064e3b', 'meio_ambiente'::indication_tag_type);

-- ANIMAIS/ZOONOSE (Brown theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Animais/Zoonose', 'ANIMAIS/ZOONOSE', 'Dog', '#a16207', 'animais_zoonose'::indication_tag_type);

-- Update the indicacoes table to include tag reference and new fields
ALTER TABLE public.indicacoes 
ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES public.indication_tags(id),
ADD COLUMN IF NOT EXISTS responsavel_nome TEXT,
ADD COLUMN IF NOT EXISTS fotos_anexadas TEXT[];