-- Inserir um eleitor de teste
-- Primeiro, vamos buscar um gabinete e usuário existente para usar como referência
DO $$
DECLARE
    test_gabinete_id uuid;
    test_user_id uuid;
BEGIN
    -- Buscar o primeiro gabinete ativo
    SELECT id INTO test_gabinete_id 
    FROM gabinetes 
    WHERE status = 'ativo' 
    LIMIT 1;
    
    -- Buscar o primeiro usuário
    SELECT user_id INTO test_user_id
    FROM profiles
    LIMIT 1;
    
    -- Se encontrou gabinete e usuário, inserir o eleitor de teste
    IF test_gabinete_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        INSERT INTO eleitores (
            name,
            email,
            whatsapp,
            birth_date,
            address,
            neighborhood,
            latitude,
            longitude,
            social_media,
            tags,
            gabinete_id,
            user_id,
            owner_user_id,
            profile_photo_url
        ) VALUES (
            'João Silva Santos',
            'joao.silva@email.com',
            '+5511999887766',
            '1985-03-15'::date,
            'Rua das Flores, 123',
            'Centro',
            -23.5505199,
            -46.6333094,
            '@joaosilva',
            ARRAY['agricultor', 'sindicalizado', 'apoiador'],
            test_gabinete_id,
            test_user_id,
            test_user_id,
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        );
        
        -- Inserir mais alguns eleitores para popular a tabela
        INSERT INTO eleitores (
            name,
            email,
            whatsapp,
            birth_date,
            address,
            neighborhood,
            latitude,
            longitude,
            social_media,
            tags,
            gabinete_id,
            user_id,
            owner_user_id
        ) VALUES 
        (
            'Maria Oliveira Costa',
            'maria.oliveira@email.com',
            '+5511988776655',
            '1978-07-22'::date,
            'Avenida Paulista, 1500',
            'Bela Vista',
            -23.5614000,
            -46.6558819,
            '@mariaoliv',
            ARRAY['comerciante', 'empreendedora'],
            test_gabinete_id,
            test_user_id,
            test_user_id
        ),
        (
            'Carlos Pereira Lima',
            'carlos.pereira@email.com',
            '+5511977665544',
            '1990-11-08'::date,
            'Rua Augusta, 800',
            'Consolação',
            -23.5522000,
            -46.6586000,
            '@carlospereira',
            ARRAY['estudante', 'jovem_lideranca'],
            test_gabinete_id,
            test_user_id,
            test_user_id
        ),
        (
            'Ana Carolina Souza',
            'ana.souza@email.com',
            '+5511966554433',
            '1982-04-30'::date,
            'Rua Oscar Freire, 200',
            'Jardins',
            -23.5644000,
            -46.6644000,
            NULL,
            ARRAY['professora', 'educacao'],
            test_gabinete_id,
            test_user_id,
            test_user_id
        ),
        (
            'Roberto Santos Ferreira',
            'roberto.ferreira@email.com',
            '+5511955443322',
            '1975-12-18'::date,
            'Rua da Liberdade, 450',
            'Liberdade',
            -23.5588000,
            -46.6344000,
            '@robertosantos',
            ARRAY['comerciante', 'lideranca_comunitaria'],
            test_gabinete_id,
            test_user_id,
            test_user_id
        );
        
        RAISE NOTICE 'Eleitores de teste inseridos com sucesso!';
    ELSE
        RAISE NOTICE 'Não foi possível inserir eleitores: gabinete ou usuário não encontrado';
    END IF;
END $$;