-- Tabela para páginas públicas dos gabinetes
CREATE TABLE public.public_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published','hidden')),
  welcome_text TEXT,
  theme JSONB NOT NULL DEFAULT jsonb_build_object('primary','#5B6BFF','secondary','#8A5BFF','mode','light'),
  links JSONB DEFAULT '{}'::jsonb,
  show_sections JSONB NOT NULL DEFAULT jsonb_build_object('kpis',true,'timeline',true,'form',true),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para submissões do formulário público
CREATE TABLE public.public_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  consent BOOLEAN NOT NULL,
  ip INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para oportunidades (novos eleitores)
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'pagina_publica',
  type TEXT NOT NULL DEFAULT 'novo_eleitor',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','em_contato','convertido','descartado')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_public_pages_slug ON public_pages (slug);
CREATE INDEX idx_public_pages_status ON public_pages (status);
CREATE INDEX idx_public_submissions_page_id ON public_submissions (page_id, created_at DESC);
CREATE INDEX idx_opportunities_cabinet_id ON opportunities (cabinet_id, status, created_at DESC);

-- RLS Policies
ALTER TABLE public.public_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Public pages policies
CREATE POLICY "Gabinete members can manage public pages" 
ON public.public_pages 
FOR ALL 
TO authenticated
USING (user_belongs_to_cabinet(cabinet_id))
WITH CHECK (user_belongs_to_cabinet(cabinet_id));

CREATE POLICY "Published pages are viewable by everyone" 
ON public.public_pages 
FOR SELECT 
TO anon, authenticated
USING (status = 'published');

-- Public submissions policies  
CREATE POLICY "Anyone can submit to public forms" 
ON public.public_submissions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Gabinete members can view submissions" 
ON public.public_submissions 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public_pages pp 
  WHERE pp.id = public_submissions.page_id 
  AND user_belongs_to_cabinet(pp.cabinet_id)
));

-- Opportunities policies
CREATE POLICY "Gabinete members can manage opportunities" 
ON public.opportunities 
FOR ALL 
TO authenticated
USING (user_belongs_to_cabinet(cabinet_id))
WITH CHECK (user_belongs_to_cabinet(cabinet_id));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_public_pages_updated_at
BEFORE UPDATE ON public_pages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();