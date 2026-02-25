-- First, let's ensure the principal_invitations table exists with proper structure
CREATE TABLE IF NOT EXISTS public.principal_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.principal_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Platform admins can manage principal invitations" ON public.principal_invitations
FOR ALL USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Allow public read for validation (needed for accepting invitations)
CREATE POLICY "Public can read pending invitations" ON public.principal_invitations
FOR SELECT USING (status = 'pending' AND expires_at > NOW());

-- Fix the get_principal_invitation_details function to work with camaras table
DROP FUNCTION IF EXISTS public.get_principal_invitation_details(text);

CREATE OR REPLACE FUNCTION public.get_principal_invitation_details(p_token TEXT)
RETURNS TABLE (
  email TEXT,
  institution_id TEXT,
  camara_nome TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.email,
    pi.institution_id::TEXT,
    COALESCE(c.nome, 'Instituição') AS camara_nome,
    pi.expires_at
  FROM principal_invitations pi
  LEFT JOIN camaras c ON c.id = pi.institution_id::UUID
  WHERE pi.token = p_token
  AND pi.expires_at > NOW()
  AND pi.status = 'pending';
END;
$$;

-- Also fix the accept_principal_invitation function to work properly
DROP FUNCTION IF EXISTS public.accept_principal_invitation(text);

CREATE OR REPLACE FUNCTION public.accept_principal_invitation(p_token TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_invitation RECORD;
  v_user_email TEXT;
  v_existing_politician RECORD;
  v_existing_cabinet RECORD;
  v_politician_id UUID;
  v_cabinet_id UUID;
  v_cabinet_name TEXT;
  v_institution RECORD;
BEGIN
  -- Get current user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Find and validate invitation
  SELECT * INTO v_invitation
  FROM public.principal_invitations pi
  JOIN public.camaras c ON c.id = pi.institution_id::UUID
  WHERE pi.token = p_token
  AND pi.accepted_at IS NULL
  AND pi.expires_at > now()
  AND lower(pi.email) = lower(v_user_email);
  
  IF v_invitation.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation token'
    );
  END IF;
  
  -- Get institution details
  SELECT * INTO v_institution FROM public.camaras WHERE id = v_invitation.institution_id::UUID;
  
  -- Check if politician already exists for this user + institution
  SELECT * INTO v_existing_politician
  FROM public.politicians
  WHERE user_id = auth.uid() AND institution_id = v_invitation.institution_id::UUID;
  
  -- Check if cabinet already exists
  SELECT * INTO v_existing_cabinet
  FROM public.gabinetes
  WHERE politico_id = auth.uid() AND camara_id = v_invitation.institution_id::UUID;
  
  IF v_existing_politician.id IS NOT NULL AND v_existing_cabinet.id IS NOT NULL THEN
    -- Mark invitation as accepted
    UPDATE public.principal_invitations
    SET accepted_at = now(), updated_at = now()
    WHERE id = v_invitation.id;
    
    RETURN jsonb_build_object(
      'success', true,
      'existing', true,
      'cabinet_id', v_existing_cabinet.id,
      'cabinet_name', v_existing_cabinet.nome,
      'institution_name', v_institution.nome
    );
  END IF;
  
  -- Create politician record if not exists
  IF v_existing_politician.id IS NULL THEN
    INSERT INTO public.politicians (user_id, institution_id, position_title)
    VALUES (auth.uid(), v_invitation.institution_id::UUID, 
      CASE v_institution.tipo 
        WHEN 'camara_municipal'::tipo_camara THEN 'Vereador'
        WHEN 'assembleia_legislativa'::tipo_camara THEN 'Deputado Estadual'
        ELSE 'Político'
      END
    ) RETURNING id INTO v_politician_id;
  ELSE
    v_politician_id := v_existing_politician.id;
  END IF;
  
  -- Create cabinet if not exists
  IF v_existing_cabinet.id IS NULL THEN
    -- Get user name for cabinet
    SELECT full_name INTO v_cabinet_name FROM public.profiles WHERE user_id = auth.uid();
    IF v_cabinet_name IS NULL THEN
      v_cabinet_name := split_part(v_user_email, '@', 1);
    END IF;
    
    v_cabinet_name := format('Gabinete do %s %s', 
      CASE v_institution.tipo 
        WHEN 'camara_municipal'::tipo_camara THEN 'Vereador'
        WHEN 'assembleia_legislativa'::tipo_camara THEN 'Deputado'
        ELSE 'Político'
      END,
      v_cabinet_name
    );
    
    INSERT INTO public.gabinetes (
      nome, politico_id, camara_id, status
    ) VALUES (
      v_cabinet_name, auth.uid(), v_invitation.institution_id::UUID, 'ativo'::gabinete_status
    ) RETURNING id INTO v_cabinet_id;
  ELSE
    v_cabinet_id := v_existing_cabinet.id;
    v_cabinet_name := v_existing_cabinet.nome;
  END IF;
  
  -- Mark invitation as accepted
  UPDATE public.principal_invitations
  SET accepted_at = now(), updated_at = now()
  WHERE id = v_invitation.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'existing', false,
    'cabinet_id', v_cabinet_id,
    'cabinet_name', v_cabinet_name,
    'politician_id', v_politician_id,
    'institution_name', v_institution.nome
  );
END;
$$;