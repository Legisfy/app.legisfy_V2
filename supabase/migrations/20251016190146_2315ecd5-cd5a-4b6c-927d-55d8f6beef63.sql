-- Enable RLS on feedback_ouvidoria if not already enabled
ALTER TABLE public.feedback_ouvidoria ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.feedback_ouvidoria
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to read their own feedback
CREATE POLICY "Users can read their own feedback"
ON public.feedback_ouvidoria
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to read and update all feedback
CREATE POLICY "Admins can manage all feedback"
ON public.feedback_ouvidoria
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND main_role = 'admin_plataforma'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND main_role = 'admin_plataforma'
  )
);