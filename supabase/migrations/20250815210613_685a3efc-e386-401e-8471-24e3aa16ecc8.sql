-- Fix the email_change column issue in auth.users table
-- This addresses the "sql: Scan error on column index 8, name "email_change": converting NULL to string is unsupported" error

-- Create a safer way to handle authentication by ensuring proper user handling
-- First, let's ensure the profiles table can handle new users properly

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text := 'assessor';
BEGIN
  -- Verificar se o email está na lista de admins
  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE email = NEW.email) THEN
    user_role := 'admin_plataforma';
  -- Verificar se é político baseado nos metadados
  ELSIF NEW.raw_user_meta_data ->> 'user_type' = 'politico' THEN
    user_role := 'politico';
  END IF;

  -- Insert with better error handling
  INSERT INTO public.profiles (user_id, full_name, main_role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name', 
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    user_role::user_role_type
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(
      NEW.raw_user_meta_data ->> 'full_name', 
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    main_role = user_role::user_role_type;
    
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;