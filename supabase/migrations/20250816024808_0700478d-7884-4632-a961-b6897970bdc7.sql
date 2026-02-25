-- Allow all authenticated users to view camaras
create policy if not exists "Users can view camaras"
  on public.camaras
  for select
  to authenticated
  using (true);