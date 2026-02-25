import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock } from "lucide-react";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useCampaigns } from "@/hooks/useCampaigns";

interface CreateCampaignModalProps {
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

export const CreateCampaignModal = ({ open, onOpenChange }: CreateCampaignModalProps) => {
  const { activeInstitution } = useActiveInstitution();
  const { createCampaign } = useCampaigns();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publicId, setPublicId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [frequency, setFrequency] = useState<"once" | "recurring">("once");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringTime, setRecurringTime] = useState("");
  const [recurringEndDate, setRecurringEndDate] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const campaignData: any = {
      title,
      description: description || null,
      public_id: publicId || null,
      is_active: isActive,
      frequency,
      scheduled_date: null,
      recurring_days: null,
      recurring_time: null,
      recurring_end_date: null,
    };

    if (frequency === "once" && scheduledDate && scheduledTime) {
      campaignData.scheduled_date = `${scheduledDate}T${scheduledTime}:00`;
    } else if (frequency === "recurring") {
      campaignData.recurring_days = recurringDays;
      campaignData.recurring_time = recurringTime || null;
      campaignData.recurring_end_date = recurringEndDate || null;
    }

    await createCampaign.mutateAsync(campaignData);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setPublicId("");
    setIsActive(true);
    setFrequency("once");
    setScheduledDate("");
    setScheduledTime("");
    setRecurringDays([]);
    setRecurringTime("");
    setRecurringEndDate("");
    onOpenChange(false);
  };

  const toggleDay = (day: number) => {
    setRecurringDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Campanha</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da campanha"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo da campanha"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public">Público Alvo</Label>
            <Select value={publicId} onValueChange={setPublicId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um público" />
              </SelectTrigger>
              <SelectContent>
                {publicos?.map((publico) => (
                  <SelectItem key={publico.id} value={publico.id}>
                    {publico.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is-active" className="cursor-pointer">
              Campanha ativa
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Tipo de Campanha</Label>
            <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Única</SelectItem>
                <SelectItem value="recurring">Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === "once" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled-date">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data de Envio
                </Label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled-time">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Horário
                </Label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {frequency === "recurring" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dias da Semana</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={recurringDays.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <Label htmlFor={`day-${day.value}`} className="cursor-pointer text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-time">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Horário do Envio
                </Label>
                <Input
                  id="recurring-time"
                  type="time"
                  value={recurringTime}
                  onChange={(e) => setRecurringTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-end">Data de Término (Opcional)</Label>
                <Input
                  id="recurring-end"
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCampaign.isPending}>
              {createCampaign.isPending ? "Criando..." : "Criar Campanha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};