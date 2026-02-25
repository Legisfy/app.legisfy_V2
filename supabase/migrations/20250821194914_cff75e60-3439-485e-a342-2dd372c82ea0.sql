-- Primeiro, criar um estado e cidade se não existirem
INSERT INTO estados (id, nome, sigla) 
VALUES (gen_random_uuid(), 'São Paulo', 'SP')
ON CONFLICT DO NOTHING;

-- Criar uma cidade se não existir
DO $$
DECLARE
    estado_sp_id uuid;
    cidade_id uuid;
    camara_id uuid;
    gabinete_id uuid;
    user_id uuid := 'd4e07676-4489-49dd-9376-6b36523b37e5';
BEGIN
    -- Buscar ou criar estado SP
    SELECT id INTO estado_sp_id FROM estados WHERE sigla = 'SP' LIMIT 1;
    
    -- Buscar ou criar cidade São Paulo
    SELECT id INTO cidade_id FROM cidades WHERE nome = 'São Paulo' AND estado_id = estado_sp_id LIMIT 1;
    
    IF cidade_id IS NULL THEN
        INSERT INTO cidades (nome, estado_id, ibge_code) 
        VALUES ('São Paulo', estado_sp_id, '3550308')
        RETURNING id INTO cidade_id;
    END IF;
    
    -- Criar uma câmara municipal se não existir
    SELECT id INTO camara_id FROM camaras WHERE nome = 'Câmara Municipal de São Paulo' LIMIT 1;
    
    IF camara_id IS NULL THEN
        INSERT INTO camaras (nome, tipo, cidade_id, presidente, email, telefone, endereco)
        VALUES (
            'Câmara Municipal de São Paulo',
            'camara_municipal'::tipo_camara,
            cidade_id,
            'Presidente da Câmara',
            'contato@camara.sp.gov.br',
            '(11) 3396-4000',
            'Viaduto Jacareí, 100 - Bela Vista, São Paulo - SP'
        )
        RETURNING id INTO camara_id;
    END IF;
    
    -- Criar gabinete para o usuário se não existir
    SELECT id INTO gabinete_id FROM gabinetes WHERE politico_id = user_id LIMIT 1;
    
    IF gabinete_id IS NULL THEN
        INSERT INTO gabinetes (nome, politico_id, camara_id, status, descricao)
        VALUES (
            'Gabinete do Vereador Carlos Gabriel',
            user_id,
            camara_id,
            'ativo'::gabinete_status,
            'Gabinete focado em desenvolvimento urbano e tecnologia'
        )
        RETURNING id INTO gabinete_id;
        
        -- Criar membership do político no seu próprio gabinete
        INSERT INTO gabinete_members (gabinete_id, user_id, role)
        VALUES (gabinete_id, user_id, 'politico')
        ON CONFLICT DO NOTHING;
        
        -- Atualizar os eleitores existentes para pertencerem a este gabinete
        UPDATE eleitores 
        SET gabinete_id = gabinete_id, 
            user_id = user_id,
            owner_user_id = user_id
        WHERE gabinete_id IS NULL OR gabinete_id != gabinete_id;
        
        RAISE NOTICE 'Gabinete criado com sucesso: %', gabinete_id;
    ELSE
        RAISE NOTICE 'Gabinete já existe: %', gabinete_id;
    END IF;
END $$;