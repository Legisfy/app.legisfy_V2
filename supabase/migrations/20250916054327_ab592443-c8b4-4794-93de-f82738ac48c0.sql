-- Corrigir search_path das funções que não têm set search_path definido
-- Isso resolve o warning de security linter

-- Atualizar função is_platform_admin para incluir search_path
CREATE OR REPLACE FUNCTION public.is_platform_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'::user_role_type
  );
$function$;

-- Atualizar função user_can_access_gabinete para incluir search_path
CREATE OR REPLACE FUNCTION public.user_can_access_gabinete(target_gabinete_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    -- Check if user is the politician (owner)
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = target_gabinete_id 
    AND g.politico_id = auth.uid()
  ) OR EXISTS (
    -- Check if user is a member
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = target_gabinete_id 
    AND gm.user_id = auth.uid()
  );
$function$;