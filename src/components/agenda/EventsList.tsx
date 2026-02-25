import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, Users, Search, Filter } from "lucide-react";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface EventsListProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
  canEdit: boolean;
}

export function EventsList({ events, onEventSelect, canEdit }: EventsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTime, setFilterTime] = useState("all");

  // Filtrar eventos
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || event.type === filterType;
    const matchesPriority = filterPriority === "all" || event.priority === filterPriority;
    
    const today = startOfDay(new Date());
    const eventDate = startOfDay(new Date(event.date));
    
    let matchesTime = true;
    if (filterTime === "past") {
      matchesTime = isBefore(eventDate, today);
    } else if (filterTime === "today") {
      matchesTime = eventDate.getTime() === today.getTime();
    } else if (filterTime === "upcoming") {
      matchesTime = isAfter(eventDate, today);
    }
    
    return matchesSearch && matchesType && matchesPriority && matchesTime;
  });

  // Ordenar eventos por data
  const sortedEvents = filteredEvents.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

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
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro por tipo */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="reuniao">Reunião</SelectItem>
                <SelectItem value="visita">Visita</SelectItem>
                <SelectItem value="sessao">Sessão</SelectItem>
                <SelectItem value="audiencia">Audiência</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por prioridade */}
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por tempo */}
            <Select value={filterTime} onValueChange={setFilterTime}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="past">Passados</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="upcoming">Próximos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de eventos */}
      <div className="space-y-3">
        {sortedEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum evento encontrado com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedEvents.map((event) => (
            <Card 
              key={event.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onEventSelect(event)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{event.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={getPriorityVariant(event.priority) as any}>
                      {event.priority === "high" ? "Alta" : 
                       event.priority === "medium" ? "Média" : "Baixa"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`}></div>
                      <span className="text-sm text-muted-foreground capitalize">{event.type}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  {event.participants.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{event.participants.length} participante(s)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}