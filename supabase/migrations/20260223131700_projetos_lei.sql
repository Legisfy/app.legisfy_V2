-- Create projetos_lei table
CREATE TABLE IF NOT EXISTS public.projetos_lei (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    problema TEXT,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'rascunho',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    gabinete_id UUID REFERENCES public.gabinetes(id) ON DELETE CASCADE,
    referencia TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create projeto_lei_status_events table for logs and comments
CREATE TABLE IF NOT EXISTS public.projeto_lei_status_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID REFERENCES public.projetos_lei(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    descricao TEXT, -- This will store the comments
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projetos_lei ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_lei_status_events ENABLE ROW LEVEL SECURITY;

-- Policies for projetos_lei
CREATE POLICY "Users can view projects from their cabinet" ON public.projetos_lei
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gabinete_usuarios
            WHERE gabinete_usuarios.gabinete_id = projetos_lei.gabinete_id
            AND gabinete_usuarios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert projects in their cabinet" ON public.projetos_lei
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gabinete_usuarios
            WHERE gabinete_usuarios.gabinete_id = (SELECT inserts.gabinete_id FROM (VALUES (gabinete_id)) AS inserts(gabinete_id))
            AND gabinete_usuarios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update projects in their cabinet" ON public.projetos_lei
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gabinete_usuarios
            WHERE gabinete_usuarios.gabinete_id = projetos_lei.gabinete_id
            AND gabinete_usuarios.user_id = auth.uid()
        )
    );

-- Policies for projeto_lei_status_events
CREATE POLICY "Users can view status events from their cabinet projects" ON public.projeto_lei_status_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projetos_lei
            JOIN public.gabinete_usuarios ON gabinete_usuarios.gabinete_id = projetos_lei.gabinete_id
            WHERE projetos_lei.id = projeto_lei_status_events.projeto_id
            AND gabinete_usuarios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert status events for their cabinet projects" ON public.projeto_lei_status_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projetos_lei
            JOIN public.gabinete_usuarios ON gabinete_usuarios.gabinete_id = projetos_lei.gabinete_id
            WHERE projetos_lei.id = projeto_lei_status_events.projeto_id
            AND gabinete_usuarios.user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_projetos_lei_updated_at
BEFORE UPDATE ON public.projetos_lei
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
