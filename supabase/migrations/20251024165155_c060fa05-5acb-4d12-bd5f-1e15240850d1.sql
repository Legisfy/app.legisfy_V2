-- Step 1: Disable RLS temporarily (will re-enable after fixing)
ALTER TABLE gabinete_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE eleitores DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandas DISABLE ROW LEVEL SECURITY;
ALTER TABLE indicacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE eventos DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies on these tables
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies on gabinete_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'gabinete_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON gabinete_members', pol.policyname);
    END LOOP;
    
    -- Drop all policies on eleitores
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'eleitores' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON eleitores', pol.policyname);
    END LOOP;
    
    -- Drop all policies on demandas
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'demandas' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON demandas', pol.policyname);
    END LOOP;
    
    -- Drop all policies on indicacoes
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'indicacoes' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON indicacoes', pol.policyname);
    END LOOP;
    
    -- Drop all policies on eventos
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'eventos' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON eventos', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Create new non-recursive policies
CREATE POLICY "gabinete_members_own_access"
ON gabinete_members FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "gabinete_members_owner_access"
ON gabinete_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM gabinetes 
    WHERE gabinetes.id = gabinete_members.gabinete_id 
    AND gabinetes.politico_id = auth.uid()
  )
);

CREATE POLICY "eleitores_cabinet_access"
ON eleitores FOR ALL
USING (user_has_cabinet_access(gabinete_id) OR owner_user_id = auth.uid());

CREATE POLICY "demandas_cabinet_access"
ON demandas FOR ALL
USING (user_has_cabinet_access(gabinete_id) OR owner_user_id = auth.uid());

CREATE POLICY "indicacoes_cabinet_access"
ON indicacoes FOR ALL
USING (user_has_cabinet_access(gabinete_id) OR owner_user_id = auth.uid());

CREATE POLICY "eventos_cabinet_access"
ON eventos FOR ALL
USING (user_has_cabinet_access(gabinete_id) OR owner_user_id = auth.uid());

-- Step 4: Re-enable RLS
ALTER TABLE gabinete_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleitores ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;