-- Create migration to add gabinete assignments to plans and payment tracking (corrected)

-- Add subscription tracking columns to gabinetes table
ALTER TABLE public.gabinetes 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'active';

-- Create payment history table
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'completed',
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for payment history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies for payment history
CREATE POLICY "Gabinete members can view payment history" ON public.payment_history
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.gabinetes g
      WHERE g.id = payment_history.gabinete_id 
      AND (g.politico_id = auth.uid() OR user_belongs_to_cabinet(g.id))
    )
  );

CREATE POLICY "Platform admins can manage payment history" ON public.payment_history
  FOR ALL 
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Create function to calculate subscription dates
CREATE OR REPLACE FUNCTION calculate_subscription_dates(
  start_date TIMESTAMPTZ,
  billing_cycle TEXT DEFAULT 'monthly'
) RETURNS TABLE (
  end_date TIMESTAMPTZ,
  next_payment TIMESTAMPTZ
) AS $$
BEGIN
  IF billing_cycle = 'yearly' THEN
    RETURN QUERY SELECT 
      start_date + INTERVAL '1 year' as end_date,
      start_date + INTERVAL '1 year' as next_payment;
  ELSE
    RETURN QUERY SELECT 
      start_date + INTERVAL '1 month' as end_date,
      start_date + INTERVAL '1 month' as next_payment;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update subscription dates when plan is assigned
CREATE OR REPLACE FUNCTION update_subscription_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update subscription dates when a plan is assigned
  IF NEW.plan_id IS NOT NULL AND (OLD.plan_id IS NULL OR OLD.plan_id != NEW.plan_id) THEN
    NEW.subscription_start_date = COALESCE(NEW.subscription_start_date, now());
    
    -- Calculate subscription end date (default to monthly)
    SELECT end_date, next_payment
    INTO NEW.subscription_end_date, NEW.next_payment_date
    FROM calculate_subscription_dates(NEW.subscription_start_date, 'monthly');
    
    NEW.payment_status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update subscription dates
DROP TRIGGER IF EXISTS update_gabinete_subscription_dates ON public.gabinetes;
CREATE TRIGGER update_gabinete_subscription_dates
  BEFORE UPDATE ON public.gabinetes
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_dates();