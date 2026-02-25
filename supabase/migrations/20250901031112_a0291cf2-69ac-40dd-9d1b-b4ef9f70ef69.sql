-- Fix avatar URL for Letícia Amorim
UPDATE public.profiles 
SET avatar_url = 'https://akjqsuqghyeioledglng.supabase.co/storage/v1/object/public/avatars/a470b3a0-7fa5-4bc0-8abc-56c26ed56725.png', 
    updated_at = now() 
WHERE user_id = 'a470b3a0-7fa5-4bc0-8abc-56c26ed56725';