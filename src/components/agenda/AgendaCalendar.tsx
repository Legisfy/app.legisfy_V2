import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate: Date;
  location: string;
  type: string;
  priority: string;
  participants: string[];
}

interface AgendaCalendarProps {
  events: Event[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventSelect: (event: Event) => void;
}

export function AgendaCalendar({ events, selectedDate, onDateSelect, onEventSelect }: AgendaCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filtrar eventos do mês atual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= monthStart && eventDate <= monthEnd;
  });

  // Eventos do dia selecionado
  const selectedDateEvents = events.filter(event => 
    isSameDay(new Date(event.date), selectedDate)
  );

  // Função para verificar se um dia tem eventos
  const hasEvents = (day: Date) => {
    return events.some(event => isSameDay(new Date(event.date), day));
  };

  // Função para obter a cor do tipo de evento
  const getEventTypeColor = (type: string) => {
    const colors = {
      reuniao: "bg-blue-500",
      visita: "bg-green-500", 
      sessao: "bg-purple-500",
      audiencia: "bg-orange-500",
      default: "bg-gray-500"
    };
    return colors[type as keyof typeof colors] || colors.default;
  };

  // Função para obter a cor da prioridade
  const getPriorityVariant = (priority: string) => {
    const variants = {
      high: "destructive",
      medium: "secondary",
      low: "outline"
    };
    return variants[priority as keyof typeof variants] || "outline";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendário */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={ptBR}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              hasEvents: (day) => hasEvents(day)
            }}
            modifiersStyles={{
              hasEvents: { 
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                fontWeight: "bold"
              }
            }}
          />
          
          {/* Legenda */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Dias com eventos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eventos do dia selecionado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedDateEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum evento agendado para este dia.
            </p>
          ) : (
            selectedDateEvents.map((event) => (
              <div 
                key={event.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onEventSelect(event)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <Badge variant={getPriorityVariant(event.priority) as any} className="text-xs">
                    {event.priority === "high" ? "Alta" : 
                     event.priority === "medium" ? "Média" : "Baixa"}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(event.date), "HH:mm")} - {format(new Date(event.endDate), "HH:mm")}
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  {event.participants.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{event.participants.length} participante(s)</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 mt-2">
                  <div className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}></div>
                  <span className="text-xs text-muted-foreground capitalize">{event.type}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}