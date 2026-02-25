import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useRealEleitores } from "@/hooks/useRealEleitores";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MocaoVoto {
  id: string;
  category: 'voto_de_louvor' | 'mocao_de_aplauso' | 'voto_de_pesar';
  title: string;
  justification: string;
  ceremony_date?: string;
  status: 'proposto' | 'aprovado' | 'entregue';
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  eleitor_id?: string;
  user_id: string;
  gabinete_id: string;
}

interface Eleitor {
  id: string;
  name: string;
}

export default function MocoesVotos() {
  const [mocoes, setMocoes] = useState<MocaoVoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMocao, setSelectedMocao] = useState<MocaoVoto | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { activeInstitution } = useActiveInstitution();
  const { eleitores } = useRealEleitores();
  const confirm = useConfirm();

  const [formData, setFormData] = useState({
    category: "" as MocaoVoto['category'] | "",
    title: "",
    justification: "",
    ceremony_date: "",
    eleitor_id: "",
    status: "proposto" as MocaoVoto['status'],
  });

  useEffect(() => {
    loadMocoes();
  }, [activeInstitution]);

  const loadMocoes = async () => {
    if (!activeInstitution?.cabinet_id) return;

    try {
      const { data, error } = await (supabase
        .from('mocoes_votos' as any)
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      setMocoes(data || []);
    } catch (error) {
      console.error('Error loading moções e votos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar moções e votos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeInstitution?.cabinet_id || !formData.category || !formData.title || !formData.justification) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const dataToInsert = {
        gabinete_id: activeInstitution.cabinet_id,
        user_id: user.id,
        category: formData.category,
        title: formData.title,
        justification: formData.justification,
        ceremony_date: formData.ceremony_date || null,
        eleitor_id: formData.eleitor_id || null,
        status: formData.status || 'proposto' as const
      };

      if (selectedMocao) {
        const { error } = await (supabase
          .from('mocoes_votos' as any)
          .update(dataToInsert)
          .eq('id', selectedMocao.id) as any);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Moção/Voto atualizado com sucesso!"
        });
      } else {
        const { error } = await (supabase
          .from('mocoes_votos' as any)
          .insert([dataToInsert]) as any);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Moção/Voto criado com sucesso!"
        });
      }

      setIsModalOpen(false);
      setSelectedMocao(null);
      setFormData({
        category: "",
        title: "",
        justification: "",
        ceremony_date: "",
        eleitor_id: "",
        status: "proposto",
      });
      loadMocoes();
    } catch (error) {
      console.error('Error saving moção/voto:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar moção/voto.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (mocao: MocaoVoto) => {
    setSelectedMocao(mocao);
    setFormData({
      category: mocao.category,
      title: mocao.title,
      justification: mocao.justification,
      ceremony_date: mocao.ceremony_date || "",
      eleitor_id: mocao.eleitor_id || "",
      status: mocao.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Excluir Moção/Voto",
      description: "Tem certeza que deseja excluir esta moção/voto?",
      variant: "destructive",
      confirmText: "Excluir",
      cancelText: "Manter"
    });

    if (!confirmed) return;

    try {
      const { error } = await (supabase
        .from('mocoes_votos' as any)
        .delete()
        .eq('id', id) as any);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Moção/Voto excluído com sucesso!"
      });

      loadMocoes();
    } catch (error) {
      console.error('Error deleting moção/voto:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir moção/voto.",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: MocaoVoto['status']) => {
    try {
      const { error } = await (supabase
        .from('mocoes_votos' as any)
        .update({ status: newStatus })
        .eq('id', id) as any);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso!"
      });

      loadMocoes();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status.",
        variant: "destructive"
      });
    }
  };

  const openModal = () => {
    setSelectedMocao(null);
    setFormData({
      category: "",
      title: "",
      justification: "",
      ceremony_date: "",
      eleitor_id: "",
      status: "proposto",
    });
    setIsModalOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'voto_de_louvor': return 'Voto de Louvor';
      case 'mocao_de_aplauso': return 'Moção de Aplauso';
      case 'voto_de_pesar': return 'Voto de Pesar';
      default: return category;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposto':
        return <Badge variant="secondary">Proposto</Badge>;
      case 'aprovado':
        return <Badge variant="default">Aprovado</Badge>;
      case 'entregue':
        return <Badge variant="outline" className="border-green-500 text-green-700">Entregue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEleitorName = (eleitorId?: string) => {
    if (!eleitorId) return 'Não especificado';
    const eleitor = eleitores.find(e => e.id === eleitorId);
    return eleitor?.name || 'Eleitor não encontrado';
  };

  const filteredMocoes = mocoes.filter(mocao => {
    const matchesSearch = mocao.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mocao.justification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mocao.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || mocao.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Moções e Votos</h1>
            <p className="text-muted-foreground">Gerencie votos de louvor, moções de aplauso e votos de pesar</p>
          </div>
          <Button onClick={openModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por título ou justificativa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="proposto">Proposto</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="voto_de_louvor">Voto de Louvor</SelectItem>
                  <SelectItem value="mocao_de_aplauso">Moção de Aplauso</SelectItem>
                  <SelectItem value="voto_de_pesar">Voto de Pesar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {filteredMocoes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma moção ou voto encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {mocoes.length === 0
                  ? "Comece criando sua primeira moção ou voto."
                  : "Tente ajustar os filtros para encontrar o que procura."
                }
              </p>
              <Button onClick={openModal}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Moção/Voto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMocoes.map((mocao) => (
              <Card key={mocao.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline">{getCategoryLabel(mocao.category)}</Badge>
                        {getStatusBadge(mocao.status)}
                      </div>
                      <h3 className="font-semibold text-lg">{mocao.title}</h3>
                      <p className="text-muted-foreground line-clamp-2">{mocao.justification}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Criado em {format(new Date(mocao.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                        {mocao.ceremony_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Cerimônia: {format(new Date(mocao.ceremony_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{getEleitorName(mocao.eleitor_id)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select value={mocao.status} onValueChange={(value) => handleStatusChange(mocao.id, value as MocaoVoto['status'])}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proposto">Proposto</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="entregue">Entregue</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMocao(mocao);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(mocao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(mocao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedMocao ? 'Editar Moção/Voto' : 'Adicionar Moção/Voto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as MocaoVoto['category'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voto_de_louvor">Voto de Louvor</SelectItem>
                      <SelectItem value="mocao_de_aplauso">Moção de Aplauso</SelectItem>
                      <SelectItem value="voto_de_pesar">Voto de Pesar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ceremony_date">Data da Homenagem</Label>
                  <Input
                    id="ceremony_date"
                    type="date"
                    value={formData.ceremony_date}
                    onChange={(e) => setFormData({ ...formData, ceremony_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Criação</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedMocao
                    ? format(new Date(selectedMocao.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    : 'Será definida automaticamente ao criar'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Digite o título da moção/voto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eleitor_id">Homenageado</Label>
                <Select
                  value={formData.eleitor_id}
                  onValueChange={(value) => setFormData({ ...formData, eleitor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o homenageado (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {eleitores.map((eleitor) => (
                      <SelectItem key={eleitor.id} value={eleitor.id}>
                        {eleitor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as MocaoVoto['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposto">Proposto</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justificativa *</Label>
                <Textarea
                  id="justification"
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  placeholder="Digite a justificativa para a moção/voto"
                  className="min-h-32"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedMocao ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Moção/Voto</DialogTitle>
            </DialogHeader>
            {selectedMocao && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{getCategoryLabel(selectedMocao.category)}</Badge>
                  {getStatusBadge(selectedMocao.status)}
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedMocao.title}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedMocao.justification}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Data de Criação</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedMocao.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  {selectedMocao.ceremony_date && (
                    <div>
                      <Label className="font-medium">Data da Cerimônia</Label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedMocao.ceremony_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="font-medium">Homenageado</Label>
                    <p className="text-sm text-muted-foreground">
                      {getEleitorName(selectedMocao.eleitor_id)}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Status Atual</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedMocao.status)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(selectedMocao);
                  }}>
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}