-- Create a function to get invitation details with cabinet and institution names
-- This function runs with SECURITY DEFINER to bypass RLS for unauthenticated users
CREATE OR REPLACE FUNCTION public.get_invitation_details(invitation_token text)
RETURNS TABLE(
  id uuid,
  email text,
  name text,
  role text,
  gabinete_id uuid,
  institution_id uuid,
  accepted_at timestamptz,
  expires_at timestamptz,
  gabinete_nome text,
  instituicao_nome text
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.name,
    i.role::text,
    i.gabinete_id,
    i.institution_id,
    i.accepted_at,
    i.expires_at,
    COALESCE(g.nome, 
      CASE 
        WHEN i.name IS NOT NULL AND i.role = 'politico' THEN 'Gabinete do ' || i.name
        ELSE 'Gabinete'
      END
    ) as gabinete_nome,
    COALESCE(c1.nome, c2.nome, 'Instituição') as instituicao_nome
  FROM public.invitations i
  LEFT JOIN public.gabinetes g ON g.id = i.gabinete_id
  LEFT JOIN public.camaras c1 ON c1.id = g.camara_id  -- Câmara através do gabinete
  LEFT JOIN public.camaras c2 ON c2.id = i.institution_id  -- Câmara direta do convite
  WHERE i.token = invitation_token;
END;
$$;