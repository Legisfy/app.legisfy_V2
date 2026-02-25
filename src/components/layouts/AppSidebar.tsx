import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users2,
  FileSignature,
  FileText,
  MessageCircle,
  Sparkles,
  Megaphone,
  Trophy,
  GraduationCap,
  ShieldCheck,
  CalendarDays,
  Map,
  Settings2,
  Lightbulb,
  CircleHelp,
  Palette,
  Puzzle,
  CreditCard,
  Lock,
  Award,
  Send,
  Globe2,
  Target,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useGabineteData } from "@/hooks/useGabineteData";
import { useForceRefresh } from "@/hooks/useForceRefresh";
import { usePermissions } from "@/hooks/usePermissions";

// Temporary fallback to use the uploaded image URL directly
const LEGISFY_LOGO_DARK = "/lovable-uploads/6ee2e8b0-bb12-484a-9bd5-d31ea171be7a.png";

const publicItems = [
  { title: "Início", url: "/dashboard", icon: LayoutDashboard, permissionModule: null },
  { title: "Eleitores", url: "/eleitores", icon: Users2, permissionModule: 'eleitores' as const },
  { title: "Indicações", url: "/indicacoes", icon: FileSignature, permissionModule: 'indicacoes' as const },
  { title: "Projeto de Lei", url: "/projetos-lei", icon: FileText, permissionModule: 'projetos_lei' as const },
  { title: "Demandas", url: "/demandas", icon: MessageCircle, permissionModule: 'demandas' as const },
  { title: "Mapa", url: "/mapa", icon: Map, permissionModule: null },
];

const aiItems: { title: string; url: string; icon: any }[] = [];

const marketingItems = [
  {
    title: "Públicos",
    url: "/publicos",
    icon: Target,
    tooltip: "Organize sua estratégia criando públicos através da lista de eleitores, lista de pessoas participantes de eventos e dentre outros.",
    permissionModule: 'publicos' as const,
  },
];

const restrictedItems = [
  { title: "Assessores", url: "/assessores", icon: ShieldCheck, permissionModule: null },
  { title: "Agenda", url: "/agenda", icon: CalendarDays, permissionModule: 'agenda' as const },
  { title: "Meu Gabinete", url: "/configuracoes", icon: Settings2, permissionModule: null },
  // { title: "Assinatura", url: "/assinatura", icon: CreditCard }, // OCULTO
];

