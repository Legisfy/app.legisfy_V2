-- Criar tabelas para sistema WhatsApp - Correção

-- 1. Tabela de cargos
CREATE TABLE IF NOT EXISTS public.cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Inserir cargos padrão
INSERT INTO public.cargos (slug, nome) VALUES 
  ('vereador', 'Vereador'),
  ('chefe_gabinete', 'Chefe de Gabinete'),
  ('assessor', 'Assessor'),
  ('estagiario', 'Estagiário')
ON CONFLICT (slug) DO NOTHING;

-- 3. Atualizar usuarios_whatsapp adicionando cargo_id
ALTER TABLE public.usuarios_whatsapp 
ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES public.cargos(id);

-- 4. Tabela whatsapp_identities sem dependência circular
CREATE TABLE IF NOT EXISTS public.whatsapp_identities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_e164 TEXT NOT NULL UNIQUE,
  meta_wa_id TEXT,
  verificado BOOLEAN NOT NULL DEFAULT false,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela agenda_eventos_whatsapp
CREATE TABLE IF NOT EXISTS public.agenda_eventos_whatsapp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
  criador_whatsapp TEXT NOT NULL, -- Usar WhatsApp E164 em vez de referência
  titulo TEXT NOT NULL,
  descricao TEXT,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ NOT NULL,
  local TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabela webhook_events para idempotência e observabilidade
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

-- 7. Ativar RLS em todas as tabelas
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_eventos_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para cargos
CREATE POLICY "Todos podem visualizar cargos"
  ON public.cargos FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem gerenciar cargos"
  ON public.cargos FOR ALL
  USING (is_whatsapp_platform_admin())
  WITH CHECK (is_whatsapp_platform_admin());

-- 9. Políticas RLS para whatsapp_identities
CREATE POLICY "Admins podem gerenciar identidades"
  ON public.whatsapp_identities FOR ALL
  USING (is_whatsapp_platform_admin())
  WITH CHECK (is_whatsapp_platform_admin());

CREATE POLICY "Gabinete members podem ver identidades"
  ON public.whatsapp_identities FOR SELECT
  USING (user_belongs_to_whatsapp_gabinete(gabinete_id));

-- 10. Políticas RLS para agenda_eventos_whatsapp
CREATE POLICY "Membros do gabinete podem ver eventos"
  ON public.agenda_eventos_whatsapp FOR SELECT
  USING (user_belongs_to_whatsapp_gabinete(gabinete_id) OR is_whatsapp_platform_admin());

CREATE POLICY "Sistema pode criar eventos"
  ON public.agenda_eventos_whatsapp FOR INSERT
  WITH CHECK (true); -- Será controlado pelos endpoints

CREATE POLICY "Membros do gabinete podem atualizar eventos"
  ON public.agenda_eventos_whatsapp FOR UPDATE
  USING (user_belongs_to_whatsapp_gabinete(gabinete_id) OR is_whatsapp_platform_admin())
  WITH CHECK (user_belongs_to_whatsapp_gabinete(gabinete_id) OR is_whatsapp_platform_admin());

CREATE POLICY "Membros do gabinete podem deletar eventos"
  ON public.agenda_eventos_whatsapp FOR DELETE
  USING (user_belongs_to_whatsapp_gabinete(gabinete_id) OR is_whatsapp_platform_admin());

-- 11. Políticas RLS para webhook_events
CREATE POLICY "Apenas admins podem ver webhook_events"
  ON public.webhook_events FOR SELECT
  USING (is_whatsapp_platform_admin());

CREATE POLICY "Sistema pode criar webhook_events"
  ON public.webhook_events FOR INSERT
  WITH CHECK (true);

-- 12. Função para resolver gabinete por WhatsApp
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
    COALESCE(c.slug, 'assessor') as cargo_slug,
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

-- 13. Triggers para updated_at
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

CREATE TRIGGER set_timestamp_whatsapp_identities
  BEFORE UPDATE ON public.whatsapp_identities
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_agenda_eventos_whatsapp
  BEFORE UPDATE ON public.agenda_eventos_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();