-- Allow all authenticated users to view camaras
DROP POLICY IF EXISTS "Users can view camaras" ON public.camaras;

CREATE POLICY "Users can view camaras"
  ON public.camaras
  FOR SELECT
  TO authenticated
  USING (true);