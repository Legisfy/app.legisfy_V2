-- Allow conversations without a gabinete and add straightforward owner-based RLS

-- 1) Make gabinete_id nullable so users without gabinete can chat
ALTER TABLE public.ia_conversations
  ALTER COLUMN gabinete_id DROP NOT NULL;

-- 2) Ensure RLS is enabled
ALTER TABLE public.ia_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_messages ENABLE ROW LEVEL SECURITY;

-- 3) Owner-based policies for ia_conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ia_conversations' AND policyname = 'Users can view own conversations'
  ) THEN
    CREATE POLICY "Users can view own conversations"
      ON public.ia_conversations
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ia_conversations' AND policyname = 'Users can insert own conversations'
  ) THEN
    CREATE POLICY "Users can insert own conversations"
      ON public.ia_conversations
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ia_conversations' AND policyname = 'Users can update own conversations'
  ) THEN
    CREATE POLICY "Users can update own conversations"
      ON public.ia_conversations
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ia_conversations' AND policyname = 'Users can delete own conversations'
  ) THEN
    CREATE POLICY "Users can delete own conversations"
      ON public.ia_conversations
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END$$;

-- 4) Policies for ia_messages tied to the parent conversation ownership
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ia_messages' AND policyname = 'Users can view messages of own conversations'
  ) THEN
    CREATE POLICY "Users can view messages of own conversations"
      ON public.ia_messages
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.ia_conversations c
          WHERE c.id = ia_messages.conversation_id
            AND c.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ia_messages' AND policyname = 'Users can insert messages into own conversations'
  ) THEN
    CREATE POLICY "Users can insert messages into own conversations"
      ON public.ia_messages
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.ia_conversations c
          WHERE c.id = ia_messages.conversation_id
            AND c.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ia_messages' AND policyname = 'Users can update messages of own conversations'
  ) THEN
    CREATE POLICY "Users can update messages of own conversations"
      ON public.ia_messages
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.ia_conversations c
          WHERE c.id = ia_messages.conversation_id
            AND c.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.ia_conversations c
          WHERE c.id = ia_messages.conversation_id
            AND c.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ia_messages' AND policyname = 'Users can delete messages of own conversations'
  ) THEN
    CREATE POLICY "Users can delete messages of own conversations"
      ON public.ia_messages
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.ia_conversations c
          WHERE c.id = ia_messages.conversation_id
            AND c.user_id = auth.uid()
        )
      );
  END IF;
END$$;
