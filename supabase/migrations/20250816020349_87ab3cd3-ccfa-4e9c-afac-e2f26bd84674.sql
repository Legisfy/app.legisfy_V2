-- Autorizar email para admin
INSERT INTO admin_emails (email) 
VALUES ('contato.legisfy@gmail.com')
ON CONFLICT (email) DO NOTHING;