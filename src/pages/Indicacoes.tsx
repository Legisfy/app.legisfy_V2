import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { NewIndicationModal } from "@/components/modals/MultiStepIndicationModal";
import { FormalizarIndicacaoModal } from "@/components/modals/FormalizarIndicacaoModal";
import { ProtocolarIndicacaoModal } from "@/components/modals/ProtocolarIndicacaoModal";
import { IndicacoesFilters } from "@/components/indicacoes/IndicacoesFilters";
import { IndicacoesTable } from "@/components/indicacoes/IndicacoesTable";
import { IndicacaoDrawer } from "@/components/indicacoes/IndicacaoDrawer";
import { IndicacoesAnalises } from "@/components/indicacoes/IndicacoesAnalises";
import { IndicacoesCamara } from "@/components/indicacoes/IndicacoesCamara";
import { IndicacoesMap } from "@/components/indicacoes/IndicacoesMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  BarChart3,
  Kanban,
  MapPin,
  Filter,
  FileText,
  FileCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";

import { useRealIndicacoes } from "@/hooks/useRealIndicacoes";
import { useAuthContext } from "@/components/AuthProvider";
import { updateIndicacoesCoordinates } from "@/utils/geocodingUtils";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard } from "@/components/PermissionGuard";

const statusConfig = {
  todos: {
    title: "Todas",
    icon: Filter,
    color: "bg-gray-500",
    description: "Todas as indicações",
  },
  criada: {
    title: "Criadas",
    icon: FileText,
    color: "bg-blue-500",
    description: "Indicações criadas",
  },
  formalizada: {
    title: "Formalizadas",
    icon: FileCheck,
    color: "bg-purple-500",
    description: "Indicações formalizadas",
  },
  protocolada: {
    title: "Protocoladas",
    icon: Send,
    color: "bg-orange-500",
    description: "Indicações protocoladas",
  },
  pendente: {
    title: "Pendentes",
    icon: AlertCircle,
    color: "bg-yellow-500",
    description: "Indicações pendentes",
  },
  atendida: {
    title: "Atendidas",
    icon: CheckCircle2,
    color: "bg-green-500",
    description: "Indicações atendidas",
  },
};

