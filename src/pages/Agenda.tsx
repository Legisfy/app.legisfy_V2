import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { CalendarGrid } from "@/components/agenda/CalendarGrid";
import { WeekView } from "@/components/agenda/WeekView";
import { DayView } from "@/components/agenda/DayView";
import { EventsList } from "@/components/agenda/EventsList";
import { SearchAndFilters } from "@/components/agenda/SearchAndFilters";
import { CreateEventModal } from "@/components/agenda/CreateEventModal";
import { ViewEventModal } from "@/components/agenda/ViewEventModal";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, List, Grid, Settings2, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useRealEventos } from "@/hooks/useRealEventos";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard } from "@/components/PermissionGuard";
import { isAfter, isBefore, startOfDay, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function Agenda() {
  const { user } = useAuthContext();
  const { eventos, loading, createEvento, updateEvento, deleteEvento } = useRealEventos();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "list">("month");
  const [userRole, setUserRole] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTime, setFilterTime] = useState("all");

  // Check user role
  useEffect(() => {
    const getUserRole = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('main_role')
          .eq('user_id', user.id)
          .single();

        setUserRole(profile?.main_role || null);
      }
    };

    getUserRole();
  }, [user]);

  // Map database events to component format
  const mappedEvents = eventos.map(evento => {
    const eventDate = new Date(evento.data_inicio);
    const today = new Date();
    const isToday = eventDate.toDateString() === today.toDateString();

    let color = '#3b82f6';
    switch (evento.tipo) {
      case 'visita': color = '#8b5cf6'; break;
      case 'audiencia': color = '#f97316'; break;
      case 'evento': color = '#3b82f6'; break;
      case 'reuniao': color = '#10b981'; break;
    }

    return {
      id: evento.id,
      title: evento.titulo,
      description: evento.descricao || '',
      date: eventDate,
      endDate: new Date(evento.data_fim),
      location: evento.local || '',
      type: evento.tipo || 'reuniao',
      priority: 'medium',
      participants: evento.participantes || [],
      createdBy: evento.user_id || '',
      color,
      isToday
    };
  });

  // Filter events
  const filteredEvents = mappedEvents.filter(event => {
    const matchesSearch = searchTerm === "" ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || event.type === filterType;
    const matchesPriority = filterPriority === "all" || event.priority === filterPriority;

    const today = startOfDay(new Date());
    const eventDate = startOfDay(new Date(event.date));

    let matchesTime = true;
    if (filterTime === "past") matchesTime = isBefore(eventDate, today);
    else if (filterTime === "today") matchesTime = isToday(new Date(event.date));
    else if (filterTime === "upcoming") matchesTime = isAfter(eventDate, today);
    else if (filterTime === "this-week") {
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);
      matchesTime = eventDate >= weekStart && eventDate <= weekEnd;
    } else if (filterTime === "this-month") {
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      matchesTime = eventDate >= monthStart && eventDate <= monthEnd;
    }

    return matchesSearch && matchesType && matchesPriority && matchesTime;
  });

  const handleCreateEvent = async (eventData: any) => {
    try {
      const participantes = Array.isArray(eventData.participants) && eventData.participants.length > 0
        ? eventData.participants
        : null;

      await createEvento({
        titulo: eventData.title,
        descricao: eventData.description,
        data_inicio: eventData.date.toISOString(),
        data_fim: eventData.endDate.toISOString(),
        local: eventData.location,
        tipo: eventData.type,
        participantes
      });
      setCreateModalOpen(false);
      toast({ title: "Evento criado", description: "O evento foi criado com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: (error as any)?.message || "Erro ao criar evento.", variant: "destructive" });
    }
  };

  const handleCreateEventFromDate = (date: Date) => {
    setSelectedDate(date);
    setCreateModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setViewModalOpen(true);
  };

  const handleUpdateEvent = async (updatedEvent: any) => {
    try {
      await updateEvento(updatedEvent.id, {
        titulo: updatedEvent.title,
        descricao: updatedEvent.description,
        data_inicio: updatedEvent.date.toISOString(),
        data_fim: updatedEvent.endDate.toISOString(),
        local: updatedEvent.location,
        tipo: updatedEvent.type,
        participantes: updatedEvent.participants
      });
      toast({ title: "Evento atualizado", description: "O evento foi atualizado com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao atualizar evento.", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvento(eventId);
      setViewModalOpen(false);
      toast({ title: "Evento excluído", description: "O evento foi excluído com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao excluir evento.", variant: "destructive" });
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterPriority("all");
    setFilterTime("all");
  };

  const todayEventsCount = mappedEvents.filter(event => isToday(new Date(event.date))).length;
  const upcomingEventsCount = mappedEvents.filter(event => isAfter(new Date(event.date), new Date())).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Sincronizando Agenda...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PermissionGuard module="agenda">
        <div className="p-5 space-y-5">
          {/* Header Compacto e Premium */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-base font-bold tracking-tight text-foreground/80 font-outfit uppercase">Agenda</h1>
                <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-bold border-border/60 text-muted-foreground bg-transparent uppercase tracking-[0.2em] rounded-full">
                  Sincronizado
                </Badge>
              </div>
              <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-widest leading-none">
                Gestão estratégica de compromissos e eventos do gabinete
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hasPermission('agenda', 'write') ? (
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="h-10 px-4 gap-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Evento</span>
                </Button>
              ) : (
                <Badge variant="secondary" className="h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-muted/50 border-none">
                  Apenas Visualização
                </Badge>
              )}
            </div>
          </div>

          {/* Stats Compactos inline */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-xl px-3 py-2.5 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50 leading-none mb-1">Hoje</p>
                <p className="text-lg font-black text-foreground/80 leading-none font-outfit">{todayEventsCount}</p>
              </div>
            </div>
            <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-xl px-3 py-2.5 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50 leading-none mb-1">Próximos</p>
                <p className="text-lg font-black text-foreground/80 leading-none font-outfit">{upcomingEventsCount}</p>
              </div>
            </div>
            <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-xl px-3 py-2.5 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50 leading-none mb-1">Total</p>
                <p className="text-lg font-black text-foreground/80 leading-none font-outfit">{mappedEvents.length}</p>
              </div>
            </div>
          </div>

          {/* Busca e Filtros - Modernizados */}
          <div className="bg-card/40 backdrop-blur-md border border-border/40 p-1.5 rounded-2xl shadow-sm">
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              filterPriority={filterPriority}
              onFilterPriorityChange={setFilterPriority}
              filterTime={filterTime}
              onFilterTimeChange={setFilterTime}
              onClearFilters={clearAllFilters}
              totalEvents={mappedEvents.length}
              filteredEvents={filteredEvents.length}
            />
          </div>

          {/* Main Content com Abas Modernas */}
          <Tabs value={viewMode} onValueChange={setViewMode as any} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="bg-muted/30 p-1 rounded-xl">
                <TabsList className="bg-transparent h-8 p-0 gap-1 border-none shadow-none">
                  <TabsTrigger value="month" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 transition-all">
                    <Grid className="h-3 w-3 opacity-60" /> Mês
                  </TabsTrigger>
                  <TabsTrigger value="week" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 transition-all">
                    <Calendar className="h-3 w-3 opacity-60" /> Semana
                  </TabsTrigger>
                  <TabsTrigger value="day" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 transition-all">
                    <Clock className="h-3 w-3 opacity-60" /> Dia
                  </TabsTrigger>
                  <TabsTrigger value="list" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 transition-all">
                    <List className="h-3 w-3 opacity-60" /> Lista
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <Badge variant="outline" className="text-[8px] font-bold tracking-widest uppercase border-border/40 text-muted-foreground/50 bg-transparent">
                  Mostrando {filteredEvents.length} de {mappedEvents.length} eventos
                </Badge>
              </div>
            </div>

            <TabsContent value="month" className="mt-0 outline-none border-none">
              <CalendarGrid
                events={filteredEvents}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onEventSelect={handleSelectEvent}
                onCreateEvent={hasPermission('agenda', 'write') ? handleCreateEventFromDate : undefined}
                viewMode="month"
              />
            </TabsContent>

            <TabsContent value="week" className="mt-0 outline-none border-none">
              <WeekView
                events={filteredEvents}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onEventSelect={handleSelectEvent}
                onCreateEvent={hasPermission('agenda', 'write') ? handleCreateEventFromDate : undefined}
              />
            </TabsContent>

            <TabsContent value="day" className="mt-0 outline-none border-none">
              <DayView
                events={filteredEvents}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onEventSelect={handleSelectEvent}
                onCreateEvent={hasPermission('agenda', 'write') ? handleCreateEventFromDate : undefined}
              />
            </TabsContent>

            <TabsContent value="list" className="mt-0 outline-none border-none">
              <EventsList
                events={filteredEvents}
                onEventSelect={handleSelectEvent}
                canEdit={hasPermission('agenda', 'write')}
              />
            </TabsContent>
          </Tabs>

          {/* Modals */}
          <CreateEventModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onCreateEvent={handleCreateEvent}
          />

          <ViewEventModal
            open={viewModalOpen}
            onOpenChange={setViewModalOpen}
            event={selectedEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            canEdit={hasPermission('agenda', 'write')}
          />
        </div>
      </PermissionGuard>
    </AppLayout>
  );
}