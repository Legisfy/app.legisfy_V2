-- Criar função para buscar apenas políticos autorizados que ainda existem no sistema de auth
CREATE OR REPLACE FUNCTION public.get_active_authorized_politicians(camara_id_param uuid)
RETURNS TABLE(
  id uuid,
  email text,
  nome_politico text,
  cargo_pretendido text,
  status text,
  data_autorizacao timestamp with time zone,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    pa.email,
    pa.nome_politico,
    pa.cargo_pretendido,
    pa.status,
    pa.data_autorizacao,
    pa.is_active,
    pa.created_at,
    pa.updated_at
  FROM public.politicos_autorizados pa
  INNER JOIN auth.users au ON pa.email = au.email
  WHERE pa.camara_id = camara_id_param
    AND pa.is_active = true
  ORDER BY pa.created_at DESC;
END;
$$;