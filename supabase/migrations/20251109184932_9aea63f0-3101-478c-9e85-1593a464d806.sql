
-- Drop existing INSERT policy
DROP POLICY IF EXISTS "demanda_status_events_write" ON public.demanda_status_events;

-- Create simplified INSERT policy using helper function
CREATE POLICY "demanda_status_events_write" 
ON public.demanda_status_events
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.demandas d
    WHERE d.id = demanda_status_events.demanda_id
    AND public.user_has_cabinet_access(d.gabinete_id)
  )
);

-- Also update the UPDATE and DELETE policies to use the same pattern
DROP POLICY IF EXISTS "demanda_status_events_update" ON public.demanda_status_events;

CREATE POLICY "demanda_status_events_update" 
ON public.demanda_status_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.demandas d
    WHERE d.id = demanda_status_events.demanda_id
    AND public.user_has_cabinet_access(d.gabinete_id)
  )
);

DROP POLICY IF EXISTS "demanda_status_events_delete" ON public.demanda_status_events;

CREATE POLICY "demanda_status_events_delete" 
ON public.demanda_status_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.demandas d
    WHERE d.id = demanda_status_events.demanda_id
    AND public.user_has_cabinet_access(d.gabinete_id)
  )
);
