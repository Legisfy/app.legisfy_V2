import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Clock, ChevronLeft, ChevronRight, Users, MessageSquare, Eye, Beaker, Tag } from "lucide-react";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useCampaigns } from "@/hooks/useCampaigns";
import { WhatsAppPreview } from "./WhatsAppPreview";
import { cn } from "@/lib/utils";

interface MultiStepCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

const STEPS = [
  { id: 1, title: "Informações", icon: Users },
  { id: 2, title: "Tipo", icon: Calendar },
  { id: 3, title: "Agendamento", icon: Clock },
  { id: 4, title: "Público", icon: Users },
  { id: 5, title: "Mensagem", icon: MessageSquare },
  { id: 6, title: "Coleta", icon: Beaker },
  { id: 7, title: "Preview", icon: Eye },
];

export const MultiStepCampaignModal = ({ open, onOpenChange }: MultiStepCampaignModalProps) => {
  const { activeInstitution } = useActiveInstitution();
  const { createCampaign } = useCampaigns();
  
  // Fetch AI Assessor configuration
  const [aiAssessor, setAiAssessor] = useState<{ nome: string; foto_url: string | null } | null>(null);
  
  useQuery({
    queryKey: ["ai-assessor", activeInstitution?.cabinet_id],
    queryFn: async () => {
      if (!activeInstitution?.cabinet_id) return null;
      
      const { data, error } = await supabase
        .from("meu_assessor_ia")
        .select("nome, foto_url")
        .eq("gabinete_id", activeInstitution.cabinet_id)
        .maybeSingle();
      
      if (error) throw error;
      setAiAssessor(data);
      return data;
    },
    enabled: !!activeInstitution?.cabinet_id,
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"once" | "recurring">("once");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [dayTimes, setDayTimes] = useState<Record<number, string>>({});
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [audienceType, setAudienceType] = useState<"publico" | "tag">("publico");
  const [publicId, setPublicId] = useState<string>("");
  const [tagId, setTagId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [collectDataEnabled, setCollectDataEnabled] = useState(false);
  const [collectDataLabel, setCollectDataLabel] = useState("");
  const [collectDataVariable, setCollectDataVariable] = useState("");
  const [collectDataTrigger, setCollectDataTrigger] = useState("");

  const { data: publicos } = useQuery({
    queryKey: ["publicos", activeInstitution?.cabinet_id],
    queryFn: async () => {
      if (!activeInstitution?.cabinet_id) return [];
      
      const { data, error } = await supabase
        .from("publicos")
        .select("*")
        .eq("gabinete_id", activeInstitution.cabinet_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeInstitution?.cabinet_id,
  });

  // Query to fetch tags
  const { data: tags } = useQuery({
    queryKey: ["eleitor-tags", activeInstitution?.cabinet_id],
    queryFn: async () => {
      if (!activeInstitution?.cabinet_id) return [];
      
      const { data, error } = await supabase
        .from("eleitor_tags")
        .select("*")
        .eq("gabinete_id", activeInstitution.cabinet_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeInstitution?.cabinet_id,
  });

  // Query to get voter count for selected public or tag
  const { data: voterCount } = useQuery({
    queryKey: ["voter-count", audienceType, publicId, tagId, activeInstitution?.cabinet_id],
    queryFn: async () => {
      if (!activeInstitution?.cabinet_id) return 0;
      
      if (audienceType === "publico" && !publicId) return 0;
      if (audienceType === "tag" && !tagId) return 0;
      
      let query = supabase
        .from("eleitores")
        .select("*", { count: "exact", head: true })
        .eq("gabinete_id", activeInstitution.cabinet_id);
      
      if (audienceType === "tag" && tagId) {
        // Tags são armazenadas como nomes, não IDs
        const selectedTag = tags?.find(t => t.id === tagId);
        if (selectedTag) {
          query = query.contains("tags", [selectedTag.name]);
        }
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!activeInstitution?.cabinet_id && ((audienceType === "publico" && !!publicId) || (audienceType === "tag" && !!tagId)),
  });

  const selectedPublic = useMemo(() => {
    return publicos?.find(p => p.id === publicId);
  }, [publicos, publicId]);

  const selectedTag = useMemo(() => {
    return tags?.find(t => t.id === tagId);
  }, [tags, tagId]);

  const handleSubmit = async () => {
    const campaignData: any = {
      title,
      description: description || null,
      audience_type: audienceType,
      public_id: audienceType === "publico" ? (publicId || null) : null,
      tag_id: audienceType === "tag" ? (tagId || null) : null,
      is_active: true,
      frequency,
      message: message || null,
      scheduled_date: null,
      recurring_days: null,
      recurring_time: null,
      recurring_day_times: null,
      recurring_end_date: null,
      collect_data_enabled: collectDataEnabled,
      collect_data_label: collectDataEnabled ? collectDataLabel : null,
      collect_data_variable: collectDataEnabled ? collectDataVariable : null,
      collect_data_trigger: collectDataEnabled ? collectDataTrigger : null,
    };

    if (frequency === "once" && scheduledDate && scheduledTime) {
      campaignData.scheduled_date = `${scheduledDate}T${scheduledTime}:00`;
    } else if (frequency === "recurring") {
      campaignData.recurring_days = recurringDays;
      campaignData.recurring_day_times = dayTimes;
      campaignData.recurring_end_date = recurringEndDate || null;
    }

    await createCampaign.mutateAsync(campaignData);
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(1);
    setTitle("");
    setDescription("");
    setFrequency("once");
    setScheduledDate("");
    setScheduledTime("");
    setRecurringDays([]);
    setDayTimes({});
    setRecurringEndDate("");
    setAudienceType("publico");
    setPublicId("");
    setTagId("");
    setMessage("");
    setCollectDataEnabled(false);
    setCollectDataLabel("");
    setCollectDataVariable("");
    setCollectDataTrigger("");
    onOpenChange(false);
  };

  const toggleDay = (day: number) => {
    setRecurringDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + `{{${variable}}}`);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return title.trim() !== "";
      case 2:
        return true;
      case 3:
        if (frequency === "once") {
          return scheduledDate !== "" && scheduledTime !== "";
        } else {
          // Check that all selected days have times
          return recurringDays.length > 0 && recurringDays.every(day => dayTimes[day]);
        }
      case 4:
        return audienceType === "publico" ? publicId !== "" : tagId !== "";
      case 5:
        return message.trim() !== "";
      case 6:
        if (!collectDataEnabled) return true;
        return collectDataLabel.trim() !== "" && collectDataVariable.trim() !== "" && collectDataTrigger.trim() !== "";
      case 7:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Campanha *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Campanha de Natal 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo desta campanha"
                rows={4}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label>Tipo de Campanha</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFrequency("once")}
                className={cn(
                  "p-6 border-2 rounded-lg transition-all hover:border-primary",
                  frequency === "once" ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <div className="font-semibold">Única</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Envio em data específica
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFrequency("recurring")}
                className={cn(
                  "p-6 border-2 rounded-lg transition-all hover:border-primary",
                  frequency === "recurring" ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <div className="font-semibold">Recorrente</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Envio em dias específicos
                </div>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {frequency === "once" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Data de Envio *</Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled-time">Horário *</Label>
                  <Input
                    id="scheduled-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Dias da Semana *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={recurringDays.includes(day.value)}
                          onCheckedChange={() => toggleDay(day.value)}
                        />
                        <Label htmlFor={`day-${day.value}`} className="cursor-pointer">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {recurringDays.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <Label>Horários por Dia *</Label>
                    <div className="space-y-2">
                      {recurringDays.map((dayValue) => {
                        const dayLabel = DAYS_OF_WEEK.find(d => d.value === dayValue)?.label;
                        return (
                          <div key={dayValue} className="flex items-center gap-3">
                            <Label className="w-24 text-sm">{dayLabel}</Label>
                            <Input
                              type="time"
                              value={dayTimes[dayValue] || ""}
                              onChange={(e) => setDayTimes(prev => ({
                                ...prev,
                                [dayValue]: e.target.value
                              }))}
                              placeholder="Selecione o horário"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="recurring-end">Data de Término (Opcional)</Label>
                  <Input
                    id="recurring-end"
                    type="date"
                    value={recurringEndDate}
                    onChange={(e) => setRecurringEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Tipo de Público Alvo *</Label>
              <RadioGroup value={audienceType} onValueChange={(value) => setAudienceType(value as "publico" | "tag")}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="publico" id="publico" />
                  <Label htmlFor="publico" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">Público</div>
                      <div className="text-xs text-muted-foreground">Segmentação por públicos criados</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="tag" id="tag" />
                  <Label htmlFor="tag" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Tag className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">TAG</div>
                      <div className="text-xs text-muted-foreground">Segmentação por tags de eleitores</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {audienceType === "publico" ? (
              <div className="space-y-2">
                <Label htmlFor="public">Selecione o Público *</Label>
                <Select value={publicId} onValueChange={setPublicId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um público" />
                  </SelectTrigger>
                  <SelectContent>
                    {publicos?.map((publico) => (
                      <SelectItem key={publico.id} value={publico.id}>
                        {publico.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedPublic && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">{selectedPublic.nome}</h4>
                    {selectedPublic.descricao && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {selectedPublic.descricao}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-primary">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">
                        {voterCount !== undefined ? `${voterCount} eleitores` : 'Carregando...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="tag">Selecione a TAG *</Label>
                <Select value={tagId} onValueChange={setTagId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags?.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
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
                
                {selectedTag && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: selectedTag.color }}
                      />
                      <h4 className="font-semibold">{selectedTag.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">
                        {voterCount !== undefined ? `${voterCount} eleitores` : 'Carregando...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem da Campanha *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite a mensagem que será enviada..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Variáveis Disponíveis</Label>
              <div className="flex flex-wrap gap-2">
                {['nome', 'bairro', 'demanda', 'indicacao'].map((variable) => (
                  <Button
                    key={variable}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                  >
                    {`{{${variable}}}`}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Clique nas variáveis para inseri-las na mensagem
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="collect-data" className="text-base font-semibold">
                Quero coletar dados customizados
              </Label>
              <input
                type="checkbox"
                id="collect-data"
                checked={collectDataEnabled}
                onChange={(e) => setCollectDataEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300"
              />
            </div>

            {collectDataEnabled && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="data-label">Qual dado está coletando? *</Label>
                  <Input
                    id="data-label"
                    value={collectDataLabel}
                    onChange={(e) => setCollectDataLabel(e.target.value)}
                    placeholder="Ex: Time de Futebol"
                  />
                  <p className="text-xs text-muted-foreground">
                    Descrição do dado que será coletado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-variable">Variável *</Label>
                  <Input
                    id="data-variable"
                    value={collectDataVariable}
                    onChange={(e) => setCollectDataVariable(e.target.value)}
                    placeholder="Ex: times"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome da variável para usar nas mensagens (sem chaves)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-trigger">Quando coletar? *</Label>
                  <Textarea
                    id="data-trigger"
                    value={collectDataTrigger}
                    onChange={(e) => setCollectDataTrigger(e.target.value)}
                    placeholder="Ex: quando o eleitor responder a pergunta de qual time ele torce"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Descreva em que momento esse dado deve ser coletado
                  </p>
                </div>
              </div>
            )}

            {!collectDataEnabled && (
              <p className="text-sm text-muted-foreground text-center p-8 border rounded-lg border-dashed">
                Ative a coleta de dados para configurar variáveis personalizadas
              </p>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Preview da Mensagem</h3>
              <p className="text-sm text-muted-foreground">
                Veja como sua mensagem aparecerá no WhatsApp
              </p>
            </div>
            <WhatsAppPreview
              message={message}
              agentName={aiAssessor?.nome || "Assessor IA"}
              agentPhoto={aiAssessor?.foto_url || undefined}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Criar Nova Campanha</DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    currentStep >= step.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background"
                  )}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 hidden md:block",
                    currentStep >= step.id ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-[2px] flex-1 transition-all mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-1">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentStep === 1) {
                handleClose();
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {currentStep === 1 ? "Cancelar" : "Voltar"}
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createCampaign.isPending}
            >
              {createCampaign.isPending ? "Criando..." : "Criar Campanha"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};