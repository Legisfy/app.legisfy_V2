-- Create email system tables for invitation and welcome flows

-- Create role enum
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('politico', 'chefe', 'assessor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create institutions table (if not exists)
CREATE TABLE IF NOT EXISTS institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create invitations table for email tracking
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role role NOT NULL,
  token text NOT NULL UNIQUE,
  accepted_at timestamptz,
  email_sent boolean DEFAULT false,
  resend_message_id text, -- For tracking Resend responses
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cabinets table (if not exists) 
CREATE TABLE IF NOT EXISTS cabinets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  owner_user uuid, -- user do político quando criado
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations(email);
CREATE INDEX IF NOT EXISTS invitations_token_idx ON invitations(token);
CREATE INDEX IF NOT EXISTS invitations_institution_idx ON invitations(institution_id);

-- Enable RLS on new tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for institutions
CREATE POLICY "Platform admins can manage institutions" 
ON institutions FOR ALL 
TO authenticated 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Users can view institutions" 
ON institutions FOR SELECT 
TO authenticated 
USING (true);

-- RLS Policies for invitations  
CREATE POLICY "Platform admins can manage invitations"
ON invitations FOR ALL
TO authenticated 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Users can view their own invitations"
ON invitations FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for cabinets
CREATE POLICY "Platform admins can manage cabinets"
ON cabinets FOR ALL
TO authenticated
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Cabinet owners can manage their cabinets"
ON cabinets FOR ALL
TO authenticated  
USING (owner_user = auth.uid())
WITH CHECK (owner_user = auth.uid());

CREATE POLICY "Users can view cabinets they belong to"
ON cabinets FOR SELECT
TO authenticated
USING (
  owner_user = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM gabinete_members gm 
    WHERE gm.gabinete_id = cabinets.id AND gm.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();