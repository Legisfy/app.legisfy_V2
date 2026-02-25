-- Adicionar constraints únicas se não existirem
ALTER TABLE public.estados ADD CONSTRAINT IF NOT EXISTS estados_sigla_unique UNIQUE (sigla);
ALTER TABLE public.cidades ADD CONSTRAINT IF NOT EXISTS cidades_nome_estado_unique UNIQUE (nome, estado_id);

-- Inserir todos os estados brasileiros
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
('Tocantins', 'TO')
ON CONFLICT (sigla) DO NOTHING;

-- Inserir principais cidades por estado
WITH estado_ids AS (
  SELECT id, sigla FROM public.estados
)
INSERT INTO public.cidades (nome, estado_id, ibge_code) 
SELECT cidade.nome, estado_ids.id, cidade.ibge_code 
FROM estado_ids
CROSS JOIN LATERAL (
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
    ('Montes Claros', '3143302', 'MG')
) AS cidade(nome, ibge_code, estado_sigla)
WHERE estado_ids.sigla = cidade.estado_sigla
ON CONFLICT (nome, estado_id) DO NOTHING;