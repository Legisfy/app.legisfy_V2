-- Migration to fix infinite recursion in RLS policies
-- Date: 2026-02-24

-- 1. Fix gabinete_usuarios policies
DROP POLICY IF EXISTS "Chefe can manage members except politico" ON public.gabinete_usuarios;
DROP POLICY IF EXISTS "Politico can manage all cabinet members" ON public.gabinete_usuarios;
DROP POLICY IF EXISTS "Users can view their own cabinet memberships" ON public.gabinete_usuarios;

-- Policy for SELECT: User can see themselves or someone with access to the cabinet can see members
CREATE POLICY "Users can view gabinete members" ON public.gabinete_usuarios
    FOR SELECT USING (
        user_id = auth.uid() OR 
        public.user_belongs_to_gabinete(gabinete_id)
    );

-- Policy for ALL (Management): Politicians and Chiefs can manage members
CREATE POLICY "Managers can manage gabinete members" ON public.gabinete_usuarios
    FOR ALL USING (
        public.can_manage_cabinet(gabinete_id)
    );

-- 2. Fix publicos policies
DROP POLICY IF EXISTS "Users can access publicos from their cabinet" ON public.publicos;

CREATE POLICY "Users can access publicos from their cabinet" ON public.publicos
    FOR SELECT USING (
        public.user_belongs_to_gabinete(gabinete_id)
    );

-- 3. Fix gabinete_custom_tags policies
DROP POLICY IF EXISTS "Users can access tags from their gabinete" ON public.gabinete_custom_tags;

CREATE POLICY "Users can access tags from their gabinete" ON public.gabinete_custom_tags
    FOR SELECT USING (
        public.user_belongs_to_gabinete(gabinete_id)
    );
