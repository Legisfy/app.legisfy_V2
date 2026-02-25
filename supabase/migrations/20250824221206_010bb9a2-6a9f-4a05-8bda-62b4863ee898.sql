-- Create demand categories table
CREATE TABLE IF NOT EXISTS public.demand_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  icon text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create demand tags table  
CREATE TABLE IF NOT EXISTS public.demand_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.demand_categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert categories with their icons
INSERT INTO public.demand_categories (name, icon) VALUES 
('Saúde', '🏥'),
('Educação', '🎓'), 
('Trabalho', '💼'),
('Assistência Social / Habitação', '🏠'),
('Documentação', '📑'),
('Esporte / Cultura / Lazer', '⚽'),
('Eventos Comunitários', '🎉'),
('Animais', '🐾')
ON CONFLICT (name) DO NOTHING;

-- Insert tags for each category
INSERT INTO public.demand_tags (name, category_id) VALUES
-- Saúde
('Vaga em hospital', (SELECT id FROM public.demand_categories WHERE name = 'Saúde')),
('Consulta básica', (SELECT id FROM public.demand_categories WHERE name = 'Saúde')),
('Exame / cirurgia', (SELECT id FROM public.demand_categories WHERE name = 'Saúde')),
('Medicamento', (SELECT id FROM public.demand_categories WHERE name = 'Saúde')),
('Transporte para tratamento médico', (SELECT id FROM public.demand_categories WHERE name = 'Saúde')),

-- Educação
('Vaga em creche', (SELECT id FROM public.demand_categories WHERE name = 'Educação')),
('Vaga em escola', (SELECT id FROM public.demand_categories WHERE name = 'Educação')),
('Transferência escolar', (SELECT id FROM public.demand_categories WHERE name = 'Educação')),
('Material escolar / uniforme', (SELECT id FROM public.demand_categories WHERE name = 'Educação')),

-- Trabalho
('Trabalho / emprego', (SELECT id FROM public.demand_categories WHERE name = 'Trabalho')),
('Cursos / capacitação', (SELECT id FROM public.demand_categories WHERE name = 'Trabalho')),
('Inserção em programas de renda', (SELECT id FROM public.demand_categories WHERE name = 'Trabalho')),

-- Assistência Social / Habitação
('Cesta básica / auxílio alimentação', (SELECT id FROM public.demand_categories WHERE name = 'Assistência Social / Habitação')),
('Auxílio financeiro emergencial', (SELECT id FROM public.demand_categories WHERE name = 'Assistência Social / Habitação')),
('Benefício social (Bolsa Família, INSS, BPC etc.)', (SELECT id FROM public.demand_categories WHERE name = 'Assistência Social / Habitação')),
('Habitação (aluguel social, casa popular, regularização)', (SELECT id FROM public.demand_categories WHERE name = 'Assistência Social / Habitação')),
('Apoio em funerais / auxílio luto', (SELECT id FROM public.demand_categories WHERE name = 'Assistência Social / Habitação')),

-- Documentação
('Documento pessoal (RG, CPF, título de eleitor, carteira de trabalho)', (SELECT id FROM public.demand_categories WHERE name = 'Documentação')),
('Certidões (nascimento, casamento, óbito)', (SELECT id FROM public.demand_categories WHERE name = 'Documentação')),
('Orientação jurídica básica', (SELECT id FROM public.demand_categories WHERE name = 'Documentação')),

-- Esporte / Cultura / Lazer
('Inscrição em projetos esportivos', (SELECT id FROM public.demand_categories WHERE name = 'Esporte / Cultura / Lazer')),
('Apoio em eventos culturais', (SELECT id FROM public.demand_categories WHERE name = 'Esporte / Cultura / Lazer')),
('Incentivo cultural', (SELECT id FROM public.demand_categories WHERE name = 'Esporte / Cultura / Lazer')),
('Doação de material esportivo', (SELECT id FROM public.demand_categories WHERE name = 'Esporte / Cultura / Lazer')),
('Apoio em torneio / campeonato', (SELECT id FROM public.demand_categories WHERE name = 'Esporte / Cultura / Lazer')),

-- Eventos Comunitários
('Pedido de policiamento', (SELECT id FROM public.demand_categories WHERE name = 'Eventos Comunitários')),
('Brinquedos para crianças (pula-pula, algodão doce etc.)', (SELECT id FROM public.demand_categories WHERE name = 'Eventos Comunitários')),
('Apoio logístico (tendas, som, cadeiras)', (SELECT id FROM public.demand_categories WHERE name = 'Eventos Comunitários')),
('Doações diversas para festas locais', (SELECT id FROM public.demand_categories WHERE name = 'Eventos Comunitários')),

-- Animais
('Castração', (SELECT id FROM public.demand_categories WHERE name = 'Animais')),
('Atendimento emergencial', (SELECT id FROM public.demand_categories WHERE name = 'Animais')),
('Adoção / proteção', (SELECT id FROM public.demand_categories WHERE name = 'Animais'));

-- Enable RLS
ALTER TABLE public.demand_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for demand_categories
CREATE POLICY "Anyone can view demand categories" 
ON public.demand_categories FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage demand categories" 
ON public.demand_categories FOR ALL 
USING (is_platform_admin()) 
WITH CHECK (is_platform_admin());

-- RLS policies for demand_tags
CREATE POLICY "Anyone can view demand tags" 
ON public.demand_tags FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage demand tags" 
ON public.demand_tags FOR ALL 
USING (is_platform_admin()) 
WITH CHECK (is_platform_admin());

-- Add category_id and tag_id columns to demandas table
ALTER TABLE public.demandas 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.demand_categories(id),
ADD COLUMN IF NOT EXISTS tag_id uuid REFERENCES public.demand_tags(id);