-- Create status events table for indicacoes and enforce strict workflow

-- 1) Alter default status to 'criada'
ALTER TABLE public.indicacoes
ALTER COLUMN status SET DEFAULT 'criada';

-- 2) Create events table
CREATE TABLE IF NOT EXISTS public.indicacao_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicacao_id UUID NOT NULL REFERENCES public.indicacoes(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  pdf_url TEXT,
  protocolo TEXT,
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_indicacao_status_events_indicacao_id ON public.indicacao_status_events(indicacao_id);
CREATE INDEX IF NOT EXISTS idx_indicacao_status_events_created_at ON public.indicacao_status_events(created_at DESC);

-- 3) Enable RLS and policies
ALTER TABLE public.indicacao_status_events ENABLE ROW LEVEL SECURITY;

-- Allow cabinet members to view events of indicacoes in their cabinet
CREATE POLICY "members_select_indicacao_status_events"
ON public.indicacao_status_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.indicacoes i
    WHERE i.id = indicacao_status_events.indicacao_id
      AND user_belongs_to_cabinet(i.gabinete_id)
  )
);

-- Allow cabinet members to insert events for indicacoes in their cabinet; must be the current user
CREATE POLICY "members_insert_indicacao_status_events"
ON public.indicacao_status_events
FOR INSERT
WITH CHECK (
  (user_id = auth.uid()) AND EXISTS (
    SELECT 1 FROM public.indicacoes i
    WHERE i.id = indicacao_status_events.indicacao_id
      AND user_belongs_to_cabinet(i.gabinete_id)
  )
);

-- 4) Validation trigger to enforce order and required attachments
CREATE OR REPLACE FUNCTION public.validate_indicacao_status_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prev_status TEXT;
BEGIN
  -- Normalize status to lowercase
  NEW.status := lower(NEW.status);

  -- Only allow known statuses
  IF NEW.status NOT IN ('criada','formalizada','protocolada','pendente','atendida') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;

  -- Enforce sequence based on last event
  SELECT e.status INTO prev_status
  FROM public.indicacao_status_events e
  WHERE e.indicacao_id = NEW.indicacao_id
  ORDER BY e.created_at DESC
  LIMIT 1;

  IF prev_status IS NULL THEN
    -- First event must be "criada"
    IF NEW.status <> 'criada' THEN
      RAISE EXCEPTION 'Primeiro status deve ser "criada"';
    END IF;
  ELSE
    CASE prev_status
      WHEN 'criada' THEN
        IF NEW.status <> 'formalizada' THEN
          RAISE EXCEPTION 'Após "criada" o próximo status deve ser "formalizada"';
        END IF;
      WHEN 'formalizada' THEN
        IF NEW.status <> 'protocolada' THEN
          RAISE EXCEPTION 'Após "formalizada" o próximo status deve ser "protocolada"';
        END IF;
      WHEN 'protocolada' THEN
        IF NEW.status <> 'pendente' THEN
          RAISE EXCEPTION 'Após "protocolada" o próximo status deve ser "pendente"';
        END IF;
      WHEN 'pendente' THEN
        IF NEW.status <> 'atendida' THEN
          RAISE EXCEPTION 'Após "pendente" o próximo status deve ser "atendida"';
        END IF;
      WHEN 'atendida' THEN
        RAISE EXCEPTION 'Indicação já está finalizada como "atendida"';
    END CASE;
  END IF;

  -- Attachment requirements (commenting out PDF validation for now - they can be added later)
  -- IF NEW.status = 'formalizada' THEN
  --   IF NEW.pdf_url IS NULL OR length(trim(NEW.pdf_url)) = 0 THEN
  --     RAISE EXCEPTION 'Formalização requer anexo de PDF';
  --   END IF;
  -- ELSIF NEW.status = 'protocolada' THEN
  --   IF NEW.pdf_url IS NULL OR length(trim(NEW.pdf_url)) = 0 OR NEW.protocolo IS NULL OR length(trim(NEW.protocolo)) = 0 THEN
  --     RAISE EXCEPTION 'Protocolar requer PDF com protocolo e número do protocolo';
  --   END IF;
  -- END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_indicacao_status_event ON public.indicacao_status_events;
CREATE TRIGGER trg_validate_indicacao_status_event
BEFORE INSERT ON public.indicacao_status_events
FOR EACH ROW
EXECUTE FUNCTION public.validate_indicacao_status_event();

-- 5) Trigger to update indicacoes.status when a new event is inserted
CREATE OR REPLACE FUNCTION public.apply_indicacao_status_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.indicacoes
  SET status = NEW.status, updated_at = now()
  WHERE id = NEW.indicacao_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_indicacao_status_event ON public.indicacao_status_events;
CREATE TRIGGER trg_apply_indicacao_status_event
AFTER INSERT ON public.indicacao_status_events
FOR EACH ROW
EXECUTE FUNCTION public.apply_indicacao_status_event();