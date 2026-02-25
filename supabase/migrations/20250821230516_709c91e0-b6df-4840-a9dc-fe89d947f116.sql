-- Criar política para permitir que políticos vejam convites de sua instituição
CREATE POLICY "Politicians can view invitations for their institution" 
ON public.invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.gabinetes g
    WHERE g.id = invitations.institution_id 
    AND g.politico_id = auth.uid()
  )
);