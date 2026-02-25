-- Clear existing tags and update with new categories
DELETE FROM public.indication_tags;

-- Insert all the new tags organized by categories and colors

-- INFRAESTRUTURA E OBRAS (Blue theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Iluminação Pública', 'INFRAESTRUTURA E OBRAS', 'Lightbulb', '#3b82f6', 'iluminacao_publica'),
('Pavimentação / Asfalto', 'INFRAESTRUTURA E OBRAS', 'Road', '#1e40af', 'asfalto_pavimentacao'),
('Calçamento', 'INFRAESTRUTURA E OBRAS', 'SquareStack', '#1e3a8a', 'calcamento'),
('Saneamento Básico', 'INFRAESTRUTURA E OBRAS', 'Droplets', '#2563eb', 'saneamento'),
('Limpeza Urbana', 'INFRAESTRUTURA E OBRAS', 'Trash2', '#3730a3', 'limpeza_urbana'),
('Drenagem / Esgoto', 'INFRAESTRUTURA E OBRAS', 'Waves', '#1d4ed8', 'drenagem_esgoto'),
('Abastecimento de Água', 'INFRAESTRUTURA E OBRAS', 'GlassWater', '#2dd4bf', 'agua'),
('Transporte Público', 'INFRAESTRUTURA E OBRAS', 'Bus', '#0891b2', 'transporte_publico'),
('Trânsito e Mobilidade', 'INFRAESTRUTURA E OBRAS', 'Car', '#0e7490', 'transito_mobilidade');

-- EDUCAÇÃO (Green theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Escola Municipal', 'EDUCAÇÃO', 'School', '#22c55e', 'escola'),
('Creche', 'EDUCAÇÃO', 'Baby', '#16a34a', 'creche'),
('Merenda Escolar', 'EDUCAÇÃO', 'UtensilsCrossed', '#15803d', 'merenda'),
('Transporte Escolar', 'EDUCAÇÃO', 'Bus', '#166534', 'transporte_escolar'),
('Material Didático', 'EDUCAÇÃO', 'BookOpen', '#14532d', 'material_didatico');

-- SAÚDE (Red theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Posto de Saúde / UBS', 'SAÚDE', 'Building2', '#ef4444', 'posto_saude'),
('Hospital', 'SAÚDE', 'Hospital', '#dc2626', 'hospital'),
('Ambulância / SAMU', 'SAÚDE', 'Ambulance', '#b91c1c', 'ambulancia'),
('Medicamentos', 'SAÚDE', 'Pill', '#991b1b', 'medicamentos'),
('Consultas / Exames', 'SAÚDE', 'Stethoscope', '#7f1d1d', 'consultas_exames');

-- SEGURANÇA (Orange theme)  
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Guarda Municipal', 'SEGURANÇA', 'Shield', '#f97316', 'guarda_municipal'),
('Polícia Militar', 'SEGURANÇA', 'ShieldCheck', '#ea580c', 'policia_militar'),
('Iluminação (segurança pública)', 'SEGURANÇA', 'Lightbulb', '#dc2626', 'iluminacao_publica'),
('Tráfego / Radar', 'SEGURANÇA', 'Camera', '#c2410c', 'trafego_radar');

-- ASSISTÊNCIA SOCIAL (Purple theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Apoio a Famílias Carentes', 'ASSISTÊNCIA SOCIAL', 'Heart', '#a855f7', 'apoio_familias'),
('Programas Sociais', 'ASSISTÊNCIA SOCIAL', 'Users', '#9333ea', 'programas_sociais'),
('Moradia Popular', 'ASSISTÊNCIA SOCIAL', 'Home', '#7c3aed', 'moradia_popular'),
('Idosos / Crianças / PCD', 'ASSISTÊNCIA SOCIAL', 'Accessibility', '#6d28d9', 'idosos_criancas_pcd');

-- ESPORTE E LAZER (Cyan theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Quadras / Campos', 'ESPORTE E LAZER', 'Gamepad2', '#06b6d4', 'quadras_campos'),
('Academias Populares', 'ESPORTE E LAZER', 'Dumbbell', '#0891b2', 'academias'),
('Eventos Esportivos', 'ESPORTE E LAZER', 'Trophy', '#0e7490', 'eventos_esportivos'),
('Espaços de Lazer', 'ESPORTE E LAZER', 'Trees', '#155e75', 'espacos_lazer');

-- CULTURA (Pink theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Festas Populares', 'CULTURA', 'PartyPopper', '#ec4899', 'festas_populares'),
('Patrimônio Cultural', 'CULTURA', 'Landmark', '#db2777', 'patrimonio_cultural'),
('Projetos Culturais', 'CULTURA', 'Palette', '#be185d', 'projetos_culturais');

-- MEIO AMBIENTE (Green theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Arborização', 'MEIO AMBIENTE', 'TreePine', '#059669', 'arborizacao'),
('Coleta de Lixo', 'MEIO AMBIENTE', 'Recycle', '#047857', 'coleta_lixo'),
('Reciclagem', 'MEIO AMBIENTE', 'RotateCcw', '#065f46', 'reciclagem'),
('Preservação Ambiental', 'MEIO AMBIENTE', 'Leaf', '#064e3b', 'preservacao_ambiental');

-- ANIMAIS/ZOONOSE (Brown theme)
INSERT INTO public.indication_tags (name, category, icon, color, tag_type) VALUES
('Animais/Zoonose', 'ANIMAIS/ZOONOSE', 'Dog', '#a16207', 'animais_zoonose');

-- Add new columns to indicacoes table if they don't exist
ALTER TABLE public.indicacoes 
ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES public.indication_tags(id),
ADD COLUMN IF NOT EXISTS responsavel_nome TEXT;