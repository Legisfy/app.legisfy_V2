-- Allow service role to manage gabinetes (needed for edge functions)
CREATE POLICY "Service role can manage gabinetes" 
ON public.gabinetes 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Allow service role to manage gabinete_members (needed for edge functions)
CREATE POLICY "Service role can manage gabinete_members" 
ON public.gabinete_members 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);