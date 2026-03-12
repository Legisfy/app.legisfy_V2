import { AppLayout } from "@/components/layouts/AppLayout";
import { LogoUploadCard } from "@/components/configuracoes/LogoUploadCard";
import { PremiacoesCard } from "@/components/configuracoes/PremiacoesCard";
import { GabineteAssinaturaCard } from "@/components/configuracoes/GabineteAssinaturaCard";
import { useAuthContext } from "@/components/AuthProvider";
import { Briefcase, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppConfigCard } from "@/components/configuracoes/WhatsAppConfigCard";
import { AssessorIACard } from "@/components/configuracoes/AssessorIACard";
import { DocumentTemplatesCard } from "@/components/configuracoes/DocumentTemplatesCard";

export default function ConfiguracoesSimples() {
  const { cabinet } = useAuthContext();

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-5">
        {/* Header compacto */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Meu Gabinete</h1>
              <p className="text-xs text-muted-foreground">
                Gerencie identidade, metas e inteligência do seu mandato
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground leading-none">
                {cabinet?.user_role === 'politico' ? 'Vereador' : cabinet?.user_role || 'Carregando...'}
              </p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                {cabinet?.cabinet_name || "Carregando..."}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="bg-muted/10 p-1 border border-border/20 rounded-xl h-auto gap-1">
            <TabsTrigger 
              value="geral" 
              className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:border-border/40 data-[state=active]:shadow-sm"
            >
              Geral
            </TabsTrigger>
            <TabsTrigger 
              value="assinatura" 
              className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:border-border/40 data-[state=active]:shadow-sm"
            >
              Minha Assinatura
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Cards — grid de 2 colunas para Geral */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LogoUploadCard />
              <PremiacoesCard />
            </div>
            
            {/* Integração WhatsApp Dedicado */}
            <div className="col-span-full">
              <WhatsAppConfigCard />
            </div>

            {/* Meu Assessor IA */}
            <div className="col-span-full">
              <AssessorIACard />
            </div>

            {/* Modelos Inteligentes de Documentos */}
            <div className="col-span-full">
              <DocumentTemplatesCard />
            </div>
          </TabsContent>

          <TabsContent value="assinatura" className="animate-in fade-in-50 slide-in-from-bottom-5 duration-400">
            <div className="max-w-4xl">
              <GabineteAssinaturaCard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}