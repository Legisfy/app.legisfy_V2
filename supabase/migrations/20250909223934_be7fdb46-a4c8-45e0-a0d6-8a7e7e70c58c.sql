-- Criar tabela de contratos
CREATE TABLE public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  politico_id UUID NOT NULL,
  responsavel_id UUID NOT NULL,
  valor_mensal DECIMAL(10,2) NOT NULL,
  valor_anual DECIMAL(10,2),
  recorrencia TEXT NOT NULL DEFAULT 'mensal' CHECK (recorrencia IN ('mensal', 'anual')),
  data_vencimento DATE NOT NULL,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'cancelado', 'trial')),
  anexo_pdf_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Criar tabela de atualizações de contratos
CREATE TABLE public.contrato_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  novo_valor_mensal DECIMAL(10,2),
  novo_valor_anual DECIMAL(10,2),
  novo_plan_id UUID,
  novo_anexo_pdf_url TEXT,
  data_atualizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes_update TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_updates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contratos
CREATE POLICY "Platform admins can manage contracts"
ON public.contratos FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Gabinete members can view contracts"
ON public.contratos FOR SELECT
USING (user_belongs_to_cabinet(gabinete_id));

-- Políticas RLS para atualizações de contratos
CREATE POLICY "Platform admins can manage contract updates"
ON public.contrato_updates FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Gabinete members can view contract updates"
ON public.contrato_updates FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.contratos c 
  WHERE c.id = contrato_updates.contrato_id 
  AND user_belongs_to_cabinet(c.gabinete_id)
));

-- Trigger para updated_at
CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Índices para performance
CREATE INDEX idx_contratos_gabinete_id ON public.contratos(gabinete_id);
CREATE INDEX idx_contratos_politico_id ON public.contratos(politico_id);
CREATE INDEX idx_contratos_plan_id ON public.contratos(plan_id);
CREATE INDEX idx_contrato_updates_contrato_id ON public.contrato_updates(contrato_id);