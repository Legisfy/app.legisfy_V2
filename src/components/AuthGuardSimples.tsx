import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/components/AuthProvider";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuardSimples = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuthContext();

  // Debug auth state
  console.log('🛡️ AuthGuardSimples - user:', !!user, 'loading:', loading, 'path:', location.pathname, 'user details:', user?.email);

  if (user) {
    console.log('✅ User authenticated in AuthGuardSimples:', user.email);
  } else {
    console.log('❌ No user in AuthGuardSimples');
  }

  useEffect(() => {
    if (loading) return; // Wait for auth state to be determined

    // IMPORTANTE: Sempre permitir acesso a rotas públicas sem verificação
    const publicPaths = ['/auth', '/reset-password', '/onboarding', '/politico-onboarding', '/convite/aceitar', '/aceitar-convite-equipe', '/admin-auth'];
    if (publicPaths.includes(location.pathname)) {
      console.log('✅ Rota pública permitida:', location.pathname);
      return;
    }

    // Simple redirect logic - no complex database queries
    if (user) {
      // User is authenticated
      const is2FAVerified = localStorage.getItem('2fa_verified') === 'true';
      
      if (!is2FAVerified && location.pathname !== '/auth') {
        console.log('⚠️ Usuário logado mas sem 2FA verificado. Redirecionando para /auth');
        
        // Preservar hash e busca se for recuperação de senha
        const hash = window.location.hash;
        const search = window.location.search;
        const isRecovery = hash.includes('type=recovery') || hash.includes('access_token=') || search.includes('type=recovery');
        
        if (isRecovery) {
          console.log('🚩 Preservando token de recuperação no redirecionamento');
          navigate(`/auth${hash}${search}`);
        } else {
          navigate('/auth');
        }
        return;
      }

      if (is2FAVerified && location.pathname === '/auth') {
        navigate('/dashboard');
      }
    } else {
      // User is not authenticated and trying to access protected route
      console.log('⚠️ Acesso negado, redirecionando para /auth');
      navigate('/auth');
    }
  }, [user, loading, location.pathname, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Render children for public routes or authenticated routes
  const publicPaths = ['/auth', '/onboarding', '/politico-onboarding', '/admin-auth', '/convite/aceitar', '/aceitar-convite-equipe'];
  const is2FAVerified = localStorage.getItem('2fa_verified') === 'true';

  if (publicPaths.includes(location.pathname) || (user && is2FAVerified)) {
    return <>{children}</>;
  }

  // Fallback - should not reach here due to useEffect redirects
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
};

export default AuthGuardSimples;