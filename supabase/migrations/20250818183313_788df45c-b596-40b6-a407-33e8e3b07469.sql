-- Habilitar RLS em todas as tabelas
ALTER TABLE public.instituicoes_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gabinetes_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eleitores_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicacoes_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideias_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.midias_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_agent_config ENABLE ROW LEVEL SECURITY;

-- Função para verificar se o usuário pertence ao gabinete
CREATE OR REPLACE FUNCTION public.user_belongs_to_whatsapp_gabinete(target_gabinete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuarios_whatsapp u
    WHERE u.whatsapp_e164 = (
      SELECT phone FROM auth.users WHERE id = auth.uid()
    )
    AND u.gabinete_id = target_gabinete_id
    AND u.ativo = true
  );
$$;

-- Função para obter o gabinete do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_whatsapp_gabinete()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.gabinete_id
  FROM public.usuarios_whatsapp u
  WHERE u.whatsapp_e164 = (
    SELECT phone FROM auth.users WHERE id = auth.uid()
  )
  AND u.ativo = true
  LIMIT 1;
$$;

-- Função para verificar se é admin da plataforma
CREATE OR REPLACE FUNCTION public.is_whatsapp_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->>'app_role') = 'ADMIN',
    false
  );
$$;

-- Políticas RLS para instituicoes_whatsapp
CREATE POLICY "Admin can manage instituicoes_whatsapp" ON public.instituicoes_whatsapp
    FOR ALL USING (is_whatsapp_platform_admin())
    WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "Users can view their instituicao" ON public.instituicoes_whatsapp
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gabinetes_whatsapp g
            WHERE g.instituicao_id = instituicoes_whatsapp.id
            AND user_belongs_to_whatsapp_gabinete(g.id)
        )
    );

-- Políticas RLS para gabinetes_whatsapp
CREATE POLICY "Admin can manage gabinetes_whatsapp" ON public.gabinetes_whatsapp
    FOR ALL USING (is_whatsapp_platform_admin())
    WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "Users can view their gabinete" ON public.gabinetes_whatsapp
    FOR SELECT USING (user_belongs_to_whatsapp_gabinete(id));

-- Políticas RLS para usuarios_whatsapp
CREATE POLICY "Admin can manage usuarios_whatsapp" ON public.usuarios_whatsapp
    FOR ALL USING (is_whatsapp_platform_admin())
    WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "Users can view gabinete members" ON public.usuarios_whatsapp
    FOR SELECT USING (user_belongs_to_whatsapp_gabinete(gabinete_id));

-- Políticas RLS para eleitores_whatsapp
CREATE POLICY "Admin can manage eleitores_whatsapp" ON public.eleitores_whatsapp
    FOR ALL USING (is_whatsapp_platform_admin())
    WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "Gabinete members can manage eleitores" ON public.eleitores_whatsapp
    FOR ALL USING (user_belongs_to_whatsapp_gabinete(gabinete_id))
    WITH CHECK (user_belongs_to_whatsapp_gabinete(gabinete_id));

-- Políticas RLS para indicacoes_whatsapp
CREATE POLICY "Admin can manage indicacoes_whatsapp" ON public.indicacoes_whatsapp
    FOR ALL USING (is_whatsapp_platform_admin())
    WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "Gabinete members can manage indicacoes" ON public.indicacoes_whatsapp
    FOR ALL USING (user_belongs_to_whatsapp_gabinete(gabinete_id))
    WITH CHECK (user_belongs_to_whatsapp_gabinete(gabinete_id));

-- Políticas RLS para demandas_whatsapp
CREATE POLICY "Admin can manage demandas_whatsapp" ON public.demandas_whatsapp
    FOR ALL USING (is_whatsapp_platform_admin())
    WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "Gabinete members can manage demandas" ON public.demandas_whatsapp
    FOR ALL USING (user_belongs_to_whatsapp_gabinete(gabinete_id))
    WITH CHECK (user_belongs_to_whatsapp_gabinete(gabinete_id));

-- Políticas RLS para ideias_whatsapp
CREATE POLICY "Admin can manage ideias_whatsapp" ON public.ideias_whatsapp
    FOR ALL USING (is_whatsapp_platform_admin())
    WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "Gabinete members can manage ideias" ON public.ideias_whatsapp
    FOR ALL USING (user_belongs_to_whatsapp_gabinete(gabinete_id))
    WITH CHECK (user_belongs_to_whatsapp_gabinete(gabinete_id));

-- Políticas RLS para midias_whatsapp
CREATE POLICY "Admin can manage midias_whatsapp" ON public.midias_whatsapp
    FOR ALL USING (is_whatsapp_platform_admin())
    WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "Gabinete members can manage midias" ON public.midias_whatsapp
    FOR ALL USING (user_belongs_to_whatsapp_gabinete(gabinete_id))
    WITH CHECK (user_belongs_to_whatsapp_gabinete(gabinete_id));

-- Políticas RLS para audit_log_whatsapp
CREATE POLICY "Admin can view audit_log_whatsapp" ON public.audit_log_whatsapp
    FOR SELECT USING (is_whatsapp_platform_admin());

CREATE POLICY "Gabinete members can view their audit log" ON public.audit_log_whatsapp
    FOR SELECT USING (user_belongs_to_whatsapp_gabinete(gabinete_id));

-- Políticas RLS para whatsapp_conversations
CREATE POLICY "Admin can manage whatsapp_conversations" ON public.whatsapp_conversations
    FOR ALL USING (is_whatsapp_platform_admin())
    WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "System can manage conversations" ON public.whatsapp_conversations
    FOR ALL USING (true)
    WITH CHECK (true);

-- Políticas RLS para whatsapp_agent_config
CREATE POLICY "Admin can manage whatsapp_agent_config" ON public.whatsapp_agent_config
    FOR ALL USING (is_whatsapp_platform_admin())
    WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "All users can view agent config" ON public.whatsapp_agent_config
    FOR SELECT USING (true);