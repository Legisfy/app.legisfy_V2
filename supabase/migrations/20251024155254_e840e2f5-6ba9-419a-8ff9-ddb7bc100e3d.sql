-- Add temporary open policy for publicos (like eleitores has)
DROP POLICY IF EXISTS "temp_open_authenticated_all" ON public.publicos;

CREATE POLICY "temp_open_authenticated_all"
ON public.publicos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);