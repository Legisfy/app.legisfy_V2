import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndGabinete = async () => {
      try {
        // Check authentication
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Session error:', error);
        }
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          // Get user profile to check if it's a politician
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('main_role')
            .eq('user_id', currentUser.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Profile error:', profileError);
          }

          // If it's a politician, check if they have completed onboarding
          if (profile?.main_role === 'politico' || 
              currentUser.user_metadata?.user_type === 'politico') {
            
            // Check if they have a gabinete
            const { data: gabinetes } = await supabase
              .from('gabinetes')
              .select('id')
              .eq('politico_id', currentUser.id);

            // If no gabinete and not on onboarding page, redirect to onboarding
            if ((!gabinetes || gabinetes.length === 0) && 
                window.location.pathname !== '/onboarding') {
              navigate('/onboarding');
              return;
            }
            
            // If has gabinete and on onboarding page, redirect to dashboard
            if (gabinetes && gabinetes.length > 0 && 
                window.location.pathname === '/onboarding') {
              navigate('/dashboard');
              return;
            }
          }
        }
        
        // Handle redirects based on auth state and current path
        if (!currentUser && 
            window.location.pathname !== '/auth' && 
            window.location.pathname !== '/onboarding') {
          navigate('/auth');
        } else if (currentUser && window.location.pathname === '/auth') {
          // Check if politician needs onboarding
          const { data: profile } = await supabase
            .from('profiles')
            .select('main_role')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (profile?.main_role === 'politico' || 
              currentUser.user_metadata?.user_type === 'politico') {
            const { data: gabinetes } = await supabase
              .from('gabinetes')
              .select('id')
              .eq('politico_id', currentUser.id);
            
            if (!gabinetes || gabinetes.length === 0) {
              navigate('/onboarding');
              return;
            }
          }
          
          navigate('/dashboard');
        }
        
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (event === 'SIGNED_IN' && currentUser) {
          // Defer gabinete check to prevent deadlocks
          setTimeout(() => {
            checkAuthAndGabinete();
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          navigate('/auth');
        }
      }
    );

    // Initial check
    checkAuthAndGabinete();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;