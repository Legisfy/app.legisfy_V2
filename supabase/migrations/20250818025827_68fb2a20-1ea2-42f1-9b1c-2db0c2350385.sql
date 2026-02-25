-- Create AI agent configurations table
CREATE TABLE public.ai_agent_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT true,
  custom_prompt TEXT NOT NULL DEFAULT 'Você é o assistente virtual da Legisfy. Ajude os usuários com suas demandas, eleitores e indicações, sempre respeitando as permissões do gabinete.',
  official_whatsapp TEXT,
  max_response_time INTEGER NOT NULL DEFAULT 15,
  auto_responses BOOLEAN NOT NULL DEFAULT true,
  learning_mode BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_agent_config ENABLE ROW LEVEL SECURITY;

-- Create policy for platform admins only
CREATE POLICY "Platform admins can manage AI config" 
ON public.ai_agent_config 
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Create WhatsApp bot interactions table
CREATE TABLE public.whatsapp_bot_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  user_message TEXT NOT NULL,
  bot_response TEXT,
  conversation_id TEXT,
  cabinet_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_time_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.whatsapp_bot_interactions ENABLE ROW LEVEL SECURITY;

-- Create policy for platform admins
CREATE POLICY "Platform admins can view bot interactions" 
ON public.whatsapp_bot_interactions 
FOR SELECT 
USING (is_platform_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_ai_agent_config_updated_at
BEFORE UPDATE ON public.ai_agent_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.ai_agent_config (custom_prompt) VALUES (DEFAULT);