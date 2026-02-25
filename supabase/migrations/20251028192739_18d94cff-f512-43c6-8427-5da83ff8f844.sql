-- Remove a política restritiva que limita atualizações apenas ao whatsapp
DROP POLICY IF EXISTS "membros_do_gabinete_podem_atualizar_whatsapp" ON public.eleitores;

-- Remove a política duplicada de escopo de atualização
DROP POLICY IF EXISTS "eleitores_update_scope" ON public.eleitores;

-- A política eleitores_cabinet_access já cobre todas as operações (ALL) necessárias
-- Ela permite acesso completo para membros do gabinete ou donos dos registros

-- Verificar se a política eleitores_cabinet_access está correta
-- Se não existir, criar uma política completa para CRUD de eleitores
DO $$ 
BEGIN
  -- Verificar se a política existe, se não, criar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'eleitores' 
    AND policyname = 'eleitores_cabinet_access'
  ) THEN
    CREATE POLICY "eleitores_cabinet_access"
    ON public.eleitores
    FOR ALL
    USING (
      user_has_cabinet_access(gabinete_id) OR (owner_user_id = auth.uid())
    );
  END IF;
END $$;