-- Modificar função de validação para permitir primeiro evento em indicações existentes
CREATE OR REPLACE FUNCTION public.validate_indicacao_status_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  prev_status TEXT;
  current_indicacao_status TEXT;
BEGIN
  -- Normalize status to lowercase
  NEW.status := lower(NEW.status);

  -- Only allow known statuses
  IF NEW.status NOT IN ('criada','formalizada','protocolada','pendente','atendida') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;

  -- Get the current status from indicacoes table
  SELECT status INTO current_indicacao_status
  FROM public.indicacoes
  WHERE id = NEW.indicacao_id;

  -- Get the last event status if any
  SELECT e.status INTO prev_status
  FROM public.indicacao_status_events e
  WHERE e.indicacao_id = NEW.indicacao_id
  ORDER BY e.created_at DESC
  LIMIT 1;

  -- If no previous events exist, check if this matches the current indicacao status
  -- This handles legacy indicacoes that were created before the event system
  IF prev_status IS NULL THEN
    -- If the indicacao already has a status and we're creating the first event,
    -- allow any status that makes sense for progression
    IF current_indicacao_status IS NOT NULL THEN
      -- Allow creating events for existing indicacoes regardless of current status
      -- This is to handle legacy data
      RETURN NEW;
    ELSE
      -- For brand new indicacoes, first event must be "criada"
      IF NEW.status <> 'criada' THEN
        RAISE EXCEPTION 'Primeiro status deve ser "criada"';
      END IF;
    END IF;
  ELSE
    -- Validate status progression based on previous event
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

  RETURN NEW;
END;
$function$;