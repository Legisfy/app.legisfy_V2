import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  cabinet: {
    cabinet_id: string;
    cabinet_name: string;
    city_name?: string;
    institution_name?: string;
    politician_name?: string;
    user_role: string;
  } | null;
  cabinetLoading: boolean;
  isExonerated: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<any>;
  signUp: (email: string, password: string, metadata?: any) => Promise<any>;
  signOut: () => Promise<any>;
  deleteAccount: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [cabinet, setCabinet] = useState<{
    cabinet_id: string;
    cabinet_name: string;
    city_name?: string;
    institution_name?: string;
    politician_name?: string;
    user_role: string;
  } | null>(null);
  const [cabinetLoading, setCabinetLoading] = useState(true);
  const [isExonerated, setIsExonerated] = useState(false);

  // Auth methods
  const signIn = async (email: string, password: string, captchaToken?: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔐 SignIn attempt:', { email: normalizedEmail });

    const signInOptions: any = {
      email: normalizedEmail,
      password,
    };

    if (captchaToken) {
      signInOptions.options = { captchaToken };
    }

    const { data, error } = await supabase.auth.signInWithPassword(signInOptions);

    console.log('🔐 SignIn result:', {
      user: data?.user?.id,
      session: !!data?.session,
      email_confirmed: data?.user?.email_confirmed_at,
      error: error?.message,
      error_code: error?.['status'],
      error_name: error?.['name']
    });

    // Não realizar nenhum reset automático de senha por segurança.
    // Apenas retornar o erro para que o usuário utilize "Esqueci minha senha" quando necessário.

    return { data, error };
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const normalizedEmail = email.toLowerCase().trim();
    const redirectUrl = `${window.location.origin}/auth-callback`;

    console.log('📧 SignUp - configurações:', {
      email: normalizedEmail,
      redirectUrl,
      metadata
    });

    // Criar a conta (sem exigir confirmação por email)
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });

    console.log('📧 SignUp result:', {
      user: data?.user?.id,
      email_confirmed: data?.user?.email_confirmed_at,
      error: error?.message
    });

    // Confirmar automaticamente o usuário e efetuar login
    if (!error && data.user) {
      try {
        console.log('🔓 Confirmando usuário via função admin-auto-confirm-user');
        const { error: confirmError } = await supabase.functions.invoke('admin-auto-confirm-user', {
          body: { user_id: data.user.id }
        });
        if (confirmError) {
          console.error('❌ Erro ao confirmar automaticamente:', confirmError);
          // Continue regardless of confirmation error
        } else {
          console.log('✅ Usuário confirmado automaticamente');
        }

        // Tentar login após signup independente da confirmação
        const { error: loginAfterSignupError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
          options: {
            captchaToken: metadata?.captchaToken
          }
        });
        if (loginAfterSignupError) {
          console.error('❌ Erro no login automático pós-signup:', loginAfterSignupError);
          console.log('💡 Usuário pode fazer login manual na tela de login');
        } else {
          console.log('✅ Login automático realizado com sucesso');
        }
      } catch (confirmError) {
        console.error('❌ Erro ao confirmar usuário automaticamente:', confirmError);
        // Não bloquear o cadastro por causa do erro de confirmação
      }
    }

    // Compatibilidade com a tela atual: tratamos como pré-autorizado para evitar bloqueios
    return { data, error, isPreAuthorized: true };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    localStorage.removeItem('2fa_verified');
    setIsExonerated(false); // Reset exoneration state
    return { error };
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user to delete');

      const userIdToDelete = user.id;

      // Primeiro força logout para limpar sessão local
      console.log('🔓 Fazendo logout antes de deletar conta...');
      await supabase.auth.signOut();

      // Reset estados locais imediatamente
      setUser(null);
      setSession(null);
      setCabinet(null);
      setIsExonerated(false);

      // Então deleta a conta do servidor
      console.log('🗑️ Deletando conta do servidor...');
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { user_id: userIdToDelete }
      });

      if (error) {
        console.error('❌ Erro ao deletar conta no servidor:', error);
        throw error;
      }

      console.log('✅ Conta deletada com sucesso');
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting account:', error);

      // Força logout mesmo em caso de erro para garantir segurança
      try {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setCabinet(null);
        setIsExonerated(false);
      } catch (logoutError) {
        console.error('Error during forced logout:', logoutError);
      }

      return { error };
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    console.log('🔄 AuthProvider - Initializing auth state listener');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log('🔔 Auth state change:', event, 'Session exists:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Reset exoneration state on sign out
        if (!session) {
          setIsExonerated(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      console.log('📱 Initial session check:', !!session);
      if (error) {
        console.error('❌ Session check error:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      console.log('🧹 AuthProvider - Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Cabinet management
  useEffect(() => {
    if (!user) {
      setCabinet(null);
      setCabinetLoading(false);
      setIsExonerated(false);
      return;
    }

    let isMounted = true;

    const fetchActiveCabinet = async () => {
      try {
        setCabinetLoading(true);
        console.log('AuthProvider - Fetching cabinet for user:', user.id);

        // Clear any stale cache when fetching fresh
        localStorage.removeItem('active_cabinet_id');

        // 1. Try RPC first (reliable and fast)
        let cabinetData = null;
        try {
          // Explicitly cast supabase to any to avoid type issues with new RPCs
          const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_active_cabinet_with_correct_name');
          if (!rpcError && rpcData && rpcData.length > 0) {
            cabinetData = rpcData[0];
          } else {
            const { data: oldRpcData, error: oldRpcError } = await (supabase as any).rpc('get_active_cabinet');
            if (!oldRpcError && oldRpcData && oldRpcData.length > 0) {
              cabinetData = oldRpcData[0];
            }
          }
        } catch (e) {
          console.warn('RPC calls failed:', e);
        }

        if (!isMounted) return;

        if (cabinetData) {
          setCabinet({
            cabinet_id: cabinetData.cabinet_id,
            cabinet_name: cabinetData.cabinet_name,
            city_name: cabinetData.cabinet_city || cabinetData.city_name,
            institution_name: cabinetData.institution_name || cabinetData.camara_name || cabinetData.cabinet_city || cabinetData.city_name,
            politician_name: cabinetData.politician_name,
            user_role: cabinetData.user_role
          });
          localStorage.setItem('active_cabinet_id', cabinetData.cabinet_id);
          console.log('AuthProvider - Cabinet set from RPC:', cabinetData);
          setIsExonerated(false);
          return;
        }

        console.log('AuthProvider - RPCs failed, using fallback queries');

        // 2. Fallback: Politician Check
        const { data: gabineteData } = await supabase
          .from('gabinetes')
          .select(`
            id, 
            nome,
            camaras (
              nome,
              tipo,
              cidades (nome)
            )
          `)
          .eq('politico_id', user.id)
          .eq('status', 'ativo')
          .maybeSingle();

        if (!isMounted) return;

        if (gabineteData) {
          const camara: any = Array.isArray(gabineteData.camaras) ? gabineteData.camaras[0] : gabineteData.camaras;
          const cityName = camara?.cidades?.nome;
          const camaraName = camara?.nome;

          setCabinet({
            cabinet_id: gabineteData.id,
            cabinet_name: gabineteData.nome,
            city_name: cityName,
            institution_name: camaraName || (cityName ? `Câmara Municipal de ${cityName}` : undefined),
            user_role: 'politico'
          });
          localStorage.setItem('active_cabinet_id', gabineteData.id);
          setIsExonerated(false);
          return;
        }

        // 3. Fallback: Member Check (using gabinete_members)
        // Note: casting to any to bypass lint error if types are missing gabinete_members
        const { data: memberData } = await (supabase.from('gabinete_members' as any) as any)
          .select(`
            gabinete_id,
            role,
            gabinetes!inner (
              id,
              nome,
              camaras (
                nome,
                tipo,
                cidades (nome)
              )
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (memberData?.gabinetes) {
          const gab = memberData.gabinetes as any;
          const camara = Array.isArray(gab.camaras) ? gab.camaras[0] : gab.camaras;
          const cityName = camara?.cidades?.nome;
          const camaraName = camara?.nome;

          setCabinet({
            cabinet_id: memberData.gabinete_id,
            cabinet_name: gab.nome,
            city_name: cityName,
            institution_name: camaraName || (cityName ? `Câmara Municipal de ${cityName}` : undefined),
            user_role: memberData.role
          });
          localStorage.setItem('active_cabinet_id', memberData.gabinete_id);
          setIsExonerated(false);
        } else {
          // If no cabinet found, check if they are exonerated or just don't have a cabinet
          const { data: profile } = await supabase.from('profiles').select('main_role').eq('user_id', user.id).maybeSingle();
          if (profile && profile.main_role !== 'admin_plataforma' && profile.main_role !== 'politico') {
            setIsExonerated(true);
          } else {
            setIsExonerated(false);
          }
          setCabinet(null);
        }
      } catch (error) {
        console.error('AuthProvider - Unexpected error in fetchActiveCabinet:', error);
        setCabinet(null);
      } finally {
        if (isMounted) setCabinetLoading(false);
      }
    };

    fetchActiveCabinet();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user.id to prevent re-renders

  const value = {
    user,
    session,
    loading,
    cabinet,
    cabinetLoading,
    isExonerated,
    signIn,
    signUp,
    signOut,
    deleteAccount,
  };

  console.log('🔵 AuthProvider value:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    hasSession: !!session,
    loading,
    hasCabinet: !!cabinet,
    cabinetId: cabinet?.cabinet_id,
    cabinetLoading,
    isExonerated
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};