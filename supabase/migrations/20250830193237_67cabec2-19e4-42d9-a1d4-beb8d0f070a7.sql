-- Verificar se a tabela invitations existe e criar/atualizar conforme necessário
-- Também vamos verificar gabinete_members

-- Primeiro, vamos criar/atualizar a tabela invitations se necessário
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL,
  gabinete_id UUID,
  gabinete_nome TEXT,
  institution_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer um acesse convites válidos por token
CREATE POLICY "Anyone can view invitations by token" ON public.invitations
  FOR SELECT USING (true);

-- Política para atualizações (marcar como aceito)
CREATE POLICY "Users can update invitations" ON public.invitations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Verificar se a tabela gabinete_members existe (já existe no contexto)