-- Corrigir o perfil do usuário guiadoautismo.pt@gmail.com para político
UPDATE public.profiles 
SET main_role = 'politico'::user_role_type 
WHERE user_id = 'b17e80af-1f0b-489d-88b6-2214d54ff4f7';