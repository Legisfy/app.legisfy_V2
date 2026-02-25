-- 1) Garantir que institutions.id seja UUID
ALTER TABLE institutions 
  ALTER COLUMN id TYPE uuid USING id::uuid;

-- 2) Garantir que invitations.institution_id seja UUID e NOT NULL
ALTER TABLE invitations 
  ALTER COLUMN institution_id TYPE uuid USING institution_id::uuid,
  ALTER COLUMN institution_id SET NOT NULL;

-- 3) Remover FK existente se houver e recriar corretamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='invitations' AND constraint_name='invitations_institution_id_fkey'
  ) THEN
    ALTER TABLE invitations DROP CONSTRAINT invitations_institution_id_fkey;
  END IF;
END$$;

-- 4) Adicionar FK consistente
ALTER TABLE invitations
  ADD CONSTRAINT invitations_institution_id_fkey
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;

-- 5) Criar índice para performance
CREATE INDEX IF NOT EXISTS invitations_institution_idx ON invitations(institution_id);