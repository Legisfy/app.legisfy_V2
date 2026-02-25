-- Fix the INSERT policy for demanda_status_events
-- The issue is that WITH CHECK cannot reference the table being inserted into with table prefix

DROP POLICY IF EXISTS "demanda_status_events_write" ON public.demanda_status_events;

CREATE POLICY "demanda_status_events_write" 
ON public.demanda_status_events
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.demandas d
    WHERE d.id = demanda_id
    AND public.user_has_cabinet_access(d.gabinete_id)
  )
);

-- Also fix UPDATE and DELETE policies to be consistent
DROP POLICY IF EXISTS "demanda_status_events_update" ON public.demanda_status_events;

CREATE POLICY "demanda_status_events_update" 
ON public.demanda_status_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.demandas d
    WHERE d.id = demanda_id
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
    WHERE d.id = demanda_id
    AND public.user_has_cabinet_access(d.gabinete_id)
  )
);