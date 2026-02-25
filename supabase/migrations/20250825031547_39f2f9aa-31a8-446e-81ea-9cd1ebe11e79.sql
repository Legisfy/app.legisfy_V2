-- Fix check constraint to accept new status name
ALTER TABLE public.demanda_status_events DROP CONSTRAINT IF EXISTS demanda_status_events_status_check;

ALTER TABLE public.demanda_status_events
  ADD CONSTRAINT demanda_status_events_status_check
  CHECK (status IN ('pendente','em_atendimento','em_andamento','resolvida','cancelada'));

-- Optional: keep a normalized view using trigger already updated; no data changes needed