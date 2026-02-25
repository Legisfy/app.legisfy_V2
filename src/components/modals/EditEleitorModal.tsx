import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertTriangle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealEleitores } from "@/hooks/useRealEleitores";
import { useEleitorTags } from "@/hooks/useEleitorTags";
import { usePermissions } from "@/hooks/usePermissions";

interface EditEleitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eleitor: any;
}

const bairros = ["Centro", "Vila Nova", "Jardim Paulista", "Vila Madalena", "Mooca"];

export function EditEleitorModal({ open, onOpenChange, eleitor }: EditEleitorModalProps) {
  const { toast } = useToast();
  const { updateEleitor } = useRealEleitores();
  const { tags: availableTags, loading: tagsLoading } = useEleitorTags();
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    bairro: "",
    cep: "",
    sex: "",
    profession: "",
    birth_date: "",
    tags: [],
    isLeader: false,
    leaderType: "",
    leaderSubtype: ""
  });

  // Initialize form data when eleitor changes
  useEffect(() => {
    if (eleitor) {
      console.log('📝 Inicializando formulário com eleitor:', eleitor);
      setFormData({
        nome: eleitor.name || "",
        telefone: eleitor.whatsapp || "",
        email: eleitor.email || "",
        endereco: eleitor.address || "",
        bairro: eleitor.neighborhood || "",
        cep: eleitor.cep || "",
        sex: eleitor.sex || "",
        profession: eleitor.profession || "",
        birth_date: eleitor.birth_date || "",
        tags: eleitor.tags || [],
        isLeader: eleitor.is_leader || false,
        leaderType: eleitor.leader_type || "",
        leaderSubtype: eleitor.leader_subtype || ""
      });
    }
  }, [eleitor]);

  const handleSave = async () => {
    console.log('🔄 handleSave called', { 
      eleitorId: eleitor.id, 
      formData,
      hasWritePermission: hasPermission('eleitores', 'write')
    });
    
    // Verificar permissão de escrita
    if (!hasPermission('eleitores', 'write')) {
      console.log('❌ Sem permissão de escrita');
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para editar eleitores. Entre em contato com o administrador do gabinete.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Validação apenas dos campos realmente obrigatórios
      if (!formData.nome || !formData.nome.trim()) {
        console.log('❌ Nome é obrigatório');
        toast({
          title: "Campo obrigatório",
          description: "O nome do eleitor é obrigatório.",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.telefone || !formData.telefone.trim()) {
        console.log('❌ Telefone é obrigatório');
        toast({
          title: "Campo obrigatório",
          description: "O telefone do eleitor é obrigatório.",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.endereco || !formData.endereco.trim()) {
        console.log('❌ Endereço é obrigatório');
        toast({
          title: "Campo obrigatório",
          description: "O endereço do eleitor é obrigatório.",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.bairro || !formData.bairro.trim()) {
        console.log('❌ Bairro é obrigatório');
        toast({
          title: "Campo obrigatório",
          description: "O bairro do eleitor é obrigatório.",
          variant: "destructive",
        });
        return;
      }
      
      const updateData = {
        name: formData.nome.trim(),
        whatsapp: formData.telefone.trim(),
        email: formData.email?.trim() || null,
        address: formData.endereco.trim(),
        neighborhood: formData.bairro.trim(),
        cep: formData.cep?.trim() || null,
        sex: formData.sex || null,
        profession: formData.profession?.trim() || null,
        birth_date: formData.birth_date || null,
        tags: formData.tags && formData.tags.length > 0 ? formData.tags : null,
        is_leader: formData.isLeader,
        leader_type: formData.isLeader && formData.leaderType ? formData.leaderType : null,
        leader_subtype: formData.isLeader && formData.leaderSubtype ? formData.leaderSubtype : null
      };
      
      console.log('🔄 Calling updateEleitor with data:', { id: eleitor.id, updateData });
      
      await updateEleitor(eleitor.id, updateData);
      
      console.log('✅ Eleitor atualizado com sucesso');
      
      toast({
        title: "Sucesso!",
        description: "Eleitor atualizado com sucesso.",
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Erro completo ao atualizar eleitor:', {
        error,
        message: error?.message,
        stack: error?.stack,
        details: error
      });
      
      // Mensagem de erro mais específica
      let errorMessage = "Ocorreu um erro ao atualizar o eleitor.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao atualizar",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getMissingFields = () => {
    const missing = [];
    if (!formData.nome) missing.push("Nome");
    if (!formData.telefone) missing.push("Telefone");
    if (!formData.email) missing.push("E-mail");
    if (!formData.endereco) missing.push("Endereço");
    if (!formData.bairro) missing.push("Bairro");
    if (!formData.cep) missing.push("CEP");
    if (!formData.sex) missing.push("Sexo");
    if (!formData.profession) missing.push("Profissão");
    if (!formData.birth_date) missing.push("Data de nascimento");
    return missing;
  };

  const isFieldMissing = (field: string) => {
    return !formData[field as keyof typeof formData];
  };

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ 
      ...formData, 
      tags: formData.tags.filter((tag: string) => tag !== tagToRemove) 
    });
  };

  if (!eleitor) return null;

  const canWrite = hasPermission('eleitores', 'write');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Eleitor</DialogTitle>
        </DialogHeader>
        
        {!canWrite && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Lock className="h-4 w-4" />
                <p className="text-sm font-medium">
                  Você não tem permissão para editar eleitores. Contate o administrador do gabinete para obter acesso.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="space-y-6">
          {/* Avatar e Nome */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={eleitor.profile_photo_url} alt={eleitor.name || 'Eleitor'} />
                  <AvatarFallback 
                    className={`text-lg ${
                      eleitor.sex === 'masculino' ? 'bg-blue-500 text-white' : 
                      eleitor.sex === 'feminino' ? 'bg-pink-500 text-white' : 
                      'bg-gray-500 text-white'
                    }`}
                  >
                    {eleitor.name ? eleitor.name.split(' ').map((n: string) => n[0]).join('') : 'E'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    {isFieldMissing('nome') && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo do eleitor"
                    className={isFieldMissing('nome') ? 'border-yellow-500' : ''}
                  />
                  {isFieldMissing('nome') && (
                    <p className="text-sm text-yellow-600 mt-1">Campo obrigatório</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    {isFieldMissing('telefone') && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className={isFieldMissing('telefone') ? 'border-yellow-500' : ''}
                  />
                  {isFieldMissing('telefone') && (
                    <p className="text-sm text-yellow-600 mt-1">Campo obrigatório</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    {isFieldMissing('email') && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className={isFieldMissing('email') ? 'border-yellow-500' : ''}
                  />
                  {isFieldMissing('email') && (
                    <p className="text-sm text-yellow-600 mt-1">Campo recomendado</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  {isFieldMissing('bairro') && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  placeholder="Nome do bairro"
                  className={isFieldMissing('bairro') ? 'border-yellow-500' : ''}
                />
                {isFieldMissing('bairro') && (
                  <p className="text-sm text-yellow-600 mt-1">Campo obrigatório</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  {isFieldMissing('endereco') && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Endereço completo"
                  className={isFieldMissing('endereco') ? 'border-yellow-500' : ''}
                />
                {isFieldMissing('endereco') && (
                  <p className="text-sm text-yellow-600 mt-1">Campo obrigatório</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="cep">CEP</Label>
                    {isFieldMissing('cep') && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                    className={isFieldMissing('cep') ? 'border-yellow-500' : ''}
                  />
                  {isFieldMissing('cep') && (
                    <p className="text-sm text-yellow-600 mt-1">Campo recomendado</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sex">Sexo</Label>
                    {isFieldMissing('sex') && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                    <SelectTrigger className={isFieldMissing('sex') ? 'border-yellow-500' : ''}>
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="nao_binario">Não binário</SelectItem>
                    </SelectContent>
                  </Select>
                  {isFieldMissing('sex') && (
                    <p className="text-sm text-yellow-600 mt-1">Campo recomendado</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="profession">Profissão</Label>
                    {isFieldMissing('profession') && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    placeholder="Profissão"
                    className={isFieldMissing('profession') ? 'border-yellow-500' : ''}
                  />
                  {isFieldMissing('profession') && (
                    <p className="text-sm text-yellow-600 mt-1">Campo recomendado</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    {isFieldMissing('birth_date') && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className={isFieldMissing('birth_date') ? 'border-yellow-500' : ''}
                  />
                  {isFieldMissing('birth_date') && (
                    <p className="text-sm text-yellow-600 mt-1">Campo recomendado</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags e Categorias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tags Atuais</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Adicionar Tag</Label>
                <Select onValueChange={addTag} disabled={tagsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={tagsLoading ? "Carregando tags..." : "Selecione uma tag para adicionar"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags
                      .filter(tag => !formData.tags.includes(tag.name))
                      .map(tag => (
                        <SelectItem key={tag.id} value={tag.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liderança */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Liderança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  id="isLeader"
                  type="checkbox"
                  checked={formData.isLeader}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isLeader: e.target.checked,
                    leaderType: e.target.checked ? prev.leaderType : "",
                    leaderSubtype: e.target.checked ? prev.leaderSubtype : ""
                  }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="isLeader" className="text-sm font-medium">
                  É uma liderança?
                </Label>
              </div>

              {formData.isLeader && (
                <div className="space-y-3">
                  <div>
                    <Label>Tipo de Liderança</Label>
                    <Select value={formData.leaderType} onValueChange={(value) => setFormData(prev => ({ ...prev, leaderType: value, leaderSubtype: "" }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="religiosa">Religiosa</SelectItem>
                        <SelectItem value="comunitaria">Comunitária/Social</SelectItem>
                        <SelectItem value="esporte_cultura">Esporte/Cultura</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.leaderType && (
                    <div>
                      <Label>Subtipo</Label>
                      <Select value={formData.leaderSubtype} onValueChange={(value) => setFormData(prev => ({ ...prev, leaderSubtype: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o subtipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.leaderType === "religiosa" && (
                            <>
                              <SelectItem value="pastor_padre">Pastor / Padre / Líder religioso</SelectItem>
                              <SelectItem value="missionario_obreiro">Missionário / Obreiro / Diácono</SelectItem>
                              <SelectItem value="lider_jovem">Líder de grupo jovem ou ministério</SelectItem>
                            </>
                          )}
                          {formData.leaderType === "comunitaria" && (
                            <>
                              <SelectItem value="lider_comunitario">Líder comunitário</SelectItem>
                              <SelectItem value="presidente_associacao">Presidente de associação de moradores</SelectItem>
                              <SelectItem value="presidente_sindicato">Presidente de sindicato</SelectItem>
                              <SelectItem value="empresario_local">Empresário local</SelectItem>
                              <SelectItem value="comerciante">Comerciante / lojista</SelectItem>
                              <SelectItem value="professor_educador">Professor / educador influente</SelectItem>
                              <SelectItem value="medico_saude">Médico / profissional de saúde de referência</SelectItem>
                              <SelectItem value="lider_estudantil">Líder estudantil (grêmio, centro acadêmico)</SelectItem>
                              <SelectItem value="representante_ong">Representante de ONG / projeto social</SelectItem>
                              <SelectItem value="morador_referencia">Morador referência (respeitado na comunidade)</SelectItem>
                            </>
                          )}
                          {formData.leaderType === "esporte_cultura" && (
                            <>
                              <SelectItem value="lider_esportivo">Líder esportivo (técnico de time, organizador de campeonato)</SelectItem>
                              <SelectItem value="lider_cultural">Líder cultural (organizador de eventos, artista local)</SelectItem>
                              <SelectItem value="lider_rural">Líder rural / agrícola (associação de produtores, cooperativa)</SelectItem>
                            </>
                          )}
                          {formData.leaderType === "digital" && (
                            <>
                              <SelectItem value="influenciador_digital">Influenciador digital local</SelectItem>
                              <SelectItem value="admin_grupos">Administrador de grupos de WhatsApp / Facebook da comunidade</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas (somente leitura) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{eleitor.indicacoes || 0}</div>
                  <p className="text-sm text-muted-foreground">Indicações</p>
                  <p className="text-xs text-muted-foreground">{eleitor.indicacoesAtendidas || 0} atendidas</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{eleitor.demandas || 0}</div>
                  <p className="text-sm text-muted-foreground">Demandas</p>
                  <p className="text-xs text-muted-foreground">{eleitor.demandasAtendidas || 0} atendidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for missing fields */}
        {getMissingFields().length > 0 && (
          <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Dados incompletos
              </p>
              <p className="text-sm text-yellow-700">
                Campos em falta: {getMissingFields().join(', ')}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!canWrite}
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}