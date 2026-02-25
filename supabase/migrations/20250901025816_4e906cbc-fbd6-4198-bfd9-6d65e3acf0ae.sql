-- Add missing columns to profiles table for better user data management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS phone_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS sex TEXT;