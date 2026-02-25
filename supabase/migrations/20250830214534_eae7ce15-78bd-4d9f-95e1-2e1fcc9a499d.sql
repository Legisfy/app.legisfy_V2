-- Fix the role for contato.legisfy@gmail.com to be admin
UPDATE public.profiles 
SET main_role = 'admin_plataforma'::user_role_type 
WHERE user_id = '47fc3dda-11d9-4375-9765-aa0bceb5d765';