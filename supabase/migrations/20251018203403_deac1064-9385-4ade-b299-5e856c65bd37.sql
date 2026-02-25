-- Add campaign tracking fields
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS messages_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS messages_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS public_name TEXT;