-- Create secure RPC to check admin email without exposing table
create or replace function public.is_admin_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails where lower(email) = lower(p_email)
  );
$$;

-- Ensure proper execute permissions
revoke all on function public.is_admin_email(text) from public;
grant execute on function public.is_admin_email(text) to anon, authenticated;