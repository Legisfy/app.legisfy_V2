import { useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Bell, TrendingUp, Search, UserMinus, Send, BarChart3, Settings } from "lucide-react";
import { AddAssessorModal } from "@/components/modals/AddAssessorModal";
import { AvisoModal } from "@/components/modals/AvisoModal";
import { ExonerarAssessorModal } from "@/components/modals/ExonerarAssessorModal";
import { ConvitesModal } from "@/components/modals/ConvitesModal";
import { AssessorPerformanceModal } from "@/components/modals/AssessorPerformanceModal";
import { AssessoresReport } from "@/components/assessores/AssessoresReport";
import { ManagePermissionsModal } from "@/components/modals/ManagePermissionsModal";
import { useAssessores } from "@/hooks/useAssessores";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const Assessores = () => {
  const { assessores, loading, refetch } = useAssessores();
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAvisoModalOpen, setIsAvisoModalOpen] = useState(false);
  const [isExonerarModalOpen, setIsExonerarModalOpen] = useState(false);
  const [isConvitesModalOpen, setIsConvitesModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [assessorToExonerar, setAssessorToExonerar] = useState<{ id: string; nome: string } | null>(null);
  const [selectedAssessor, setSelectedAssessor] = useState<any>(null);

  const getRankingColor = (ranking: number) => {
    switch (ranking) {
      case 1:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 2:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case 3:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getRankingEmoji = (ranking: number) => {
    switch (ranking) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏅";
    }
  };

  const handleExonerar = (assessor: { id: string; nome: string }) => {
    setAssessorToExonerar(assessor);
    setIsExonerarModalOpen(true);
  };

  const handleConfirmExonerar = (assessorId: string) => {
    refetch();
  };

  const handleVerDesempenho = (assessor: any) => {
    setSelectedAssessor(assessor);
    setIsPerformanceModalOpen(true);
  };

  const handleGerenciarPermissoes = (assessor: any) => {
    setSelectedAssessor(assessor);
    setIsPermissionsModalOpen(true);
  };

  // Filtrar assessores por nome
  const filteredAssessores = assessores.filter(assessor =>
    assessor.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Assessores</h1>
            <p className="text-muted-foreground">
              Gerencie a equipe do gabinete e acompanhe o desempenho
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConvitesModalOpen(true)}
              className="gap-2 rounded-xl transition-all active:scale-95"
            >
              <Send className="h-4 w-4" />
              Convites
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAvisoModalOpen(true)}
              className="gap-2 rounded-xl transition-all active:scale-95"
            >
              <Bell className="h-4 w-4" />
              Enviar Aviso
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Adicionar Assessor
            </Button>
          </div>
        </div>

        {/* Lista de Assessores */}
        <div className="mt-6 space-y-6">
          {/* Relatório de Desempenho */}
          <AssessoresReport assessores={filteredAssessores} />

          {/* Busca */}
          {/* Busca */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar assessor por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-card/50 border-border/40 focus-visible:ring-primary/20 transition-all"
            />
          </div>

          {/* Ranking de Assessores */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Ranking de Assessores</h2>
            </div>

            {/* Top 3 Assessores em Cards Destacados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {filteredAssessores.slice(0, 3).map((assessor) => (
                <Card key={assessor.id} className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary" />
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <Avatar className="h-14 w-14 border-2 border-primary/10 p-0.5 bg-background shadow-sm">
                          <AvatarImage src={assessor.avatar || undefined} alt={assessor.nome} className="rounded-full" />
                          <AvatarFallback className="text-base font-bold bg-primary/5 text-primary">
                            {assessor.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-md",
                          assessor.ranking === 1 ? "bg-yellow-400" :
                            assessor.ranking === 2 ? "bg-slate-300" : "bg-orange-400"
                        )}>
                          {getRankingEmoji(assessor.ranking)}
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold font-outfit uppercase tracking-tight break-words leading-tight">
                          {assessor.nome}
                        </CardTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-0.5">{assessor.cargo}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 px-4 pb-4">
                    <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/10">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Pontuação</p>
                        <p className="text-base font-bold text-green-500 font-outfit">{assessor.pontuacaoTotal || 0}</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Eleitores</p>
                        <p className="text-base font-bold text-primary font-outfit">{assessor.eleitoresCadastrados}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        <span>Demandas</span>
                        <span className="text-foreground">{assessor.demandas}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        <span>Indicações</span>
                        <span className="text-foreground">{assessor.indicacoes}</span>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-col gap-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-0 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest gap-1.5 transition-all"
                          onClick={() => handleVerDesempenho(assessor)}
                        >
                          <BarChart3 className="h-3 w-3" />
                          Desempenho
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-0 rounded-xl bg-muted/30 hover:bg-muted/50 text-foreground/70 font-bold text-[10px] uppercase tracking-widest gap-1.5 transition-all"
                          onClick={() => handleGerenciarPermissoes(assessor)}
                          disabled={assessor.id.startsWith('invite-')}
                        >
                          <Settings className="h-3 w-3" />
                          Permissões
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-xl text-destructive/40 hover:text-destructive hover:bg-destructive/5 font-bold text-[10px] uppercase tracking-widest gap-1.5 transition-all"
                        onClick={() => handleExonerar({ id: assessor.id, nome: assessor.nome })}
                      >
                        <UserMinus className="h-3 w-3" />
                        Exonerar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Demais Assessores em Lista */}
            {filteredAssessores.length > 3 && (
              <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl overflow-hidden shadow-xl">
                <CardHeader className="border-b border-border/10 bg-muted/5">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Demais Assessores</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/10">
                    {filteredAssessores.slice(3).map((assessor) => (
                      <div key={assessor.id} className="group flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:p-6 hover:bg-primary/[0.02] transition-colors gap-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold font-outfit text-sm transition-all",
                            "bg-muted/20 border border-border/40 group-hover:border-primary/20 group-hover:bg-primary/5"
                          )}>
                            #{assessor.ranking}
                          </div>
                          <Avatar className="h-12 w-12 border-2 border-border/10">
                            <AvatarImage src={assessor.avatar || undefined} alt={assessor.nome} />
                            <AvatarFallback className="text-sm font-bold bg-muted text-muted-foreground">
                              {assessor.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold font-outfit uppercase tracking-tight text-foreground/80 leading-tight">{assessor.nome}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">{assessor.cargo}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-12 px-2 lg:px-0">
                          <div className="flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Pontos</p>
                            <p className="text-sm font-bold text-green-500 font-outfit">{assessor.pontuacaoTotal || 0}</p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Eleitores</p>
                            <p className="text-sm font-bold text-primary font-outfit">{assessor.eleitoresCadastrados}</p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Demandas</p>
                            <p className="text-sm font-medium text-foreground/60">{assessor.demandas}</p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Indicações</p>
                            <p className="text-sm font-medium text-foreground/60">{assessor.indicacoes}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 rounded-xl bg-muted/20 hover:bg-primary/10 hover:text-primary font-bold text-[9px] uppercase tracking-widest gap-2 transition-all"
                            onClick={() => handleVerDesempenho(assessor)}
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Desempenho</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 rounded-xl bg-muted/20 hover:bg-muted/40 font-bold text-[9px] uppercase tracking-widest gap-2 transition-all"
                            onClick={() => handleGerenciarPermissoes(assessor)}
                            disabled={assessor.id.startsWith('invite-')}
                          >
                            <Settings className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Permissões</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 rounded-xl bg-destructive/5 hover:bg-destructive hover:text-destructive-foreground font-bold text-[9px] uppercase tracking-widest gap-2 transition-all"
                            onClick={() => handleExonerar({ id: assessor.id, nome: assessor.nome })}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Exonerar</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modais */}
        <AddAssessorModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onInviteCreated={() => {
            // Force a refresh of the invitations when modal closes
            setTimeout(() => {
              refetch();
            }, 1000);
          }}
        />

        <AvisoModal
          open={isAvisoModalOpen}
          onOpenChange={setIsAvisoModalOpen}
          assessores={filteredAssessores}
        />

        <ExonerarAssessorModal
          open={isExonerarModalOpen}
          onOpenChange={setIsExonerarModalOpen}
          assessor={assessorToExonerar}
          onConfirm={handleConfirmExonerar}
        />

        <ConvitesModal
          open={isConvitesModalOpen}
          onOpenChange={setIsConvitesModalOpen}
          onRefresh={refetch}
        />

        <AssessorPerformanceModal
          open={isPerformanceModalOpen}
          onOpenChange={setIsPerformanceModalOpen}
          assessor={selectedAssessor}
        />

        <ManagePermissionsModal
          open={isPermissionsModalOpen}
          onOpenChange={setIsPermissionsModalOpen}
          assessor={selectedAssessor}
        />
      </div>
    </AppLayout>
  );
};

export default Assessores;