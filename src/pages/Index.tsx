import { ComunicadoPopupModal } from "@/components/modals/ComunicadoPopupModal";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Users2, FileSignature, MessageCircle, Lightbulb, TrendingUp, CalendarDays, MapPin, UserPlus, FileDown, Phone, Shield, X, Eye, Clock, Award, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EnhancedVoterModal } from "@/components/modals/EnhancedVoterModal";
import { NewIndicationModal } from "@/components/modals/MultiStepIndicationModal";
import { NewDemandModal } from "@/components/modals/MultiStepDemandModal";
import { NewIdeaModal } from "@/components/modals/MultiStepIdeaModal";
import { PromotionalBanner } from "@/components/ui/promotional-banner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGabineteData } from "@/hooks/useGabineteData";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";
import { MetasRewards } from "@/components/dashboard/MetasRewards";
import { DashboardAgenda } from "@/components/dashboard/DashboardAgenda";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/ui/standard-card";

interface Comunicado {
  id: string;
  titulo: string;
  descricao?: string;
  imagem_url?: string;
  texto_botao: string;
  link_botao: string;
  link_destino?: string;
  ativo: boolean;
  tipo?: 'texto' | 'banner' | 'dashboard' | 'login' | 'popup';
  target_institution_id?: string;
  target_user_roles?: string[];
  banner_width?: number;
  banner_height?: number;
  data_inicio?: string;
  data_fim?: string;
  data_inicio_hora?: string;
  data_fim_hora?: string;
  total_clicks?: number;
  total_views?: number;
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useCurrentUser();
  const { stats, assessorRanking, recentActivities, loading } = useGabineteData();
  const { monthlyData, upcomingEvents, loading: monthlyLoading } = useMonthlyStats();
  const [newVoterOpen, setNewVoterOpen] = useState(false);
  const [newIndicationOpen, setNewIndicationOpen] = useState(false);
  const [newDemandOpen, setNewDemandOpen] = useState(false);
  const [newIdeaOpen, setNewIdeaOpen] = useState(false);

  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [popupComunicado, setPopupComunicado] = useState<Comunicado | null>(null);
  const [popupShown, setPopupShown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  // Check if admin and redirect
  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('main_role')
          .eq('user_id', user.id)
          .single();

        if (profile?.main_role === 'admin_plataforma') {
          navigate('/admin');
        }
      }
    };

    checkAdminRole();
  }, [user, navigate]);

  // Verificar se deve mostrar modal de troca de senha
  useEffect(() => {
    const changePassword = searchParams.get('change-password');
    console.log('[INDEX] Checking change-password param:', changePassword);
    console.log('[INDEX] Current URL:', window.location.href);
    if (changePassword === 'true') {
      console.log('[INDEX] Opening change password modal');
      setShowChangePassword(true);
      // Limpar o parâmetro da URL
      searchParams.delete('change-password');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Debug assessor ranking
  useEffect(() => {
    console.log('🎖️ Dashboard - assessorRanking updated:', assessorRanking);
    console.log('🎖️ Dashboard - assessorRanking length:', assessorRanking.length);
    console.log('🔄 Dashboard - loading state:', loading);
    console.log('📊 Dashboard - stats:', stats);
  }, [assessorRanking, loading, stats]);

  useEffect(() => {
    fetchActiveComunicados();
  }, []);

  useEffect(() => {
    // Track views for displayed comunicados
    const trackViews = async () => {
      for (const comunicado of comunicados) {
        try {
          await supabase.rpc('register_comunicado_metric', {
            p_comunicado_id: comunicado.id,
            p_action_type: 'view'
          });
        } catch (error) {
          console.error('Error tracking comunicado view:', error);
        }
      }
    };

    if (comunicados.length > 0) {
      trackViews();
    }
  }, [comunicados]);

  const fetchActiveComunicados = async () => {
    console.log('🚀 Fetching comunicados from Index page');
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('comunicados')
        .select('*')
        .eq('ativo', true)
        .in('tipo', ['dashboard', 'popup', 'banner'])
        .or(`data_inicio.is.null,data_inicio.lte.${currentDate}`)
        .or(`data_fim.is.null,data_fim.gte.${currentDate}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      console.log('📦 Comunicados fetched:', data);

      // Filter by time and date if specified
      const filteredComunicados = (data || []).filter(comunicado => {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

        console.log('🔍 Processing comunicado:', {
          titulo: comunicado.titulo,
          tipo: comunicado.tipo,
          imagem_url: !!comunicado.imagem_url
        });

        // Check date range
        if (comunicado.data_inicio && comunicado.data_inicio > currentDate) {
          return false;
        }
        if (comunicado.data_fim && comunicado.data_fim < currentDate) {
          return false;
        }

        // Check time range for today
        if (comunicado.data_inicio === currentDate && comunicado.data_inicio_hora) {
          if (comunicado.data_inicio_hora > currentTime) {
            return false;
          }
        }
        if (comunicado.data_fim === currentDate && comunicado.data_fim_hora) {
          if (comunicado.data_fim_hora < currentTime) {
            return false;
          }
        }

        return true;
      });

      // Separar dashboard banners dos popups
      const dashboardBanners = filteredComunicados.filter(c => c.tipo === 'dashboard' || c.tipo === 'banner');
      const popupComunicados = filteredComunicados.filter(c => c.tipo === 'popup');

      console.log('✅ Dashboard banners:', dashboardBanners);
      console.log('✅ Popup comunicados:', popupComunicados);

      setComunicados(dashboardBanners);

      // Mostrar popup sempre após login/acesso ao sistema
      if (popupComunicados.length > 0 && !popupShown) {
        setPopupComunicado(popupComunicados[0]);
        setPopupShown(true);
      }
    } catch (error) {
      console.error('❌ Error fetching comunicados:', error);
    }
  };



  if (loading || monthlyLoading || !stats) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Carregando dados do gabinete...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const statsCards = [
    {
      title: "Eleitores",
      value: (stats?.totalEleitores || 0).toLocaleString('pt-BR'),
      change: "+10%",
      icon: Users2,
      iconColor: "text-emerald-600 dark:text-white",
      iconBgColor: "bg-emerald-500 shadow-none dark:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
    },
    {
      title: "Demandas Ativas",
      value: (stats?.totalDemandas || 0).toLocaleString('pt-BR'),
      change: "-5%",
      icon: MessageCircle,
      iconColor: "text-blue-600 dark:text-white",
      iconBgColor: "bg-blue-500 shadow-none dark:shadow-[0_0_15px_rgba(59,130,246,0.4)]",
    },
    {
      title: "Indicações",
      value: (stats?.totalIndicacoes || 0).toLocaleString('pt-BR'),
      change: "+18",
      icon: FileSignature,
      iconColor: "text-purple-600 dark:text-white",
      iconBgColor: "bg-purple-500 shadow-none dark:shadow-[0_0_15px_rgba(168,85,247,0.4)]",
    },
    {
      title: "Projetos de Lei",
      value: "0",
      change: "0%",
      icon: FileText,
      iconColor: "text-sky-500 dark:text-white",
      iconBgColor: "bg-sky-500 shadow-none dark:shadow-[0_0_15px_rgba(56,189,248,0.4)]",
    }
  ];

  return (
    <AppLayout>
      <div className="p-5 space-y-5">
        {/* Modal de Troca de Senha */}
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => setShowChangePassword(false)}
        />

        {/* Active Communications Banner */}
        {comunicados.length > 0 && comunicados.map((comunicado) => (
          <div key={comunicado.id}>
            {comunicado.tipo === 'dashboard' && comunicado.imagem_url ? (
              // Dashboard Banner - 1200px x 600px - DEVE APARECER NO TOPO
              <div className="relative mx-auto overflow-hidden rounded-lg mb-4 shadow-sm" style={{ maxWidth: '1200px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setComunicados(prev => prev.filter(c => c.id !== comunicado.id));
                  }}
                  className="absolute top-3 right-3 z-20 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all"
                  aria-label="Fechar banner"
                >
                  <X className="w-3 h-3 text-white" />
                </button>

                <div
                  className={`relative w-full ${(comunicado.link_destino && comunicado.link_destino !== '#') || (comunicado.link_botao && comunicado.link_botao !== '#') ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
                  style={{ height: '160px', maxWidth: '1200px' }}
                  onClick={((comunicado.link_destino && comunicado.link_destino !== '#') || (comunicado.link_botao && comunicado.link_botao !== '#')) ? async () => {
                    const linkToOpen = comunicado.link_destino || comunicado.link_botao;
                    console.log('🔗 Link original:', linkToOpen);

                    if (linkToOpen && linkToOpen !== '#') {
                      // Corrigir duplicação de links
                      let finalUrl = linkToOpen;
                      if (!linkToOpen.startsWith('http')) {
                        finalUrl = `https://${linkToOpen}`;
                      }
                      console.log('🚀 URL final:', finalUrl);
                      window.open(finalUrl, '_blank');
                    }
                    try {
                      await supabase.rpc('register_comunicado_metric', {
                        p_comunicado_id: comunicado.id,
                        p_action_type: 'click'
                      });
                    } catch (error) {
                      console.error('Error tracking click:', error);
                    }
                  } : undefined}
                >
                  <img
                    src={comunicado.imagem_url}
                    alt={comunicado.titulo || 'Banner do gabinete'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : comunicado.tipo === 'banner' && comunicado.imagem_url ? (
              // Clean banner - clickable if has link
              <div className="relative overflow-hidden rounded-lg mb-3 group">
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setComunicados(prev => prev.filter(c => c.id !== comunicado.id));
                  }}
                  className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-all"
                  aria-label="Fechar banner"
                >
                  <X className="w-3 h-3 text-white" />
                </button>

                {(comunicado.link_destino || comunicado.link_botao) ? (
                  <div
                    className="cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={async () => {
                      const linkToOpen = comunicado.link_destino || comunicado.link_botao;
                      console.log('🔗 Banner Link original:', linkToOpen);

                      if (linkToOpen && linkToOpen !== '#') {
                        // Corrigir duplicação de links
                        let finalUrl = linkToOpen;
                        if (!linkToOpen.startsWith('http')) {
                          finalUrl = `https://${linkToOpen}`;
                        }
                        console.log('🚀 Banner URL final:', finalUrl);
                        window.open(finalUrl, '_blank');
                      }
                      // Track click
                      try {
                        await supabase.rpc('register_comunicado_metric', {
                          p_comunicado_id: comunicado.id,
                          p_action_type: 'click'
                        });
                      } catch (error) {
                        console.error('Error tracking click:', error);
                      }
                    }}
                  >
                    <img
                      src={comunicado.imagem_url}
                      alt={comunicado.titulo}
                      className="w-full object-cover"
                      style={{
                        height: `${comunicado.banner_height || 180}px`,
                        minHeight: '180px'
                      }}
                    />
                  </div>
                ) : (
                  // Non-clickable banner
                  <img
                    src={comunicado.imagem_url}
                    alt={comunicado.titulo}
                    className="w-full object-cover"
                    style={{
                      height: `${comunicado.banner_height || 180}px`,
                      minHeight: '180px'
                    }}
                  />
                )}
              </div>
            ) : (
              // Regular promotional banner for text comunicados
              <PromotionalBanner
                title={comunicado.titulo}
                description={comunicado.descricao}
                buttonText={comunicado.texto_botao}
                buttonLink={comunicado.link_botao}
                imageSrc={comunicado.imagem_url}
                onClose={async () => {
                  setComunicados(prev => prev.filter(c => c.id !== comunicado.id));
                  // Track view
                  try {
                    await supabase.rpc('register_comunicado_metric', {
                      p_comunicado_id: comunicado.id,
                      p_action_type: 'view'
                    });
                  } catch (error) {
                    console.error('Error tracking view:', error);
                  }
                }}
              />
            )}
          </div>
        ))}

        {/* Header Compacto e Premium */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-base font-bold tracking-tight text-foreground/80 font-outfit uppercase">Dashboard</h1>
              <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-bold border-border/60 text-muted-foreground bg-transparent uppercase tracking-[0.2em] rounded-full">
                Sincronizado
              </Badge>
            </div>
            <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-widest leading-none">
              Visão geral estratégica das atividades do gabinete
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            <Button
              onClick={() => setNewVoterOpen(true)}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5 gap-2"
            >
              <UserPlus className="h-3 w-3 opacity-40" />
              Eleitor
            </Button>
            <Button
              onClick={() => setNewIndicationOpen(true)}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5 gap-2"
            >
              <FileDown className="h-3 w-3 opacity-40" />
              Indicação
            </Button>
            <Button
              onClick={() => setNewDemandOpen(true)}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-purple-500 hover:bg-purple-500/5 gap-2"
            >
              <Phone className="h-3 w-3 opacity-40" />
              Demanda
            </Button>
            <div className="w-[1px] h-4 bg-border/40 mx-1" />

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-min">
          {/* Stats Cards */}
          {statsCards.map((stat) => (
            <div key={stat.title} className="lg:col-span-1">
              <StatsCard
                title={stat.title}
                value={stat.value}
                change={stat.change?.toString() || "0%"}
                icon={stat.icon}
                iconColor={stat.iconColor}
                iconBgColor={stat.iconBgColor}
              />
            </div>
          ))}



          {/* Ranking de Assessores */}
          <Card className="border border-border/40 bg-card/95 dark:bg-card/20 backdrop-blur-sm lg:col-span-2 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-outfit">
                  <Award className="h-3 w-3 opacity-40" />
                  Eficiência da Equipe
                </CardTitle>
                <Badge variant="outline" className="text-[7px] font-bold tracking-widest uppercase px-1.5 h-4 border-border/40 text-muted-foreground/40 bg-transparent">
                  RANKING MENSAL
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {assessorRanking && assessorRanking.length > 0 ? (
                assessorRanking.slice(0, 4).map((assessor, index) => {
                  const maxPoints = Math.max(...assessorRanking.map(a => a.points)) || 100;
                  const percentage = Math.round((assessor.points / maxPoints) * 100);

                  return (
                    <div key={assessor.user_id || index} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8 border border-border/40">
                              <AvatarImage src={assessor.avatar_url} />
                              <AvatarFallback className="text-[10px] bg-muted">{assessor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {index === 0 && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary flex items-center justify-center border border-background shadow-lg">
                                <Award className="h-1.5 w-1.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-foreground/80 truncate leading-none">{assessor.name}</p>
                            <p className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-tight mt-1">
                              {assessor.role || "Assessor"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/60 font-outfit">
                          {assessor.points} pts
                        </span>
                      </div>
                      <div className="pl-11">
                        <Progress
                          value={percentage}
                          className="h-1 bg-muted/30"
                          indicatorClassName={cn(
                            "transition-all duration-1000",
                            index === 0 ? "bg-primary/60" : "bg-muted-foreground/20"
                          )}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 opacity-20">
                  <Users2 className="mx-auto h-8 w-8 mb-3" />
                  <p className="text-[9px] uppercase font-bold tracking-widest">Sem Pontuação</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agenda Imediata - Componente Premium */}
          <div className="lg:col-span-2">
            <DashboardAgenda events={upcomingEvents} loading={monthlyLoading} />
          </div>
        </div>

        {/* Visão Geral e Metas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Visão Geral */}
          <Card className="border border-border/40 bg-card/80 dark:bg-card/20 backdrop-blur-sm shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-outfit">Produtividade Mensal</CardTitle>
              <CardDescription className="text-[8px] uppercase font-medium tracking-tighter opacity-40">Volume acumulado por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "hsl(var(--foreground))", fontWeight: 'bold', opacity: 0.7 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "hsl(var(--foreground))", fontWeight: 'bold', opacity: 0.7 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border)/0.2)",
                        borderRadius: "8px",
                        fontSize: "9px",
                        fontWeight: "bold",
                        boxShadow: "none"
                      }}
                    />
                    <Bar dataKey="eleitores" fill="#10b981" opacity={0.8} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="demandas" fill="#3b82f6" opacity={0.9} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="indicacoes" fill="#8b5cf6" opacity={1} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Metas e Premiações */}
          <MetasRewards />
        </div>

        {/* Modals */}
        <EnhancedVoterModal
          open={newVoterOpen}
          onOpenChange={setNewVoterOpen}
        />
        <NewIndicationModal
          open={newIndicationOpen}
          onOpenChange={setNewIndicationOpen}
        />
        <NewDemandModal
          open={newDemandOpen}
          onOpenChange={setNewDemandOpen}
        />


        {/* Popup Modal para comunicados tipo "popup" */}
        {popupComunicado && (
          <ComunicadoPopupModal
            comunicado={popupComunicado}
            onClose={() => setPopupComunicado(null)}
            onTrackClick={async (comunicadoId: string) => {
              try {
                await supabase.rpc('register_comunicado_metric', {
                  p_comunicado_id: comunicadoId,
                  p_action_type: 'click'
                });
              } catch (error) {
                console.error('Error tracking popup click:', error);
              }
            }}
          />
        )}

        {/* Modal de Visualização de Evento */}
        <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Detalhes do Evento
              </DialogTitle>
            </DialogHeader>

            {selectedEvent && (() => {
              const eventDate = new Date(selectedEvent.data_inicio);
              const eventTypeColors: Record<string, string> = {
                reuniao: 'bg-blue-500/10 text-blue-700 border-blue-200',
                evento: 'bg-purple-500/10 text-purple-700 border-purple-200',
                audiencia: 'bg-green-500/10 text-green-700 border-green-200',
                sessao: 'bg-orange-500/10 text-orange-700 border-orange-200',
                outro: 'bg-gray-500/10 text-gray-700 border-gray-200'
              };
              const eventTypeLabels: Record<string, string> = {
                reuniao: 'Reunião',
                evento: 'Evento',
                audiencia: 'Audiência',
                sessao: 'Sessão',
                outro: 'Outro'
              };

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center border border-primary/20">
                      <span className="text-xs font-medium text-primary uppercase">
                        {eventDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {eventDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{selectedEvent.titulo}</h3>
                      <Badge
                        variant="outline"
                        className={`text-xs ${eventTypeColors[selectedEvent.tipo] || eventTypeColors.outro}`}
                      >
                        {eventTypeLabels[selectedEvent.tipo] || selectedEvent.tipo}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Data:</span>
                        <p className="mt-0.5">
                          {eventDate.toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }).split(',').map((part, i) => i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part).join(',')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Horário:</span>
                      <span>{eventDate.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>

                    {selectedEvent.local && (
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">Local:</span>
                          <p className="mt-0.5">{selectedEvent.local}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedEvent.descricao && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Descrição</h4>
                        <p className="text-sm text-muted-foreground">{selectedEvent.descricao}</p>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEventModalOpen(false)}>
                      Fechar
                    </Button>
                    <Button onClick={() => {
                      setEventModalOpen(false);
                      navigate('/agenda');
                    }}>
                      Ver na Agenda
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Index;
