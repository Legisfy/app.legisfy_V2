-- Add missing columns and create missing tables
ALTER TABLE public.plan_features_available 
ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'Settings';

-- Create plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 5,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_days INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  plan_type TEXT NOT NULL DEFAULT 'custom',
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan_features table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);

-- Create subscription_page_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_page_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_image_url TEXT,
  headline TEXT NOT NULL DEFAULT 'Escolha seu Plano',
  subtitle TEXT NOT NULL DEFAULT 'Transforme seu gabinete com as ferramentas mais avançadas da política moderna',
  background_color TEXT NOT NULL DEFAULT '#1e293b',
  primary_color TEXT NOT NULL DEFAULT '#3b82f6',
  accent_color TEXT NOT NULL DEFAULT '#fbbf24',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tables if not already enabled
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features_available ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_page_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Platform admins can manage plans" ON public.plans
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY IF NOT EXISTS "Everyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true);

CREATE POLICY IF NOT EXISTS "Platform admins can manage plan features" ON public.plan_features
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY IF NOT EXISTS "Everyone can view plan features" ON public.plan_features
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Everyone can view available features" ON public.plan_features_available
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Platform admins can manage available features" ON public.plan_features_available
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY IF NOT EXISTS "Platform admins can manage subscription config" ON public.subscription_page_config
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY IF NOT EXISTS "Everyone can view subscription config" ON public.subscription_page_config
  FOR SELECT USING (true);

-- Insert available features
INSERT INTO public.plan_features_available (feature_key, feature_name, feature_description, category, icon) VALUES
  ('dashboard', 'Início', 'Dashboard principal com métricas e resumos', 'principal', 'BarChart3'),
  ('eleitores', 'Eleitores', 'Gestão de eleitores e contatos', 'principal', 'Users'),
  ('indicacoes', 'Indicações', 'Sistema de indicações políticas', 'principal', 'FileText'),
  ('demandas', 'Demandas', 'Gestão de demandas e solicitações', 'principal', 'MessageSquare'),
  ('assessor_ia', 'Assessor IA', 'Assistente virtual com inteligência artificial', 'principal', 'Bot'),
  ('marketing', 'Marketing', 'Ferramentas de comunicação e marketing político', 'principal', 'Palette'),
  ('assessores', 'Assessores', 'Gestão de equipe e assessores', 'administrativo', 'UserCheck'),
  ('agenda', 'Agenda', 'Sistema de agendamento e calendário', 'administrativo', 'Calendar'),
  ('configuracoes', 'Meu Gabinete', 'Configurações e gestão do gabinete', 'administrativo', 'Briefcase'),
  ('pontuacao', 'Sistema de Pontuação', 'Gamificação com pontos e rankings para assessores', 'administrativo', 'Target')
ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  feature_description = EXCLUDED.feature_description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon;