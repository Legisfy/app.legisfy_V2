import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

interface WeekViewProps {
  events: Event[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventSelect: (event: Event) => void;
  onCreateEvent?: (date: Date) => void;
}

export function WeekView({ 
  events, 
  selectedDate, 
  onDateSelect, 
  onEventSelect, 
  onCreateEvent 
}: WeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);

  const weekStart = startOfWeek(currentWeek, { locale: ptBR });
  const weekEnd = endOfWeek(currentWeek, { locale: ptBR });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' 
      ? subWeeks(currentWeek, 1) 
      : addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
    onDateSelect(newWeek);
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

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">
            {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setCurrentWeek(new Date());
            onDateSelect(new Date());
          }}
        >
          Esta semana
        </Button>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-8 gap-px bg-border rounded-lg overflow-hidden">
        {/* Time column */}
        <div className="bg-muted/30">
          <div className="h-12 border-b border-border"></div>
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="h-[60px] border-b border-border p-2 text-xs text-muted-foreground">
              {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
            </div>
          ))}
        </div>

        {/* Days */}
        {days.map((day) => {
          const dayEvents = getEventsForDate(day);
          const isDayToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div key={day.toISOString()} className="bg-background relative">
              {/* Day header */}
              <div 
                className={cn(
                  'h-12 border-b border-border p-2 text-center cursor-pointer hover:bg-accent/50',
                  isSelected && 'bg-accent',
                  isDayToday && 'bg-primary/10'
                )}
                onClick={() => onDateSelect(day)}
              >
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={cn(
                  'text-sm font-medium',
                  isDayToday && 'text-primary font-semibold'
                )}>
                  {format(day, 'd')}
                </div>
              </div>

              {/* Hour slots */}
              <div className="relative">
                {Array.from({ length: 24 }, (_, hour) => (
                  <div 
                    key={hour} 
                    className="h-[60px] border-b border-border cursor-pointer hover:bg-accent/20"
                    onClick={() => {
                      const clickDate = new Date(day);
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
                        'absolute left-1 right-1 rounded text-xs text-white p-1 cursor-pointer border-l-2',
                        getEventColor(event.type)
                      )}
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                        zIndex: 10
                      }}
                      onClick={() => onEventSelect(event)}
                      title={`${event.title} - ${format(new Date(event.date), 'HH:mm')} às ${format(new Date(event.endDate), 'HH:mm')}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-90 truncate">
                        {format(new Date(event.date), 'HH:mm')} - {format(new Date(event.endDate), 'HH:mm')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}