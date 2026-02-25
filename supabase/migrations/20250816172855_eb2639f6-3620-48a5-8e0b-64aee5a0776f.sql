-- First, let's update the existing tables to ensure proper user/institution isolation columns and RLS policies

-- Update eleitores table to ensure proper columns exist (they should already exist)
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS institution_id UUID;

-- Update indicacoes table
ALTER TABLE public.indicacoes ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.indicacoes ADD COLUMN IF NOT EXISTS institution_id UUID;

-- Update demandas table 
ALTER TABLE public.demandas ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.demandas ADD COLUMN IF NOT EXISTS institution_id UUID;

-- Update ideias table
ALTER TABLE public.ideias ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.ideias ADD COLUMN IF NOT EXISTS institution_id UUID;

-- Update eventos table
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS institution_id UUID;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eleitores_owner_institution ON public.eleitores(user_id, gabinete_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_owner_institution ON public.indicacoes(user_id, gabinete_id);
CREATE INDEX IF NOT EXISTS idx_demandas_owner_institution ON public.demandas(user_id, gabinete_id);
CREATE INDEX IF NOT EXISTS idx_ideias_owner_institution ON public.ideias(user_id, gabinete_id);
CREATE INDEX IF NOT EXISTS idx_eventos_owner_institution ON public.eventos(user_id, gabinete_id);

-- Function to check if user belongs to a gabinete (already exists but ensuring it's correct)
CREATE OR REPLACE FUNCTION public.user_belongs_to_institution(target_institution_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.gabinete_usuarios gu
    WHERE gu.user_id = auth.uid() 
    AND gu.gabinete_id = target_institution_id 
    AND gu.ativo = true
  );
$$;

-- Update RLS policies for all domain tables
-- DROP existing policies first to recreate them correctly

-- ELEITORES policies
DROP POLICY IF EXISTS "Users can view gabinete eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Users can create gabinete eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Users can update gabinete eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Users can delete gabinete eleitores" ON public.eleitores;

CREATE POLICY "read_own_institution_eleitores"
ON public.eleitores
FOR SELECT
USING (user_belongs_to_cabinet(gabinete_id) OR is_platform_admin());

CREATE POLICY "insert_own_institution_eleitores"
ON public.eleitores
FOR INSERT
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "update_own_records_eleitores"
ON public.eleitores
FOR UPDATE 
USING (user_id = auth.uid() OR is_platform_admin())
WITH CHECK (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "delete_own_records_eleitores"
ON public.eleitores
FOR DELETE 
USING (user_id = auth.uid() OR is_platform_admin());

-- INDICACOES policies
DROP POLICY IF EXISTS "Users can view gabinete indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "Users can create gabinete indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "Users can update gabinete indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "Users can delete gabinete indicacoes" ON public.indicacoes;

CREATE POLICY "read_own_institution_indicacoes"
ON public.indicacoes
FOR SELECT
USING (user_belongs_to_cabinet(gabinete_id) OR is_platform_admin());

CREATE POLICY "insert_own_institution_indicacoes"
ON public.indicacoes
FOR INSERT
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "update_own_records_indicacoes"
ON public.indicacoes
FOR UPDATE 
USING (user_id = auth.uid() OR is_platform_admin())
WITH CHECK (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "delete_own_records_indicacoes"
ON public.indicacoes
FOR DELETE 
USING (user_id = auth.uid() OR is_platform_admin());

-- DEMANDAS policies
DROP POLICY IF EXISTS "Users can view gabinete demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users can create gabinete demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users can update gabinete demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users can delete gabinete demandas" ON public.demandas;

CREATE POLICY "read_own_institution_demandas"
ON public.demandas
FOR SELECT
USING (user_belongs_to_cabinet(gabinete_id) OR is_platform_admin());

CREATE POLICY "insert_own_institution_demandas"
ON public.demandas
FOR INSERT
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "update_own_records_demandas"
ON public.demandas
FOR UPDATE 
USING (user_id = auth.uid() OR is_platform_admin())
WITH CHECK (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "delete_own_records_demandas"
ON public.demandas
FOR DELETE 
USING (user_id = auth.uid() OR is_platform_admin());

-- IDEIAS policies
DROP POLICY IF EXISTS "Users can view gabinete ideias" ON public.ideias;
DROP POLICY IF EXISTS "Users can create gabinete ideias" ON public.ideias;
DROP POLICY IF EXISTS "Users can update gabinete ideias" ON public.ideias;
DROP POLICY IF EXISTS "Users can delete gabinete ideias" ON public.ideias;

CREATE POLICY "read_own_institution_ideias"
ON public.ideias
FOR SELECT
USING (user_belongs_to_cabinet(gabinete_id) OR is_platform_admin());

CREATE POLICY "insert_own_institution_ideias"
ON public.ideias
FOR INSERT
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "update_own_records_ideias"
ON public.ideias
FOR UPDATE 
USING (user_id = auth.uid() OR is_platform_admin())
WITH CHECK (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "delete_own_records_ideias"
ON public.ideias
FOR DELETE 
USING (user_id = auth.uid() OR is_platform_admin());

-- EVENTOS policies
DROP POLICY IF EXISTS "Users can view gabinete eventos" ON public.eventos;
DROP POLICY IF EXISTS "Users can create gabinete eventos" ON public.eventos;
DROP POLICY IF EXISTS "Users can update gabinete eventos" ON public.eventos;
DROP POLICY IF EXISTS "Users can delete gabinete eventos" ON public.eventos;

CREATE POLICY "read_own_institution_eventos"
ON public.eventos
FOR SELECT
USING (user_belongs_to_cabinet(gabinete_id) OR is_platform_admin());

CREATE POLICY "insert_own_institution_eventos"
ON public.eventos
FOR INSERT
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND user_id = auth.uid());

CREATE POLICY "update_own_records_eventos"
ON public.eventos
FOR UPDATE 
USING (user_id = auth.uid() OR is_platform_admin())
WITH CHECK (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "delete_own_records_eventos"
ON public.eventos
FOR DELETE 
USING (user_id = auth.uid() OR is_platform_admin());