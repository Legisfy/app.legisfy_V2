-- Add new admin email to the admin_emails table
INSERT INTO public.admin_emails (email) VALUES ('carlosgabriel.camppos@gmail.com')
ON CONFLICT (email) DO NOTHING;