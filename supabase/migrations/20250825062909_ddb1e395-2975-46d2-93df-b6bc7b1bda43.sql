-- Criar tabela para modelos de documentos do gabinete
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'indicacao', 'oficio', 'requerimento', etc
  original_pdf_url TEXT NOT NULL, -- URL do PDF modelo original
  template_analysis JSONB, -- Análise da IA dos campos fixos e variáveis
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Adicionar RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Gabinete members can view templates" 
ON public.document_templates 
FOR SELECT 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Gabinete members can create templates" 
ON public.document_templates 
FOR INSERT 
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND created_by = auth.uid());

CREATE POLICY "Gabinete members can update templates" 
ON public.document_templates 
FOR UPDATE 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Gabinete members can delete templates" 
ON public.document_templates 
FOR DELETE 
USING (user_belongs_to_cabinet(gabinete_id));

-- Trigger para updated_at
CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON public.document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para logs de geração de documentos
CREATE TABLE public.document_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.document_templates(id),
  gabinete_id UUID NOT NULL,
  related_entity_type TEXT, -- 'indicacao', 'demanda', etc
  related_entity_id UUID,
  variables_used JSONB NOT NULL, -- Variáveis que foram substituídas
  generated_pdf_url TEXT NOT NULL,
  generation_status TEXT NOT NULL DEFAULT 'success', -- 'success', 'error'
  error_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- RLS para document_generations
ALTER TABLE public.document_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gabinete members can view generations" 
ON public.document_generations 
FOR SELECT 
USING (user_belongs_to_cabinet(gabinete_id));

CREATE POLICY "Users can create generations" 
ON public.document_generations 
FOR INSERT 
WITH CHECK (user_belongs_to_cabinet(gabinete_id) AND created_by = auth.uid());