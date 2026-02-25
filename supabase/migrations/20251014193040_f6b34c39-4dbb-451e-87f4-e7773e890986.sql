-- Create partidos_politicos table
CREATE TABLE IF NOT EXISTS public.partidos_politicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_partido INTEGER NOT NULL UNIQUE,
  sigla TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partidos_politicos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to political parties
CREATE POLICY "partidos_politicos_public_read"
ON public.partidos_politicos
FOR SELECT
TO public
USING (true);

-- Insert Brazilian political parties
INSERT INTO public.partidos_politicos (numero_partido, sigla, nome_completo) VALUES
  (10, 'PRB', 'Partido Republicano Brasileiro'),
  (11, 'PP', 'Progressistas'),
  (12, 'PDT', 'Partido Democrático Trabalhista'),
  (13, 'PT', 'Partido dos Trabalhadores'),
  (14, 'PTB', 'Partido Trabalhista Brasileiro'),
  (15, 'MDB', 'Movimento Democrático Brasileiro'),
  (16, 'PSTU', 'Partido Socialista dos Trabalhadores Unificado'),
  (17, 'PSL', 'Partido Social Liberal'),
  (18, 'REDE', 'Rede Sustentabilidade'),
  (19, 'PODE', 'Podemos'),
  (20, 'PSC', 'Partido Social Cristão'),
  (21, 'PCB', 'Partido Comunista Brasileiro'),
  (22, 'PL', 'Partido Liberal'),
  (23, 'CIDADANIA', 'Cidadania'),
  (25, 'DEM', 'Democratas'),
  (27, 'DC', 'Democracia Cristã'),
  (28, 'PRTB', 'Partido Renovador Trabalhista Brasileiro'),
  (29, 'PCO', 'Partido da Causa Operária'),
  (30, 'NOVO', 'Partido Novo'),
  (31, 'PHS', 'Partido Humanista da Solidariedade'),
  (33, 'PMB', 'Partido da Mulher Brasileira'),
  (35, 'PMN', 'Partido da Mobilização Nacional'),
  (36, 'PTC', 'Partido Trabalhista Cristão'),
  (40, 'PSB', 'Partido Socialista Brasileiro'),
  (43, 'PV', 'Partido Verde'),
  (44, 'PRP', 'Partido Republicano Progressista'),
  (45, 'PSDB', 'Partido da Social Democracia Brasileira'),
  (50, 'PSOL', 'Partido Socialismo e Liberdade'),
  (51, 'PATRIOTA', 'Patriota'),
  (54, 'PPL', 'Partido Pátria Livre'),
  (55, 'PSD', 'Partido Social Democrático'),
  (65, 'PCdoB', 'Partido Comunista do Brasil'),
  (70, 'AVANTE', 'Avante'),
  (77, 'SOLIDARIEDADE', 'Solidariedade'),
  (80, 'UP', 'Unidade Popular'),
  (90, 'PROS', 'Partido Republicano da Ordem Social')
ON CONFLICT (numero_partido) DO NOTHING;