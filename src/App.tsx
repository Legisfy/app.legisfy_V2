import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Eleitores from "./pages/Eleitores";
import EleitorHistorico from "./pages/EleitorHistorico";
import Indicacoes from "./pages/Indicacoes";
import Demandas from "./pages/Demandas";
import MocoesVotos from "./pages/MocoesVotos";
import Ideias from "./pages/Ideias";
import Comunicacao from "./pages/Comunicacao";
import Assessores from "./pages/Assessores";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/ConfiguracoesSimples";
import Perfil from "./pages/Perfil";
import DuvidasSugestoes from "./pages/DuvidasSugestoes";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import AdminAuth from "./pages/AdminAuth";
import AuthGuardSimples from "./components/AuthGuardSimples";
import AdminGuard from "./components/AdminGuard";
import RoleGuard from "./components/RoleGuard";
import { AuthProvider } from "./components/AuthProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import { ConfirmProvider } from "./components/ui/confirm-dialog";
import { ExonerationPopupModal } from "./components/modals/ExonerationPopupModal";
import SaaSOnboarding from "./pages/SaaSOnboarding";
import AceitarConvite from "./pages/AceitarConvite";
import AceitarConviteEquipe from "./pages/AceitarConviteEquipe";
// LandingPage import removed
import PublicPageEditor from "./pages/PublicPageEditor";
import Publicos from "./pages/Publicos";
import Campanhas from "./pages/Campanhas";
import Coleta from "./pages/Coleta";
import Assinatura from "./pages/Assinatura";
import AssinaturaStripe from "./pages/AssinaturaStripe";
import MinhaAssinatura from "./pages/MinhaAssinatura";
import Mapa from "./pages/Mapa";
import DebugEleitores from "./pages/DebugEleitores";
import DebugPoliticoLogin from "./pages/DebugPoliticoLogin";
import SupabaseTest from "./pages/SupabaseTest";
import ProjetosLei from "./pages/ProjetosLei";
import { useAuthContext } from "./components/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { PreviewPanel } from "@/components/public-page-editor/PreviewPanel";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function PublicLandingPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [publicPage, setPublicPage] = useState<any | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("public_pages")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) {
          console.error("Erro ao carregar página pública por slug:", error);
          setPublicPage(null);
        } else {
          setPublicPage(data);
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar página pública:", err);
        setPublicPage(null);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando página pública...</p>
        </div>
      </div>
    );
  }

  if (!publicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Página não encontrada</p>
          <p className="text-sm text-muted-foreground">
            Verifique se o link foi digitado corretamente ou tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  const formData = {
    welcome_text: publicPage.welcome_text || "",
    instagram: publicPage.links?.instagram || "",
    whatsapp: publicPage.links?.whatsapp || "",
    site: publicPage.links?.site || "",
    show_kpis: publicPage.show_sections?.kpis !== false,
    show_timeline: publicPage.show_sections?.timeline !== false,
    show_form: publicPage.show_sections?.form !== false,
    primary_color: publicPage.theme?.primary || "#2563eb",
    secondary_color: publicPage.theme?.secondary || "#10b981",
    theme_mode: publicPage.theme?.mode || "light",
    font_family: "system",
    header_layout: "compact",
    cover_image_url: "",
    logo_url: "",
    form_title: "Fale com o Gabinete",
    form_description: "Envie sua sugestão, elogio ou reclamação",
    lgpd_text: "Seus dados serão tratados conforme nossa Política de Privacidade.",
    captcha_enabled: true,
    rate_limit: 5,
    slug: publicPage.slug || "",
    status: publicPage.status || "draft",
    seo_title: "",
    seo_description: ""
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <PreviewPanel
          formData={formData}
          gabineteData={null}
          publicPage={publicPage}
        />
      </div>
    </div>
  );
}

// Global Exoneration Handler Component
function GlobalExonerationHandler() {
  const context = useAuthContext();

  // Wait for auth to initialize before proceeding
  if (context.loading || context.cabinetLoading) {
    return null;
  }

  const { isExonerated, deleteAccount, signOut } = context;

  const handleExonerationConfirm = async () => {
    try {
      await signOut();
      await deleteAccount();

      toast({
        title: 'Conta removida',
        description: 'Sua conta foi removida do sistema.',
        variant: 'destructive'
      });
    } catch (error) {
      console.error('Error deleting account:', error);

      try {
        await signOut();
      } catch (logoutError) {
        console.error('Error during logout:', logoutError);
      }

      toast({
        title: 'Erro',
        description: 'Erro ao remover conta. Você foi desconectado por segurança.',
        variant: 'destructive'
      });
    }
  };

  return (
    <ExonerationPopupModal
      isOpen={isExonerated}
      onConfirm={handleExonerationConfirm}
    />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ThemeWrapper>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary>
              <ConfirmProvider>
                <AuthProvider>
                  <GlobalExonerationHandler />
                  <Routes>
                    {/* Public routes - outside AuthGuard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/p/:slug" element={<PublicLandingPage />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth-callback" element={<AuthCallback />} />
                    <Route path="/admin-auth" element={<AdminAuth />} />
                    <Route path="/onboarding" element={<SaaSOnboarding />} />
                    <Route path="/convite/aceitar" element={<AceitarConvite />} />
                    <Route path="/aceitar" element={<AceitarConvite />} />
                    <Route path="/aceitar-convite-equipe" element={<AceitarConviteEquipe />} />

                    {/* Protected routes - inside AuthGuard */}
                    <Route path="*" element={
                      <AuthGuardSimples>
                        <Routes>
                          <Route path="/dashboard" element={<Index />} />
                          <Route path="/eleitores" element={<Eleitores />} />
                          <Route path="/eleitores/:id/historico" element={<EleitorHistorico />} />
                          <Route path="/indicacoes" element={<Indicacoes />} />
                          <Route path="/projetos-lei" element={<ProjetosLei />} />
                          <Route path="/demandas" element={<Demandas />} />
                          <Route path="/mocoes-votos" element={<MocoesVotos />} />
                          <Route path="/ideias" element={<Ideias />} />
                          <Route path="/comunicacao" element={<Comunicacao />} />
                          <Route path="/assessores" element={
                            <RoleGuard allowedRoles={['politico', 'chefe_gabinete']}>
                              <Assessores />
                            </RoleGuard>
                          } />
                          <Route path="/agenda" element={<Agenda />} />
                          <Route path="/configuracoes" element={<Configuracoes />} />
                          <Route path="/assinatura" element={<Assinatura />} />
                          <Route path="/assinatura-stripe" element={<AssinaturaStripe />} />
                          <Route path="/perfil" element={<Perfil />} />
                          <Route path="/duvidas" element={<DuvidasSugestoes />} />
                          <Route path="/mapa" element={<Mapa />} />
                          <Route path="/debug-eleitores" element={<DebugEleitores />} />
                          <Route path="/debug-politico" element={<DebugPoliticoLogin />} />
                          <Route path="/supabase-test" element={<SupabaseTest />} />
                          <Route path="/builder" element={<PublicPageEditor />} />
                          <Route path="/pagina-publica" element={<PublicPageEditor />} />
                          <Route path="/publicos" element={<Publicos />} />
                          <Route path="/campanhas" element={<Campanhas />} />
                          <Route path="/coleta" element={<Coleta />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AuthGuardSimples>
                    } />
                  </Routes>
                </AuthProvider>
              </ConfirmProvider>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeWrapper>
    </ThemeProvider>
  </QueryClientProvider >
);

export default App;
