-- Create table for subscription page configuration
CREATE TABLE public.subscription_page_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_image_url TEXT,
  headline TEXT DEFAULT 'Escolha seu Plano',
  subtitle TEXT DEFAULT 'Transforme seu gabinete com as ferramentas mais avançadas da política moderna',
  background_color TEXT DEFAULT '#1e293b',
  primary_color TEXT DEFAULT '#3b82f6',
  accent_color TEXT DEFAULT '#fbbf24',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_page_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Platform admins can manage subscription page config"
ON public.subscription_page_config
FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Everyone can view subscription page config"
ON public.subscription_page_config
FOR SELECT
USING (true);

-- Insert default configuration
INSERT INTO public.subscription_page_config (
  headline,
  subtitle,
  background_color,
  primary_color,
  accent_color
) VALUES (
  'Escolha seu Plano',
  'Transforme seu gabinete com as ferramentas mais avançadas da política moderna',
  '#1e293b',
  '#3b82f6', 
  '#fbbf24'
);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_page_config_updated_at
  BEFORE UPDATE ON public.subscription_page_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();