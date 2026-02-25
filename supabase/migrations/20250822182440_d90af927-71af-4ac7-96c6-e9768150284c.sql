-- Modificar tabela comunicados para suportar novas funcionalidades
-- Adicionar colunas para tipo de conteúdo, filtros e métricas

-- Adicionar enum para tipos de conteúdo
CREATE TYPE comunicado_type AS ENUM ('texto', 'banner');

-- Adicionar enum para tipos de usuário alvo
CREATE TYPE user_role_target AS ENUM ('politico', 'chefe_gabinete', 'assessor', 'todos');

-- Modificar tabela comunicados
ALTER TABLE public.comunicados 
ADD COLUMN tipo comunicado_type DEFAULT 'texto',
ADD COLUMN target_institution_id uuid REFERENCES public.camaras(id),
ADD COLUMN target_user_roles user_role_target[] DEFAULT '{todos}',
ADD COLUMN banner_width integer,
ADD COLUMN banner_height integer,
ADD COLUMN data_inicio_hora time,
ADD COLUMN data_fim_hora time,
ADD COLUMN total_clicks integer DEFAULT 0,
ADD COLUMN total_views integer DEFAULT 0;

-- Remover coluna prioridade (conforme solicitado)
ALTER TABLE public.comunicados DROP COLUMN IF EXISTS prioridade;

-- Criar tabela para métricas detalhadas de cliques
CREATE TABLE IF NOT EXISTS public.comunicado_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id uuid NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL CHECK (action_type IN ('view', 'click')),
  timestamp timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text,
  gabinete_id uuid REFERENCES public.gabinetes(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela de métricas
ALTER TABLE public.comunicado_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para comunicado_metrics
CREATE POLICY "Platform admins can manage comunicado metrics"
ON public.comunicado_metrics
FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Users can insert their own metrics"
ON public.comunicado_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Criar função para registrar métricas
CREATE OR REPLACE FUNCTION public.register_comunicado_metric(
  p_comunicado_id uuid,
  p_action_type text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_gabinete_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir métrica
  INSERT INTO public.comunicado_metrics (
    comunicado_id, 
    user_id, 
    action_type, 
    ip_address, 
    user_agent,
    gabinete_id
  ) VALUES (
    p_comunicado_id, 
    auth.uid(), 
    p_action_type, 
    p_ip_address, 
    p_user_agent,
    p_gabinete_id
  );
  
  -- Atualizar contadores na tabela principal
  IF p_action_type = 'click' THEN
    UPDATE public.comunicados 
    SET total_clicks = total_clicks + 1 
    WHERE id = p_comunicado_id;
  ELSIF p_action_type = 'view' THEN
    UPDATE public.comunicados 
    SET total_views = total_views + 1 
    WHERE id = p_comunicado_id;
  END IF;
END;
$$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_comunicado_metrics_comunicado_id ON public.comunicado_metrics(comunicado_id);
CREATE INDEX IF NOT EXISTS idx_comunicado_metrics_timestamp ON public.comunicado_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_comunicados_target_institution ON public.comunicados(target_institution_id);
CREATE INDEX IF NOT EXISTS idx_comunicados_tipo ON public.comunicados(tipo);