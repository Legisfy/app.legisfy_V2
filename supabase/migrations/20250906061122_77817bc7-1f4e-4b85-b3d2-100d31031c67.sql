-- Criar tabela de partidos políticos
CREATE TABLE public.partidos_politicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sigla TEXT NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.partidos_politicos ENABLE ROW LEVEL SECURITY;

-- Política para visualizar partidos (todos podem ver)
CREATE POLICY "Todos podem visualizar partidos politicos" 
ON public.partidos_politicos 
FOR SELECT 
USING (true);

-- Política para admins gerenciarem partidos
CREATE POLICY "Platform admins can manage partidos politicos" 
ON public.partidos_politicos 
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Adicionar coluna partido_id na tabela gabinetes
ALTER TABLE public.gabinetes 
ADD COLUMN partido_id UUID REFERENCES public.partidos_politicos(id);

-- Inserir os partidos políticos
INSERT INTO public.partidos_politicos (sigla, nome_completo) VALUES 
('MDB', 'Movimento Democrático Brasileiro'),
('PT', 'Partido dos Trabalhadores'),
('PP', 'Progressistas'),
('PRD', 'Partido Renovação Democrática'),
('PSDB', 'Partido da Social Democracia Brasileira'),
('PDT', 'Partido Democrático Trabalhista'),
('UNIÃO', 'União Brasil'),
('PL', 'Partido Liberal'),
('PODE', 'Podemos'),
('PSB', 'Partido Socialista Brasileiro'),
('Republicanos', 'Republicanos'),
('PSD', 'Partido Social Democrático'),
('Cidadania', 'Cidadania'),
('PCdoB', 'Partido Comunista do Brasil'),
('Solidariedade', 'Solidariedade'),
('PV', 'Partido Verde'),
('PSOL', 'Partido Socialismo e Liberdade'),
('Avante', 'Avante'),
('MOBILIZA', 'Mobilização Nacional'),
('Agir', 'Agir'),
('DC', 'Democracia Cristã'),
('PRTB', 'Partido Renovador Trabalhista Brasileiro'),
('NOVO', 'Partido Novo'),
('REDE', 'Rede Sustentabilidade'),
('PMB', 'Partido da Mulher Brasileira'),
('PSTU', 'Partido Socialista dos Trabalhadores Unificado'),
('PCB', 'Partido Comunista Brasileiro'),
('UP', 'Unidade Popular'),
('PCO', 'Partido da Causa Operária');

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_partidos_politicos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_partidos_politicos_updated_at
BEFORE UPDATE ON public.partidos_politicos
FOR EACH ROW
EXECUTE FUNCTION public.update_partidos_politicos_updated_at();