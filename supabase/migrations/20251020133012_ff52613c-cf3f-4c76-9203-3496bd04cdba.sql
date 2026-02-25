-- Adicionar coluna phone_whatsapp na tabela profiles se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_whatsapp text;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone_whatsapp ON public.profiles(phone_whatsapp);

-- Criar VIEW materializada para consultas rápidas de WhatsApp por gabinete
DROP MATERIALIZED VIEW IF EXISTS public.gabinete_whatsapp_users CASCADE;

CREATE MATERIALIZED VIEW public.gabinete_whatsapp_users AS
SELECT 
  gm.gabinete_id,
  g.nome as nome_gabinete,
  gm.user_id,
  p.full_name as nome_usuario,
  p.phone_whatsapp,
  gm.role as cargo,
  gm.created_at
FROM public.gabinete_members gm
INNER JOIN public.gabinetes g ON g.id = gm.gabinete_id
INNER JOIN public.profiles p ON p.user_id = gm.user_id
WHERE p.phone_whatsapp IS NOT NULL 
  AND p.phone_whatsapp != ''
  AND (g.status IS NULL OR g.status = 'ativo');

-- Criar índices na VIEW materializada
CREATE UNIQUE INDEX idx_gabinete_whatsapp_unique 
ON public.gabinete_whatsapp_users(gabinete_id, user_id);

CREATE INDEX idx_gabinete_whatsapp_gabinete 
ON public.gabinete_whatsapp_users(gabinete_id);

-- Função para atualizar a VIEW materializada
CREATE OR REPLACE FUNCTION public.refresh_gabinete_whatsapp_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.gabinete_whatsapp_users;
END;
$$;

-- Triggers para manter a VIEW atualizada automaticamente
CREATE OR REPLACE FUNCTION public.trigger_refresh_gabinete_whatsapp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_gabinete_whatsapp_users();
  RETURN NULL;
END;
$$;

-- Trigger quando membro é adicionado/removido
DROP TRIGGER IF EXISTS trg_gabinete_members_refresh_whatsapp ON public.gabinete_members;
CREATE TRIGGER trg_gabinete_members_refresh_whatsapp
AFTER INSERT OR UPDATE OR DELETE ON public.gabinete_members
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_gabinete_whatsapp();

-- Trigger quando profile é atualizado
DROP TRIGGER IF EXISTS trg_profiles_refresh_whatsapp ON public.profiles;
CREATE TRIGGER trg_profiles_refresh_whatsapp
AFTER UPDATE OF phone_whatsapp, full_name ON public.profiles
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_gabinete_whatsapp();

-- Função helper para buscar usuários WhatsApp de um gabinete (com RLS)
CREATE OR REPLACE FUNCTION public.get_gabinete_whatsapp_users(p_gabinete_id uuid)
RETURNS TABLE(
  user_id uuid,
  nome_usuario text,
  phone_whatsapp text,
  cargo text,
  nome_gabinete text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário tem acesso ao gabinete
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.gabinete_members 
      WHERE gabinete_id = p_gabinete_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.gabinetes 
      WHERE id = p_gabinete_id AND politico_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado ao gabinete';
  END IF;

  RETURN QUERY
  SELECT 
    gwu.user_id,
    gwu.nome_usuario,
    gwu.phone_whatsapp,
    gwu.cargo,
    gwu.nome_gabinete
  FROM public.gabinete_whatsapp_users gwu
  WHERE gwu.gabinete_id = p_gabinete_id
  ORDER BY gwu.nome_usuario;
END;
$$;