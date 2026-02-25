-- Create enum for plan types
CREATE TYPE plan_type AS ENUM ('starter', 'ambicioso', 'poder', 'institucional', 'custom');

-- Create enum for billing periods
CREATE TYPE billing_period AS ENUM ('monthly', 'yearly');

-- Create plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 5,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  plan_type plan_type NOT NULL DEFAULT 'custom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create available features table
CREATE TABLE public.plan_features_available (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create plan features junction table
CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES public.plan_features_available(feature_key) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);

-- Add plan_id to gabinetes table
ALTER TABLE public.gabinetes ADD COLUMN plan_id UUID REFERENCES public.plans(id);

-- Enable RLS on all tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features_available ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for plans
CREATE POLICY "Platform admins can manage plans" ON public.plans
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY "Users can view active plans" ON public.plans
  FOR SELECT USING (is_active = true);

-- Create RLS policies for plan features available
CREATE POLICY "Platform admins can manage available features" ON public.plan_features_available
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY "Users can view active features" ON public.plan_features_available
  FOR SELECT USING (is_active = true);

-- Create RLS policies for plan features
CREATE POLICY "Platform admins can manage plan features" ON public.plan_features
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY "Users can view plan features" ON public.plan_features
  FOR SELECT USING (true);

-- Insert default available features
INSERT INTO public.plan_features_available (feature_key, feature_name, feature_description, category) VALUES
  ('eleitores', 'Cadastro de Eleitores', 'Permite cadastrar e gerenciar eleitores', 'core'),
  ('demandas', 'Demandas', 'Sistema de gestão de demandas', 'core'),
  ('indicacoes', 'Indicações', 'Sistema de indicações políticas', 'core'),
  ('relatorios_basicos', 'Relatórios Básicos', 'Relatórios básicos de performance', 'reports'),
  ('chat_ia', 'Chat com IA', 'Assistente virtual com inteligência artificial', 'ai'),
  ('assessor_ia', 'Assessor IA', 'Assessor virtual inteligente', 'ai'),
  ('whatsapp_ia', 'WhatsApp IA', 'Integração com WhatsApp e IA', 'ai'),
  ('marketing', 'Marketing', 'Ferramentas de marketing político', 'marketing'),
  ('sistema_premiacao', 'Sistema de Premiação', 'Gamificação e sistema de premiações', 'gamification'),
  ('relatorios_institucionais', 'Relatórios Institucionais', 'Relatórios avançados para instituições', 'reports'),
  ('agenda', 'Agenda', 'Sistema de agendamento e calendário', 'core'),
  ('comunicacao', 'Comunicação', 'Sistema de comunicação avançado', 'communication');

-- Create default plans
INSERT INTO public.plans (title, description, price_monthly, price_yearly, max_users, plan_type) VALUES
  ('Starter', 'Plano básico para gabinetes iniciantes', 199.00, 2149.00, 5, 'starter'),
  ('Ambicioso', 'Plano intermediário para gabinetes em crescimento', 499.00, 5389.00, 15, 'ambicioso'),
  ('Poder', 'Plano avançado para gabinetes estabelecidos', 999.00, 10789.00, 25, 'poder'),
  ('Institucional', 'Plano enterprise para grandes instituições', 1999.00, 21589.00, 999, 'institucional');

-- Create function to get plan statistics
CREATE OR REPLACE FUNCTION get_plan_statistics()
RETURNS TABLE(
  plan_id UUID,
  plan_title TEXT,
  gabinetes_count BIGINT,
  monthly_revenue DECIMAL,
  yearly_revenue DECIMAL
) LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT 
    p.id as plan_id,
    p.title as plan_title,
    COUNT(g.id) as gabinetes_count,
    (COUNT(g.id) * p.price_monthly) as monthly_revenue,
    (COUNT(g.id) * p.price_yearly) as yearly_revenue
  FROM public.plans p
  LEFT JOIN public.gabinetes g ON g.plan_id = p.id
  WHERE p.is_active = true
  GROUP BY p.id, p.title, p.price_monthly, p.price_yearly
  ORDER BY p.created_at;
$$;

-- Create function to check if feature is enabled for gabinete
CREATE OR REPLACE FUNCTION gabinete_has_feature(target_gabinete_id UUID, feature_key TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.gabinetes g
    JOIN public.plan_features pf ON pf.plan_id = g.plan_id
    WHERE g.id = target_gabinete_id 
    AND pf.feature_key = gabinete_has_feature.feature_key
    AND pf.is_enabled = true
  );
$$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();