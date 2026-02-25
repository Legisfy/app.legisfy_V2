-- Fix infinite recursion in RLS policies by creating security definer functions

-- Function to check if user is cabinet owner or member (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_has_cabinet_access(cabinet_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if user is the politico (owner) of the cabinet
  IF EXISTS (
    SELECT 1 FROM gabinetes 
    WHERE id = cabinet_id_param AND politico_id = current_user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a member of the cabinet
  IF EXISTS (
    SELECT 1 FROM gabinete_members 
    WHERE gabinete_id = cabinet_id_param AND user_id = current_user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Drop ALL existing policies on gabinete_members
DROP POLICY IF EXISTS "gabinete_members_access" ON gabinete_members;
DROP POLICY IF EXISTS "gabinete_members_admin_access" ON gabinete_members;
DROP POLICY IF EXISTS "temp_open_authenticated_all" ON gabinete_members;
DROP POLICY IF EXISTS "bypass_service_role" ON gabinete_members;

-- Create simple, non-recursive policies for gabinete_members
CREATE POLICY "gabinete_members_own_access"
ON gabinete_members
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "gabinete_members_owner_access"
ON gabinete_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM gabinetes 
    WHERE gabinetes.id = gabinete_members.gabinete_id 
    AND gabinetes.politico_id = auth.uid()
  )
);

-- Update eleitores policies
DROP POLICY IF EXISTS "eleitores_access" ON eleitores;
DROP POLICY IF EXISTS "eleitores_cabinet_access" ON eleitores;
DROP POLICY IF EXISTS "temp_open_authenticated_all" ON eleitores;
DROP POLICY IF EXISTS "bypass_service_role" ON eleitores;

CREATE POLICY "eleitores_cabinet_access"
ON eleitores
FOR ALL
USING (
  user_has_cabinet_access(gabinete_id) OR owner_user_id = auth.uid()
);

-- Update demandas policies
DROP POLICY IF EXISTS "demandas_access" ON demandas;
DROP POLICY IF EXISTS "demandas_cabinet_access" ON demandas;
DROP POLICY IF EXISTS "temp_open_authenticated_all" ON demandas;
DROP POLICY IF EXISTS "bypass_service_role" ON demandas;

CREATE POLICY "demandas_cabinet_access"
ON demandas
FOR ALL
USING (
  user_has_cabinet_access(gabinete_id) OR owner_user_id = auth.uid()
);

-- Update indicacoes policies
DROP POLICY IF EXISTS "indicacoes_access" ON indicacoes;
DROP POLICY IF EXISTS "indicacoes_cabinet_access" ON indicacoes;

CREATE POLICY "indicacoes_cabinet_access"
ON indicacoes
FOR ALL
USING (
  user_has_cabinet_access(gabinete_id) OR owner_user_id = auth.uid()
);

-- Update eventos policies
DROP POLICY IF EXISTS "eventos_access" ON eventos;
DROP POLICY IF EXISTS "eventos_cabinet_access" ON eventos;

CREATE POLICY "eventos_cabinet_access"
ON eventos
FOR ALL
USING (
  user_has_cabinet_access(gabinete_id) OR owner_user_id = auth.uid()
);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.user_has_cabinet_access(UUID) TO authenticated;