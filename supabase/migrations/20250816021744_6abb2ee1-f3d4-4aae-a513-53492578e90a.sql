-- Inserir todos os estados brasileiros (usando WHERE NOT EXISTS para evitar duplicatas)
INSERT INTO public.estados (nome, sigla)
SELECT 'Acre', 'AC' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'AC') UNION ALL
SELECT 'Alagoas', 'AL' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'AL') UNION ALL
SELECT 'Amapá', 'AP' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'AP') UNION ALL
SELECT 'Amazonas', 'AM' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'AM') UNION ALL
SELECT 'Bahia', 'BA' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'BA') UNION ALL
SELECT 'Ceará', 'CE' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'CE') UNION ALL
SELECT 'Distrito Federal', 'DF' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'DF') UNION ALL
SELECT 'Espírito Santo', 'ES' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'ES') UNION ALL
SELECT 'Goiás', 'GO' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'GO') UNION ALL
SELECT 'Maranhão', 'MA' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'MA') UNION ALL
SELECT 'Mato Grosso', 'MT' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'MT') UNION ALL
SELECT 'Mato Grosso do Sul', 'MS' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'MS') UNION ALL
SELECT 'Minas Gerais', 'MG' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'MG') UNION ALL
SELECT 'Pará', 'PA' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'PA') UNION ALL
SELECT 'Paraíba', 'PB' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'PB') UNION ALL
SELECT 'Paraná', 'PR' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'PR') UNION ALL
SELECT 'Pernambuco', 'PE' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'PE') UNION ALL
SELECT 'Piauí', 'PI' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'PI') UNION ALL
SELECT 'Rio de Janeiro', 'RJ' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'RJ') UNION ALL
SELECT 'Rio Grande do Norte', 'RN' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'RN') UNION ALL
SELECT 'Rio Grande do Sul', 'RS' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'RS') UNION ALL
SELECT 'Rondônia', 'RO' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'RO') UNION ALL
SELECT 'Roraima', 'RR' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'RR') UNION ALL
SELECT 'Santa Catarina', 'SC' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'SC') UNION ALL
SELECT 'São Paulo', 'SP' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'SP') UNION ALL
SELECT 'Sergipe', 'SE' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'SE') UNION ALL
SELECT 'Tocantins', 'TO' WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE sigla = 'TO');

-- Inserir principais cidades do Espírito Santo e outros estados importantes
INSERT INTO public.cidades (nome, estado_id, ibge_code)
SELECT c.nome, e.id, c.ibge_code
FROM public.estados e
CROSS JOIN (
  VALUES
    -- Espírito Santo
    ('Vitória', '3205002', 'ES'),
    ('Serra', '3205010', 'ES'),
    ('Vila Velha', '3205309', 'ES'),
    ('Cariacica', '3201308', 'ES'),
    ('Guarapari', '3202405', 'ES'),
    ('Linhares', '3203205', 'ES'),
    ('São Mateus', '3204906', 'ES'),
    ('Colatina', '3201704', 'ES'),
    ('Cachoeiro de Itapemirim', '3201209', 'ES'),
    
    -- São Paulo (principais)
    ('São Paulo', '3550308', 'SP'),
    ('Guarulhos', '3518800', 'SP'),
    ('Campinas', '3509502', 'SP'),
    ('São Bernardo do Campo', '3548708', 'SP'),
    ('Santo André', '3547809', 'SP'),
    ('Osasco', '3534401', 'SP'),
    ('Ribeirão Preto', '3543402', 'SP'),
    ('Sorocaba', '3552205', 'SP'),
    
    -- Rio de Janeiro (principais)
    ('Rio de Janeiro', '3304557', 'RJ'),
    ('Niterói', '3303302', 'RJ'),
    ('Nova Iguaçu', '3303500', 'RJ'),
    ('Duque de Caxias', '3301702', 'RJ'),
    ('São Gonçalo', '3304904', 'RJ'),
    ('Campos dos Goytacazes', '3301009', 'RJ'),
    
    -- Minas Gerais (principais)
    ('Belo Horizonte', '3106200', 'MG'),
    ('Uberlândia', '3170206', 'MG'),
    ('Contagem', '3118601', 'MG'),
    ('Juiz de Fora', '3136702', 'MG'),
    ('Betim', '3106705', 'MG'),
    ('Montes Claros', '3143302', 'MG'),
    
    -- Bahia (principais)
    ('Salvador', '2927408', 'BA'),
    ('Feira de Santana', '2910800', 'BA'),
    ('Vitória da Conquista', '2933307', 'BA'),
    ('Camaçari', '2905206', 'BA'),
    ('Juazeiro', '2918407', 'BA'),
    
    -- Paraná (principais)
    ('Curitiba', '4106902', 'PR'),
    ('Londrina', '4113700', 'PR'),
    ('Maringá', '4115200', 'PR'),
    ('Ponta Grossa', '4119905', 'PR'),
    ('Cascavel', '4104808', 'PR'),
    
    -- Rio Grande do Sul (principais)
    ('Porto Alegre', '4314902', 'RS'),
    ('Caxias do Sul', '4305108', 'RS'),
    ('Pelotas', '4314407', 'RS'),
    ('Canoas', '4304606', 'RS'),
    ('Santa Maria', '4316907', 'RS'),
    
    -- Santa Catarina (principais)
    ('Florianópolis', '4205407', 'SC'),
    ('Joinville', '4209102', 'SC'),
    ('Blumenau', '4202404', 'SC'),
    ('Chapecó', '4204202', 'SC'),
    ('Criciúma', '4204608', 'SC'),
    
    -- Goiás (principais)
    ('Goiânia', '5208707', 'GO'),
    ('Aparecida de Goiânia', '5201405', 'GO'),
    ('Anápolis', '5201108', 'GO'),
    ('Rio Verde', '5218805', 'GO'),
    
    -- Ceará (principais)
    ('Fortaleza', '2304400', 'CE'),
    ('Caucaia', '2303709', 'CE'),
    ('Juazeiro do Norte', '2307650', 'CE'),
    ('Sobral', '2312908', 'CE'),
    
    -- Pernambuco (principais)
    ('Recife', '2611606', 'PE'),
    ('Jaboatão dos Guararapes', '2607901', 'PE'),
    ('Olinda', '2609600', 'PE'),
    ('Caruaru', '2604106', 'PE'),
    
    -- Distrito Federal
    ('Brasília', '5300108', 'DF'),
    
    -- Amazonas (principais)
    ('Manaus', '1302603', 'AM'),
    ('Parintins', '1303503', 'AM'),
    ('Itacoatiara', '1301902', 'AM'),
    
    -- Pará (principais)
    ('Belém', '1501402', 'PA'),
    ('Ananindeua', '1500800', 'PA'),
    ('Santarém', '1506807', 'PA'),
    ('Marabá', '1504208', 'PA')
) AS c(nome, ibge_code, sigla)
WHERE e.sigla = c.sigla
AND NOT EXISTS (
  SELECT 1 FROM public.cidades 
  WHERE nome = c.nome AND estado_id = e.id
);