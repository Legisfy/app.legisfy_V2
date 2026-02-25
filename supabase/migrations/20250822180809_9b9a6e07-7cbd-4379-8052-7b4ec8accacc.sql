-- Remover política existente que estava muito restritiva
DROP POLICY IF EXISTS "Cabinet chiefs can view invitations for their gabinete" ON invitations;

-- Criar nova política mais abrangente para permitir visualização por membros do gabinete
CREATE POLICY "Cabinet members can view invitations for their gabinete" 
ON invitations 
FOR SELECT 
USING (
  institution_id IN (
    SELECT gm.gabinete_id 
    FROM gabinete_members gm 
    WHERE gm.user_id = auth.uid() 
    AND gm.role IN ('politico', 'chefe_gabinete', 'chefe')
  )
  OR 
  institution_id IN (
    SELECT g.id 
    FROM gabinetes g 
    WHERE g.politico_id = auth.uid()
  )
  OR 
  institution_id IN (
    SELECT c.id 
    FROM cabinets c 
    WHERE c.owner_user = auth.uid()
  )
);

-- Criar política para permitir que membros do gabinete criem convites
CREATE POLICY "Cabinet members can create invitations" 
ON invitations 
FOR INSERT 
WITH CHECK (
  institution_id IN (
    SELECT gm.gabinete_id 
    FROM gabinete_members gm 
    WHERE gm.user_id = auth.uid() 
    AND gm.role IN ('politico', 'chefe_gabinete', 'chefe')
  )
  OR 
  institution_id IN (
    SELECT g.id 
    FROM gabinetes g 
    WHERE g.politico_id = auth.uid()
  )
  OR 
  institution_id IN (
    SELECT c.id 
    FROM cabinets c 
    WHERE c.owner_user = auth.uid()
  )
);

-- Criar política para permitir que membros do gabinete atualizem convites
CREATE POLICY "Cabinet members can update invitations" 
ON invitations 
FOR UPDATE 
USING (
  institution_id IN (
    SELECT gm.gabinete_id 
    FROM gabinete_members gm 
    WHERE gm.user_id = auth.uid() 
    AND gm.role IN ('politico', 'chefe_gabinete', 'chefe')
  )
  OR 
  institution_id IN (
    SELECT g.id 
    FROM gabinetes g 
    WHERE g.politico_id = auth.uid()
  )
  OR 
  institution_id IN (
    SELECT c.id 
    FROM cabinets c 
    WHERE c.owner_user = auth.uid()
  )
);

-- Criar política para permitir que membros do gabinete deletem convites
CREATE POLICY "Cabinet members can delete invitations" 
ON invitations 
FOR DELETE 
USING (
  institution_id IN (
    SELECT gm.gabinete_id 
    FROM gabinete_members gm 
    WHERE gm.user_id = auth.uid() 
    AND gm.role IN ('politico', 'chefe_gabinete', 'chefe')
  )
  OR 
  institution_id IN (
    SELECT g.id 
    FROM gabinetes g 
    WHERE g.politico_id = auth.uid()
  )
  OR 
  institution_id IN (
    SELECT c.id 
    FROM cabinets c 
    WHERE c.owner_user = auth.uid()
  )
);