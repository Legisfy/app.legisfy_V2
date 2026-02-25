import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, Clock, User, Search, MoreVertical, Eye, Trash2, Info, ExternalLink, Upload, MessageSquare, TrendingUp, Tag, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { FormalizarProjetoModal } from "@/components/modals/FormalizarProjetoModal";
import { ProtocolarProjetoModal } from "@/components/modals/ProtocolarProjetoModal";
import { ProjetosAnalises } from "@/components/projetos/ProjetosAnalises";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PermissionGuard } from "@/components/PermissionGuard";

type ProjetoStatus =
  | "rascunho"
  | "formalizado"
  | "em_revisao"
  | "pronto_para_protocolar"
  | "protocolado"
  | "em_tramitacao"
  | "aprovado"
  | "arquivado"
  | "rejeitado";

interface ProjetoLei {
  id: string;
  titulo: string;
  problema: string;
  descricao: string;
  status: ProjetoStatus;
  user_id: string;
  gabinete_id: string;
  user_name?: string;
  referencia?: string;
  pdf_url?: string;
  numero_protocolo?: string;
  created_at: string;
  updated_at?: string;
  logs?: ProjetoLog[];
  tags?: string[];
}

interface ProjetoLog {
  id?: string;
  projeto_id: string;
  status: ProjetoStatus | "evento";
  descricao?: string;
  user_name?: string;
  pdf_url?: string;
  created_at: string;
}

const statusLabels: Record<ProjetoStatus, string> = {
  rascunho: "Rascunho",
  formalizado: "Formalizado",
  em_revisao: "Em revisão",
  pronto_para_protocolar: "Pronto para protocolar",
  protocolado: "Protocolado",
  em_tramitacao: "Em tramitação",
  aprovado: "Aprovado",
  arquivado: "Arquivado",
  rejeitado: "Rejeitado",
};

const statusColors: Record<ProjetoStatus, string> = {
  rascunho: "bg-muted/40 text-muted-foreground border-muted",
  formalizado: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  em_revisao: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  pronto_para_protocolar: "bg-blue-500/10 text-blue-700 border-blue-200",
  protocolado: "bg-purple-500/10 text-purple-700 border-purple-200",
  em_tramitacao: "bg-orange-500/10 text-orange-700 border-orange-200",
  aprovado: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  arquivado: "bg-gray-500/10 text-gray-700 border-gray-200",
  rejeitado: "bg-rose-500/10 text-rose-700 border-rose-200",
};

