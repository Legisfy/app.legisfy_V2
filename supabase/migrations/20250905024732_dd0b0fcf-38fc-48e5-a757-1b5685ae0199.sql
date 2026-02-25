-- Atualizar apenas o email_confirmed_at (confirmed_at é gerado automaticamente)
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'la5878957@gmail.com' AND email_confirmed_at IS NULL;