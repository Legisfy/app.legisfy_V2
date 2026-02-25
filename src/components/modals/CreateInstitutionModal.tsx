import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, CheckCircle, ArrowLeft, ArrowRight, Users, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Estado {
  id: string;
  nome: string;
  sigla: string;
}

interface Cidade {
  id: string;
  nome: string;
  estado_id: string;
}

interface CreateInstitutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type InstitutionType = "camara_municipal" | "assembleia_legislativa";
type DBInstitutionType = "municipal" | "estadual";

interface PoliticoAutorizado {
  email: string;
  nome_politico: string;
}

export function CreateInstitutionModal({ open, onOpenChange, onSuccess }: CreateInstitutionModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<Estado | null>(null);
  const [selectedCidade, setSelectedCidade] = useState<Cidade | null>(null);
  const [institutionType, setInstitutionType] = useState<InstitutionType | null>(null);
  const [politicosAutorizados, setPoliticosAutorizados] = useState<PoliticoAutorizado[]>([]);
  const [newPolitico, setNewPolitico] = useState<PoliticoAutorizado>({
    email: "",
    nome_politico: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInstitutionId, setCreatedInstitutionId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchEstados();
    }
  }, [open]);

  useEffect(() => {
    if (selectedEstado) {
      fetchCidades(selectedEstado.id);
    }
  }, [selectedEstado]);

  const fetchEstados = async () => {
    const { data, error } = await supabase
      .from("estados")
      .select("*")
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar estados");
      return;
    }

    setEstados(data || []);
  };

  const fetchCidades = async (estadoId: string) => {
    const { data, error } = await supabase
      .from("cidades")
      .select("*")
      .eq("estado_id", estadoId)
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar cidades");
      return;
    }

    setCidades(data || []);
  };

  const getCapitalName = (estadoNome: string): string => {
    const capitais: Record<string, string> = {
      "Acre": "Rio Branco",
      "Alagoas": "Maceió",
      "Amapá": "Macapá",
      "Amazonas": "Manaus",
      "Bahia": "Salvador",
      "Ceará": "Fortaleza",
      "Distrito Federal": "Brasília",
      "Espírito Santo": "Vitória",
      "Goiás": "Goiânia",
      "Maranhão": "São Luís",
      "Mato Grosso": "Cuiabá",
      "Mato Grosso do Sul": "Campo Grande",
      "Minas Gerais": "Belo Horizonte",
      "Pará": "Belém",
      "Paraíba": "João Pessoa",
      "Paraná": "Curitiba",
      "Pernambuco": "Recife",
      "Piauí": "Teresina",
      "Rio de Janeiro": "Rio de Janeiro",
      "Rio Grande do Norte": "Natal",
      "Rio Grande do Sul": "Porto Alegre",
      "Rondônia": "Porto Velho",
      "Roraima": "Boa Vista",
      "Santa Catarina": "Florianópolis",
      "São Paulo": "São Paulo",
      "Sergipe": "Aracaju",
      "Tocantins": "Palmas"
    };
    return capitais[estadoNome] || estadoNome;
  };

  const getInstitutionName = () => {
    if (!institutionType) return "";
    
    if (institutionType === "camara_municipal" && selectedCidade) {
      return `Câmara Municipal de ${selectedCidade.nome}`;
    }
    
    if (institutionType === "assembleia_legislativa" && selectedEstado) {
      return `Assembleia Legislativa do ${selectedEstado.nome}`;
    }
    
    return "";
  };

  const handleNext = async () => {
    if (currentStep === 1 && !institutionType) {
      toast.error("Selecione o tipo de instituição");
      return;
    }
    
    if (currentStep === 2) {
      if (institutionType === "camara_municipal" && (!selectedEstado || !selectedCidade)) {
        toast.error("Selecione o estado e cidade");
        return;
      }
      if (institutionType === "assembleia_legislativa" && !selectedEstado) {
        toast.error("Selecione o estado");
        return;
      }
      
      // Se passamos da etapa 2, criar a instituição
      await createInstitution();
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const addPolitico = () => {
    if (!newPolitico.email) {
      toast.error("Email é obrigatório");
      return;
    }

    const emailExists = politicosAutorizados.some(p => p.email === newPolitico.email);
    if (emailExists) {
      toast.error("Este email já foi adicionado");
      return;
    }

    setPoliticosAutorizados(prev => [...prev, { ...newPolitico }]);
    setNewPolitico({ email: "", nome_politico: "" });
    toast.success("Político adicionado à lista");
  };

  const removePolitico = (email: string) => {
    setPoliticosAutorizados(prev => prev.filter(p => p.email !== email));
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const createInstitution = async () => {
    if (!institutionType || !selectedEstado) {
      toast.error("Dados incompletos");
      return;
    }

    if (institutionType === "camara_municipal" && !selectedCidade) {
      toast.error("Selecione uma cidade");
      return;
    }

    setIsSubmitting(true);

    try {
      const dbType: DBInstitutionType = institutionType === "camara_municipal" ? "municipal" : "estadual";
      
      // Para assembleia legislativa, usar a capital do estado como cidade_id
      let cidade_id = selectedCidade?.id;
      
      if (institutionType === "assembleia_legislativa" && selectedEstado) {
        // Buscar a capital do estado
        const { data: capitais } = await supabase
          .from("cidades")
          .select("id")
          .eq("estado_id", selectedEstado.id)
          .eq("nome", getCapitalName(selectedEstado.nome))
          .single();
        
        cidade_id = capitais?.id || selectedEstado.id; // Fallback para estado_id se não encontrar capital
      }
      
      const institutionData = {
        nome: getInstitutionName(),
        tipo: dbType,
        cidade_id: cidade_id!,
        numero_gabinetes_permitidos: 10,
        usuarios_por_gabinete_permitidos: 20,
      };

      const { data, error } = await supabase
        .from("camaras")
        .insert([institutionData])
        .select()
        .single();

      if (error) {
        toast.error("Erro ao criar instituição");
        return;
      }

      setCreatedInstitutionId(data.id);
      setCurrentStep(3);
      toast.success("Instituição criada! Agora adicione os políticos autorizados.");
    } catch (error) {
      toast.error("Erro inesperado ao criar instituição");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!createdInstitutionId) {
      toast.error("Erro: Instituição não encontrada");
      return;
    }

    setIsSubmitting(true);

    try {
      // Cadastrar políticos autorizados
      if (politicosAutorizados.length > 0) {
        for (const politico of politicosAutorizados) {
          const cargoAutomatico = institutionType === "camara_municipal" ? "Vereador" : "Deputado Estadual";
          
          // Verificar se já existe e está ativo
          const { data: existingPolitico } = await supabase
            .from("politicos_autorizados")
            .select("id, is_active")
            .eq("camara_id", createdInstitutionId)
            .eq("email", politico.email.toLowerCase())
            .maybeSingle();

          if (existingPolitico?.is_active) {
            console.log(`Político ${politico.email} já autorizado para esta câmara`);
          } else if (existingPolitico && !existingPolitico.is_active) {
            // Reativar político
            await supabase
              .from("politicos_autorizados")
              .update({ 
                is_active: true,
                nome_politico: politico.nome_politico || null,
                cargo_pretendido: cargoAutomatico,
                updated_at: new Date().toISOString()
              })
              .eq("id", existingPolitico.id);
          } else {
            // Inserir novo político autorizado
            const { error: politicoError } = await supabase
              .from("politicos_autorizados")
              .insert([{
                camara_id: createdInstitutionId,
                email: politico.email.toLowerCase(),
                nome_politico: politico.nome_politico || null,
                cargo_pretendido: cargoAutomatico,
                is_active: true
              }]);

            if (politicoError) {
              console.error("Erro ao inserir político autorizado:", politicoError);
              // Não falhar a criação da instituição por isso
            }
          }
        }

        // Enviar convites por email
        for (const politico of politicosAutorizados) {
          try {
            // Usar a função send_principal_invite que já existe
            const { data: inviteData, error: inviteError } = await supabase.rpc('send_principal_invite', {
              p_email: politico.email,
              p_institution_id: createdInstitutionId
            });

            if (inviteError) {
              console.error(`Erro ao criar convite para ${politico.email}:`, inviteError);
              toast.error(`Erro ao processar convite para ${politico.email}`);
              continue;
            }

            // Se o convite foi criado com sucesso, enviar o email
            if (inviteData && typeof inviteData === 'object' && 'success' in inviteData && 'token' in inviteData) {
              const inviteResult = inviteData as { success: boolean; token: string };
              
              if (inviteResult.success && inviteResult.token) {
                const { error: emailError } = await supabase.functions.invoke('enviar-convite-principal', {
                  body: {
                    email: politico.email,
                    nomeConvidado: politico.nome_politico || politico.email.split('@')[0],
                    nomeInstituicao: getInstitutionName(),
                    nomeConvidador: "Admin da Plataforma",
                    cargo: institutionType === "camara_municipal" ? "Vereador" : "Deputado Estadual",
                    token: inviteResult.token
                  },
                  headers: {
                    'x-app-base-url': window.location.origin
                  }
                });

                if (emailError) {
                  console.error(`Erro ao enviar email para ${politico.email}:`, emailError);
                  toast.error(`Erro ao enviar email para ${politico.email}`);
                }
              }
            }
          } catch (error) {
            console.error(`Erro ao processar convite para ${politico.email}:`, error);
          }
        }
      }

      toast.success(`Instituição criada com sucesso! ${politicosAutorizados.length > 0 ? 'Convites enviados por email.' : ''}`);
      handleClose();
      onSuccess?.();
    } catch (error) {
      toast.error("Erro inesperado ao finalizar cadastro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setInstitutionType(null);
    setSelectedEstado(null);
    setSelectedCidade(null);
    setPoliticosAutorizados([]);
    setNewPolitico({ email: "", nome_politico: "" });
    setCreatedInstitutionId(null);
    onOpenChange(false);
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Tipo de Instituição
        </CardTitle>
        <CardDescription>
          Selecione o tipo de instituição que deseja cadastrar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              institutionType === "camara_municipal"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-primary/50"
            }`}
            onClick={() => setInstitutionType("camara_municipal")}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Câmara Municipal</h3>
                <p className="text-sm text-muted-foreground">
                  Legislativo municipal de uma cidade específica
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              institutionType === "assembleia_legislativa"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-primary/50"
            }`}
            onClick={() => setInstitutionType("assembleia_legislativa")}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Assembleia Legislativa</h3>
                <p className="text-sm text-muted-foreground">
                  Legislativo estadual
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Localização
        </CardTitle>
        <CardDescription>
          {institutionType === "camara_municipal"
            ? "Selecione o estado e cidade da câmara municipal"
            : "Selecione o estado da assembleia legislativa"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="estado">Estado *</Label>
          <Select
            value={selectedEstado?.id || ""}
            onValueChange={(value) => {
              const estado = estados.find(e => e.id === value);
              setSelectedEstado(estado || null);
              setSelectedCidade(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {estados.map((estado) => (
                <SelectItem key={estado.id} value={estado.id}>
                  {estado.nome} ({estado.sigla})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {institutionType === "camara_municipal" && (
          <div>
            <Label htmlFor="cidade">Cidade *</Label>
            <Select
              value={selectedCidade?.id || ""}
              onValueChange={(value) => {
                const cidade = cidades.find(c => c.id === value);
                setSelectedCidade(cidade || null);
              }}
              disabled={!selectedEstado}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                {cidades.map((cidade) => (
                  <SelectItem key={cidade.id} value={cidade.id}>
                    {cidade.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Políticos Autorizados
        </CardTitle>
        <CardDescription>
          Adicione os emails dos políticos que poderão criar contas nesta instituição
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para adicionar político */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Adicionar Político Autorizado</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="politico-email">Email *</Label>
              <Input
                id="politico-email"
                type="email"
                value={newPolitico.email}
                onChange={(e) => setNewPolitico({ ...newPolitico, email: e.target.value })}
                placeholder="político@email.com"
              />
            </div>
            <div>
              <Label htmlFor="politico-nome">Nome Completo</Label>
              <Input
                id="politico-nome"
                value={newPolitico.nome_politico}
                onChange={(e) => setNewPolitico({ ...newPolitico, nome_politico: e.target.value })}
                placeholder="João Silva"
              />
            </div>
          </div>
          <Button onClick={addPolitico} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar à Lista
          </Button>
        </div>

        {/* Lista de políticos adicionados */}
        {politicosAutorizados.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Políticos que receberão convite por email:</h4>
            <div className="space-y-2">
              {politicosAutorizados.map((politico, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{politico.email}</p>
                    {politico.nome_politico && (
                      <p className="text-sm text-muted-foreground">{politico.nome_politico}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {institutionType === "camara_municipal" ? "Vereador" : "Deputado Estadual"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removePolitico(politico.email)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {politicosAutorizados.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum político adicionado ainda</p>
            <p className="text-sm">Você pode pular esta etapa e adicionar políticos depois</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Instituição - Etapa {currentStep} de 3</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`h-0.5 w-16 mx-2 ${
                      step < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? handleClose : handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 1 ? "Cancelar" : "Voltar"}
            </Button>

            <Button
              onClick={currentStep === 3 ? handleSubmit : handleNext}
              disabled={isSubmitting}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === 3 ? (
                isSubmitting ? "Finalizando..." : "Finalizar e Enviar Convites"
              ) : currentStep === 2 ? (
                isSubmitting ? "Criando..." : (
                  <>
                    Criar e Continuar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )
              ) : (
                <>
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}