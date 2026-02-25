-- Create triggers to auto-confirm authorized users and create profiles on user signup
-- SAFETY: Drop if exist first
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to auto-confirm emails for pre-authorized users (admins or politicians)
CREATE TRIGGER on_auth_user_created_auto_confirm
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_authorized_users();

-- Trigger to create/update public.profiles on user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();