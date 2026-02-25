import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedVoterModal } from "@/components/modals/EnhancedVoterModal";
import { ViewEleitorModal } from "@/components/modals/ViewEleitorModal";
import { EditEleitorModal } from "@/components/modals/EditEleitorModal";
import { EleitoresMap } from "@/components/maps/EleitoresMap";
import { EleitoresAnalytics } from "@/components/analytics/EleitoresAnalytics";
import { SpreadsheetImport } from "@/components/import/SpreadsheetImport";
import { exportFilteredEleitores, EleitorExport } from "@/utils/exportUtils";
import { getAvatarColor, getAvatarInitials } from "@/utils/avatarUtils";
import { StatsCard } from "@/components/ui/standard-card";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MessageCircle,
  Map,
  BarChart3,
  MapPin,
  Upload,
  Download,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Cake,
  MoreVertical,
  ChevronRight,
  SlidersHorizontal,
  Mail,
  MoreHorizontal,
  Zap
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useEleitoresWithStats } from "@/hooks/useEleitoresWithStats";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard } from "@/components/PermissionGuard";

const sexos = ["Sexo", "MASCULINO", "FEMININO", "NAO_BINARIO"];
const atendimentos = ["Status Demanda", "Atendidos", "Não Atendidos"];

export default function Eleitores() {
  const { eleitores, loading, error } = useEleitoresWithStats();
  const { activeInstitution } = useActiveInstitution();
  const { hasPermission } = usePermissions();

  console.log('🟣 Eleitores component render:', {
    eleitoresCount: eleitores.length,
    eleitoresData: eleitores,
    loading,
    error,
    activeInstitution,
    cabinet_id: activeInstitution?.cabinet_id
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBairro, setSelectedBairro] = useState("Bairro");
  const [selectedTag, setSelectedTag] = useState("Tag");
  const [selectedSexo, setSelectedSexo] = useState("Sexo");
  const [selectedAtendimento, setSelectedAtendimento] = useState("Status Demanda");
  const [selectedPublico, setSelectedPublico] = useState("Público");
  const [publicos, setPublicos] = useState<any[]>([]);
  const [showNewVoterModal, setShowNewVoterModal] = useState(false);
  const [selectedEleitor, setSelectedEleitor] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch públicos
  useEffect(() => {
    if (activeInstitution?.cabinet_id) {
      const fetchPublicos = async () => {
        const { data } = await supabase
          .from('publicos')
          .select('*')
          .eq('gabinete_id', activeInstitution.cabinet_id)
          .eq('is_active', true)
          .order('nome');

        if (data) setPublicos(data);
      };
      fetchPublicos();
    }
  }, [activeInstitution?.cabinet_id]);

  // Extract unique values from real data - filter out empty strings
  const bairros = ["Bairro", ...Array.from(new Set(eleitores.map(e => e.neighborhood).filter(b => b && b.trim() !== '')))];
  const tags = ["Tag", ...Array.from(new Set(eleitores.flatMap(e => e.tags || []).filter(t => t && t.trim() !== '')))];

  // Filter eleitores based on search and filters
  const filteredEleitores = eleitores.filter(eleitor => {
    // Apply público filter first if selected
    if (selectedPublico !== "Público") {
      const publico = publicos.find(p => p.nome === selectedPublico);
      if (publico && publico.filtros) {
        const filtros = publico.filtros;
        const today = new Date();

        // Check sexo
        if (filtros.sexo && eleitor.sex !== filtros.sexo) return false;

        // Check neighborhood
        if (filtros.neighborhood && eleitor.neighborhood !== filtros.neighborhood) return false;

        // Check isLeader
        if (filtros.isLeader !== undefined && (eleitor as any).is_leader !== filtros.isLeader) return false;

        // Check profession
        if (filtros.profession && eleitor.profession !== filtros.profession) return false;

        // Check age range
        if ((filtros.minAge || filtros.maxAge) && eleitor.birth_date) {
          const birthDate = new Date(eleitor.birth_date);
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ? age - 1
            : age;

          if (filtros.minAge && adjustedAge < filtros.minAge) return false;
          if (filtros.maxAge && adjustedAge > filtros.maxAge) return false;
        }

        // Check birthday month
        if (filtros.birthdayMonth && eleitor.birth_date) {
          const birthMonth = new Date(eleitor.birth_date).getMonth() + 1;
          if (birthMonth !== filtros.birthdayMonth) return false;
        }
      }
    }

    // Apply other filters
    const matchesSearch = eleitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eleitor.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBairro = selectedBairro === "Bairro" || eleitor.neighborhood === selectedBairro;
    const matchesTag = selectedTag === "Tag" || (eleitor.tags && eleitor.tags.includes(selectedTag));
    const matchesSexo = selectedSexo === "Sexo"; // Always true for now
    const matchesAtendimento = selectedAtendimento === "Status Demanda"; // Always true for now

    return matchesSearch && matchesBairro && matchesTag && matchesSexo && matchesAtendimento;
  });

  const handleWhatsApp = (telefone: string, nome: string) => {
    const cleanPhone = telefone.replace(/\D/g, '');
    const message = `Olá ${nome}, tudo bem?`;
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleViewEleitor = (eleitor: any) => {
    setSelectedEleitor(eleitor);
    setShowViewModal(true);
  };

  const handleEditEleitor = (eleitor: any) => {
    setSelectedEleitor(eleitor);
    setShowEditModal(true);
  };

  const handleExport = () => {
    const exportData: EleitorExport[] = filteredEleitores.map((eleitor, index) => ({
      id: index + 1, // Use numeric ID for export
      nome: eleitor.name,
      email: eleitor.email || '',
      telefone: eleitor.whatsapp,
      endereco: eleitor.address,
      bairro: eleitor.neighborhood,
      sexo: eleitor.sex || 'N/A',
      profissao: eleitor.profession || 'N/A',
      tags: eleitor.tags || [],
      indicacoes: eleitor.totalIndicacoes || 0,
      demandas: eleitor.totalDemandas || 0,
      indicacoesAtendidas: eleitor.indicacoesAtendidas || 0,
      demandasAtendidas: eleitor.demandasAtendidas || 0,
    }));

    exportFilteredEleitores(exportData, searchTerm, selectedBairro, selectedTag);
  };

  const getMissingData = (eleitor: any) => {
    const missingFields = [];

    if (!eleitor.name) missingFields.push("Nome");
    if (!eleitor.whatsapp) missingFields.push("WhatsApp");
    if (!eleitor.email) missingFields.push("Email");
    if (!eleitor.address) missingFields.push("Endereço");
    if (!eleitor.neighborhood) missingFields.push("Bairro");
    if (!eleitor.birth_date) missingFields.push("Data de nascimento");
    if (!eleitor.sex) missingFields.push("Sexo");
    if (!eleitor.profession) missingFields.push("Profissão");
    if (!eleitor.cep) missingFields.push("CEP");

    return missingFields;
  };

  const getStatusTag = (eleitor: any) => {
    if (eleitor.totalDemandas === 0 && eleitor.totalIndicacoes === 0) {
      return null; // Sem demandas/indicações
    }

    if (eleitor.isAtendido) {
      return (
        <div className="flex items-center gap-1">
          <span className="text-lg">😊</span>
          <Badge variant="outline" className="text-green-600 border-green-600">
            Atendido
          </Badge>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <span className="text-lg">😠</span>
          <Badge variant="outline" className="text-red-600 border-red-600">
            Não Atendido
          </Badge>
        </div>
      );
    }
  };


  return (
    <AppLayout>
      <PermissionGuard module="eleitores">
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-base font-bold tracking-tight text-foreground/80 font-outfit uppercase">Eleitores</h1>
                <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-bold border-border/60 text-muted-foreground bg-transparent uppercase tracking-[0.2em] rounded-full">
                  Base de Influência
                </Badge>
              </div>
              <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-widest leading-none">
                Gerencie e analise sua base de influência política e territorial
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl mr-2">
                <Tabs value={showAnalytics ? "analises" : "tabela"} onValueChange={(v) => {
                  if (v === "analises") {
                    setShowAnalytics(true);
                  } else {
                    setShowAnalytics(false);
                  }
                }} className="bg-transparent border-none">
                  <TabsList className="bg-transparent h-8 p-0 gap-1">
                    <TabsTrigger value="tabela" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Tabela</TabsTrigger>
                    <TabsTrigger value="analises" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Análises</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {hasPermission('eleitores', 'write') && (
                <Button
                  onClick={() => setShowNewVoterModal(true)}
                  variant="success"
                  className="h-10 px-4 gap-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Novo Eleitor</span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 px-3 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[9px] tracking-widest">
                    <MoreHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
                    Ferramentas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  {hasPermission('eleitores', 'write') && (
                    <DropdownMenuItem onClick={() => setShowImportModal(true)} className="py-2.5 cursor-pointer">
                      <Upload className="w-4 h-4 mr-3 text-zinc-500" />
                      <span className="font-medium">Importar Dados</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleExport} className="py-2.5 cursor-pointer">
                    <Download className="w-4 h-4 mr-3 text-zinc-500" />
                    <span className="font-medium">Exportar Relatório</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatsCard
              title="Total"
              value={eleitores.length.toString()}
              icon={Users}
              iconColor="text-blue-500"
              iconBgColor="bg-blue-500/10"
            />
            <StatsCard
              title="Atendidos"
              value={eleitores.filter(e => e.isAtendido).length.toString()}
              icon={CheckCircle}
              iconColor="text-emerald-500"
              iconBgColor="bg-emerald-500/10"
              change={`${((eleitores.filter(e => e.isAtendido).length / (eleitores.length || 1)) * 100).toFixed(0)}%`}
            />
            <StatsCard
              title="Lideranças"
              value={eleitores.filter(e => (e as any).is_leader).length.toString()}
              icon={Zap}
              iconColor="text-purple-500"
              iconBgColor="bg-purple-500/10"
              change={`${((eleitores.filter(e => (e as any).is_leader).length / (eleitores.length || 1)) * 100).toFixed(0)}%`}
            />
            <StatsCard
              title="Pendentes"
              value={eleitores.filter(e => getMissingData(e).length > 0).length.toString()}
              icon={AlertTriangle}
              iconColor="text-amber-500"
              iconBgColor="bg-amber-500/10"
            />
            <StatsCard
              title="Aniversários"
              value={(() => {
                const currentMonth = new Date().getMonth();
                return eleitores.filter(e => e.birth_date && new Date(e.birth_date).getMonth() === currentMonth).length.toString();
              })()}
              icon={Cake}
              iconColor="text-rose-500"
              iconBgColor="bg-rose-500/10"
            />
            <StatsCard
              title="Demandas Pendentes"
              value={eleitores.filter(e => !e.isAtendido && (e.totalDemandas > 0 || e.totalIndicacoes > 0)).length.toString()}
              icon={XCircle}
              iconColor="text-zinc-400"
              iconBgColor="bg-zinc-500/10"
            />
          </div>

          {/* Tab Content */}
          <Tabs value={showAnalytics ? "analises" : "tabela"} className="space-y-6">
            <TabsContent value="tabela" className="space-y-6 mt-0 border-none p-0 outline-none">
              {/* Content Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Busque por nome, bairro ou palavra-chave..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-14 bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-white/5 shadow-sm rounded-2xl text-lg font-medium transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className={cn(
                          "h-14 px-6 rounded-2xl border-zinc-200 dark:border-white/5 font-bold transition-all",
                          (selectedBairro !== "Bairro" || selectedTag !== "Tag" || selectedSexo !== "Sexo" || selectedAtendimento !== "Status Demanda" || selectedPublico !== "Público") && "bg-primary/5 border-primary/20 text-primary"
                        )}
                      >
                        <SlidersHorizontal className="w-5 h-5 mr-3" />
                        Filtros
                        {(selectedBairro !== "Bairro" || selectedTag !== "Tag" || selectedSexo !== "Sexo" || selectedAtendimento !== "Status Demanda" || selectedPublico !== "Público") && (
                          <Badge className="ml-2 bg-primary">Ativos</Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-none shadow-2xl">
                      <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                        <SheetHeader className="space-y-1">
                          <SheetTitle className="text-3xl font-black">Refinar Busca</SheetTitle>
                          <SheetDescription className="font-medium">
                            Combine filtros para encontrar públicos específicos
                          </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6 bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-3xl">
                          {/* Filter Selects ... (keeping the same implementation) */}
                          <div className="space-y-3">
                            <label className="text-sm font-black uppercase tracking-widest text-zinc-500">Bairro</label>
                            <Select value={selectedBairro} onValueChange={setSelectedBairro}>
                              <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-zinc-900">
                                <SelectValue placeholder="Selecione o bairro" />
                              </SelectTrigger>
                              <SelectContent>
                                {bairros.map(bairro => (
                                  <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {/* ... rest of selects (shortened for brevity in thought, but must be complete in tool call) */}
                          <div className="space-y-3">
                            <label className="text-sm font-black uppercase tracking-widest text-zinc-500">Tag / Classificação</label>
                            <Select value={selectedTag} onValueChange={setSelectedTag}>
                              <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-zinc-900">
                                <SelectValue placeholder="Selecione a tag" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {tags.map(tag => (
                                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-black uppercase tracking-widest text-zinc-500">Gênero</label>
                            <Select value={selectedSexo} onValueChange={setSelectedSexo}>
                              <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-zinc-900">
                                <SelectValue placeholder="Selecione o gênero" />
                              </SelectTrigger>
                              <SelectContent>
                                {sexos.map(sexo => (
                                  <SelectItem key={sexo} value={sexo}>{sexo}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-black uppercase tracking-widest text-zinc-500">Status de Demanda</label>
                            <Select value={selectedAtendimento} onValueChange={setSelectedAtendimento}>
                              <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-zinc-900">
                                <SelectValue placeholder="Selecione o status de demanda" />
                              </SelectTrigger>
                              <SelectContent>
                                {atendimentos.map(atendimento => (
                                  <SelectItem key={atendimento} value={atendimento}>{atendimento}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-black uppercase tracking-widest text-zinc-500">Público Personalizado</label>
                            <Select value={selectedPublico} onValueChange={setSelectedPublico}>
                              <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-zinc-900">
                                <SelectValue placeholder="Selecione o público" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Público">Todos os Públicos</SelectItem>
                                {publicos.map(publico => (
                                  <SelectItem key={publico.id} value={publico.nome}>{publico.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-white/5 space-y-3">
                        <Button
                          className="w-full h-14 rounded-2xl font-bold text-lg"
                          onClick={() => setIsFilterOpen(false)}
                        >
                          Ver {filteredEleitores.length} Resultados
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-zinc-500 font-bold"
                          onClick={() => {
                            setSelectedBairro("Bairro");
                            setSelectedTag("Tag");
                            setSelectedSexo("Sexo");
                            setSelectedAtendimento("Status Demanda");
                            setSelectedPublico("Público");
                          }}
                        >
                          Limpar Todos os Filtros
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="flex items-center justify-between text-sm px-2">
                  <div className="font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    Mostrando {filteredEleitores.length} de {eleitores.length} eleitores
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredEleitores.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 dark:bg-zinc-900/20 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-white/5">
                      <Search className="w-10 h-10 text-muted-foreground mb-4 opacity-20" />
                      <h3 className="text-xl font-bold">Nenhum eleitor encontrado</h3>
                    </div>
                  ) : (
                    filteredEleitores.map((eleitor) => (
                      <div
                        key={eleitor.id}
                        className="group relative flex flex-col md:flex-row md:items-center justify-between p-3 bg-white dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-white/5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border border-white dark:border-zinc-800 shadow-sm transition-transform duration-500 group-hover:scale-105">
                              <AvatarImage src={eleitor.profile_photo_url || ''} alt={eleitor.name} />
                              <AvatarFallback className={cn(
                                "text-white font-bold text-lg",
                                !eleitor.profile_photo_url ? getAvatarColor(eleitor.sex) : ""
                              )}>
                                {getAvatarInitials(eleitor.name)}
                              </AvatarFallback>
                            </Avatar>
                            {(eleitor as any).is_leader && (
                              <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-purple-500 rounded-full border border-white dark:border-zinc-900 shadow-lg">
                                <Zap className="w-2.5 h-2.5 text-white fill-current" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                className="text-base font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleViewEleitor(eleitor)}
                              >
                                {eleitor.name}
                              </h3>
                              {getStatusTag(eleitor)}
                              {getMissingData(eleitor).length > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-center p-1 bg-amber-500/10 rounded-full cursor-help">
                                        <AlertTriangle className="h-3 w-3 text-amber-600 animate-pulse" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-amber-50 border-amber-200 text-amber-900 p-2 rounded-xl">
                                      <p className="text-[10px] font-bold uppercase tracking-tight mb-1">Dados Faltantes:</p>
                                      <ul className="text-[9px] list-disc list-inside opacity-80">
                                        {getMissingData(eleitor).map(field => (
                                          <li key={field}>{field}</li>
                                        ))}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-medium text-muted-foreground">
                              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                <MapPin className="w-3 h-3" />
                                {eleitor.neighborhood}
                              </div>
                              {eleitor.profession && <div className="flex items-center gap-1 opacity-80"><Users className="w-3 h-3" />{eleitor.profession}</div>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mt-2 md:mt-0">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                            onClick={() => handleViewEleitor(eleitor)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-amber-500/10 hover:text-amber-600 transition-all shadow-sm"
                            onClick={() => handleEditEleitor(eleitor)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all shadow-sm"
                            onClick={() => handleWhatsApp(eleitor.whatsapp, eleitor.name)}
                          >
                            <MessageCircle className="w-4 h-4 fill-current" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analises" className="space-y-6 mt-0 border-none p-0 outline-none">
              <EleitoresAnalytics onBack={() => setShowAnalytics(false)} />
            </TabsContent>

          </Tabs>

          {/* Modals */}
          <EnhancedVoterModal
            open={showNewVoterModal}
            onOpenChange={setShowNewVoterModal}
          />

          <ViewEleitorModal
            open={showViewModal}
            onOpenChange={setShowViewModal}
            eleitor={selectedEleitor}
          />

          <EditEleitorModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            eleitor={selectedEleitor}
          />


          <SpreadsheetImport
            open={showImportModal}
            onOpenChange={setShowImportModal}
          />
        </div>
      </PermissionGuard>
    </AppLayout>
  );
}