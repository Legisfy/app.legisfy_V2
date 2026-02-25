import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Clock, X, MapPin, Users, Eye, EyeOff, ChevronDown, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAssessores } from "@/hooks/useAssessores";
import { useRealEleitores } from "@/hooks/useRealEleitores";

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateEvent: (event: any) => void;
  selectedDate?: Date;
}

export function CreateEventModal({ open, onOpenChange, onCreateEvent }: CreateEventModalProps) {
  const { toast } = useToast();
  const { assessores } = useAssessores();
  const { eleitores } = useRealEleitores();
  const [showAddress, setShowAddress] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    cep: "",
    type: "reuniao",
    isPrivate: false,
    selectedAssessores: [] as string[],
    selectedEleitores: [] as string[]
  });
  const [loadingCep, setLoadingCep] = useState(false);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      cep: "",
      type: "reuniao",
      isPrivate: false,
      selectedAssessores: [],
      selectedEleitores: []
    });
    setShowAddress(false);
    setShowParticipants(false);
  };

  const searchCep = async (cep: string) => {
    if (cep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({ title: "CEP não encontrado", description: "Verifique se o CEP está correto.", variant: "destructive" });
        return;
      }

      setFormData(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: `${data.localidade} - ${data.uf}` || ''
      }));
    } catch (error) {
      toast({ title: "Erro ao buscar CEP", description: "Não foi possível buscar o endereço.", variant: "destructive" });
    } finally {
      setLoadingCep(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      reuniao: "bg-blue-500",
      visita: "bg-emerald-500",
      audiencia: "bg-orange-500",
      evento: "bg-indigo-500"
    };
    return colors[type] || "bg-primary";
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reuniao: "Reunião",
      visita: "Visita",
      audiencia: "Audiência",
      evento: "Evento"
    };
    return labels[type] || type;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: "Erro", description: "O título do evento é obrigatório.", variant: "destructive" });
      return;
    }

    const startDateTime = new Date(formData.date);
    const [startHour, startMinute] = formData.startTime.split(':');
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

    const endDateTime = new Date(formData.date);
    const [endHour, endMinute] = formData.endTime.split(':');
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

    if (endDateTime <= startDateTime) {
      toast({ title: "Erro", description: "O horário de término deve ser posterior ao de início.", variant: "destructive" });
      return;
    }

    const allParticipants = [
      ...assessores.filter(a => formData.selectedAssessores.includes(a.id)).map(a => a.nome),
      ...eleitores.filter(e => formData.selectedEleitores.includes(e.id)).map(e => e.name)
    ];

    const fullAddress = [formData.street, formData.number, formData.neighborhood, formData.city].filter(Boolean).join(', ');

    onCreateEvent({
      title: formData.title,
      description: formData.description,
      date: startDateTime,
      endDate: endDateTime,
      location: fullAddress,
      type: formData.type,
      isPrivate: formData.isPrivate,
      selectedAssessores: formData.selectedAssessores,
      selectedEleitores: formData.selectedEleitores,
      participants: allParticipants,
      color: getEventTypeColor(formData.type)
    });
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg p-0 gap-0 bg-card/95 backdrop-blur-xl border-border/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header premium */}
        <div className="px-5 pt-5 pb-3 border-b border-border/20">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <DialogHeader className="p-0 space-y-0">
              <DialogTitle className="text-sm font-bold text-foreground/90 font-outfit">Novo Evento</DialogTitle>
            </DialogHeader>
          </div>
          <p className="text-[9px] text-muted-foreground/50 font-medium uppercase tracking-widest ml-8">
            Adicione um compromisso à agenda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Título */}
          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reunião com Secretário de Obras"
              className="h-9 bg-muted/20 border-border/30 rounded-xl text-[11px] font-medium placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/30"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes do evento..."
              rows={2}
              className="bg-muted/20 border-border/30 rounded-xl text-[11px] font-medium placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/30 resize-none min-h-0"
            />
          </div>

          {/* Data e Horários - inline */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left font-medium bg-muted/20 border-border/30 rounded-xl text-[10px] hover:bg-muted/30",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3 opacity-50" />
                    {formData.date ? format(formData.date, "dd/MM/yy", { locale: ptBR }) : "Data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border-border/40" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Início</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="h-9 pl-7 bg-muted/20 border-border/30 rounded-xl text-[10px] font-medium focus-visible:ring-1 focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Término</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="h-9 pl-7 bg-muted/20 border-border/30 rounded-xl text-[10px] font-medium focus-visible:ring-1 focus-visible:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Tipo + Visibilidade inline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Tipo</Label>
              <div className="flex gap-1.5 flex-wrap">
                {(['reuniao', 'visita', 'audiencia', 'evento'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    className={cn(
                      "h-7 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border",
                      formData.type === type
                        ? `${getEventTypeColor(type)} text-white border-transparent shadow-sm`
                        : "bg-muted/20 border-border/30 text-muted-foreground/60 hover:bg-muted/40"
                    )}
                  >
                    {getEventTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Visibilidade</Label>
              <div className="flex items-center gap-2 h-7 mt-0.5">
                <Switch
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
                  className="scale-75"
                />
                <div className="flex items-center gap-1">
                  {formData.isPrivate ? <EyeOff className="h-3 w-3 text-muted-foreground/50" /> : <Eye className="h-3 w-3 text-muted-foreground/50" />}
                  <span className="text-[9px] font-medium text-muted-foreground/60">
                    {formData.isPrivate ? "Secreto" : "Visível"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Endereço - colapsável */}
          <div className="border border-border/20 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAddress(!showAddress)}
              className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>Endereço</span>
                {(formData.street || formData.city) && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[7px] rounded-full bg-primary/10 text-primary border-none font-bold">
                    Preenchido
                  </Badge>
                )}
              </div>
              <ChevronDown className={cn("h-3 w-3 transition-transform", showAddress && "rotate-180")} />
            </button>

            {showAddress && (
              <div className="px-3 pb-3 space-y-3 border-t border-border/10">
                <div className="grid grid-cols-3 gap-2 pt-3">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">CEP</Label>
                    <div className="flex gap-1">
                      <Input
                        value={formData.cep}
                        onChange={(e) => {
                          const cep = e.target.value.replace(/\D/g, '');
                          if (cep.length <= 8) {
                            setFormData({ ...formData, cep });
                            if (cep.length === 8) searchCep(cep);
                          }
                        }}
                        placeholder="00000000"
                        maxLength={8}
                        className="h-8 bg-muted/20 border-border/30 rounded-lg text-[10px] font-medium"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">Rua</Label>
                    <Input
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="Nome da rua"
                      className="h-8 bg-muted/20 border-border/30 rounded-lg text-[10px] font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">Nº</Label>
                    <Input
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="123"
                      className="h-8 bg-muted/20 border-border/30 rounded-lg text-[10px] font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">Bairro</Label>
                    <Input
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Bairro"
                      className="h-8 bg-muted/20 border-border/30 rounded-lg text-[10px] font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">Cidade</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Cidade - UF"
                      className="h-8 bg-muted/20 border-border/30 rounded-lg text-[10px] font-medium"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Participantes - colapsável */}
          <div className="border border-border/20 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowParticipants(!showParticipants)}
              className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>Participantes</span>
                {(formData.selectedAssessores.length > 0 || formData.selectedEleitores.length > 0) && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[7px] rounded-full bg-primary/10 text-primary border-none font-bold">
                    {formData.selectedAssessores.length + formData.selectedEleitores.length}
                  </Badge>
                )}
              </div>
              <ChevronDown className={cn("h-3 w-3 transition-transform", showParticipants && "rotate-180")} />
            </button>

            {showParticipants && (
              <div className="px-3 pb-3 space-y-3 border-t border-border/10 pt-3">
                {/* Assessores */}
                <div className="space-y-1.5">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">Assessores</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !formData.selectedAssessores.includes(value)) {
                        setFormData({ ...formData, selectedAssessores: [...formData.selectedAssessores, value] });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 bg-muted/20 border-border/30 rounded-lg text-[10px] font-medium">
                      <SelectValue placeholder="Selecionar assessores" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40">
                      {assessores.map((assessor) => (
                        <SelectItem key={assessor.id} value={assessor.id} className="text-[10px]">
                          {assessor.nome} - {assessor.cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.selectedAssessores.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.selectedAssessores.map((id) => {
                        const assessor = assessores.find(a => a.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="h-5 text-[8px] gap-1 rounded-md bg-muted/30 border-border/20 font-medium">
                            {assessor?.nome}
                            <X className="h-2.5 w-2.5 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setFormData({
                              ...formData, selectedAssessores: formData.selectedAssessores.filter(i => i !== id)
                            })} />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Eleitores */}
                <div className="space-y-1.5">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">Eleitores</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !formData.selectedEleitores.includes(value)) {
                        setFormData({ ...formData, selectedEleitores: [...formData.selectedEleitores, value] });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 bg-muted/20 border-border/30 rounded-lg text-[10px] font-medium">
                      <SelectValue placeholder="Selecionar eleitores" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40">
                      {eleitores.map((eleitor) => (
                        <SelectItem key={eleitor.id} value={eleitor.id} className="text-[10px]">
                          {eleitor.name} - {eleitor.neighborhood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.selectedEleitores.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.selectedEleitores.map((id) => {
                        const eleitor = eleitores.find(e => e.id === id);
                        return (
                          <Badge key={id} variant="outline" className="h-5 text-[8px] gap-1 rounded-md border-border/20 font-medium">
                            {eleitor?.name}
                            <X className="h-2.5 w-2.5 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setFormData({
                              ...formData, selectedEleitores: formData.selectedEleitores.filter(i => i !== id)
                            })} />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer fixo */}
        <div className="px-5 py-3 border-t border-border/20 flex items-center justify-between bg-muted/5">
          <Button type="button" variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }}
            className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-foreground rounded-lg">
            Cancelar
          </Button>
          <Button onClick={handleSubmit}
            className="h-8 px-5 text-[9px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95">
            Criar Evento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}