import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  createdBy: string;
}

interface CalendarGridProps {
  events: Event[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventSelect: (event: Event) => void;
  onCreateEvent?: (date: Date) => void;
  viewMode: 'month' | 'week' | 'day';
}

export function CalendarGrid({
  events,
  selectedDate,
  onDateSelect,
  onEventSelect,
  onCreateEvent,
  viewMode = 'month'
}: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  const getEventColor = (type: string) => {
    const colors = {
      reuniao: 'bg-blue-500',
      visita: 'bg-emerald-500',
      sessao: 'bg-purple-500',
      audiencia: 'bg-orange-500',
      evento: 'bg-indigo-500',
      default: 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || colors.default;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev'
      ? subMonths(currentDate, 1)
      : addMonths(currentDate, 1);
    setCurrentDate(newDate);
    onDateSelect(newDate);
  };

  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const firstDayOfWeek = monthStart.getDay();
    const paddingStart = Array.from({ length: firstDayOfWeek }, (_, i) => {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (firstDayOfWeek - i));
      return date;
    });

    const lastDayOfWeek = monthEnd.getDay();
    const paddingEnd = Array.from({ length: 6 - lastDayOfWeek }, (_, i) => {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + (i + 1));
      return date;
    });

    const allDays = [...paddingStart, ...days, ...paddingEnd];

    return (
      <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        {/* Header compacto */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-foreground/80 capitalize font-outfit">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg hover:bg-muted/40"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg hover:bg-muted/40"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg border-border/40 hover:bg-muted/30"
            onClick={() => {
              setCurrentDate(new Date());
              onDateSelect(new Date());
            }}
          >
            Hoje
          </Button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 border-b border-border/20">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="py-2 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
              {day}
            </div>
          ))}
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7">
          {allDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div
                key={index}
                className={cn(
                  'min-h-[80px] p-1.5 cursor-pointer transition-all border-r border-b border-border/10 hover:bg-accent/30',
                  !isCurrentMonth && 'bg-muted/10 opacity-40',
                  isSelected && 'bg-primary/5',
                  isDayToday && 'bg-primary/8'
                )}
                onClick={() => onDateSelect(day)}
                onDoubleClick={() => onCreateEvent?.(day)}
              >
                <div className={cn(
                  'flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full mb-0.5 transition-colors',
                  isDayToday && 'bg-primary text-primary-foreground',
                  isSelected && !isDayToday && 'bg-foreground/10 text-foreground'
                )}>
                  {format(day, 'd')}
                </div>

                {/* Eventos */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-[8px] leading-tight px-1.5 py-0.5 rounded text-white cursor-pointer truncate font-medium',
                        getEventColor(event.type)
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventSelect(event);
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}

                  {dayEvents.length > 2 && (
                    <div className="text-[8px] text-muted-foreground/60 px-1 font-bold">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <div>Week and Day views coming soon...</div>;
}