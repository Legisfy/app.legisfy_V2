import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Moon, Sun, User as UserIcon, LogOut, Settings2, Camera, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { ProfilePhotoUploadModal } from "@/pages/ProfilePhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";

export function AppNavbar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const { activeInstitution } = useActiveInstitution();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Get user profile with retry mechanism
        const fetchProfile = async (retries = 3) => {
          for (let i = 0; i < retries; i++) {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

            if (!error && profile) {
              console.log('AppNavbar - User profile loaded:', profile);
              setUserProfile(profile);
              return;
            }

            if (i < retries - 1) {
              console.log(`AppNavbar - Retrying profile fetch (${i + 1}/${retries})`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          console.log('AppNavbar - Failed to load profile after retries');
        };

        await fetchProfile();
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AppNavbar - Auth state change:', event);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Fetch profile when user signs in with delay to ensure profile exists
          setTimeout(() => {
            supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle()
              .then(({ data, error }) => {
                if (data) {
                  console.log('AppNavbar - Profile updated after auth change:', data);
                  setUserProfile(data);
                } else {
                  console.log('AppNavbar - No profile found after auth change, error:', error);
                }
              });
          }, 1500); // Increased delay to allow profile creation
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      // Clean up auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Sign out
      await supabase.auth.signOut({ scope: 'global' });

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso"
      });

      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive"
      });
    }
  };

  const getUserInitials = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (userProfile?.full_name) {
      const names = userProfile.full_name.trim().split(/\s+/);
      if (names.length >= 2) {
        return `${names[0]} ${names[1]}`;
      }
      return names[0];
    }

    // Fallback: Se for político, usar o nome do político da instituição ativa
    if (activeInstitution?.politician_name && getUserRole() === 'Político') {
      const names = activeInstitution.politician_name.trim().split(/\s+/);
      if (names.length >= 2) {
        return `${names[0]} ${names[1]}`;
      }
      return names[0];
    }

    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuário';
  };

  const getUserRole = () => {
    if (userProfile?.main_role === 'admin_plataforma') {
      return 'Administrador';
    }
    if (userProfile?.main_role === 'politico') {
      return 'Político';
    }
    if (userProfile?.main_role === 'chefe_gabinete') {
      return 'Chefe de Gabinete';
    }
    // Fallback para exibir Político se o perfil não tiver carregado mas o usuário for o dono do gabinete
    if (activeInstitution?.user_role === 'politico') {
      return 'Político';
    }
    return 'Assessor';
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const formatDayMonth = (date: Date) => {
    return date.toLocaleString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <header className="h-16 bg-card/90 dark:bg-card/30 backdrop-blur-xl border-b border-border/40 px-4 flex items-center sticky top-0 z-50">
      <div className="grid grid-cols-3 w-full items-center">
        <div className="flex items-center space-x-6">
          <SidebarTrigger className="hover:bg-accent/10 transition-colors" />

          <div className="hidden lg:flex items-center space-x-4 border-l border-border/20 pl-6">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60 dark:text-muted-foreground/40" />
              <span className="text-[10px] font-bold text-foreground/80 dark:text-foreground/60 capitalize tracking-tight font-inter">
                {formatDayMonth(currentTime)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/60 dark:text-muted-foreground/40" />
              <span className="text-[10px] font-black text-foreground/80 font-mono">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-sm font-bold leading-tight text-foreground/90 truncate uppercase tracking-tight font-outfit max-w-[150px] md:max-w-none">
            {activeInstitution?.cabinet_name || "Carregando..."}
          </h1>
          <div className="flex items-center justify-center space-x-1.5 w-full mt-0.5">
            <div className="flex-shrink-0 w-1 h-1 rounded-full bg-emerald-500/60" />
            <p className="text-[8px] leading-tight text-muted-foreground/60 dark:text-muted-foreground/40 font-black truncate uppercase tracking-[0.15em] font-inter">
              {activeInstitution?.institution_name || ""}
            </p>
          </div>
        </div>

        {/* Lado Direito: Ações + Perfil */}
        <div className="flex items-center justify-end space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl hover:bg-accent"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <NotificationDropdown />

          <div className="h-8 w-[1px] bg-border/50 mx-2" />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2.5 px-2 h-10 rounded-lg hover:bg-muted/10 transition-all border border-border/5">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-foreground/80 leading-none mb-1 font-inter">{getUserDisplayName()}</p>
                  <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none font-inter">{getUserRole()}</p>
                </div>
                <div className="relative">
                  <Avatar className="h-8 w-8 border border-border/20 shadow-sm ring-1 ring-emerald-500/10">
                    <AvatarImage
                      src={userProfile?.avatar_url || user?.user_metadata?.avatar_url}
                      alt={getUserDisplayName()}
                    />
                    <AvatarFallback className="bg-primary/5 text-primary/60 font-bold text-[10px]">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full shadow-sm" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2">
              <DropdownMenuItem onClick={() => navigate('/perfil')}>
                <UserIcon className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPhotoUpload(true)}>
                <Camera className="mr-2 h-4 w-4" />
                Alterar Foto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings2 className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modal de Upload de Foto */}
      <ProfilePhotoUploadModal
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onSuccess={() => {
          // Recarregar perfil após upload
          if (user) {
            supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle()
              .then(({ data }) => {
                if (data) setUserProfile(data);
              });
          }
        }}
      />
    </header>
  );
}