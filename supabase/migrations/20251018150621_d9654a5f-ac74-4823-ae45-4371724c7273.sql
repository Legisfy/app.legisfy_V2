-- Create enum for campaign frequency
CREATE TYPE campaign_frequency AS ENUM ('once', 'recurring');

-- Create table for campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  public_id UUID REFERENCES public.publicos(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  frequency campaign_frequency NOT NULL DEFAULT 'once',
  scheduled_date TIMESTAMPTZ,
  recurring_days INTEGER[], -- Days of week: 0=Sunday, 1=Monday, etc.
  recurring_time TIME,
  recurring_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "campaigns_cabinet_access"
ON public.campaigns
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = campaigns.gabinete_id
    AND g.politico_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.gabinete_members gm
    WHERE gm.gabinete_id = campaigns.gabinete_id
    AND gm.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better query performance
CREATE INDEX idx_campaigns_gabinete ON public.campaigns(gabinete_id);
CREATE INDEX idx_campaigns_public ON public.campaigns(public_id);