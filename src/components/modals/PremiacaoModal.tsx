import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Plus, Trash2, Sparkles, Star, Zap, Award, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMetasPremiacoes } from "@/hooks/useMetasPremiacoes";
import { cn } from "@/lib/utils";

interface Meta {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'eleitores' | 'demandas' | 'ideias' | 'indicacoes';
  meta: number;
  premio: string;
}

interface Pontuacao {
  acao: string;
  pontos: number;
}

const tipoConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Star }> = {
  eleitores: { label: "Eleitores", color: "text-emerald-400", bg: "bg-emerald-500", icon: Star },
  demandas: { label: "Demandas", color: "text-blue-400", bg: "bg-blue-500", icon: Zap },
  ideias: { label: "Projeto de Leis", color: "text-amber-400", bg: "bg-amber-500", icon: Sparkles },
  indicacoes: { label: "Indicações", color: "text-purple-400", bg: "bg-purple-500", icon: Award },
};

export function PremiacaoModal({ children }: { children: React.ReactNode }) {
  const { metas, pontuacoes, loading, salvarMeta, removerMeta, salvarPontuacoes, defaultPontuacoes } = useMetasPremiacoes();

  const predefinedActions = [
    'Eleitor cadastrado',
    'Demanda criada',
    'Demanda atualizada',
    'Demanda atendida',
    'Indicação criada',
    'Indicação formalizada',
    'Indicação atendida',
    'Ideia de projeto de lei',
    'Projeto de Lei formalizado'
  ];

  const [activeSection, setActiveSection] = useState<'pontuacao' | 'metas'>('pontuacao');
  const [localPontuacoes, setLocalPontuacoes] = useState<Pontuacao[]>([]);
  const [novaMeta, setNovaMeta] = useState({
    nome: '',
    descricao: '',
    tipo: 'eleitores' as const,
    meta: 0,
    premio: ''
  });

  const [novaPontuacao, setNovaPontuacao] = useState({
    acao: '',
    pontos: 0
  });

  const handleOpenChange = (open: boolean) => {
    if (open) {
      if (pontuacoes.length > 0) {
        setLocalPontuacoes(pontuacoes.map(p => ({ acao: p.acao, pontos: p.pontos })));
      } else {
        setLocalPontuacoes([...defaultPontuacoes]);
      }
    }
  };

  const adicionarMeta = async () => {
    if (!novaMeta.nome || !novaMeta.descricao || !novaMeta.premio || novaMeta.meta <= 0) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos da meta", variant: "destructive" });
      return;
    }
    const success = await salvarMeta(novaMeta);
    if (success) {
      setNovaMeta({ nome: '', descricao: '', tipo: 'eleitores', meta: 0, premio: '' });
    }
  };

  const adicionarPontuacao = () => {
    if (!novaPontuacao.acao || novaPontuacao.pontos <= 0) {
      toast({ title: "Campos obrigatórios", description: "Selecione a ação e defina a pontuação", variant: "destructive" });
      return;
    }
    const existingIndex = localPontuacoes.findIndex(p => p.acao === novaPontuacao.acao);
    if (existingIndex >= 0) {
      const updated = [...localPontuacoes];
      updated[existingIndex] = { ...novaPontuacao };
      setLocalPontuacoes(updated);
      toast({ title: "Atualizado", description: "Pontuação atualizada com sucesso!" });
    } else {
      setLocalPontuacoes([...localPontuacoes, { ...novaPontuacao }]);
      toast({ title: "Adicionado", description: "Pontuação adicionada com sucesso!" });
    }
    setNovaPontuacao({ acao: '', pontos: 0 });
  };

  const removerPontuacao = (index: number) => {
    setLocalPontuacoes(localPontuacoes.filter((_, i) => i !== index));
  };

  const salvarConfiguracoes = async () => {
    await salvarPontuacoes(localPontuacoes);
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0 gap-0 border-border/40 bg-background">
        {/* Header Premium */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogHeader className="p-0 space-y-0">
                <DialogTitle className="text-base font-bold font-outfit tracking-tight">
                  Sistema de Premiação e Metas
                </DialogTitle>
              </DialogHeader>
              <p className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest mt-0.5">
                Configure a pontuação e motivação da equipe
              </p>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1 mt-4 bg-muted/30 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveSection('pontuacao')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 h-8 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all",
                activeSection === 'pontuacao'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground/50 hover:text-muted-foreground/70"
              )}
            >
              <Target className="h-3 w-3" />
              Pontuação
            </button>
            <button
              onClick={() => setActiveSection('metas')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 h-8 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all",
                activeSection === 'metas'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground/50 hover:text-muted-foreground/70"
              )}
            >
              <Award className="h-3 w-3" />
              Metas do Gabinete
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">Carregando...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(85vh-200px)]">
            {/* ====== SEÇÃO PONTUAÇÃO ====== */}
            {activeSection === 'pontuacao' && (
              <div className="p-6 space-y-4">
                {/* Add new score */}
                <div className="p-4 rounded-xl bg-muted/15 border border-border/20">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">
                    Adicionar pontuação
                  </p>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select
                        className="w-full h-9 px-3 text-xs border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                        value={novaPontuacao.acao}
                        onChange={(e) => setNovaPontuacao({ ...novaPontuacao, acao: e.target.value })}
                      >
                        <option value="">Selecione uma ação</option>
                        {predefinedActions.map(action => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Pts"
                        className="h-9 text-xs border-border/40"
                        value={novaPontuacao.pontos || ''}
                        onChange={(e) => setNovaPontuacao({ ...novaPontuacao, pontos: Number(e.target.value) })}
                      />
                    </div>
                    <Button
                      onClick={adicionarPontuacao}
                      size="sm"
                      className="h-9 px-4 text-[9px] font-bold uppercase tracking-widest gap-1.5"
                    >
                      <Plus className="h-3 w-3" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Pontuações list */}
                <div className="space-y-1.5">
                  {localPontuacoes.map((pontuacao, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/15 hover:border-border/30 hover:bg-muted/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-primary/5 flex items-center justify-center">
                          <Zap className="h-3 w-3 text-primary/50" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-foreground/80">{pontuacao.acao}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="h-5 px-2 text-[8px] font-black uppercase tracking-wider rounded-md border-primary/20 text-primary bg-primary/5"
                        >
                          {pontuacao.pontos} {pontuacao.pontos === 1 ? 'pt' : 'pts'}
                        </Badge>
                        <button
                          onClick={() => removerPontuacao(index)}
                          className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {localPontuacoes.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="mx-auto h-8 w-8 text-muted-foreground/15 mb-2" />
                      <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest">
                        Nenhuma pontuação configurada
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ====== SEÇÃO METAS ====== */}
            {activeSection === 'metas' && (
              <div className="p-6 space-y-4">
                {/* Create new meta */}
                <div className="p-4 rounded-xl bg-muted/15 border border-border/20 space-y-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Nova meta
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input
                      placeholder="Nome da meta"
                      className="h-9 text-xs border-border/40"
                      value={novaMeta.nome}
                      onChange={(e) => setNovaMeta({ ...novaMeta, nome: e.target.value })}
                    />
                    <select
                      className="h-9 px-3 text-xs border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      value={novaMeta.tipo}
                      onChange={(e) => setNovaMeta({ ...novaMeta, tipo: e.target.value as any })}
                    >
                      <option value="eleitores">Eleitores</option>
                      <option value="demandas">Demandas</option>
                      <option value="ideias">Projeto de Leis</option>
                      <option value="indicacoes">Indicações</option>
                    </select>
                    <Input
                      placeholder="Descrição da meta"
                      className="h-9 text-xs border-border/40"
                      value={novaMeta.descricao}
                      onChange={(e) => setNovaMeta({ ...novaMeta, descricao: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Quantidade (ex: 50)"
                      className="h-9 text-xs border-border/40"
                      value={novaMeta.meta || ''}
                      onChange={(e) => setNovaMeta({ ...novaMeta, meta: Number(e.target.value) })}
                    />
                    <Input
                      placeholder="Prêmio (ex: Medalha de Ouro)"
                      className="h-9 text-xs border-border/40"
                      value={novaMeta.premio}
                      onChange={(e) => setNovaMeta({ ...novaMeta, premio: e.target.value })}
                    />
                    <Button
                      onClick={adicionarMeta}
                      size="sm"
                      className="h-9 text-[9px] font-bold uppercase tracking-widest gap-1.5"
                    >
                      <Plus className="h-3 w-3" />
                      Criar Meta
                    </Button>
                  </div>
                </div>

                {/* Existing metas */}
                <div className="space-y-2">
                  {metas.length > 0 ? (
                    metas.map((meta) => {
                      const config = tipoConfig[meta.tipo] || tipoConfig.eleitores;
                      const percentage = Math.min(((meta as any).progresso || 0) / meta.meta * 100, 100);

                      return (
                        <div
                          key={meta.id}
                          className="p-4 rounded-xl bg-muted/10 border border-border/15 hover:border-border/30 hover:bg-muted/20 transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-[11px] font-bold text-foreground/80 truncate font-outfit">
                                  {meta.nome}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "h-4 px-1.5 text-[7px] font-black uppercase tracking-wider rounded-md border-transparent text-white shrink-0",
                                    config.bg
                                  )}
                                >
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-[9px] text-muted-foreground/50 leading-relaxed">
                                {meta.descricao}
                              </p>
                            </div>
                            <button
                              onClick={() => removerMeta(meta.id)}
                              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Progress bar */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] font-bold text-muted-foreground/40 font-mono uppercase tracking-wider">
                                {(meta as any).progresso || 0} / {meta.meta}
                              </span>
                              <span className="text-[8px] font-bold text-primary/60">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                            <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", config.bg, "opacity-50")}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Prize */}
                          <div className="flex items-center gap-1.5">
                            <Trophy className="h-2.5 w-2.5 text-amber-500/50" />
                            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-wider truncate">
                              {meta.premio}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10">
                      <Award className="mx-auto h-8 w-8 text-muted-foreground/15 mb-2" />
                      <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest">
                        Nenhuma meta definida
                      </p>
                      <p className="text-[8px] text-muted-foreground/20 mt-1">
                        Crie metas para motivar sua equipe
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/20 flex items-center justify-between bg-muted/5">
          <p className="text-[8px] text-muted-foreground/30 font-medium uppercase tracking-widest">
            {activeSection === 'pontuacao'
              ? `${localPontuacoes.length} ações configuradas`
              : `${metas.length} metas ativas`}
          </p>
          <Button
            onClick={salvarConfiguracoes}
            size="sm"
            className="h-8 px-4 text-[9px] font-bold uppercase tracking-widest gap-1.5"
          >
            <Trophy className="h-3 w-3" />
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}