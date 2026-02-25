-- Create demand status events table (similar to indicacao_status_events)
CREATE TABLE IF NOT EXISTS public.demanda_status_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demanda_id UUID NOT NULL REFERENCES public.demandas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'em_andamento', 'resolvida', 'cancelada')),
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  new_deadline DATE
);

-- Enable RLS
ALTER TABLE public.demanda_status_events ENABLE ROW LEVEL SECURITY;

-- Create policies for demanda_status_events
CREATE POLICY "members_select_demanda_status_events" 
ON public.demanda_status_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.demandas d 
    WHERE d.id = demanda_status_events.demanda_id 
    AND user_belongs_to_cabinet(d.gabinete_id)
  )
);

CREATE POLICY "members_insert_demanda_status_events" 
ON public.demanda_status_events 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.demandas d 
    WHERE d.id = demanda_status_events.demanda_id 
    AND user_belongs_to_cabinet(d.gabinete_id)
  )
);

-- Create function to apply demanda status changes
CREATE OR REPLACE FUNCTION public.apply_demanda_status_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update demanda status and deadline if provided
  UPDATE public.demandas
  SET 
    status = NEW.status, 
    updated_at = now(),
    data_limite = COALESCE(NEW.new_deadline, data_limite)
  WHERE id = NEW.demanda_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to apply status changes
CREATE TRIGGER apply_demanda_status_event_trigger
AFTER INSERT ON public.demanda_status_events
FOR EACH ROW
EXECUTE FUNCTION public.apply_demanda_status_event();

-- Create function to validate demanda status transitions
CREATE OR REPLACE FUNCTION public.validate_demanda_status_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  prev_status TEXT;
BEGIN
  -- Normalize status to lowercase
  NEW.status := lower(NEW.status);

  -- Only allow known statuses
  IF NEW.status NOT IN ('pendente','em_andamento','resolvida','cancelada') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;

  -- Get the current status from demandas table
  SELECT status INTO prev_status
  FROM public.demandas
  WHERE id = NEW.demanda_id;

  -- Allow any transition except from resolvida/cancelada to other status
  IF prev_status IN ('resolvida', 'cancelada') AND NEW.status != prev_status THEN
    RAISE EXCEPTION 'Não é possível alterar status de uma demanda % para %', prev_status, NEW.status;
  END IF;

  -- If status changes to em_andamento, ensure there's at least one update
  IF NEW.status = 'em_andamento' AND (NEW.notes IS NULL OR length(trim(NEW.notes)) = 0) THEN
    RAISE EXCEPTION 'Para colocar em andamento, adicione uma atualização/comentário';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to validate status changes
CREATE TRIGGER validate_demanda_status_event_trigger
BEFORE INSERT ON public.demanda_status_events
FOR EACH ROW
EXECUTE FUNCTION public.validate_demanda_status_event();

-- Create function to auto-revert demands to pendente after 48h without updates
CREATE OR REPLACE FUNCTION public.auto_revert_stale_demandas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update demandas that have been em_andamento for 48h without updates and no deadline
  UPDATE public.demandas d
  SET status = 'pendente', updated_at = now()
  WHERE d.status = 'em_andamento'
    AND d.data_limite IS NULL
    AND d.updated_at < now() - INTERVAL '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.demanda_status_events dse
      WHERE dse.demanda_id = d.id
        AND dse.created_at > now() - INTERVAL '48 hours'
    );
END;
$$;