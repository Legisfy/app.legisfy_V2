-- Criar tabela para identidades WhatsApp se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_identities') THEN
        CREATE TABLE public.whatsapp_identities (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            phone_number TEXT NOT NULL,
            normalized_phone TEXT NOT NULL UNIQUE,
            cabinet_id UUID REFERENCES gabinetes_whatsapp(id) ON DELETE CASCADE,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.whatsapp_identities ENABLE ROW LEVEL SECURITY;

        -- RLS policies
        CREATE POLICY "Admin can manage whatsapp_identities" 
        ON public.whatsapp_identities 
        FOR ALL 
        USING (is_whatsapp_platform_admin())
        WITH CHECK (is_whatsapp_platform_admin());

        CREATE POLICY "Users can view their identity" 
        ON public.whatsapp_identities 
        FOR SELECT 
        USING (user_belongs_to_whatsapp_gabinete(cabinet_id));

        -- Trigger for updated_at
        CREATE TRIGGER update_whatsapp_identities_updated_at
        BEFORE UPDATE ON public.whatsapp_identities
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;