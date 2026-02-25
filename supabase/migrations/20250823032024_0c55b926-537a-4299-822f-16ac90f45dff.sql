-- Create enum for indication tags
CREATE TYPE indication_tag_type AS ENUM (
  'iluminacao_publica',
  'pavimentacao_asfalto',
  'calcamento',
  'saneamento_basico',
  'limpeza_urbana',
  'drenagem_esgoto',
  'abastecimento_agua',
  'transporte_publico',
  'transito_mobilidade',
  'escola_municipal',
  'creche',
  'merenda_escolar',
  'transporte_escolar',
  'material_didatico',
  'posto_saude_ubs',
  'hospital',
  'ambulancia_samu',
  'medicamentos',
  'consultas_exames',
  'guarda_municipal',
  'policia_militar',
  'iluminacao_seguranca',
  'trafego_radar',
  'apoio_familias',
  'programas_sociais',
  'moradia_popular',
  'idosos_criancas_pcd',
  'quadras_campos',
  'academias_populares',
  'eventos_esportivos',
  'espacos_lazer',
  'festas_populares',
  'patrimonio_cultural',
  'projetos_culturais',
  'arborizacao',
  'coleta_lixo',
  'reciclagem',
  'preservacao_ambiental',
  'animais_zoonose'
);

-- Create tags table with categories, colors and icons
CREATE TABLE public.indication_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_type indication_tag_type NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  color text NOT NULL,
  icon text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.indication_tags ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing tags
CREATE POLICY "Everyone can view indication tags"
ON public.indication_tags
FOR SELECT
USING (true);

-- Create policy for admin management
CREATE POLICY "Platform admins can manage indication tags"
ON public.indication_tags
FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Insert predefined tags
INSERT INTO public.indication_tags (tag_type, name, category, color, icon) VALUES
-- INFRAESTRUTURA E OBRAS
('iluminacao_publica', 'Iluminação Pública', 'Infraestrutura e Obras', '#f59e0b', 'Lightbulb'),
('pavimentacao_asfalto', 'Pavimentação / Asfalto', 'Infraestrutura e Obras', '#6b7280', 'Construction'),
('calcamento', 'Calçamento', 'Infraestrutura e Obras', '#78716c', 'HardHat'),
('saneamento_basico', 'Saneamento Básico', 'Infraestrutura e Obras', '#0891b2', 'Waves'),
('limpeza_urbana', 'Limpeza Urbana', 'Infraestrutura e Obras', '#16a34a', 'Trash2'),
('drenagem_esgoto', 'Drenagem / Esgoto', 'Infraestrutura e Obras', '#0369a1', 'Droplets'),
('abastecimento_agua', 'Abastecimento de Água', 'Infraestrutura e Obras', '#0ea5e9', 'Droplet'),
('transporte_publico', 'Transporte Público', 'Infraestrutura e Obras', '#dc2626', 'Bus'),
('transito_mobilidade', 'Trânsito e Mobilidade', 'Infraestrutura e Obras', '#ea580c', 'Car'),

-- EDUCAÇÃO
('escola_municipal', 'Escola Municipal', 'Educação', '#7c3aed', 'School'),
('creche', 'Creche', 'Educação', '#c026d3', 'Baby'),
('merenda_escolar', 'Merenda Escolar', 'Educação', '#059669', 'Apple'),
('transporte_escolar', 'Transporte Escolar', 'Educação', '#d97706', 'Bus'),
('material_didatico', 'Material Didático', 'Educação', '#0d9488', 'BookOpen'),

-- SAÚDE
('posto_saude_ubs', 'Posto de Saúde / UBS', 'Saúde', '#dc2626', 'Cross'),
('hospital', 'Hospital', 'Saúde', '#b91c1c', 'Hospital'),
('ambulancia_samu', 'Ambulância / SAMU', 'Saúde', '#ef4444', 'Truck'),
('medicamentos', 'Medicamentos', 'Saúde', '#f97316', 'Pill'),
('consultas_exames', 'Consultas / Exames', 'Saúde', '#ec4899', 'Stethoscope'),

-- SEGURANÇA
('guarda_municipal', 'Guarda Municipal', 'Segurança', '#1e40af', 'Shield'),
('policia_militar', 'Polícia Militar', 'Segurança', '#1d4ed8', 'ShieldCheck'),
('iluminacao_seguranca', 'Iluminação (segurança pública)', 'Segurança', '#facc15', 'Lightbulb'),
('trafego_radar', 'Tráfego / Radar', 'Segurança', '#f59e0b', 'Camera'),

-- ASSISTÊNCIA SOCIAL
('apoio_familias', 'Apoio a Famílias Carentes', 'Assistência Social', '#be185d', 'Heart'),
('programas_sociais', 'Programas Sociais', 'Assistência Social', '#a21caf', 'Users'),
('moradia_popular', 'Moradia Popular', 'Assistência Social', '#7c2d12', 'Home'),
('idosos_criancas_pcd', 'Idosos / Crianças / PCD', 'Assistência Social', '#be123c', 'Heart'),

-- ESPORTE E LAZER
('quadras_campos', 'Quadras / Campos', 'Esporte e Lazer', '#16a34a', 'Trophy'),
('academias_populares', 'Academias Populares', 'Esporte e Lazer', '#15803d', 'Dumbbell'),
('eventos_esportivos', 'Eventos Esportivos', 'Esporte e Lazer', '#059669', 'Calendar'),
('espacos_lazer', 'Espaços de Lazer', 'Esporte e Lazer', '#0d9488', 'MapPin'),

-- CULTURA
('festas_populares', 'Festas Populares', 'Cultura', '#a855f7', 'Music'),
('patrimonio_cultural', 'Patrimônio Cultural', 'Cultura', '#8b5cf6', 'Landmark'),
('projetos_culturais', 'Projetos Culturais', 'Cultura', '#7c3aed', 'Palette'),

-- MEIO AMBIENTE
('arborizacao', 'Arborização', 'Meio Ambiente', '#22c55e', 'Tree'),
('coleta_lixo', 'Coleta de Lixo', 'Meio Ambiente', '#65a30d', 'Recycle'),
('reciclagem', 'Reciclagem', 'Meio Ambiente', '#84cc16', 'RotateCcw'),
('preservacao_ambiental', 'Preservação Ambiental', 'Meio Ambiente', '#16a34a', 'Leaf'),

-- ANIMAIS/ZOONOSE
('animais_zoonose', 'Animais/Zoonose', 'Animais/Zoonose', '#f97316', 'Dog');

-- Add tag column to indicacoes table
ALTER TABLE public.indicacoes ADD COLUMN tag indication_tag_type;

-- Add photos column to indicacoes table (array of URLs)
ALTER TABLE public.indicacoes ADD COLUMN fotos_urls text[] DEFAULT '{}';

-- Drop the old fotos_urls column if it exists and recreate it properly
ALTER TABLE public.indicacoes DROP COLUMN IF EXISTS fotos_urls CASCADE;
ALTER TABLE public.indicacoes ADD COLUMN fotos_urls text[] DEFAULT '{}';