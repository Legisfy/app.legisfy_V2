import { useState, useMemo } from "react";
import { Calendar, Clock, MapPin, List, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface UpcomingEvent {
    id: string;
    titulo: string;
    data_inicio: string;
    tipo: string;
    cor?: string;
    local?: string;
    descricao?: string;
}

interface DashboardAgendaProps {
    events: UpcomingEvent[];
    loading?: boolean;
}

const typeColors: Record<string, string> = {
    reuniao: "bg-blue-500",
    visita: "bg-emerald-500",
    sessao: "bg-purple-500",
    audiencia: "bg-orange-500",
    evento: "bg-indigo-500",
};

const typeLabels: Record<string, string> = {
    reuniao: "Reunião",
    visita: "Visita",
    sessao: "Sessão",
    audiencia: "Audiência",
    evento: "Evento",
};

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export function DashboardAgenda({ events, loading }: DashboardAgendaProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activeTab, setActiveTab] = useState<"calendario" | "proximos">("calendario");

    // Build calendar days grid
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const days: Date[] = [];
        let day = calStart;
        while (day <= calEnd) {
            days.push(day);
            day = addDays(day, 1);
        }
        return days;
    }, [currentMonth]);

    // Map events to their dates
    const eventsByDate = useMemo(() => {
        const map: Record<string, UpcomingEvent[]> = {};
        if (!events) return map;
        events.forEach((event) => {
            const dateKey = event.data_inicio.split("T")[0];
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(event);
        });
        return map;
    }, [events]);

    const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    if (loading) {
        return (
            <Card className="border-border/40">
                <CardContent className="p-4">
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-border/40 bg-card/95 dark:bg-card/20 backdrop-blur-sm shadow-none overflow-hidden">
            <CardContent className="p-0">
                {/* Header com navegação e abas */}
                <div className="px-4 pt-4 pb-2">
                    {/* Tabs: Calendário | Próximos */}
                    <div className="flex gap-1 bg-muted/30 p-0.5 rounded-lg mb-3">
                        <button
                            onClick={() => setActiveTab("calendario")}
                            className={`flex-1 flex items-center justify-center gap-1.5 h-7 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === "calendario"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground/50 hover:text-muted-foreground/70"
                                }`}
                        >
                            <Calendar className="h-3 w-3" />
                            Calendário
                        </button>
                        <button
                            onClick={() => setActiveTab("proximos")}
                            className={`flex-1 flex items-center justify-center gap-1.5 h-7 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === "proximos"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground/50 hover:text-muted-foreground/70"
                                }`}
                        >
                            <List className="h-3 w-3" />
                            Próximos Eventos
                        </button>
                    </div>
                </div>

                {/* === ABA CALENDÁRIO === */}
                {activeTab === "calendario" && (
                    <div className="px-4 pb-4">
                        {/* Month navigation */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-foreground/90 capitalize">
                                    {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                                </h3>
                                <div className="flex items-center gap-0.5">
                                    <button
                                        onClick={goToPrevMonth}
                                        className="h-6 w-6 rounded-md hover:bg-muted/50 flex items-center justify-center transition-colors"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                    <button
                                        onClick={goToNextMonth}
                                        className="h-6 w-6 rounded-md hover:bg-muted/50 flex items-center justify-center transition-colors"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={goToToday}
                                className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/30"
                            >
                                Hoje
                            </button>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 mb-1">
                            {WEEKDAYS.map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 py-1"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, idx) => {
                                const dateKey = format(day, "yyyy-MM-dd");
                                const dayEvents = eventsByDate[dateKey] || [];
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isTodayDate = isToday(day);

                                return (
                                    <div
                                        key={idx}
                                        className={`relative min-h-[60px] border-t border-border/10 p-1 transition-colors ${!isCurrentMonth ? "opacity-30" : ""
                                            } ${isTodayDate ? "bg-primary/5" : "hover:bg-muted/20"}`}
                                    >
                                        {/* Day number */}
                                        <span
                                            className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${isTodayDate
                                                    ? "bg-primary text-white"
                                                    : "text-foreground/70"
                                                }`}
                                        >
                                            {format(day, "d")}
                                        </span>

                                        {/* Events on this day */}
                                        <div className="mt-0.5 space-y-0.5 overflow-hidden">
                                            {dayEvents.slice(0, 2).map((event) => {
                                                const color = typeColors[event.tipo] || "bg-gray-500";
                                                return (
                                                    <div
                                                        key={event.id}
                                                        className={`${color} text-white text-[7px] font-bold px-1 py-0.5 rounded truncate leading-tight cursor-default`}
                                                        title={`${event.titulo} - ${format(parseISO(event.data_inicio), "HH:mm")}`}
                                                    >
                                                        {event.titulo}
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 2 && (
                                                <span className="text-[7px] font-bold text-muted-foreground/50 pl-1">
                                                    +{dayEvents.length - 2} mais
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* === ABA PRÓXIMOS EVENTOS (lista) === */}
                {activeTab === "proximos" && (
                    <div className="px-4 pb-4 space-y-1.5 max-h-[360px] overflow-y-auto">
                        {!events || events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Calendar className="h-8 w-8 text-muted-foreground/20 mb-2" />
                                <p className="text-[10px] font-medium text-muted-foreground/40">
                                    Nenhum evento agendado
                                </p>
                            </div>
                        ) : (
                            events.map((event) => {
                                const eventDate = parseISO(event.data_inicio);
                                const typeColor = typeColors[event.tipo] || "bg-gray-500";
                                const typeLabel = typeLabels[event.tipo] || event.tipo;

                                return (
                                    <div
                                        key={event.id}
                                        className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/15 hover:bg-muted/30 border border-border/10 hover:border-border/30 transition-all cursor-default"
                                    >
                                        {/* Color indicator */}
                                        <div className={`w-1 h-9 rounded-full ${typeColor} opacity-60 shrink-0`}></div>

                                        {/* Date badge */}
                                        <div className="w-9 h-9 bg-muted/40 flex flex-col items-center justify-center rounded-lg border border-border/30 shrink-0">
                                            <span className="text-[7px] font-bold text-muted-foreground uppercase leading-none">
                                                {format(eventDate, "MMM", { locale: ptBR }).replace(".", "")}
                                            </span>
                                            <span className="text-xs font-bold font-outfit leading-none">
                                                {format(eventDate, "dd")}
                                            </span>
                                        </div>

                                        {/* Event info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-foreground/80 truncate leading-tight">
                                                {event.titulo}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="flex items-center gap-1 text-[8px] font-medium text-muted-foreground/50">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {format(eventDate, "dd/MM · HH:mm", { locale: ptBR })}
                                                </span>
                                                {event.local && (
                                                    <span className="flex items-center gap-1 text-[8px] font-medium text-muted-foreground/50">
                                                        <MapPin className="h-2.5 w-2.5" />
                                                        <span className="truncate max-w-[100px]">{event.local}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Type badge */}
                                        <Badge
                                            variant="outline"
                                            className={`h-4 px-1.5 text-[6px] font-black uppercase tracking-wider rounded-md border-transparent text-white shrink-0 ${typeColor}`}
                                        >
                                            {typeLabel}
                                        </Badge>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
