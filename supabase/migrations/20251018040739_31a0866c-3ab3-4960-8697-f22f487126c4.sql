-- Drop the old restrictive policy
DROP POLICY IF EXISTS "demanda_status_events_cabinet_access" ON public.demanda_status_events;

-- Create new read policy for all cabinet members
CREATE POLICY "demanda_status_events_read"
ON public.demanda_status_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.demandas d
    WHERE d.id = demanda_status_events.demanda_id
    AND (
      -- User is the politician (owner of the cabinet)
      EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = d.gabinete_id AND g.politico_id = auth.uid()
      )
      OR
      -- User is a member of the cabinet
      EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = d.gabinete_id AND gm.user_id = auth.uid()
      )
      OR
      -- User is the owner of the demand
      d.owner_user_id = auth.uid()
    )
  )
);

-- Create new write policy for all cabinet members
CREATE POLICY "demanda_status_events_write"
ON public.demanda_status_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.demandas d
    WHERE d.id = demanda_status_events.demanda_id
    AND (
      -- User is the politician (owner of the cabinet)
      EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = d.gabinete_id AND g.politico_id = auth.uid()
      )
      OR
      -- User is a member of the cabinet
      EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = d.gabinete_id AND gm.user_id = auth.uid()
      )
    )
  )
);

-- Allow updates and deletes for cabinet members
CREATE POLICY "demanda_status_events_update"
ON public.demanda_status_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.demandas d
    WHERE d.id = demanda_status_events.demanda_id
    AND (
      EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = d.gabinete_id AND g.politico_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = d.gabinete_id AND gm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "demanda_status_events_delete"
ON public.demanda_status_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.demandas d
    WHERE d.id = demanda_status_events.demanda_id
    AND (
      EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = d.gabinete_id AND g.politico_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = d.gabinete_id AND gm.user_id = auth.uid()
      )
    )
  )
);