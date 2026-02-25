import { useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAssessorIA } from "@/hooks/useAssessorIA";
import { useIntegrationsIA } from "@/hooks/useIntegrationsIA";
import { TelegramConnectionModal } from "@/components/modals/TelegramConnectionModal";
import {
  Bot,
  Calendar,
  Mail,
  Send,
  Smartphone,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Settings2,
  Lock,
  MessageCircle
} from "lucide-react";

interface IntegrationCardProps {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: "connected" | "disconnected" | "coming_soon";
  onClick?: () => void;
}

const IntegrationCard = ({ title, description, icon: Icon, status, onClick }: IntegrationCardProps) => {
  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-200 border-border/40 hover:border-primary/30 bg-white dark:bg-card/40 hover:bg-muted/5 dark:hover:bg-card/60",
      status === "coming_soon" && "opacity-60"
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              <Icon className={cn("h-4 w-4", status === "connected" ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-tight font-outfit uppercase text-foreground/90 leading-tight">
                {title}
              </CardTitle>
              <div className="flex items-center gap-1.5 mt-1">
                {status === "connected" && (
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                )}
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest",
                  status === "connected" ? "text-emerald-500" : "text-muted-foreground/50"
                )}>
                  {status === "connected" ? "Conectado" : status === "coming_soon" ? "Em breve" : "Desconectado"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4">
        <CardDescription className="text-[11px] leading-relaxed text-muted-foreground/70 font-medium">
          {description}
        </CardDescription>

        <div className="pt-1">
          {status === "disconnected" && (
            <Button
              size="sm"
              className="w-full h-8 rounded-lg gap-2 text-[10px] font-bold uppercase tracking-wider group/btn"
              onClick={onClick}
            >
              Conectar Agora
              <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          )}
          {status === "connected" && (
            <Button size="sm" variant="outline" className="w-full h-8 rounded-lg gap-2 text-[10px] font-bold uppercase tracking-wider border-border/60 hover:bg-muted/50">
              <Settings2 className="h-3 w-3" />
              Configurar
            </Button>
          )}
          {status === "coming_soon" && (
            <Button size="sm" disabled className="w-full h-8 rounded-lg gap-2 bg-muted/20 text-[10px] font-bold uppercase tracking-wider border-none">
              <Lock className="h-3 w-3" />
              Indisponível
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function AssessorIA() {
  const { nome: assessorNome } = useAssessorIA();
  const { integrations, connectGoogle, pairingCode } = useIntegrationsIA();
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);

  const integrationsData: IntegrationCardProps[] = [
    {
      id: "telegram",
      title: "Telegram Bot",
      description: "Crie um bot no Telegram e integre ao Assessor IA para notificações e comandos rápidos.",
      icon: Send,
      status: integrations.telegram_enabled ? "connected" : "disconnected",
      onClick: () => setTelegramModalOpen(true)
    },
    {
      id: "google-calendar",
      title: "Google Agenda",
      description: "Permita que o robô organize compromissos, agende reuniões e sincronize sua agenda.",
      icon: Calendar,
      status: integrations.google_enabled ? "connected" : "disconnected",
      onClick: connectGoogle
    },
    {
      id: "email",
      title: "Email Marketing",
      description: "Automatize o envio de newsletters e comunicações diretas com sua base por email.",
      icon: Mail,
      status: integrations.google_enabled ? "connected" : "disconnected",
      onClick: connectGoogle
    },
  ];

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row-reverse gap-6 lg:gap-8">

          {/* Sidebar - Card do Robô (Direita em Desktop) */}
          <aside className="w-full lg:w-[320px] shrink-0">
            <Card className="h-full border-border/40 bg-white dark:bg-card/40 overflow-hidden relative group/robot flex flex-col">
              {/* Background Glow */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50" />

              <CardHeader className="relative z-10 text-center pb-0">
                <Badge variant="outline" className="mx-auto w-fit mb-4 text-[7px] font-black uppercase tracking-[0.2em] border-primary/30 text-primary bg-primary/5 px-2">
                  Assessor Digital
                </Badge>
                <CardTitle className="text-2xl font-black font-outfit uppercase tracking-tighter text-foreground/90 leading-none">
                  {assessorNome}
                </CardTitle>
                <p className="text-[10px] text-muted-foreground/50 uppercase font-bold tracking-widest mt-1">
                  Inteligência Central
                </p>
              </CardHeader>

              <CardContent className="relative flex-1 flex flex-col items-center justify-center py-10 overflow-visible">
                {/* 3D Floating Icons Container */}
                <div className="relative w-full aspect-square max-w-[240px] flex items-center justify-center">

                  {/* Floating Elements / Icons - Symmetrical Distribution */}
                  <div className="absolute top-0 -left-4 animate-bounce [animation-duration:3s] z-20">
                    <div className="p-2 rounded-xl bg-white/90 dark:bg-background/80 border border-border/50 shadow-xl backdrop-blur-md">
                      <Send className="h-5 w-5 text-sky-500" />
                    </div>
                  </div>

                  <div className="absolute top-0 -right-4 animate-bounce [animation-duration:3.5s] z-20">
                    <div className="p-2 rounded-xl bg-white/90 dark:bg-background/80 border border-border/50 shadow-xl backdrop-blur-md">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>

                  <div className="absolute bottom-4 -left-6 animate-bounce [animation-duration:4s] z-20">
                    <div className="p-2 rounded-xl bg-white/90 dark:bg-background/80 border border-border/50 shadow-xl backdrop-blur-md">
                      <Mail className="h-5 w-5 text-red-400" />
                    </div>
                  </div>

                  <div className="absolute bottom-4 -right-6 animate-bounce [animation-duration:4.5s] z-20">
                    <div className="p-2 rounded-xl bg-white/90 dark:bg-background/80 border border-border/50 shadow-xl backdrop-blur-md">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>

                  {/* Robot Image with Glow and Gradient Fade at the Bottom */}
                  <div className="relative z-10 transform transition-transform duration-700 group-hover/robot:scale-110">
                    {/* Bottom Fade Gradient - Ensures smooth transition in both themes */}
                    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white dark:from-[#020817] via-white/50 dark:via-[#020817]/50 to-transparent z-20 pointer-events-none" />

                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-75 animate-pulse" />
                    <img
                      src="https://wvvxstgpjodmfxpekhkf.supabase.co/storage/v1/object/public/LEGISFY/assessor%20ia.png"
                      alt={assessorNome}
                      className="w-full h-auto drop-shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] relative z-10"
                    />
                  </div>
                </div>

                {/* Status Indicator inside Card */}
                <div className="mt-8 flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-2xl border border-border/10 backdrop-blur-sm">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Sistema Ativo</span>
                </div>
              </CardContent>

              {/* Decorative Footer */}
              <div className="p-6 border-t border-border/20 bg-muted/5">
                <p className="text-[9px] text-muted-foreground/60 leading-relaxed text-center font-medium uppercase tracking-wider">
                  Trabalhando em tempo real para otimizar sua gestão parlamentar.
                </p>
              </div>
            </Card>
          </aside>

          {/* Conteúdo Principal - Grid e Header */}
          <main className="flex-1 space-y-6">
            {/* Header Section match Indicacoes.tsx style */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h1 className="text-base font-bold tracking-tight text-foreground/80 font-outfit uppercase">
                    Conectar Assessor
                  </h1>
                  <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-bold border-border/60 text-muted-foreground bg-transparent uppercase tracking-[0.2em] rounded-full">
                    Hub de Conexões
                  </Badge>
                </div>
                <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-widest leading-none">
                  Sincronize sua inteligência com o mundo externo
                </p>
              </div>
            </div>

            {/* Integrations Grid - More compact grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {integrationsData.map((item) => (
                <IntegrationCard key={item.id} {...item} />
              ))}
            </div>

            {/* Info Card - Consistent with modern app tips */}
            <Card className="border-border/40 bg-white dark:bg-card/20 overflow-hidden group">
              <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <Sparkles className="h-5 w-5 text-primary/70 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold font-outfit uppercase tracking-tight text-foreground/80">Gestão Autônoma Habilitada</h3>
                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-2xl font-medium uppercase tracking-wider">
                      Ao conectar o robô, ele passa a ter autonomia para gerir rotinas e responder demandas em tempo real.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="h-9 rounded-xl gap-2 text-[10px] font-bold uppercase tracking-widest border-border/60 hover:bg-muted/50 group/doc">
                  Ver Documentação
                  <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/doc:translate-x-0.5 group-hover/doc:-translate-y-0.5" />
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <TelegramConnectionModal
        open={telegramModalOpen}
        onOpenChange={setTelegramModalOpen}
        pairingCode={pairingCode}
        botUsername="Legisfy_bot"
      />
    </AppLayout>
  );
}
