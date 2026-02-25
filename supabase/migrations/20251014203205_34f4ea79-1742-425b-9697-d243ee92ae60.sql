-- Adicionar cidades do Espírito Santo que ainda não existem na tabela
DO $$
DECLARE
  v_estado_id uuid;
  v_cidade_nome text;
  v_cidades text[] := ARRAY[
    'Afonso Cláudio', 'Água Doce do Norte', 'Águia Branca', 'Alegre', 'Alfredo Chaves',
    'Alto Rio Novo', 'Anchieta', 'Apiacá', 'Aracruz', 'Atilio Vivacqua',
    'Baixo Guandu', 'Barra de São Francisco', 'Boa Esperança', 'Bom Jesus do Norte', 'Brejetuba',
    'Cachoeiro de Itapemirim', 'Cariacica', 'Castelo', 'Colatina', 'Conceição da Barra',
    'Conceição do Castelo', 'Divino de São Lourenço', 'Domingos Martins', 'Dores do Rio Preto',
    'Ecoporanga', 'Fundão', 'Governador Lindenberg', 'Guaçuí', 'Guarapari',
    'Ibatiba', 'Ibiraçu', 'Ibitirama', 'Iconha', 'Irupi', 'Itaguaçu', 'Itapemirim', 'Itarana',
    'Iúna', 'Jaguaré', 'Jerônimo Monteiro', 'João Neiva', 'Laranja da Terra', 'Linhares',
    'Mantenópolis', 'Marataízes', 'Marechal Floriano', 'Marilândia', 'Mimoso do Sul', 'Montanha',
    'Mucurici', 'Muniz Freire', 'Muqui', 'Nova Venécia', 'Pancas', 'Pedro Canário',
    'Pinheiros', 'Piúma', 'Ponto Belo', 'Presidente Kennedy', 'Rio Bananal', 'Rio Novo do Sul',
    'Santa Leopoldina', 'Santa Maria de Jetibá', 'Santa Teresa', 'São Domingos do Norte',
    'São Gabriel da Palha', 'São José do Calçado', 'São Mateus', 'São Roque do Canaã',
    'Serra', 'Sooretama', 'Vargem Alta', 'Venda Nova do Imigrante', 'Viana',
    'Vila Pavão', 'Vila Valério', 'Vila Velha', 'Vitória'
  ];
BEGIN
  -- Obter o ID do Espírito Santo
  SELECT id INTO v_estado_id 
  FROM public.estados 
  WHERE nome = 'Espírito Santo' OR sigla = 'ES'
  LIMIT 1;
  
  IF v_estado_id IS NULL THEN
    RAISE EXCEPTION 'Estado Espírito Santo não encontrado';
  END IF;
  
  -- Inserir cada cidade se não existir
  FOREACH v_cidade_nome IN ARRAY v_cidades
  LOOP
    INSERT INTO public.cidades (estado_id, nome, created_at, updated_at)
    SELECT v_estado_id, v_cidade_nome, NOW(), NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.cidades 
      WHERE estado_id = v_estado_id 
      AND nome = v_cidade_nome
    );
  END LOOP;
  
  RAISE NOTICE 'Cidades do Espírito Santo processadas com sucesso';
END $$;