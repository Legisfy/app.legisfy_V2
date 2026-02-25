-- Criar tabela para armazenar dados dos clientes Stripe
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para armazenar assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para configurações de checkout personalizadas
CREATE TABLE IF NOT EXISTS public.checkout_customizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_image_url text,
  banner_text text,
  primary_color text DEFAULT '#6366f1',
  secondary_color text DEFAULT '#f59e0b',
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_customizations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para stripe_customers
CREATE POLICY "Users can view their own Stripe customer data"
ON public.stripe_customers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Stripe customer data"
ON public.stripe_customers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Stripe customer data"
ON public.stripe_customers FOR UPDATE
USING (auth.uid() = user_id);

-- Políticas RLS para subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage subscriptions"
ON public.subscriptions FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas RLS para checkout_customizations (somente admin)
CREATE POLICY "Admins can manage checkout customizations"
ON public.checkout_customizations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
);

CREATE POLICY "Everyone can view active checkout customizations"
ON public.checkout_customizations FOR SELECT
USING (is_active = true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stripe_customers_updated_at 
BEFORE UPDATE ON public.stripe_customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkout_customizations_updated_at 
BEFORE UPDATE ON public.checkout_customizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão de checkout
INSERT INTO public.checkout_customizations (
  banner_text,
  primary_color,
  secondary_color,
  is_active
) VALUES (
  'Transforme seu gabinete com a plataforma mais avançada da política moderna',
  '#6366f1',
  '#f59e0b',
  true
) ON CONFLICT DO NOTHING;