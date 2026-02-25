-- Criar trigger para validar eventos de status de indicação
DROP TRIGGER IF EXISTS validate_indicacao_status_event_trigger ON public.indicacao_status_events;
CREATE TRIGGER validate_indicacao_status_event_trigger
  BEFORE INSERT ON public.indicacao_status_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_indicacao_status_event();

-- Criar trigger para aplicar status de indicação
DROP TRIGGER IF EXISTS apply_indicacao_status_event_trigger ON public.indicacao_status_events;
CREATE TRIGGER apply_indicacao_status_event_trigger
  AFTER INSERT ON public.indicacao_status_events
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_indicacao_status_event();