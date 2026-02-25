-- Corrigir problemas de segurança nas funções
ALTER FUNCTION public.register_comunicado_metric(uuid, text, inet, text, uuid) 
SET search_path = public, auth;