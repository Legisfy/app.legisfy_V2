import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemandasTable, type Demanda } from "@/components/demandas/DemandasTable";
import { DemandasFilters } from "@/components/demandas/DemandasFilters";
import { DemandasDashboard } from "@/components/demandas/DemandasDashboard";
import { NewDemandModal } from "@/components/modals/MultiStepDemandModal";
import { UpdatedViewDemandaModal } from "@/components/modals/UpdatedViewDemandaModal";
import { DemandasKanban } from "@/components/demandas/DemandasKanban";
import { AddDemandaUpdateModal } from "@/components/modals/AddDemandaUpdateModal";
import { Plus, Users, Clock, CheckCircle, AlertCircle, BarChart3, Kanban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealDemandas } from "@/hooks/useRealDemandas";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function Demandas() {
  const { toast } = useToast();
  const { demandas, loading, createDemanda, updateDemanda, deleteDemanda, fetchDemandas } = useRealDemandas();
  const { hasPermission } = usePermissions();
  const [isNewDemandaModalOpen, setIsNewDemandaModalOpen] = useState(false);
  const [selectedDemanda, setSelectedDemanda] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedDemandaForUpdate, setSelectedDemandaForUpdate] = useState<any>(null);

  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [tagFilter, setTagFilter] = useState("todas");

  // Map database fields to expected format for components
  const mappedDemandas = demandas.map((d: any) => ({
    id: d.id,
    titulo: d.titulo || d.title,
    descricao: d.descricao || d.description,
    autor: d.autor || 'Sistema',
    eleitorSolicitante: d.eleitorSolicitante || 'Eleitor não informado',
    dataHora: d.dataHora || new Date(d.created_at),
    tag: d.tag || 'Geral',
    status: (d.status === 'pendente' || d.status === 'em_atendimento' || d.status === 'resolvida' || d.status === 'cancelada')
      ? d.status as "pendente" | "em_atendimento" | "resolvida" | "cancelada"
      : 'pendente' as const,
    tipo: 'geral' as const,
    priority: d.priority || 'media',
    data_limite: d.data_limite ? new Date(d.data_limite) : undefined,
    // Pass through the relational data
    author: d.author,
    eleitor: d.eleitor,
    tag_relation: d.tag_relation,
    categoria: d.categoria,
    // Add database fields for proper display
    category_name: d.demand_categories?.name || 'Geral',
    category_id: d.category_id,
    tag_id: d.tag_id,
    user_id: d.user_id,
    eleitor_id: d.eleitor_id,
  }));

  // Demandas filtradas
  const filteredDemandas = useMemo(() => {
    return mappedDemandas.filter((demanda) => {
      const matchesSearch = searchTerm === "" ||
        demanda.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demanda.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demanda.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demanda.eleitorSolicitante.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "todos" || demanda.status === statusFilter;
      const matchesTipo = tipoFilter === "todos" || demanda.tipo === tipoFilter;
      const matchesTag = tagFilter === "todas" || demanda.tag === tagFilter;

      return matchesSearch && matchesStatus && matchesTipo && matchesTag;
    });
  }, [mappedDemandas, searchTerm, statusFilter, tipoFilter, tagFilter]);

  // Tags disponíveis
  const availableTags = useMemo(() => {
    const tags = mappedDemandas.map(d => d.tag);
    return Array.from(new Set(tags)).sort();
  }, [mappedDemandas]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: mappedDemandas.length,
      pendentes: mappedDemandas.filter(d => d.status === "pendente").length,
      emAndamento: mappedDemandas.filter(d => d.status === "em_atendimento").length,
      resolvidas: mappedDemandas.filter(d => d.status === "resolvida").length,
    };
  }, [mappedDemandas]);

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "todos" || tipoFilter !== "todos" || tagFilter !== "todas";

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("todos");
    setTipoFilter("todos");
    setTagFilter("todas");
  };

  const handleNewDemanda = async (novaDemanda: Omit<Demanda, "id" | "dataHora">) => {
    try {
      await createDemanda({
        description: novaDemanda.descricao,
        status: novaDemanda.status
      });
      toast({
        title: "Sucesso",
        description: "Demanda criada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleAddUpdate = (demanda: any) => {
    setSelectedDemandaForUpdate(demanda);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSuccess = async () => {
    // Atualiza dados sem recarregar a página
    await fetchDemandas();
    toast({ title: "Demanda atualizada", description: "Dados atualizados." });
  };

  const handleView = (demanda: any) => {
    setSelectedDemanda(demanda);
    setIsViewModalOpen(true);
  };

  const handleEdit = (demanda: any) => {
    toast({
      title: "Editar demanda",
      description: `Editando demanda: ${demanda.titulo}`,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDemanda(id);
      toast({
        title: "Demanda excluída",
        description: "A demanda foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (id: string, novoStatus: string) => {
    try {
      await updateDemanda(id, { status: novoStatus });
      toast({
        title: "Status atualizado",
        description: `Status da demanda alterado para: ${novoStatus}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Carregando demandas...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PermissionGuard module="demandas">
        <div className="p-6 space-y-6">
          <Tabs defaultValue="kanban" className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-base font-bold tracking-tight text-foreground/80 font-outfit uppercase">Demandas</h1>
                  <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-bold border-border/60 text-muted-foreground bg-transparent uppercase tracking-[0.2em] rounded-full">
                    Gestão de Crises
                  </Badge>
                </div>
                <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-widest leading-none">
                  Gerencie e acompanhe todas as demandas e solicitações dos eleitores
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-muted/30 p-1 rounded-xl">
                  <TabsList className="bg-transparent h-8 p-0 gap-1">
                    <TabsTrigger value="kanban" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      Kanban
                    </TabsTrigger>
                    <TabsTrigger value="gerenciar" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      Lista
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      Dashboard
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex items-center gap-2">
                  {hasPermission('demandas', 'write') ? (
                    <Button
                      onClick={() => setIsNewDemandaModalOpen(true)}
                      variant="success"
                      className="h-10 px-4 gap-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Nova Demanda</span>
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-muted/50 border-none">
                      Apenas Visualização
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border border-border/60 bg-card/95 dark:bg-card/10 rounded-2xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Total
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground font-outfit">
                    {stats.total}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/95 dark:bg-card/10 rounded-2xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Pendentes
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground font-outfit">
                    {stats.pendentes}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/95 dark:bg-card/10 rounded-2xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Em Andamento
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-sky-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground font-outfit">
                    {stats.emAndamento}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/95 dark:bg-card/10 rounded-2xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Resolvidas
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground font-outfit">
                    {stats.resolvidas}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <div className="bg-card/50 border border-border/40 p-4 rounded-xl">
              <DemandasFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                tipoFilter={tipoFilter}
                onTipoFilterChange={setTipoFilter}
                tagFilter={tagFilter}
                onTagFilterChange={setTagFilter}
                availableTags={availableTags}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            <TabsContent value="kanban" className="space-y-6 mt-0 border-none p-0 outline-none">
              <DemandasKanban
                demandas={filteredDemandas}
                onView={handleView}
                onAddUpdate={handleAddUpdate}
              />
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6 mt-0 border-none p-0 outline-none">
              <Card className="border-border/40 shadow-none bg-card/50">
                <CardHeader className="pb-3 px-6">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-outfit flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 opacity-40" />
                    Analytics de Demandas
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <DemandasDashboard demandas={filteredDemandas} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gerenciar" className="space-y-6 mt-0 border-none p-0 outline-none">
              <Card className="border-border/40 shadow-none bg-card/50">
                <CardHeader className="pb-3 px-6">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-outfit">
                    Demandas Registradas ({filteredDemandas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 p-0">
                  <DemandasTable
                    demandas={filteredDemandas}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Modals */}
          <NewDemandModal
            open={isNewDemandaModalOpen}
            onOpenChange={setIsNewDemandaModalOpen}
          />

          <UpdatedViewDemandaModal
            open={isViewModalOpen}
            onOpenChange={setIsViewModalOpen}
            demanda={selectedDemanda}
            onSuccess={handleUpdateSuccess}
          />

          <AddDemandaUpdateModal
            open={isUpdateModalOpen}
            onOpenChange={setIsUpdateModalOpen}
            demanda={selectedDemandaForUpdate}
            onSuccess={handleUpdateSuccess}
          />
        </div>
      </PermissionGuard>
    </AppLayout >
  );
}
