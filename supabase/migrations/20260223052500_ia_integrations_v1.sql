-- Tabela para armazenar configurações de integrações por gabinete
CREATE TABLE IF NOT EXISTS public.ia_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gabinete_id UUID NOT NULL UNIQUE REFERENCES public.gabinetes(id) ON DELETE CASCADE,
    
    -- Telegram
    telegram_bot_token TEXT,
    telegram_chat_id TEXT, -- ID do chat principal do gabinete (se houver)
    telegram_enabled BOOLEAN DEFAULT false,
    
    -- Google (Gmail/Calendar)
    google_refresh_token TEXT,
    google_access_token TEXT,
    google_token_expires_at TIMESTAMPTZ,
    google_enabled BOOLEAN DEFAULT false,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para mapear usuários do Telegram para usuários do Legisfy
CREATE TABLE IF NOT EXISTS public.ia_telegram_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, gabinete_id)
);

-- Habilitar RLS
ALTER TABLE public.ia_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_telegram_users ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ia_integrations' AND policyname = 'Admins do gabinete podem gerenciar integrações'
    ) THEN
        CREATE POLICY "Admins do gabinete podem gerenciar integrações" 
        ON public.ia_integrations FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM gabinete_usuarios 
            WHERE gabinete_id = ia_integrations.gabinete_id 
            AND user_id = auth.uid() 
            AND role IN ('politico', 'chefe_gabinete')
          )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ia_telegram_users' AND policyname = 'Usuários podem ver seus próprios mapeamentos de Telegram'
    ) THEN
        CREATE POLICY "Usuários podem ver seus próprios mapeamentos de Telegram" 
        ON public.ia_telegram_users FOR ALL 
        USING (user_id = auth.uid());
    END IF;
END
$$;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ia_integrations_updated_at ON public.ia_integrations;
CREATE TRIGGER update_ia_integrations_updated_at
    BEFORE UPDATE ON public.ia_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
