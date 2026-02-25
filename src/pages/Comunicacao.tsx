import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Zap,
  Globe,
  Lock,
  Users,
  BarChart3,
  Share2,
  Target,
  MessageSquare,
  FileText
} from "lucide-react";

export default function Comunicacao() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="p-6 space-y-8">
          {/* Hero Header */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl mb-4">
              <Target className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Marketing Digital
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas de marketing digital para conectar-se com seus eleitores de forma estratégica e eficaz.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* WhatsApp Campaigns */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-card to-card/50 flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Campanhas WhatsApp</CardTitle>
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 mt-1">
                      Em breve
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Crie campanhas de envio em massa personalizadas para diferentes segmentos de eleitores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2 text-sm text-muted-foreground flex-1">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span>Mensagens personalizadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>Segmentação por bairro/região</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <span>Relatórios de entrega</span>
                  </div>
                </div>
                <Button disabled className="w-full cursor-not-allowed opacity-60 mt-auto">
                  <Lock className="h-4 w-4 mr-2" />
                  Criar Campanha
                </Button>
              </CardContent>
            </Card>

            {/* WhatsApp Automations */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-card to-card/50 flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Automações WhatsApp</CardTitle>
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 mt-1">
                      Em breve
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Configure fluxos automatizados de atendimento e respostas inteligentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2 text-sm text-muted-foreground flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span>Respostas automáticas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <span>Fluxos de conversação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Atendimento 24/7</span>
                  </div>
                </div>
                <Button disabled className="w-full cursor-not-allowed opacity-60 mt-auto">
                  <Lock className="h-4 w-4 mr-2" />
                  Configurar Automações
                </Button>
              </CardContent>
            </Card>

            {/* Public Page */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-card to-card/50 md:col-span-2 lg:col-span-1 flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Builder</CardTitle>
                     <Badge variant="default" className="text-xs bg-green-100 text-green-700 mt-1">
                       Disponível
                     </Badge>
                  </div>
                </div>
                <CardDescription>
                  Construa landing pages e formulários conectados ao seu gabinete para capturar eleitores, demandas e indicações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2 text-sm text-muted-foreground flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span>Formulário cidadão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    <span>Performance do gabinete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-purple-600" />
                    <span>Cores personalizáveis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purple-600" />
                    <span>Link para bio do Instagram</span>
                  </div>
                </div>
                 <Button className="w-full mt-auto" onClick={() => window.location.href = '/builder'}>
                   <Globe className="h-4 w-4 mr-2" />
                   Abrir Builder
                 </Button>
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon Section */}
          <div className="text-center py-8 px-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl">
            <h3 className="text-2xl font-semibold mb-3">Mais funcionalidades em desenvolvimento</h3>
            <p className="text-muted-foreground mb-4">
              Estamos trabalhando para trazer ainda mais ferramentas de comunicação digital para o seu gabinete
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline">Email Marketing</Badge>
              <Badge variant="outline">Redes Sociais</Badge>
              <Badge variant="outline">Analytics Avançado</Badge>
              <Badge variant="outline">Campanhas Meta</Badge>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
