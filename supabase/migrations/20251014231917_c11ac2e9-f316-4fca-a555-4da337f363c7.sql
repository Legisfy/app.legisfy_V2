-- Add cor column to publicos table
ALTER TABLE public.publicos ADD COLUMN IF NOT EXISTS cor TEXT DEFAULT '#6366f1';