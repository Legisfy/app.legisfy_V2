-- Criar tabelas para sistema WhatsApp

-- 1. Tabela de cargos
CREATE TABLE IF NOT EXISTS public.cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Atualizar tabela usuarios_whatsapp se não existir
CREATE TABLE IF NOT EXISTS public.usuarios_whatsapp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp_e164 TEXT NOT NULL UNIQUE,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
  cargo_id UUID REFERENCES public.cargos(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela whatsapp_identities
CREATE TABLE IF NOT EXISTS public.whatsapp_identities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios_whatsapp(id) ON DELETE CASCADE,
  whatsapp_e164 TEXT NOT NULL UNIQUE,
  meta_wa_id TEXT,
  verificado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela agenda_eventos_whatsapp
CREATE TABLE IF NOT EXISTS public.agenda_eventos_whatsapp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
  criador_id UUID NOT NULL REFERENCES public.usuarios_whatsapp(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ NOT NULL,
  local TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela webhook_events para idempotência e observabilidade
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('outbound_to_n8n', 'inbound_from_n8n')),
  event_type TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  status_code INTEGER,
  request JSONB DEFAULT '{}',
  response JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Inserir cargos padrão
INSERT INTO public.cargos (slug, nome) VALUES 
  ('vereador', 'Vereador'),
  ('chefe_gabinete', 'Chefe de Gabinete'),
  ('assessor', 'Assessor'),
  ('estagiario', 'Estagiário')
ON CONFLICT (slug) DO NOTHING;

-- 7. Ativar RLS em todas as tabelas
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_eventos_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para cargos (público para visualização)
CREATE POLICY "Todos podem visualizar cargos"
  ON public.cargos FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem gerenciar cargos"
  ON public.cargos FOR ALL
  USING (is_whatsapp_platform_admin())
  WITH CHECK (is_whatsapp_platform_admin());

-- 9. Políticas RLS para usuarios_whatsapp
CREATE POLICY "Usuários podem ver próprios dados"
  ON public.usuarios_whatsapp FOR SELECT
  USING (whatsapp_e164 = (SELECT phone FROM auth.users WHERE id = auth.uid()) OR is_whatsapp_platform_admin());

CREATE POLICY "Admins podem gerenciar usuarios_whatsapp"
  ON public.usuarios_whatsapp FOR ALL
  USING (is_whatsapp_platform_admin())
  WITH CHECK (is_whatsapp_platform_admin());

-- 10. Políticas RLS para whatsapp_identities
CREATE POLICY "Usuários podem ver próprias identidades"
  ON public.whatsapp_identities FOR SELECT
  USING (usuario_id IN (
    SELECT id FROM public.usuarios_whatsapp 
    WHERE whatsapp_e164 = (SELECT phone FROM auth.users WHERE id = auth.uid())
  ) OR is_whatsapp_platform_admin());

CREATE POLICY "Admins podem gerenciar identidades"
  ON public.whatsapp_identities FOR ALL
  USING (is_whatsapp_platform_admin())
  WITH CHECK (is_whatsapp_platform_admin());

-- 11. Políticas RLS para agenda_eventos_whatsapp
CREATE POLICY "Membros do gabinete podem ver eventos"
  ON public.agenda_eventos_whatsapp FOR SELECT
  USING (user_belongs_to_whatsapp_gabinete(gabinete_id) OR is_whatsapp_platform_admin());

CREATE POLICY "Membros do gabinete podem criar eventos"
  ON public.agenda_eventos_whatsapp FOR INSERT
  WITH CHECK (user_belongs_to_whatsapp_gabinete(gabinete_id));

CREATE POLICY "Membros do gabinete podem atualizar eventos"
  ON public.agenda_eventos_whatsapp FOR UPDATE
  USING (user_belongs_to_whatsapp_gabinete(gabinete_id))
  WITH CHECK (user_belongs_to_whatsapp_gabinete(gabinete_id));

CREATE POLICY "Membros do gabinete podem deletar eventos"
  ON public.agenda_eventos_whatsapp FOR DELETE
  USING (user_belongs_to_whatsapp_gabinete(gabinete_id));

CREATE POLICY "Admins podem gerenciar todos os eventos"
  ON public.agenda_eventos_whatsapp FOR ALL
  USING (is_whatsapp_platform_admin())
  WITH CHECK (is_whatsapp_platform_admin());

-- 12. Políticas RLS para webhook_events
CREATE POLICY "Apenas admins podem ver webhook_events"
  ON public.webhook_events FOR SELECT
  USING (is_whatsapp_platform_admin());

CREATE POLICY "Apenas sistema pode criar webhook_events"
  ON public.webhook_events FOR INSERT
  WITH CHECK (true); -- Será controlado pelos endpoints

-- 13. Função para resolver gabinete por WhatsApp atualizada
CREATE OR REPLACE FUNCTION public.resolve_user_and_gabinete_by_whatsapp(p_whatsapp_e164 text)
RETURNS TABLE(
  usuario_id uuid,
  gabinete_id uuid,
  cargo_slug text,
  usuario_nome text,
  gabinete_nome text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as usuario_id,
    u.gabinete_id,
    c.slug as cargo_slug,
    u.nome as usuario_nome,
    g.nome as gabinete_nome
  FROM public.usuarios_whatsapp u
  JOIN public.gabinetes_whatsapp g ON g.id = u.gabinete_id
  LEFT JOIN public.cargos c ON c.id = u.cargo_id
  WHERE u.whatsapp_e164 = p_whatsapp_e164 
    AND u.ativo = true
  LIMIT 1;
END;
$$;

-- 14. Triggers para updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_cargos
  BEFORE UPDATE ON public.cargos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_usuarios_whatsapp
  BEFORE UPDATE ON public.usuarios_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_whatsapp_identities
  BEFORE UPDATE ON public.whatsapp_identities
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_agenda_eventos_whatsapp
  BEFORE UPDATE ON public.agenda_eventos_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();