export default function ProjetosLei() {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [projetos, setProjetos] = useState<ProjetoLei[]>([]);
  const [currentUserName, setCurrentUserName] = useState<string | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedProjeto, setSelectedProjeto] = useState<ProjetoLei | null>(null);
  const [titulo, setTitulo] = useState("");
  const [problema, setProblema] = useState("");
  const [descricao, setDescricao] = useState("");
  const [referencia, setReferencia] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formalizarOpen, setFormalizarOpen] = useState(false);
  const [protocolarOpen, setProtocolarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjetoStatus | "todos">("todos");
  const [authorFilter, setAuthorFilter] = useState<string>("todos");
  const [availableTags, setAvailableTags] = useState<{ id: string, name: string, color: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (activeInstitution?.cabinet_id) {
      fetchProjetos();
      fetchTags();
    }
    fetchCurrentUserName();
  }, [activeInstitution?.cabinet_id]);

  const fetchTags = async () => {
    try {
      if (!activeInstitution?.cabinet_id) return;
      const { data, error } = await supabase
        .from('gabinete_custom_tags')
        .select('id, name, color')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .eq('category', 'projetos_lei');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchCurrentUserName = async () => {
    try {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (data?.full_name) {
        setCurrentUserName(data.full_name);
      } else if (user.user_metadata?.full_name) {
        setCurrentUserName(user.user_metadata.full_name);
      } else {
        setCurrentUserName("Membro da Equipe");
      }
    } catch {
      if (user?.user_metadata?.full_name) {
        setCurrentUserName(user.user_metadata.full_name);
      } else {
        setCurrentUserName("Membro da Equipe");
      }
    }
  };

  const fetchProjetos = async () => {
    setLoading(true);
    try {
      if (!activeInstitution?.cabinet_id) return;

      console.log("🔍 ProjetosLei: Iniciando fetchProjetos com cabinet_id:", activeInstitution.cabinet_id);

      const { data, error } = await supabase
        .from("projetos_lei")
        .select(`
          *,
          author:profiles!user_id(full_name),
          logs:projeto_lei_status_events (
            id,
            status,
            descricao,
            created_at,
            user_id,
            profile:profiles!user_id(full_name)
          )
        `)
        .eq("gabinete_id", activeInstitution.cabinet_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("⚠️ ProjetosLei: Erro na busca completa, tentando busca simplificada sem joins...", error);
        // Fallback: Tenta buscar sem o join de profiles caso o relacionamento não esteja pronto
        const { data: simpleData, error: simpleError } = await supabase
          .from("projetos_lei")
          .select("*")
          .eq("gabinete_id", activeInstitution.cabinet_id)
          .order("created_at", { ascending: false });

        if (simpleError) {
          console.error("❌ ProjetosLei: Erro na busca simplificada:", simpleError);
          setProjetos([]);
        } else {
          console.log("✅ ProjetosLei: Projetos encontrados (busca simplificada):", simpleData?.length);
          setProjetos((simpleData as any[]).map(p => ({ ...p, user_name: "Autor" })));
        }
        setLoading(false);
        return;
      }
      const formatName = (name?: string | null) => {
        if (!name) return "Membro da Equipe";
        const parts = name.trim().split(/\s+/);
        if (parts.length <= 1) return name;
        return `${parts[0]} ${parts[1]}`;
      };

      const enrichedProjetos = (data as any[]).map((p) => {
        const user_name = formatName(p.author?.full_name);

        const logsWithUserNames = (p.logs || []).map((log: any) => ({
          ...log,
          user_name: formatName(log.profile?.full_name)
        }));

        return {
          ...p,
          user_name,
          logs: logsWithUserNames.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        };
      });

      if (enrichedProjetos.length === 0) {
        console.warn("Nenhum projeto encontrado para o gabinete:", activeInstitution.cabinet_id);
      }
      setProjetos(enrichedProjetos);
    } catch (e) {
      console.error(e);
      setProjetos([]);
    } finally {
      setLoading(false);
    }
  };

  const createProjeto = async () => {
    if (!user) return;
    if (!activeInstitution?.cabinet_id) {
      toast({
        title: "Erro de Gabinete",
        description: "Não foi possível identificar seu gabinete. Tente recarregar a página.",
        variant: "destructive"
      });
      return;
    }
    if (!titulo.trim()) {
      toast({ title: "Informe o título", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("projetos_lei")
        .insert({
          titulo,
          problema,
          descricao,
          referencia,
          status: "rascunho",
          user_id: user.id,
          gabinete_id: activeInstitution?.cabinet_id,
          tags: selectedTags,
        })
        .select()
        .single();

      if (error || !data) {
        throw error || new Error("Falha ao criar projeto no banco de dados");
      }

      const formatName = (name?: string | null) => {
        if (!name) return "Autor";
        const parts = name.trim().split(/\s+/);
        if (parts.length <= 2) return name;
        return `${parts[0]} ${parts[1]}`;
      };

      const finalUserName = formatName(currentUserName);
      const novo: ProjetoLei = { ...data, user_name: finalUserName, logs: [] };

      const log: ProjetoLog = {
        projeto_id: novo.id,
        status: "rascunho",
        descricao: "Criado",
        user_id: user.id,
        user_name: finalUserName,
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from("projeto_lei_status_events").insert({
          projeto_id: novo.id,
          status: log.status,
          descricao: "Projeto criado",
          user_id: log.user_id,
        });
      } catch { }

      setProjetos((prev) => [{ ...novo, logs: [log, ...(novo.logs || [])] }, ...prev]);
      setTitulo("");
      setProblema("");
      setDescricao("");
      setReferencia("");
      setSelectedTags([]);
      setNewOpen(false);
      toast({ title: "Projeto criado" });
    } catch (error: any) {
      console.error("Erro ao criar projeto:", error);
      toast({
        title: "Erro ao criar projeto",
        description: error.message || "Verifique se você executou o script SQL no Supabase.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const uploadPdf = async (file: File, projetoId: string): Promise<string | null> => {
    if (!activeInstitution?.cabinet_id) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projetoId}/${Math.random()}.${fileExt}`;
      const filePath = `projetos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('projeto_pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('projeto_pdfs')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro no upload do PDF:', error);
      toast({
        title: "Erro no Upload",
        description: "Não foi possível salvar o arquivo PDF.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleFormalizarSuccess = async (id: string, pdfUrl: string, comment: string) => {
    if (!user) return;

    setUpdating(true);
    try {
      const logAlpha: ProjetoLog = {
        projeto_id: id,
        status: "formalizado",
        descricao: comment,
        user_name: currentUserName,
        pdf_url: pdfUrl,
        created_at: new Date().toISOString(),
      };

      const { error: eventError } = await (supabase as any).from("projeto_lei_status_events").insert({
        projeto_id: id,
        status: "formalizado",
        descricao: comment,
        user_id: user.id,
        pdf_url: pdfUrl
      });

      if (eventError) throw eventError;

      const { error: updateError } = await (supabase as any)
        .from("projetos_lei")
        .update({ status: "formalizado", pdf_url: pdfUrl })
        .eq("id", id);

      if (updateError) throw updateError;

      setProjetos((prev) =>
        prev.map((p) => (p.id === id ? {
          ...p,
          status: "formalizado",
          pdf_url: pdfUrl,
          logs: [logAlpha, ...(p.logs || [])]
        } : p))
      );

      if (selectedProjeto?.id === id) {
        setSelectedProjeto(prev => prev ? {
          ...prev,
          status: "formalizado",
          pdf_url: pdfUrl,
          logs: [logAlpha, ...(prev.logs || [])]
        } : null);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleProtocolarSuccess = async (id: string, protocolo: string, pdfUrl: string) => {
    if (!user) return;

    setUpdating(true);
    try {
      const logProto: ProjetoLog = {
        projeto_id: id,
        status: "protocolado",
        descricao: `Protocolado sob nº ${protocolo}`,
        user_name: currentUserName,
        pdf_url: pdfUrl,
        created_at: new Date().toISOString(),
      };

      const { error: eventError } = await (supabase as any).from("projeto_lei_status_events").insert({
        projeto_id: id,
        status: "protocolado",
        descricao: `Protocolado sob nº ${protocolo}`,
        user_id: user.id,
        pdf_url: pdfUrl,
        numero_protocolo: protocolo
      });

      if (eventError) throw eventError;

      const { error: updateError } = await (supabase as any)
        .from("projetos_lei")
        .update({
          status: "protocolado",
          pdf_url: pdfUrl,
          numero_protocolo: protocolo
        })
        .eq("id", id);

      if (updateError) throw updateError;

      setProjetos((prev) =>
        prev.map((p) => (p.id === id ? {
          ...p,
          status: "protocolado",
          pdf_url: pdfUrl,
          numero_protocolo: protocolo,
          logs: [logProto, ...(p.logs || [])]
        } : p))
      );

      if (selectedProjeto?.id === id) {
        setSelectedProjeto(prev => prev ? {
          ...prev,
          status: "protocolado",
          pdf_url: pdfUrl,
          numero_protocolo: protocolo,
          logs: [logProto, ...(prev.logs || [])]
        } : null);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const advanceStatus = async (id: string, novoStatus: ProjetoStatus) => {
    if (!user) return;
    setUpdating(true);

    try {
      const log: ProjetoLog = {
        projeto_id: id,
        status: novoStatus,
        descricao: statusComment || statusLabels[novoStatus],
        user_name: currentUserName,
        created_at: new Date().toISOString(),
      };

      const { error: eventError } = await (supabase as any).from("projeto_lei_status_events").insert({
        projeto_id: id,
        status: novoStatus,
        descricao: statusComment || statusLabels[novoStatus],
        user_id: user.id,
      });

      if (eventError) throw eventError;

      const { error: updateError } = await (supabase as any)
        .from("projetos_lei")
        .update({ status: novoStatus })
        .eq("id", id);

      if (updateError) throw updateError;

      setProjetos((prev) =>
        prev.map((p) => (p.id === id ? {
          ...p,
          status: novoStatus,
          logs: [log, ...(p.logs || [])]
        } : p))
      );

      if (selectedProjeto?.id === id) {
        setSelectedProjeto(prev => prev ? {
          ...prev,
          status: novoStatus,
          logs: [log, ...(prev.logs || [])]
        } : null);
      }

      setStatusComment("");
      setSelectedFile(null);
      toast({ title: "Status atualizado com sucesso" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const statusOptions: { value: ProjetoStatus; label: string }[] = useMemo(
    () =>
      [
        "rascunho",
        "formalizado",
        "em_revisao",
        "pronto_para_protocolar",
        "protocolado",
        "em_tramitacao",
        "aprovado",
        "arquivado",
        "rejeitado",
      ].map((s) => ({ value: s as ProjetoStatus, label: statusLabels[s as ProjetoStatus] })),
    []
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "todos" as const, label: "Todos" },
      ...statusOptions,
    ],
    [statusOptions]
  );

  const authorOptions = useMemo(() => {
    const autores = Array.from(
      new Set(
        projetos
          .map((p) => p.user_name || "Autor")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return autores;
  }, [projetos]);

  const filteredProjetos = useMemo(() => {
    return projetos.filter((p) => {
      const texto = `${p.titulo} ${p.problema} ${p.descricao}`.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        texto.includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" || p.status === statusFilter;

      const autor = p.user_name || "Autor";
      const matchesAuthor =
        authorFilter === "todos" || autor === authorFilter;

      return matchesSearch && matchesStatus && matchesAuthor;
    });
  }, [projetos, searchTerm, statusFilter, authorFilter]);

  return (
    <AppLayout>
      <PermissionGuard module="projetos_lei">
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-base font-bold tracking-tight text-foreground/80 font-outfit uppercase">
                  Projetos de Lei
                </h1>
                <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-bold border-border/60 text-muted-foreground bg-transparent uppercase tracking-[0.2em] rounded-full">
                  Mandato Ativo
                </Badge>
              </div>
              <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-widest leading-none">
                Gestão e ciclo legislativo
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setNewOpen(true)}
                variant="success"
                className="h-10 px-4 gap-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Projeto</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="tabela" className="w-full">
            <TabsList className="bg-muted/30 p-1 rounded-xl mb-4 border border-border/40">
              <TabsTrigger
                value="tabela"
                className="text-[10px] uppercase font-bold tracking-widest px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
              >
                <FileText className="w-3.5 h-3.5 mr-2" />
                Gestão Legislativa
              </TabsTrigger>
              <TabsTrigger
                value="analise"
                className="text-[10px] uppercase font-bold tracking-widest px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-2" />
                Painel de Análise
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tabela" className="space-y-6 mt-0">
              <Card className="border border-border/40">
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                        <Input
                          placeholder="Buscar por título, problema ou descrição"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statusFilterOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={statusFilter === opt.value ? "outline" : "ghost"}
                          className={cn(
                            "h-8 rounded-full px-3 text-[11px] font-semibold",
                            statusFilter === opt.value
                              ? "border-primary/50 text-primary bg-primary/5"
                              : "text-muted-foreground/80"
                          )}
                          onClick={() => setStatusFilter(opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="w-full md:w-72">
                      <Select
                        value={authorFilter}
                        onValueChange={(value) => setAuthorFilter(value)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Filtrar por autor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os autores</SelectItem>
                          {authorOptions.map((autor) => (
                            <SelectItem key={autor} value={autor}>
                              {autor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Autor</TableHead>
                        <TableHead>Criação</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                            Carregando...
                          </TableCell>
                        </TableRow>
                      ) : filteredProjetos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                            Nenhum projeto cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProjetos.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.titulo}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {(p.tags || []).map(tagName => {
                                  const tagObj = availableTags.find(t => t.name === tagName);
                                  return (
                                    <Badge
                                      key={tagName}
                                      variant="outline"
                                      className="text-[8px] px-1.5 py-0 rounded-md font-bold text-white border-transparent"
                                      style={{ backgroundColor: tagObj?.color || '#ccc' }}
                                    >
                                      {tagName}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap", statusColors[p.status])}>
                                {statusLabels[p.status]}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 opacity-40 shrink-0" />
                                <span className="text-xs truncate max-w-[120px]">{p.user_name || "Autor"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 opacity-40 shrink-0" />
                                <span className="text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleString("pt-BR")}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedProjeto(p); setViewOpen(true); }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={async () => {
                                      const confirmed = await confirm({
                                        title: "Excluir Projeto",
                                        description: "Tem certeza que deseja excluir este projeto?",
                                        variant: "destructive",
                                        confirmText: "Excluir",
                                        cancelText: "Manter"
                                      });

                                      if (confirmed) {
                                        const { error } = await supabase.from("projetos_lei").delete().eq("id", p.id);
                                        if (!error) {
                                          setProjetos(prev => prev.filter(x => x.id !== p.id));
                                          toast({ title: "Projeto excluído" });
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analise" className="mt-0">
              <ProjetosAnalises projetos={projetos} />
            </TabsContent>
          </Tabs>

          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Novo Projeto de Lei
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Alert className="bg-primary/5 border-primary/20">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-[11px] text-primary/80">
                    <strong>Dica de Sucesso:</strong> Projetos com referências de outras cidades ou fontes sólidas têm mais chances de avançar. Adicione links ou cite onde esta ideia já funciona!
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Input placeholder="Título do Projeto" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                  <Textarea placeholder="Que problema este projeto resolve?" value={problema} onChange={(e) => setProblema(e.target.value)} />
                  <Textarea placeholder="Descrição detalhada (objetivos, metas)" className="min-h-[120px]" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                  <Textarea placeholder="Referências, fontes ou links (ex: cidades onde já existe)" className="min-h-[80px] border-dashed" value={referencia} onChange={(e) => setReferencia(e.target.value)} />

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Tags do Projeto</Label>
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border border-border/40 rounded-xl">
                      {availableTags.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground/40 italic">Nenhuma TAG de projeto cadastrada</p>
                      ) : (
                        availableTags.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              if (selectedTags.includes(tag.name)) {
                                setSelectedTags(prev => prev.filter(t => t !== tag.name));
                              } else {
                                setSelectedTags(prev => [...prev, tag.name]);
                              }
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border",
                              selectedTags.includes(tag.name)
                                ? "text-white border-transparent shadow-sm scale-105"
                                : "bg-muted/30 text-muted-foreground/60 border-border/20 hover:border-border/60"
                            )}
                            style={{
                              backgroundColor: selectedTags.includes(tag.name) ? tag.color : undefined,
                              boxShadow: selectedTags.includes(tag.name) ? `0 4px 12px ${tag.color}30` : undefined
                            }}
                          >
                            {tag.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
                  <Button onClick={createProjeto} disabled={creating}>
                    {creating ? "Criando..." : "Criar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={viewOpen} onOpenChange={setViewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
              {selectedProjeto && (
                <div className="flex flex-col md:flex-row h-full">
                  {/* Coluna Esquerda: Detalhes */}
                  <div className="flex-1 p-6 space-y-6 border-r border-border/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <DialogHeader className="p-0">
                          <DialogTitle className="text-xl font-bold leading-tight">
                            {selectedProjeto.titulo}
                          </DialogTitle>
                        </DialogHeader>
                      </div>
                      <Badge className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm", statusColors[selectedProjeto.status])}>
                        {statusLabels[selectedProjeto.status]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Info className="h-3 w-3" />
                          Problema que resolve
                        </div>
                        <div className="text-sm bg-muted/30 p-4 rounded-xl border border-border/50 leading-relaxed">
                          {selectedProjeto.problema || "-"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="h-3 w-3" />
                          Descrição do Projeto
                        </div>
                        <div className="text-sm bg-muted/30 p-4 rounded-xl border border-border/50 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                          {selectedProjeto.descricao || "-"}
                        </div>
                      </div>

                      {selectedProjeto.referencia && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                            <ExternalLink className="h-3 w-3" />
                            Referências e Fontes
                          </div>
                          <div className="text-xs text-primary/80 bg-primary/5 p-4 rounded-xl border border-primary/10 border-dashed whitespace-pre-wrap">
                            {selectedProjeto.referencia}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                          <Tag className="h-3 w-3" />
                          Tags de Classificação
                        </div>
                        <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-2xl border border-border/50">
                          {(selectedProjeto.tags || []).length === 0 ? (
                            <p className="text-[10px] text-muted-foreground/40 italic">Sem tags aplicadas</p>
                          ) : (
                            (selectedProjeto.tags || []).map(tagName => {
                              const tagObj = availableTags.find(t => t.name === tagName);
                              return (
                                <Badge
                                  key={tagName}
                                  variant="outline"
                                  className="text-[10px] px-3 py-1 rounded-xl font-bold text-white border-transparent shadow-sm"
                                  style={{ backgroundColor: tagObj?.color || '#ccc' }}
                                >
                                  {tagName}
                                </Badge>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ações de Status</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(statusLabels).map(([value, label]) => {
                          const isFormalizar = value === "formalizado";
                          return (
                            <Button
                              key={value}
                              size="sm"
                              variant={selectedProjeto.status === value ? "default" : "outline"}
                              className={cn(
                                "h-8 text-[10px] rounded-xl font-bold uppercase tracking-wider transition-all",
                                selectedProjeto.status === value && "shadow-md scale-105"
                              )}
                              onClick={() => {
                                if (isFormalizar) {
                                  setFormalizarOpen(true);
                                } else if (value === "protocolado") {
                                  setProtocolarOpen(true);
                                } else {
                                  advanceStatus(selectedProjeto.id, value as ProjetoStatus);
                                }
                              }}
                              disabled={updating || selectedProjeto.status === value}
                            >
                              {label}
                            </Button>
                          );
                        })}
                      </div>
                      <div className="space-y-4 pt-4 border-t border-border/10">
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3" />
                            Adicionar Comentário ou Registro
                          </div>
                          <Textarea
                            placeholder="Adicione observações ou registros sobre este projeto..."
                            className="text-xs min-h-[80px] rounded-xl bg-muted/20 border-border/40 focus:bg-background transition-colors"
                            value={statusComment}
                            onChange={(e) => setStatusComment(e.target.value)}
                          />
                        </div>
                        <Button
                          className="w-full h-10 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all border border-primary/20"
                          variant="ghost"
                          onClick={() => advanceStatus(selectedProjeto!.id, selectedProjeto!.status)}
                          disabled={updating || !statusComment.trim()}
                        >
                          Salvar Apenas Comentário
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita: Timeline */}
                  <div className="w-full md:w-[320px] bg-muted/10 p-6 flex flex-col border-l border-border/50">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Histórico do Projeto
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                      {(selectedProjeto.logs || []).length === 0 ? (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-8 rounded-2xl border border-dashed border-border/50 text-center">
                          Sem eventos registrados
                        </div>
                      ) : (
                        (selectedProjeto.logs || []).map((log, idx) => (
                          <div key={idx} className="flex gap-4 relative pb-2 group">
                            {idx !== (selectedProjeto.logs || []).length - 1 && (
                              <div className="absolute left-[9px] top-6 bottom-0 w-[1px] bg-border transition-colors group-hover:bg-primary/30" />
                            )}
                            <div className="mt-1.5 w-5 h-5 rounded-full border-2 border-primary bg-background flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-col gap-1">
                                <span className={cn("text-[8px] w-fit px-2 py-0.5 rounded-full font-bold uppercase tracking-wider", statusColors[log.status as ProjetoStatus] || "bg-muted text-muted-foreground")}>
                                  {log.status === 'evento' ? 'Evento' : statusLabels[log.status as ProjetoStatus]}
                                </span>
                                <div className="text-[11px] font-bold text-foreground">
                                  {log.user_name || "Membro da Equipe"}
                                </div>
                                <span className="text-[9px] text-muted-foreground font-medium">
                                  {new Date(log.created_at).toLocaleDateString("pt-BR")} às {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {log.descricao && (
                                <div className="text-[10px] text-foreground/70 bg-background/50 p-2.5 rounded-xl border border-border/50 italic leading-relaxed">
                                  "{log.descricao}"
                                </div>
                              )}

                              {log.pdf_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full h-8 text-[9px] gap-2 rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold transition-all shadow-sm"
                                  onClick={() => window.open(log.pdf_url, '_blank')}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Ver PDF Anexado
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <FormalizarProjetoModal
            open={formalizarOpen}
            onOpenChange={setFormalizarOpen}
            projeto={selectedProjeto}
            onSuccess={handleFormalizarSuccess}
          />

          <ProtocolarProjetoModal
            open={protocolarOpen}
            onOpenChange={setProtocolarOpen}
            projeto={selectedProjeto}
            onSuccess={handleProtocolarSuccess}
          />
        </div>
      </PermissionGuard>
    </AppLayout>
  );
}
