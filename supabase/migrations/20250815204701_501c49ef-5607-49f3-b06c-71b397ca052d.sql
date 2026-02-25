-- Criar perfil de admin do sistema diretamente na tabela profiles
-- Primeiro, vamos criar um ID específico para o admin
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Gerar um UUID específico para o admin
    admin_user_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
    
    -- Inserir ou atualizar o perfil de admin
    INSERT INTO public.profiles (
        user_id,
        full_name,
        main_role,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'Administrador do Sistema',
        'admin_plataforma',
        now(),
        now()
    ) ON CONFLICT (user_id) DO UPDATE SET
        main_role = 'admin_plataforma',
        full_name = 'Administrador do Sistema';
        
END $$;

-- Garantir que a função is_platform_admin funcione corretamente
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  );
$$;