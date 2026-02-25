-- Create policy to allow politicians to view invitations for their gabinete
CREATE POLICY "Politicians can view invitations for their gabinete"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  institution_id IN (
    SELECT id 
    FROM public.gabinetes 
    WHERE politico_id = auth.uid()
  )
);

-- Also allow chefes de gabinete to view invitations
CREATE POLICY "Cabinet chiefs can view invitations for their gabinete"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  institution_id IN (
    SELECT gabinete_id 
    FROM public.gabinete_members 
    WHERE user_id = auth.uid() 
    AND role IN ('chefe', 'politico')
  )
);