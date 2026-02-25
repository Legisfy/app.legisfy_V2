-- Add audience type fields to campaigns
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT 'publico' CHECK (audience_type IN ('publico', 'tag')),
ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES public.eleitor_tags(id) ON DELETE SET NULL;