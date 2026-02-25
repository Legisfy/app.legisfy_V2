-- Adicionar campos de liderança na tabela de eleitores
ALTER TABLE public.eleitores 
ADD COLUMN is_leader boolean NOT NULL DEFAULT false,
ADD COLUMN leader_type text,
ADD COLUMN leader_subtype text;

-- Comentário dos tipos de liderança para referência:
-- RELIGIOSA: Pastor/Padre/Líder religioso, Missionário/Obreiro/Diácono, Líder de grupo jovem ou ministério
-- COMUNITÁRIA/SOCIAL: Líder comunitário, Presidente de associação de moradores, Presidente de sindicato, Empresário local, Comerciante/lojista, Professor/educador influente, Médico/profissional de saúde de referência, Líder estudantil, Representante de ONG/projeto social, Morador referência
-- ESPORTE/CULTURA: Líder esportivo, Líder cultural, Líder rural/agrícola  
-- DIGITAL: Influenciador digital local, Administrador de grupos de WhatsApp/Facebook da comunidade