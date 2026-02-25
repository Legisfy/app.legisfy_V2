-- Migration: Implement Allow-List + Invitations Flow for Politicians
-- This creates the new tables and functions for the secure politician invitation system

-- 1. Update existing politicos_autorizados to match authorized_principals concept
ALTER TABLE public.politicos_autorizados 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Ensure email is unique per institution (institution = camara_id)
DROP INDEX IF EXISTS idx_politicos_autorizados_unique_email_camara;
CREATE UNIQUE INDEX idx_politicos_autorizados_unique_email_camara 
ON public.politicos_autorizados (lower(email), camara_id) WHERE is_active = true;

-- 2. Create principal_invitations table
CREATE TABLE IF NOT EXISTS public.principal_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.camaras(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one active invitation per email per institution
CREATE UNIQUE INDEX IF NOT EXISTS idx_principal_invitations_unique_active 
ON public.principal_invitations (institution_id, lower(email)) 
WHERE accepted_at IS NULL;

-- Enable RLS
ALTER TABLE public.principal_invitations ENABLE ROW LEVEL SECURITY;

-- 3. Add updated_at trigger for principal_invitations
CREATE TRIGGER update_principal_invitations_updated_at
  BEFORE UPDATE ON public.principal_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create politicians table if not exists (to track politician records)
CREATE TABLE IF NOT EXISTS public.politicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.camaras(id) ON DELETE CASCADE,
  position_title text DEFAULT 'Vereador',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, institution_id)
);

-- Enable RLS
ALTER TABLE public.politicians ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_politicians_updated_at
  BEFORE UPDATE ON public.politicians
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Ensure gabinetes has proper structure
ALTER TABLE public.gabinetes 
ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.camaras(id);

-- Update existing gabinetes to reference institution via camara_id if column exists
UPDATE public.gabinetes SET institution_id = camara_id WHERE institution_id IS NULL AND camara_id IS NOT NULL;

-- 6. Create assessor_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.assessor_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cabinet_id uuid NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  permission_module text NOT NULL CHECK (permission_module IN ('agenda', 'comunicacao', 'documentos', 'eleitores', 'indicacoes', 'demandas', 'ideias')),
  can_read boolean DEFAULT true,
  can_write boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, cabinet_id, permission_module)
);

-- Enable RLS
ALTER TABLE public.assessor_permissions ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_assessor_permissions_updated_at
  BEFORE UPDATE ON public.assessor_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create whatsapp_identities table for citizen WhatsApp numbers
CREATE TABLE IF NOT EXISTS public.whatsapp_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id uuid NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  normalized_phone text NOT NULL, -- E.164 format
  citizen_name text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cabinet_id, normalized_phone)
);

-- Enable RLS
ALTER TABLE public.whatsapp_identities ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_whatsapp_identities_updated_at
  BEFORE UPDATE ON public.whatsapp_identities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create RPC: send_principal_invite
CREATE OR REPLACE FUNCTION public.send_principal_invite(
  p_institution_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized_email text;
  v_is_authorized boolean;
  v_existing_invitation record;
  v_new_token text;
  v_expires_at timestamptz;
  v_invitation_id uuid;
BEGIN
  -- Normalize email
  v_normalized_email := lower(trim(p_email));
  
  -- Check if email is authorized
  SELECT EXISTS (
    SELECT 1 FROM public.politicos_autorizados 
    WHERE lower(email) = v_normalized_email 
    AND camara_id = p_institution_id 
    AND is_active = true
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email not authorized for this institution'
    );
  END IF;
  
  -- Check for existing active invitation
  SELECT * INTO v_existing_invitation
  FROM public.principal_invitations
  WHERE institution_id = p_institution_id 
  AND lower(email) = v_normalized_email
  AND accepted_at IS NULL;
  
  -- Generate new token and expiration
  v_new_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + interval '7 days';
  
  IF v_existing_invitation.id IS NOT NULL THEN
    -- Update existing invitation
    UPDATE public.principal_invitations
    SET 
      token = v_new_token,
      expires_at = v_expires_at,
      updated_at = now(),
      created_by = auth.uid()
    WHERE id = v_existing_invitation.id;
    
    v_invitation_id := v_existing_invitation.id;
  ELSE
    -- Create new invitation
    INSERT INTO public.principal_invitations (
      institution_id, email, token, expires_at, created_by
    ) VALUES (
      p_institution_id, v_normalized_email, v_new_token, v_expires_at, auth.uid()
    ) RETURNING id INTO v_invitation_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'token', v_new_token,
    'expires_at', v_expires_at,
    'accept_url', format('%s/aceitar?token=%s', 
      coalesce(current_setting('app.base_url', true), 'http://localhost:3000'), 
      v_new_token)
  );
END;
$$;

