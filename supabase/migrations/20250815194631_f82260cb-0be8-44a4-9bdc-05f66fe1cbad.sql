-- Add contract value to camaras table
ALTER TABLE public.camaras 
ADD COLUMN valor_contrato DECIMAL(15,2);

-- Create estados table
CREATE TABLE public.estados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cidades table
CREATE TABLE public.cidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  estado_id UUID NOT NULL REFERENCES public.estados(id),
  ibge_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cidades ENABLE ROW LEVEL SECURITY;

-- Add foreign key to camaras table
ALTER TABLE public.camaras 
ADD COLUMN cidade_id UUID REFERENCES public.cidades(id);

-- Policies for estados
CREATE POLICY "Platform admins can manage estados" 
ON public.estados 
FOR ALL 
USING (is_platform_admin());

-- Policies for cidades
CREATE POLICY "Platform admins can manage cidades" 
ON public.cidades 
FOR ALL 
USING (is_platform_admin());

-- Insert Brazilian states
INSERT INTO public.estados (nome, sigla) VALUES
('Acre', 'AC'),
('Alagoas', 'AL'),
('Amapá', 'AP'),
('Amazonas', 'AM'),
('Bahia', 'BA'),
('Ceará', 'CE'),
('Distrito Federal', 'DF'),
('Espírito Santo', 'ES'),
('Goiás', 'GO'),
('Maranhão', 'MA'),
('Mato Grosso', 'MT'),
('Mato Grosso do Sul', 'MS'),
('Minas Gerais', 'MG'),
('Pará', 'PA'),
('Paraíba', 'PB'),
('Paraná', 'PR'),
('Pernambuco', 'PE'),
('Piauí', 'PI'),
('Rio de Janeiro', 'RJ'),
('Rio Grande do Norte', 'RN'),
('Rio Grande do Sul', 'RS'),
('Rondônia', 'RO'),
('Roraima', 'RR'),
('Santa Catarina', 'SC'),
('São Paulo', 'SP'),
('Sergipe', 'SE'),
('Tocantins', 'TO');

-- Insert capital cities (using state IDs)
INSERT INTO public.cidades (nome, estado_id) VALUES
('Rio Branco', (SELECT id FROM public.estados WHERE sigla = 'AC')),
('Maceió', (SELECT id FROM public.estados WHERE sigla = 'AL')),
('Macapá', (SELECT id FROM public.estados WHERE sigla = 'AP')),
('Manaus', (SELECT id FROM public.estados WHERE sigla = 'AM')),
('Salvador', (SELECT id FROM public.estados WHERE sigla = 'BA')),
('Fortaleza', (SELECT id FROM public.estados WHERE sigla = 'CE')),
('Brasília', (SELECT id FROM public.estados WHERE sigla = 'DF')),
('Vitória', (SELECT id FROM public.estados WHERE sigla = 'ES')),
('Goiânia', (SELECT id FROM public.estados WHERE sigla = 'GO')),
('São Luís', (SELECT id FROM public.estados WHERE sigla = 'MA')),
('Cuiabá', (SELECT id FROM public.estados WHERE sigla = 'MT')),
('Campo Grande', (SELECT id FROM public.estados WHERE sigla = 'MS')),
('Belo Horizonte', (SELECT id FROM public.estados WHERE sigla = 'MG')),
('Belém', (SELECT id FROM public.estados WHERE sigla = 'PA')),
('João Pessoa', (SELECT id FROM public.estados WHERE sigla = 'PB')),
('Curitiba', (SELECT id FROM public.estados WHERE sigla = 'PR')),
('Recife', (SELECT id FROM public.estados WHERE sigla = 'PE')),
('Teresina', (SELECT id FROM public.estados WHERE sigla = 'PI')),
('Rio de Janeiro', (SELECT id FROM public.estados WHERE sigla = 'RJ')),
('Natal', (SELECT id FROM public.estados WHERE sigla = 'RN')),
('Porto Alegre', (SELECT id FROM public.estados WHERE sigla = 'RS')),
('Porto Velho', (SELECT id FROM public.estados WHERE sigla = 'RO')),
('Boa Vista', (SELECT id FROM public.estados WHERE sigla = 'RR')),
('Florianópolis', (SELECT id FROM public.estados WHERE sigla = 'SC')),
('São Paulo', (SELECT id FROM public.estados WHERE sigla = 'SP')),
('Aracaju', (SELECT id FROM public.estados WHERE sigla = 'SE')),
('Palmas', (SELECT id FROM public.estados WHERE sigla = 'TO'));

-- Create trigger for updated_at
CREATE TRIGGER update_estados_updated_at
  BEFORE UPDATE ON public.estados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cidades_updated_at
  BEFORE UPDATE ON public.cidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();