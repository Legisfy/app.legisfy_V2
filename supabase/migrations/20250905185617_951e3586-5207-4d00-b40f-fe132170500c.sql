-- Allow service role to insert profiles (needed for edge functions)
CREATE POLICY "Service role can insert profiles" 
ON public.profiles 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Allow service role to update profiles (needed for edge functions)
CREATE POLICY "Service role can update profiles" 
ON public.profiles 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);