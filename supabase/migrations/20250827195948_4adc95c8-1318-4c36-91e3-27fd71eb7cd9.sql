-- Create function to get user emails for admin
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
  SELECT email FROM auth.users WHERE id = user_id;
$function$;