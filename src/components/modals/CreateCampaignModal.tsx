import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Campaign } from '@/hooks/useCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from '@/hooks/useActiveInstitution';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (campaign: Partial<Campaign>) => Promise<void>;
  editingCampaign?: Campaign | null;
}

interface Publico {
  id: string;
  nome: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export function CreateCampaignModal({ open, onOpenChange, onSave, editingCampaign }: CreateCampaignModalProps) {
  const { activeInstitution } = useActiveInstitution();
  const [loading, setLoading] = useState(false);
  const [publicos, setPublicos] = useState<Publico[]>([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publicId, setPublicId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [frequency, setFrequency] = useState<'once' | 'recurring'>('once');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringTime, setRecurringTime] = useState('09:00');
  const [recurringEndDate, setRecurringEndDate] = useState<Date | undefined>();

  useEffect(() => {
    if (open && activeInstitution?.cabinet_id) {
      fetchPublicos();
    }
  }, [open, activeInstitution?.cabinet_id]);

  useEffect(() => {
    if (editingCampaign) {
      setTitle(editingCampaign.title);
      setDescription(editingCampaign.description || '');
      setPublicId(editingCampaign.public_id || '');
      setIsActive(editingCampaign.is_active);
      setFrequency(editingCampaign.frequency);
      if (editingCampaign.scheduled_date) {
        setScheduledDate(new Date(editingCampaign.scheduled_date));
      }
      setRecurringDays(editingCampaign.recurring_days || []);
      setRecurringTime(editingCampaign.recurring_time || '09:00');
      if (editingCampaign.recurring_end_date) {
        setRecurringEndDate(new Date(editingCampaign.recurring_end_date));
      }
    } else {
      resetForm();
    }
  }, [editingCampaign, open]);

  const fetchPublicos = async () => {
    if (!activeInstitution?.cabinet_id) return;

    try {
      const { data, error } = await supabase
        .from('publicos')
        .select('id, nome')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      setPublicos(data || []);
    } catch (error) {
      console.error('Error fetching publicos:', error);
      toast.error('Erro ao carregar públicos');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPublicId('');
    setIsActive(true);
    setFrequency('once');
    setScheduledDate(undefined);
    setRecurringDays([]);
    setRecurringTime('09:00');
    setRecurringEndDate(undefined);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!publicId) {
      toast.error('Selecione um público');
      return;
    }

    if (frequency === 'once' && !scheduledDate) {
      toast.error('Selecione uma data para o disparo único');
      return;
    }

    if (frequency === 'recurring') {
      if (recurringDays.length === 0) {
        toast.error('Selecione pelo menos um dia da semana');
        return;
      }
      if (!recurringEndDate) {
        toast.error('Selecione uma data de término');
        return;
      }
    }

    setLoading(true);
    try {
      const campaignData: Partial<Campaign> = {
        title: title.trim(),
        description: description.trim() || null,
        public_id: publicId,
        is_active: isActive,
        frequency,
        scheduled_date: frequency === 'once' && scheduledDate 
          ? scheduledDate.toISOString() 
          : null,
        recurring_days: frequency === 'recurring' ? recurringDays : null,
        recurring_time: frequency === 'recurring' ? recurringTime : null,
        recurring_end_date: frequency === 'recurring' && recurringEndDate
          ? format(recurringEndDate, 'yyyy-MM-dd')
          : null,
      };

      await onSave(campaignData);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setRecurringDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da campanha de disparos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Boas-vindas Novo Público"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo desta campanha..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public">Público *</Label>
            <Select value={publicId} onValueChange={setPublicId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um público" />
              </SelectTrigger>
              <SelectContent>
                {publicos.map((publico) => (
                  <SelectItem key={publico.id} value={publico.id}>
                    {publico.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Campanha ativa</Label>
          </div>

          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as 'once' | 'recurring')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Uma vez</SelectItem>
                <SelectItem value="recurring">Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === 'once' && (
            <div className="space-y-2">
              <Label>Data do Disparo *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !scheduledDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? (
                      format(scheduledDate, "PPP 'às' HH:mm", { locale: ptBR })
                    ) : (
                      <span>Selecione a data e hora</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {frequency === 'recurring' && (
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
                      <Label
                        htmlFor={`day-${day.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={recurringTime}
                    onChange={(e) => setRecurringTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data de Término *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !recurringEndDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurringEndDate ? (
                        format(recurringEndDate, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecione a data de término</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={recurringEndDate}
                      onSelect={setRecurringEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : editingCampaign ? 'Atualizar' : 'Criar Campanha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}