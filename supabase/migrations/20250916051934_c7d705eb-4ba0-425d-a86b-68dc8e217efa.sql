-- Simplify the gabinetes RLS policy to be more direct and reliable

-- Drop the existing policy that uses the function
DROP POLICY IF EXISTS "gabinetes_safe_access" ON public.gabinetes;

-- Create a simple and direct policy that should work reliably
CREATE POLICY "gabinetes_direct_access" 
ON public.gabinetes 
FOR ALL 
USING (
  -- User is the politician/owner of this gabinete
  politico_id = auth.uid() 
  OR
  -- User is a member of this gabinete (direct check without function)
  id IN (
    SELECT gabinete_id 
    FROM public.gabinete_members 
    WHERE user_id = auth.uid()
  )
);

-- Also make sure the profiles table can be accessed
DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
CREATE POLICY "profiles_access"
ON public.profiles
FOR ALL
USING (
  user_id = auth.uid() 
  OR 
  -- Allow viewing profiles of people in the same gabinete
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm1
    JOIN public.gabinete_members gm2 ON gm1.gabinete_id = gm2.gabinete_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.user_id
  )
  OR
  -- Allow politicians to see profiles of their gabinete members
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    JOIN public.gabinete_members gm ON gm.gabinete_id = g.id
    WHERE g.politico_id = auth.uid() AND gm.user_id = profiles.user_id
  )
);