-- Verificar se já existe o usuário admin e criar o perfil
-- Como não podemos inserir diretamente em auth.users, vamos criar
-- uma estrutura para que quando o admin se cadastre, ele seja automaticamente
-- definido como admin da plataforma

-- Primeiro, vamos garantir que temos um email específico para o admin
-- e criar um trigger para identificá-lo quando ele se cadastrar

-- Criar uma tabela para emails de admin pré-autorizados
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamp with time zone default now()
);

-- Inserir o email do admin
INSERT INTO public.admin_emails (email) 
VALUES ('contato.legisfy@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Atualizar a função handle_new_user para detectar emails de admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role text := 'assessor';
BEGIN
  -- Verificar se o email está na lista de admins
  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE email = NEW.email) THEN
    user_role := 'admin_plataforma';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, main_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    user_role::user_role_type
  );
  RETURN NEW;
END;
$$;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();