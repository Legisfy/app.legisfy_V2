-- Update the get_active_authorized_politicians function to only show politicians 
-- that have active accounts and are still authorized
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
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  resultado integer;
BEGIN
  RAISE LOG 'Buscando políticos autorizados para câmara: %', camara_id_param;
  
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
  WHERE pa.camara_id = camara_id_param
    AND pa.is_active = true
    AND EXISTS (
      -- Only show politicians that have existing accounts in auth.users
      SELECT 1 FROM auth.users au 
      WHERE lower(au.email) = lower(pa.email)
      AND au.deleted_at IS NULL
    )
  ORDER BY pa.created_at DESC;
  
  GET DIAGNOSTICS resultado = ROW_COUNT;
  RAISE LOG 'Encontrados % políticos ativos para câmara %', resultado, camara_id_param;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro na função get_active_authorized_politicians: %', SQLERRM;
    RAISE;
END;
$function$;