-- 9. Create RPC: accept_principal_invitation
CREATE OR REPLACE FUNCTION public.accept_principal_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_user_email text;
  v_existing_politician record;
  v_existing_cabinet record;
  v_politician_id uuid;
  v_cabinet_id uuid;
  v_cabinet_name text;
  v_institution record;
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
  JOIN public.camaras c ON c.id = pi.institution_id
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
  SELECT * INTO v_institution FROM public.camaras WHERE id = v_invitation.institution_id;
  
  -- Check if politician already exists for this user + institution
  SELECT * INTO v_existing_politician
  FROM public.politicians
  WHERE user_id = auth.uid() AND institution_id = v_invitation.institution_id;
  
  -- Check if cabinet already exists
  SELECT * INTO v_existing_cabinet
  FROM public.gabinetes
  WHERE politico_id = auth.uid() AND institution_id = v_invitation.institution_id;
  
  IF v_existing_politician.id IS NOT NULL AND v_existing_cabinet.id IS NOT NULL THEN
    -- Mark invitation as accepted
    UPDATE public.principal_invitations
    SET accepted_at = now(), updated_at = now()
    WHERE id = v_invitation.id;
    
    RETURN jsonb_build_object(
      'success', true,
      'existing', true,
      'cabinet_id', v_existing_cabinet.id,
      'cabinet_name', v_existing_cabinet.nome
    );
  END IF;
  
  -- Create politician record if not exists
  IF v_existing_politician.id IS NULL THEN
    INSERT INTO public.politicians (user_id, institution_id, position_title)
    VALUES (auth.uid(), v_invitation.institution_id, 
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
      nome, politico_id, camara_id, institution_id, status
    ) VALUES (
      v_cabinet_name, auth.uid(), v_invitation.institution_id, v_invitation.institution_id, 'ativo'::gabinete_status
    ) RETURNING id INTO v_cabinet_id;
    
    -- Create membership as POLITICO
    INSERT INTO public.gabinete_usuarios (
      gabinete_id, user_id, role, ativo, data_entrada
    ) VALUES (
      v_cabinet_id, auth.uid(), 'politico'::user_role_type, true, now()
    );
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

-- 10. Create RPC: resolve_cabinet_by_whatsapp
CREATE OR REPLACE FUNCTION public.resolve_cabinet_by_whatsapp(p_phone text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized_phone text;
  v_cabinet_id uuid;
BEGIN
  -- Normalize phone (basic E.164 format)
  v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Add country code if missing (assume Brazil +55)
  IF length(v_normalized_phone) = 11 AND left(v_normalized_phone, 2) != '55' THEN
    v_normalized_phone := '55' || v_normalized_phone;
  ELSIF length(v_normalized_phone) = 10 AND left(v_normalized_phone, 2) != '55' THEN
    v_normalized_phone := '55' || v_normalized_phone;
  END IF;
  
  -- Find cabinet by WhatsApp identity
  SELECT cabinet_id INTO v_cabinet_id
  FROM public.whatsapp_identities
  WHERE normalized_phone = v_normalized_phone AND is_active = true
  LIMIT 1;
  
  RETURN v_cabinet_id;
END;
$$;

-- 11. RLS Policies for new tables

-- principal_invitations: Only platform admins can manage
CREATE POLICY "Platform admins can manage principal invitations" 
ON public.principal_invitations
FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- politicians: Users can view their own politician records
CREATE POLICY "Users can view own politician records"
ON public.politicians
FOR SELECT
USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "Platform admins can manage politicians"
ON public.politicians
FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- assessor_permissions: Cabinet members can view, politicians/chiefs can manage
CREATE POLICY "Cabinet members can view assessor permissions"
ON public.assessor_permissions
FOR SELECT
USING (user_belongs_to_cabinet(cabinet_id) OR is_platform_admin());

CREATE POLICY "Politicians and chiefs can manage assessor permissions"
ON public.assessor_permissions
FOR ALL
USING (
  is_platform_admin() OR 
  EXISTS (
    SELECT 1 FROM public.gabinete_usuarios gu
    WHERE gu.gabinete_id = cabinet_id 
    AND gu.user_id = auth.uid()
    AND gu.ativo = true
    AND gu.role IN ('politico'::user_role_type, 'chefe_gabinete'::user_role_type)
  )
)
WITH CHECK (
  is_platform_admin() OR 
  EXISTS (
    SELECT 1 FROM public.gabinete_usuarios gu
    WHERE gu.gabinete_id = cabinet_id 
    AND gu.user_id = auth.uid()
    AND gu.ativo = true
    AND gu.role IN ('politico'::user_role_type, 'chefe_gabinete'::user_role_type)
  )
);

-- whatsapp_identities: Cabinet members can manage
CREATE POLICY "Cabinet members can manage whatsapp identities"
ON public.whatsapp_identities
FOR ALL
USING (user_belongs_to_cabinet(cabinet_id) OR is_platform_admin())
WITH CHECK (user_belongs_to_cabinet(cabinet_id) OR is_platform_admin());

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_politicians_user_institution 
ON public.politicians (user_id, institution_id);

CREATE INDEX IF NOT EXISTS idx_assessor_permissions_user_cabinet 
ON public.assessor_permissions (user_id, cabinet_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_identities_normalized_phone 
ON public.whatsapp_identities (normalized_phone) WHERE is_active = true;