-- Limpar dados existentes e inserir a lista corrigida
DELETE FROM public.partidos_politicos;

-- Inserir os partidos com números oficiais
INSERT INTO public.partidos_politicos (numero_partido, sigla, nome_completo) VALUES 
(10, 'Republicanos', 'Republicanos'),
(11, 'PP', 'Progressistas'),
(12, 'PDT', 'Partido Democrático Trabalhista'),
(13, 'PT', 'Partido dos Trabalhadores'),
(15, 'MDB', 'Movimento Democrático Brasileiro'),
(16, 'PSTU', 'Partido Socialista dos Trabalhadores Unificado'),
(18, 'REDE', 'Rede Sustentabilidade'),
(19, 'PODE', 'Podemos'),
(21, 'PCB', 'Partido Comunista Brasileiro'),
(22, 'PL', 'Partido Liberal'),
(23, 'Cidadania', 'Cidadania'),
(25, 'PRD', 'Partido Renovação Democrática'),
(27, 'DC', 'Democracia Cristã'),
(28, 'PRTB', 'Partido Renovador Trabalhista Brasileiro'),
(29, 'PCO', 'Partido da Causa Operária'),
(30, 'NOVO', 'Partido Novo'),
(33, 'MOBILIZA', 'Mobilização Nacional'),
(35, 'PMB', 'Partido da Mulher Brasileira'),
(36, 'Agir', 'Agir'),
(40, 'PSB', 'Partido Socialista Brasileiro'),
(43, 'PV', 'Partido Verde'),
(44, 'UNIÃO', 'União Brasil'),
(45, 'PSDB', 'Partido da Social Democracia Brasileira'),
(50, 'PSOL', 'Partido Socialismo e Liberdade'),
(55, 'PSD', 'Partido Social Democrático'),
(65, 'PCdoB', 'Partido Comunista do Brasil'),
(70, 'Avante', 'Avante'),
(77, 'Solidariedade', 'Solidariedade'),
(80, 'UP', 'Unidade Popular');