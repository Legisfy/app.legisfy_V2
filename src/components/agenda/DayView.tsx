import React from 'react';
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

interface DayViewProps {
  events: Event[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventSelect: (event: Event) => void;
  onCreateEvent?: (date: Date) => void;
}

export function DayView({ 
  events, 
  selectedDate, 
  onDateSelect, 
  onEventSelect, 
  onCreateEvent 
}: DayViewProps) {
  
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDay = direction === 'prev' 
      ? subDays(selectedDate, 1) 
      : addDays(selectedDate, 1);
    onDateSelect(newDay);
  };

  const getEventColor = (type: string) => {
    const colors = {
      reuniao: 'bg-blue-500 border-blue-600',
      visita: 'bg-green-500 border-green-600',
      sessao: 'bg-purple-500 border-purple-600',
      audiencia: 'bg-orange-500 border-orange-600',
      default: 'bg-gray-500 border-gray-600'
    };
    return colors[type as keyof typeof colors] || colors.default;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const getEventPosition = (event: Event) => {
    const startHour = new Date(event.date).getHours();
    const startMinute = new Date(event.date).getMinutes();
    const endHour = new Date(event.endDate).getHours();
    const endMinute = new Date(event.endDate).getMinutes();
    
    const startPosition = (startHour * 60 + startMinute) / 60; // Position in hours
    const duration = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60; // Duration in hours
    
    return {
      top: startPosition * 60, // 60px per hour
      height: Math.max(duration * 60, 30) // Minimum 30px height
    };
  };

  const dayEvents = getEventsForDate(selectedDate);
  const isDayToday = isToday(selectedDate);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">
            {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDay('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDay('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isDayToday && (
            <div className="text-sm text-primary font-medium px-2 py-1 bg-primary/10 rounded">
              Hoje
            </div>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => onDateSelect(new Date())}
          >
            Ir para hoje
          </Button>
        </div>
      </div>

      {/* Day content */}
      <div className="grid grid-cols-12 gap-4">
        {/* Time column */}
        <div className="col-span-2">
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="h-[60px] border-b border-border p-2 text-xs text-muted-foreground">
              {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
            </div>
          ))}
        </div>

        {/* Events column */}
        <div className="col-span-10 relative">
          {/* Hour grid */}
          {Array.from({ length: 24 }, (_, hour) => (
            <div 
              key={hour} 
              className="h-[60px] border-b border-border cursor-pointer hover:bg-accent/20"
              onClick={() => {
                const clickDate = new Date(selectedDate);
                clickDate.setHours(hour, 0, 0, 0);
                onCreateEvent?.(clickDate);
              }}
            />
          ))}

          {/* Events */}
          {dayEvents.map((event) => {
            const position = getEventPosition(event);
            return (
              <div
                key={event.id}
                className={cn(
                  'absolute left-2 right-2 rounded p-3 cursor-pointer border-l-4 text-white shadow-sm',
                  getEventColor(event.type)
                )}
                style={{
                  top: `${position.top}px`,
                  height: `${position.height}px`,
                  zIndex: 10
                }}
                onClick={() => onEventSelect(event)}
              >
                <div className="font-medium mb-1">{event.title}</div>
                <div className="text-xs opacity-90 mb-1">
                  {format(new Date(event.date), 'HH:mm')} - {format(new Date(event.endDate), 'HH:mm')}
                </div>
                {event.location && (
                  <div className="text-xs opacity-80">📍 {event.location}</div>
                )}
                {event.participants.length > 0 && (
                  <div className="text-xs opacity-80">👥 {event.participants.length} participante(s)</div>
                )}
              </div>
            );
          })}

          {/* Quick add button */}
          {onCreateEvent && (
            <div className="absolute bottom-4 right-4">
              <Button
                variant="default"
                size="sm"
                onClick={() => onCreateEvent(selectedDate)}
                className="flex items-center gap-2 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Novo evento
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Events summary */}
      {dayEvents.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-medium mb-3">Resumo do dia ({dayEvents.length} eventos)</h3>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div 
                key={event.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-accent/50 cursor-pointer"
                onClick={() => onEventSelect(event)}
              >
                <div className={cn('w-3 h-3 rounded-full', getEventColor(event.type).split(' ')[0])}></div>
                <div className="flex-1">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(event.date), 'HH:mm')} - {format(new Date(event.endDate), 'HH:mm')}
                    {event.location && ` • ${event.location}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}