const legisfyItems = [
  { title: "Suporte", url: "/duvidas", icon: CircleHelp },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { theme } = useTheme();
  const collapsed = state === "collapsed";
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { activeInstitution } = useActiveInstitution();
  const { gabinete } = useGabineteData();
  const { forceRefresh } = useForceRefresh();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    // Get current user and user role
    const loadUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Get user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('main_role')
          .eq('user_id', user.id)
          .single();

        setUserRole(profile?.main_role || null);
      }
    };

    loadUserInfo();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserInfo();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Log gabinete data changes for debugging
  useEffect(() => {
    console.log('🔄 AppSidebar - Gabinete data updated:', {
      gabinete,
      hasLogo: !!gabinete?.logomarca_url,
      logoUrl: gabinete?.logomarca_url,
      nome: gabinete?.nome,
      politician_name: gabinete?.politician_name
    });
  }, [gabinete]);

  // Force reload gabinete data when forceRefresh changes
  useEffect(() => {
    console.log('🔃 AppSidebar - Force refresh triggered');
  }, [forceRefresh]);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const getNavClass = (isActiveRoute: boolean) =>
    isActiveRoute
      ? "bg-primary/5 text-primary font-bold border-r-2 border-primary/40"
      : "text-muted-foreground/80 dark:text-muted-foreground/60 hover:bg-muted/10 hover:text-foreground transition-all duration-200";

  const getLegisfyLogo = () => {
    // For now, use the same logo for both themes since we have the uploaded logo
    return LEGISFY_LOGO_DARK;
  };

  return (
    <TooltipProvider>
      <Sidebar className={cn("border-r border-border/40 transition-all duration-300 overflow-hidden hide-scrollbar", collapsed ? "w-16" : "w-64")}>
        <SidebarHeader className="bg-sidebar/90 dark:bg-sidebar/40 backdrop-blur-xl border-b border-border/20 p-0">
          <div className="pt-2 pb-2 px-4 flex items-center justify-center min-h-[70px]">
            {!collapsed ? (
              <div className="flex flex-col items-center justify-center w-full space-y-0.5">
                {gabinete?.logomarca_url ? (
                  <div className="w-full h-14 flex items-center justify-center p-1 rounded-lg bg-muted/5 border border-border/10 shadow-sm">
                    <img
                      key={gabinete.logomarca_url}
                      src={
                        gabinete.logomarca_url.startsWith('http')
                          ? gabinete.logomarca_url
                          : supabase.storage.from('gabinete-logos').getPublicUrl(gabinete.logomarca_url).data.publicUrl
                      }
                      alt={gabinete.nome || "Logo do Gabinete"}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        console.error('❌ AppSidebar - Logo failed to load:', gabinete.logomarca_url);
                        // Fallback to old bucket if new one fails and it looks like a relative path
                        if (!gabinete.logomarca_url.startsWith('http')) {
                          const fallbackUrl = supabase.storage.from('LEGISFY').getPublicUrl(gabinete.logomarca_url).data.publicUrl;
                          e.currentTarget.src = fallbackUrl;
                        } else {
                          e.currentTarget.style.display = 'none';
                        }
                      }}
                      onLoad={() => console.log('✅ AppSidebar - Logo loaded successfully')}
                    />
                  </div>
                ) : (
                  <img
                    src={getLegisfyLogo()}
                    alt="Legisfy"
                    className="w-[120px] h-8 object-contain opacity-80"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                {gabinete?.logomarca_url ? (
                  <img
                    key={gabinete.logomarca_url}
                    src={
                      gabinete.logomarca_url.startsWith('http')
                        ? gabinete.logomarca_url
                        : supabase.storage.from('gabinete-logos').getPublicUrl(gabinete.logomarca_url).data.publicUrl
                    }
                    alt={gabinete.nome || "Logo"}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="text-xs font-bold text-primary">L</div>
                )}
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-sidebar hide-scrollbar overflow-y-auto">
          {/* Menu Principal */}
          <SidebarGroup className="pt-1 pb-0.5">
            <SidebarGroupLabel className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-muted-foreground/30 mb-0.5 px-4 font-outfit",
              collapsed && "sr-only"
            )}>
              Navegação Central
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {publicItems.filter(item => {
                  // No permission module = always visible (Dashboard, Mapa)
                  if (!item.permissionModule) return true;
                  return hasPermission(item.permissionModule, 'read');
                }).map((item) => (
                  <SidebarMenuItem key={item.title} className="px-2 mb-0.5">
                    <SidebarMenuButton asChild className="h-[26px] rounded-lg group transition-all">
                      <NavLink
                        to={item.url}
                        className={getNavClass(isActive(item.url))}
                        title={collapsed ? item.title : undefined}
                      >
                        <div className="flex items-center gap-2 px-2">
                          <item.icon className={cn("h-3 w-3 transition-transform group-hover:scale-110", isActive(item.url) ? "text-primary" : "opacity-40")} />
                          {!collapsed && <span className="text-[10px] font-bold tracking-tight font-inter">{item.title}</span>}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Menu Inteligência Artificial */}
          {aiItems.length > 0 && (
            <SidebarGroup className="py-0.5">
              <SidebarGroupLabel className={cn(
                "text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-muted-foreground/30 mb-0.5 px-4 font-outfit",
                collapsed && "sr-only"
              )}>
                Inteligência Artificial
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {aiItems.map((item) => (
                    <SidebarMenuItem key={item.title} className="px-2 mb-0.5">
                      <SidebarMenuButton asChild className="h-[26px] rounded-lg group transition-all">
                        <NavLink
                          to={item.url}
                          className={getNavClass(isActive(item.url))}
                          title={collapsed ? item.title : undefined}
                        >
                          <div className="flex items-center gap-2 px-2">
                            <item.icon className={cn("h-3 w-3 transition-transform group-hover:scale-110", isActive(item.url) ? "text-primary" : "opacity-40")} />
                            {!collapsed && <span className="text-[10px] font-bold tracking-tight font-inter">{item.title}</span>}
                          </div>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Menu Marketing */}
          <SidebarGroup className="py-0.5">
            <SidebarGroupLabel className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-muted-foreground/30 mb-0.5 px-4 font-outfit",
              collapsed && "sr-only"
            )}>
              Estratégia e Canais
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {marketingItems.filter(item => {
                  if (!item.permissionModule) return true;
                  return hasPermission(item.permissionModule, 'read');
                }).map((item) => (
                  <SidebarMenuItem key={item.title} className="px-2">
                    <SidebarMenuButton asChild className="h-[26px] rounded-lg group transition-all">
                      <NavLink
                        to={item.url}
                        className={getNavClass(isActive(item.url))}
                        title={collapsed ? item.title : undefined}
                      >
                        <div className="flex items-center gap-2 px-2">
                          <item.icon className={cn("h-3 w-3 transition-transform group-hover:scale-110", isActive(item.url) ? "text-primary" : "opacity-40")} />
                          {!collapsed && <span className="text-[10px] font-bold tracking-tight font-inter">{item.title}</span>}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Menu Administrativo */}
          <SidebarGroup className="py-0.5">
            <SidebarGroupLabel className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-muted-foreground/30 mb-0.5 px-4 font-outfit",
              collapsed && "sr-only"
            )}>
              Gestão Interna
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {restrictedItems.filter(item => {
                  // Filter by permission if module is specified
                  if (item.permissionModule) {
                    return hasPermission(item.permissionModule, 'read');
                  }
                  return true;
                }).map((item) => {
                  const isAssessor = userRole === 'assessor';
                  const isAssessores = item.title === 'Assessores';
                  const isAssessorIA = item.title === 'Assessor IA';
                  const isMeuGabinete = item.title === 'Meu Gabinete';
                  const isAssinatura = item.title === 'Assinatura';
                  const hasAdminAccess = userRole === 'politico' || userRole === 'chefe_gabinete';
                  const isRestricted = (isAssessor && (isAssessores || isAssessorIA || isMeuGabinete || isAssinatura)) ||
                    (userRole === 'chefe_gabinete' && isAssinatura);

                  return (
                    <SidebarMenuItem key={item.title} className="px-2">
                      {isRestricted ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton className="cursor-default opacity-50 h-[26px] rounded-lg px-4 border border-transparent">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-3 w-3 opacity-40" />
                                  {!collapsed && <span className="text-[10px] font-bold tracking-tight font-inter">{item.title}</span>}
                                </div>
                                {!collapsed && (
                                  <Badge variant="outline" className="text-[6px] px-1 py-0 h-3 border-orange-500/20 text-orange-500/60 bg-transparent uppercase font-black tracking-widest leading-none">
                                    Privado
                                  </Badge>
                                )}
                              </div>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs text-[10px] font-bold uppercase tracking-tight">
                            <p>
                              {isAssinatura
                                ? "Político gerencia assinaturas."
                                : "Acesso restrito para assessores."
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <SidebarMenuButton asChild className="h-[26px] rounded-lg group transition-all">
                          <NavLink
                            to={item.url}
                            className={getNavClass(isActive(item.url))}
                            title={collapsed ? item.title : undefined}
                          >
                            <div className="flex items-center gap-2 px-2">
                              <item.icon className={cn("h-3 w-3 transition-transform group-hover:scale-110", isActive(item.url) ? "text-primary" : "opacity-40")} />
                              {!collapsed && <span className="text-[10px] font-bold tracking-tight font-inter">{item.title}</span>}
                            </div>
                          </NavLink>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Menu Legisfy */}
          <SidebarGroup className="py-0.5">
            <SidebarGroupLabel className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-muted-foreground/30 mb-0.5 px-4 font-outfit",
              collapsed && "sr-only"
            )}>
              Suporte
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {legisfyItems.map((item) => (
                  <SidebarMenuItem key={item.title} className="px-2 mb-0.5">
                    <SidebarMenuButton asChild className="h-[26px] rounded-lg group transition-all">
                      <NavLink
                        to={item.url}
                        className={getNavClass(isActive(item.url))}
                        title={collapsed ? item.title : undefined}
                      >
                        <div className="flex items-center gap-2 px-2">
                          <item.icon className={cn("h-3 w-3 transition-transform group-hover:scale-110", isActive(item.url) ? "text-primary" : "opacity-40")} />
                          {!collapsed && <span className="text-[10px] font-bold tracking-tight font-inter">{item.title}</span>}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
