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
    status: string;
    city_name?: string;
    institution_name?: string;
    politician_name?: string;
    user_role: string;
  } | null;
  cabinetLoading: boolean;
  isExonerated: boolean;
  isSuspended: boolean;
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
    status: string;
    city_name?: string;
    institution_name?: string;
    politician_name?: string;
    user_role: string;
  } | null>(null);
  const [cabinetLoading, setCabinetLoading] = useState(true);
  const [isExonerated, setIsExonerated] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

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
    setIsSuspended(false); // Reset suspension state
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
      setIsSuspended(false);

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
        setIsSuspended(false);
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

        // Reset exoneration state and 2FA on sign out
        if (!session) {
          localStorage.removeItem('2fa_verified');
          setIsExonerated(false);
          setIsSuspended(false);
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
      setIsSuspended(false);
      return;
    }

    let isMounted = true;

    const fetchActiveCabinet = async () => {
      try {
        setCabinetLoading(true);
        console.log('🔐 AuthProvider - Detecção de gabinete iniciada para:', user.id);

        // 1. Obter Perfil do Usuário (Fonte da verdade para o gabinete_id)
        const { data: profile, error: profileError } = await (supabase
          .from('profiles') as any)
          .select('gabinete_id, main_role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('❌ AuthProvider - Erro ao buscar perfil:', profileError);
        }

        const profileCabinetId = profile?.gabinete_id;
        console.log('👤 AuthProvider - Perfil carregado:', { 
          role: profile?.main_role, 
          gabinete_id: profileCabinetId 
        });

        // 2. Tentar buscar dados via RPC primeiro (para compatibilidade com lógica existente)
        let cabinetData = null;
        try {
          const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_active_cabinet_with_correct_name');
          if (!rpcError && rpcData && rpcData.length > 0) {
            cabinetData = rpcData[0];
            console.log('🚀 AuthProvider - Gabinete via RPC detectado');
          }
        } catch (e) {
          console.warn('⚠️ AuthProvider - RPC failed, continuing to fallbacks');
        }

        // 3. Se não veio via RPC, ou temos um ID no perfil, buscar status diretamente
        const targetCabinetId = cabinetData?.cabinet_id || profileCabinetId;

        if (targetCabinetId) {
          console.log('🔍 AuthProvider - Buscando status direto para gabinete:', targetCabinetId);
          const { data: directCabinet, error: directError } = await supabase
            .from('gabinetes')
            .select(`
              id, 
              nome,
              status,
              politician_name,
              camaras (
                nome,
                tipo,
                cidades (nome)
              )
            `)
            .eq('id', targetCabinetId)
            .maybeSingle();

          if (directError) {
            console.error('❌ AuthProvider - Erro ao buscar gabinete direto:', directError);
          }

          if (directCabinet) {
            const camara: any = Array.isArray(directCabinet.camaras) ? directCabinet.camaras[0] : directCabinet.camaras;
            const cityName = camara?.cidades?.nome;
            const camaraName = camara?.nome;
            const status = directCabinet.status || 'ativo';

            console.log('📊 AuthProvider - Gabinete encontrado:', { 
              id: directCabinet.id, 
              nome: directCabinet.nome, 
              status: status 
            });

            if (!isMounted) return;

            setCabinet({
              cabinet_id: directCabinet.id,
              cabinet_name: directCabinet.nome,
              status: status,
              city_name: cityName,
              institution_name: camaraName || (cityName ? `Câmara Municipal de ${cityName}` : undefined),
              politician_name: directCabinet.politician_name,
              user_role: profile?.main_role || 'assessor'
            });

            localStorage.setItem('active_cabinet_id', directCabinet.id);
            
            // ATENÇÃO: O bloqueio deve ser ativado se o status for QUALQUER COISA diferente de 'ativo'
            const shouldBlock = status !== 'ativo';
            console.log('🚫 AuthProvider - Status de bloqueio:', shouldBlock);
            setIsSuspended(shouldBlock);
            setIsExonerated(false);
            return;
          }
        }

        // 4. Se chegou aqui sem gabinete, verificar se foi exonerado ou se é Admin
        if (isMounted) {
          console.log('❓ AuthProvider - Nenhum gabinete vinculado encontrado');
          setCabinet(null);
          setIsSuspended(false);
          
          if (profile && profile.main_role !== 'admin_plataforma' && profile.main_role !== 'politico') {
            setIsExonerated(true);
          } else {
            setIsExonerated(false);
          }
        }
      } catch (error) {
        console.error('❌ AuthProvider - Erro inesperado em fetchActiveCabinet:', error);
      } finally {
        if (isMounted) {
          setCabinetLoading(false);
          console.log('🏁 AuthProvider - Carregamento finalizado');
        }
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
    isSuspended,
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
    cabinetStatus: cabinet?.status,
    cabinetLoading,
    isExonerated,
    isSuspended
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