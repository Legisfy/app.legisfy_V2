-- Criar tabela para conversas do chat
CREATE TABLE public.ia_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gabinete_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nova Conversa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para mensagens do chat
CREATE TABLE public.ia_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ia_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ia_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies para conversas
CREATE POLICY "Users can view their own conversations" 
ON public.ia_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.ia_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.ia_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.ia_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies para mensagens
CREATE POLICY "Users can view messages from their conversations" 
ON public.ia_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ia_conversations 
    WHERE id = conversation_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.ia_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ia_conversations 
    WHERE id = conversation_id 
    AND user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ia_conversations_updated_at
BEFORE UPDATE ON public.ia_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX idx_ia_conversations_user_id ON public.ia_conversations(user_id);
CREATE INDEX idx_ia_conversations_gabinete_id ON public.ia_conversations(gabinete_id);
CREATE INDEX idx_ia_messages_conversation_id ON public.ia_messages(conversation_id);
CREATE INDEX idx_ia_messages_created_at ON public.ia_messages(created_at);