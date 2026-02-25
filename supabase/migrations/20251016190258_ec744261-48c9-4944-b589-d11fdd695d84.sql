-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback_ouvidoria;
DROP POLICY IF EXISTS "Users can read their own feedback" ON public.feedback_ouvidoria;
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.feedback_ouvidoria;

-- Recreate policies with proper permissions
-- Allow ANY authenticated user to insert feedback (no restrictions)
CREATE POLICY "authenticated_users_can_insert_feedback"
ON public.feedback_ouvidoria
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read all feedback
CREATE POLICY "authenticated_users_can_read_feedback"
ON public.feedback_ouvidoria
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to update and delete feedback
CREATE POLICY "admins_can_manage_feedback"
ON public.feedback_ouvidoria
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND main_role = 'admin_plataforma'
  )
);