-- Add RLS policies for indicacao_status_events table
-- This will allow users to create and view status events for indicacoes they have access to

-- Enable RLS on the table if not already enabled
ALTER TABLE public.indicacao_status_events ENABLE ROW LEVEL SECURITY;

-- Policy for viewing status events: users can see events for indicacoes in their cabinet
CREATE POLICY "indicacao_status_events_cabinet_read"
ON public.indicacao_status_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.indicacoes i
    WHERE i.id = indicacao_status_events.indicacao_id
    AND (
      -- User owns the indicacao
      i.user_id = auth.uid()
      OR
      -- User is the politician who owns the cabinet
      EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = i.gabinete_id
        AND g.politico_id = auth.uid()
      )
      OR
      -- User is a member of the cabinet
      EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = i.gabinete_id
        AND gm.user_id = auth.uid()
      )
      OR
      -- User is platform admin
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND p.main_role = 'admin_plataforma'
      )
    )
  )
);

-- Policy for creating status events: users can create events for indicacoes in their cabinet
CREATE POLICY "indicacao_status_events_cabinet_insert"
ON public.indicacao_status_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.indicacoes i
    WHERE i.id = indicacao_status_events.indicacao_id
    AND (
      -- User owns the indicacao
      i.user_id = auth.uid()
      OR
      -- User is the politician who owns the cabinet
      EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = i.gabinete_id
        AND g.politico_id = auth.uid()
      )
      OR
      -- User is a member of the cabinet
      EXISTS (
        SELECT 1 FROM public.gabinete_members gm
        WHERE gm.gabinete_id = i.gabinete_id
        AND gm.user_id = auth.uid()
      )
      OR
      -- User is platform admin
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND p.main_role = 'admin_plataforma'
      )
    )
  )
);

-- Policy for updating status events (in case needed)
CREATE POLICY "indicacao_status_events_cabinet_update"
ON public.indicacao_status_events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.indicacoes i
    WHERE i.id = indicacao_status_events.indicacao_id
    AND (
      -- User created the event
      indicacao_status_events.user_id = auth.uid()
      OR
      -- User is the politician who owns the cabinet
      EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = i.gabinete_id
        AND g.politico_id = auth.uid()
      )
      OR
      -- User is platform admin
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND p.main_role = 'admin_plataforma'
      )
    )
  )
);