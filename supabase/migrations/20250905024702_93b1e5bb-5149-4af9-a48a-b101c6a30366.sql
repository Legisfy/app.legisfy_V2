-- Atualizar o email não confirmado para o usuário que testou
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now()
WHERE email = 'la5878957@gmail.com' AND email_confirmed_at IS NULL;