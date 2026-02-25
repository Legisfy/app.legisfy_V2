-- Update validate_demanda_status_event to accept 'em_atendimento' and normalize from 'em_andamento'
CREATE OR REPLACE FUNCTION public.validate_demanda_status_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  prev_status TEXT;
BEGIN
  -- Normalize to lowercase
  NEW.status := lower(NEW.status);

  -- Backward compatibility: map old status to the new one
  IF NEW.status = 'em_andamento' THEN
    NEW.status := 'em_atendimento';
  END IF;

  -- Only allow known statuses
  IF NEW.status NOT IN ('pendente','em_atendimento','resolvida','cancelada') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;

  -- Get the current status from demandas table
  SELECT status INTO prev_status
  FROM public.demandas
  WHERE id = NEW.demanda_id;

  -- Allow any transition except from resolvida/cancelada to other status
  IF prev_status IN ('resolvida', 'cancelada') AND NEW.status <> prev_status THEN
    RAISE EXCEPTION 'Não é possível alterar status de uma demanda % para %', prev_status, NEW.status;
  END IF;

  -- If status changes to em_atendimento, ensure there's at least one update
  IF NEW.status = 'em_atendimento' AND (NEW.notes IS NULL OR length(btrim(NEW.notes)) = 0) THEN
    RAISE EXCEPTION 'Para colocar em atendimento, adicione uma atualização/comentário';
  END IF;

  RETURN NEW;
END;
$function$;

-- Also normalize in apply_demanda_status_event for consistency
CREATE OR REPLACE FUNCTION public.apply_demanda_status_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Normalize to lowercase and map legacy value
  NEW.status := lower(NEW.status);
  IF NEW.status = 'em_andamento' THEN
    NEW.status := 'em_atendimento';
  END IF;

  -- Update demanda status and deadline if provided
  UPDATE public.demandas
  SET 
    status = NEW.status, 
    updated_at = now(),
    data_limite = COALESCE(NEW.new_deadline, data_limite)
  WHERE id = NEW.demanda_id;
  
  RETURN NEW;
END;
$function$;