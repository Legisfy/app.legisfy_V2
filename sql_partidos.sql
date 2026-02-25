-- Execute este SQL no SQL Editor do Supabase (Dashboard > SQL Editor > New Query)
-- Ele insere todos os partidos políticos brasileiros registrados no TSE

INSERT INTO partidos_politicos (sigla, nome, numero) VALUES
  ('REPUBLICANOS', 'Republicanos', 10),
  ('PP', 'Progressistas', 11),
  ('PDT', 'Partido Democrático Trabalhista', 12),
  ('PT', 'Partido dos Trabalhadores', 13),
  ('MDB', 'Movimento Democrático Brasileiro', 15),
  ('PSTU', 'Partido Socialista dos Trabalhadores Unificado', 16),
  ('REDE', 'Rede Sustentabilidade', 18),
  ('PODEMOS', 'Podemos', 20),
  ('PCB', 'Partido Comunista Brasileiro', 21),
  ('PL', 'Partido Liberal', 22),
  ('CIDADANIA', 'Cidadania', 23),
  ('PRD', 'Partido Renovação Democrática', 25),
  ('DC', 'Democracia Cristã', 27),
  ('PRTB', 'Partido Renovador Trabalhista Brasileiro', 28),
  ('PCO', 'Partido da Causa Operária', 29),
  ('NOVO', 'Partido Novo', 30),
  ('PMN', 'Partido da Mobilização Nacional', 33),
  ('PMB', 'Partido da Mulher Brasileira', 35),
  ('AGIR', 'Agir', 36),
  ('PSB', 'Partido Socialista Brasileiro', 40),
  ('PV', 'Partido Verde', 43),
  ('UNIÃO', 'União Brasil', 44),
  ('PSDB', 'Partido da Social Democracia Brasileira', 45),
  ('PSOL', 'Partido Socialismo e Liberdade', 50),
  ('PSD', 'Partido Social Democrático', 55),
  ('PCdoB', 'Partido Comunista do Brasil', 65),
  ('AVANTE', 'Avante', 70),
  ('SOLIDARIEDADE', 'Solidariedade', 77),
  ('UP', 'Unidade Popular', 80)
ON CONFLICT (sigla) DO NOTHING;