export default function Indicacoes() {
  const { indicacoes, loading, createIndicacao, updateIndicacao, deleteIndicacao, advanceStatus, addObservation } = useRealIndicacoes();
  const { cabinet } = useAuthContext();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState("tabela");
  const [isNewIndicationModalOpen, setIsNewIndicationModalOpen] = useState(false);
  const [selectedIndicacao, setSelectedIndicacao] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormalizarModalOpen, setIsFormalizarModalOpen] = useState(false);
  const [isProtocolarModalOpen, setIsProtocolarModalOpen] = useState(false);
  const [filteredIndicacoes, setFilteredIndicacoes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [isGeocodingInProgress, setIsGeocodingInProgress] = useState(false);

  // Update filtered data when real data changes
  useEffect(() => {
    let filtered = indicacoes;

    // Apply status filter
    if (statusFilter !== "todos") {
      filtered = filtered.filter(indicacao => indicacao.status === statusFilter);
    }

    setFilteredIndicacoes(filtered);
  }, [indicacoes, statusFilter]);

  const handleFiltersChange = (filters: any) => {
    let filtered = indicacoes;

    // Apply status filter first
    if (statusFilter !== "todos") {
      filtered = filtered.filter(indicacao => indicacao.status === statusFilter);
    }

    // Filtro de busca
    if (filters.search) {
      filtered = filtered.filter(indicacao =>
        indicacao.titulo?.toLowerCase().includes(filters.search.toLowerCase()) ||
        indicacao.justificativa?.toLowerCase().includes(filters.search.toLowerCase()) ||
        indicacao.endereco_rua?.toLowerCase().includes(filters.search.toLowerCase()) ||
        indicacao.endereco_bairro?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filtro de autor
    if (filters.autor && filters.autor !== "todos") {
      filtered = filtered.filter((indicacao: any) =>
        indicacao.userName === filters.autor
      );
    }

    // Filtro de eleitor
    if (filters.eleitor && filters.eleitor !== "todos") {
      filtered = filtered.filter((indicacao: any) =>
        indicacao.eleitor_nome === filters.eleitor
      );
    }

    // Filtro de bairro
    if (filters.bairro && filters.bairro !== "todos") {
      filtered = filtered.filter((indicacao: any) =>
        indicacao.endereco_bairro === filters.bairro
      );
    }

    // Filtro de tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((indicacao: any) => {
        const tagValue = indicacao.tag;
        return filters.tags.includes(tagValue);
      });
    }

    // Filtro de data início
    if (filters.dataInicio) {
      filtered = filtered.filter(indicacao => {
        const dataIndicacao = new Date(indicacao.created_at);
        const dataFiltro = new Date(filters.dataInicio);
        return dataIndicacao >= dataFiltro;
      });
    }

    // Filtro de data fim
    if (filters.dataFim) {
      filtered = filtered.filter(indicacao => {
        const dataIndicacao = new Date(indicacao.created_at);
        const dataFiltro = new Date(filters.dataFim);
        return dataIndicacao <= dataFiltro;
      });
    }

    // Filtro de solicitação por eleitor
    if (filters.hasVoterRequest) {
      filtered = filtered.filter(indicacao => indicacao.eleitor_id);
    }

    setFilteredIndicacoes(filtered);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateIndicacao(id, { status: newStatus });
    } catch (error) {
      console.error('Error updating indicacao status:', error);
    }
  };

  const handleEdit = (indicacao: any) => {
    console.log("Editar indicação:", indicacao);
    // Implementar abertura do modal de edição
  };

  const handleView = (indicacao: any) => {
    setSelectedIndicacao(indicacao);
    setIsDrawerOpen(true);
  };

  const handleFormalizar = (indicacao: any) => {
    setSelectedIndicacao(indicacao);
    setIsFormalizarModalOpen(true);
  };

  const handleFormalizarConfirm = async (id: string, pdfUrl?: string) => {
    try {
      await advanceStatus(id, "formalizada", {
        pdf_url: pdfUrl,
        notes: "PDF gerado e formalizada"
      });
      setIsFormalizarModalOpen(false);
    } catch (error) {
      console.error('Error formalizing indicacao:', error);
    }
  };

  const handleProtocolarConfirm = async (id: string, protocolo: string, pdfUrl?: string) => {
    try {
      await advanceStatus(id, "pendente", {
        protocolo: protocolo,
        pdf_url: pdfUrl,
        notes: "Protocolada na câmara e enviada ao executivo"
      });
      setIsProtocolarModalOpen(false);
    } catch (error) {
      console.error('Error protocoling indicacao:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIndicacao(id);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error('Error deleting indicacao:', error);
    }
  };

  // Função para corrigir coordenadas das indicações existentes
  const handleFixCoordinates = async () => {
    if (!cabinet?.cabinet_id) {
      toast({
        title: "Erro",
        description: "ID do gabinete não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsGeocodingInProgress(true);

    try {
      const result = await updateIndicacoesCoordinates(cabinet.cabinet_id);

      toast({
        title: "Coordenadas atualizadas!",
        description: `${result.updated} indicações foram geocodificadas com sucesso. ${result.errors} erros encontrados.`,
      });

      // Recarregar dados após atualização
      window.location.reload();
    } catch (error) {
      console.error('Error updating coordinates:', error);
      toast({
        title: "Erro ao geocodificar",
        description: "Ocorreu um erro ao atualizar as coordenadas das indicações.",
        variant: "destructive",
      });
    } finally {
      setIsGeocodingInProgress(false);
    }
  };

  // Novas funções para automação de status
  const handleAdvanceStatus = async (id: string, newStatus: string, options?: { pdf_url?: string; protocolo?: string; notes?: string }) => {
    try {
      await advanceStatus(id, newStatus, options);
    } catch (error) {
      console.error(`Error advancing indicacao to ${newStatus}:`, error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Carregando indicações...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PermissionGuard module="indicacoes">
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-base font-bold tracking-tight text-foreground/80 font-outfit uppercase">Indicações</h1>
                <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-bold border-border/60 text-muted-foreground bg-transparent uppercase tracking-[0.2em] rounded-full">
                  Mandato Ativo
                </Badge>
              </div>
              <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-widest leading-none">
                Gestão estratégica e acompanhamento territorial
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl mr-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-transparent border-none">
                  <TabsList className="bg-transparent h-8 p-0 gap-1">
                    <TabsTrigger value="tabela" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Tabela</TabsTrigger>
                    <TabsTrigger value="camara" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Câmara</TabsTrigger>
                    <TabsTrigger value="analises" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Análises</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {hasPermission('indicacoes', 'write') ? (
                <Button
                  onClick={() => setIsNewIndicationModalOpen(true)}
                  variant="success"
                  className="h-10 px-4 gap-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nova Indicação</span>
                </Button>
              ) : (
                <Badge variant="secondary" className="h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-muted/50 border-none">
                  Apenas Visualização
                </Badge>
              )}
            </div>
          </div>

          {/* Filtros */}
          <IndicacoesFilters
            onFiltersChange={handleFiltersChange}
            totalIndicacoes={filteredIndicacoes.length}
            indicacoes={indicacoes}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />



          {/* Tab Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="tabela" className="space-y-4">
              <IndicacoesTable
                indicacoes={filteredIndicacoes}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onFormalizar={handleFormalizar}
                onProtocolar={(id, protocol) => handleAdvanceStatus(id, "protocolada", { protocolo: protocol, notes: "Protocolada na câmara" })}
                onEnviarExecutivo={(id) => handleAdvanceStatus(id, "pendente", { notes: "Enviada ao executivo" })}
                onMarcarAtendida={(id) => handleAdvanceStatus(id, "atendida", { notes: "Atendida pelo executivo" })}
              />
            </TabsContent>

            <TabsContent value="camara" className="space-y-4">
              <IndicacoesCamara
                cityName={cabinet?.city_name}
                politicianName={cabinet?.cabinet_name?.replace('Gabinete do ', '')}
              />
            </TabsContent>

            <TabsContent value="analises" className="space-y-4">
              <IndicacoesAnalises
                onBack={() => setActiveTab("tabela")}
                indicacoes={filteredIndicacoes}
                cityName={cabinet?.city_name}
              />
            </TabsContent>

          </Tabs>

          {/* Modal Nova Indicação */}
          <NewIndicationModal
            open={isNewIndicationModalOpen}
            onOpenChange={setIsNewIndicationModalOpen}
            createIndicacao={createIndicacao}
          />

          {/* Modal Formalizar */}
          <FormalizarIndicacaoModal
            indicacao={selectedIndicacao}
            open={isFormalizarModalOpen}
            onOpenChange={setIsFormalizarModalOpen}
            onFormalizar={handleFormalizarConfirm}
          />

          {/* Modal Protocolar */}
          <ProtocolarIndicacaoModal
            indicacao={selectedIndicacao}
            open={isProtocolarModalOpen}
            onOpenChange={setIsProtocolarModalOpen}
            onProtocolar={handleProtocolarConfirm}
          />

          {/* Drawer de Detalhes */}
          <IndicacaoDrawer
            indicacao={selectedIndicacao}
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
            onEdit={handleEdit}
            onAdvanceStatus={handleAdvanceStatus}
            onUpdate={updateIndicacao}
            onAddObservation={addObservation}
            onFormalizar={(indicacao) => {
              setIsDrawerOpen(false);
              setSelectedIndicacao(indicacao);
              setIsFormalizarModalOpen(true);
            }}
            onProtocolar={(indicacao) => {
              setSelectedIndicacao(indicacao);
              setIsProtocolarModalOpen(true);
            }}
          />
        </div>
      </PermissionGuard>
    </AppLayout>
  );
}