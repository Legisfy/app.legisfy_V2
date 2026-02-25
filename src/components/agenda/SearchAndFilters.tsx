import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (value: string) => void;
  filterTime: string;
  onFilterTimeChange: (value: string) => void;
  onClearFilters: () => void;
  totalEvents: number;
  filteredEvents: number;
}

export function SearchAndFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterPriority,
  onFilterPriorityChange,
  filterTime,
  onFilterTimeChange,
  onClearFilters,
  totalEvents,
  filteredEvents
}: SearchAndFiltersProps) {
  const hasActiveFilters = searchTerm || filterType !== 'all' || filterPriority !== 'all' || filterTime !== 'all';

  return (
    <div className="flex items-center gap-2 p-1 w-full">
      {/* Search bar */}
      <div className="relative flex-1 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Buscar compromissos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 pl-9 bg-background/40 border-none rounded-xl text-[11px] font-medium placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
        />
      </div>

      {/* Filters popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-9 px-3 flex items-center gap-2 rounded-xl bg-background/40 border-none hover:bg-background/60 text-muted-foreground/70 transition-all font-bold text-[10px] uppercase tracking-widest">
            <Filter className="h-3.5 w-3.5 opacity-50" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center text-[8px] bg-primary text-primary-foreground rounded-full border-none">
                {(searchTerm ? 1 : 0) + (filterType !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0) + (filterTime !== 'all' ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 mt-2 p-4 bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/70">Filtros Avançados</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-6 px-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg"
                >
                  Limpar
                </Button>
              )}
            </div>

            <div className="grid gap-4">
              {/* Tipo de evento */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Categoria</label>
                <Select value={filterType} onValueChange={onFilterTypeChange}>
                  <SelectTrigger className="h-9 bg-muted/20 border-border/40 rounded-xl text-[10px] font-medium focus:ring-1 focus:ring-primary/20">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="text-[10px]">Todas as Categorias</SelectItem>
                    <SelectItem value="reuniao" className="text-[10px]">Reunião</SelectItem>
                    <SelectItem value="visita" className="text-[10px]">Visita</SelectItem>
                    <SelectItem value="sessao" className="text-[10px]">Sessão</SelectItem>
                    <SelectItem value="audiencia" className="text-[10px]">Audiência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Período */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Período</label>
                <Select value={filterTime} onValueChange={onFilterTimeChange}>
                  <SelectTrigger className="h-9 bg-muted/20 border-border/40 rounded-xl text-[10px] font-medium focus:ring-1 focus:ring-primary/20">
                    <SelectValue placeholder="Qualquer data" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="text-[10px]">O Tempo Todo</SelectItem>
                    <SelectItem value="past" className="text-[10px]">Eventos Passados</SelectItem>
                    <SelectItem value="today" className="text-[10px]">Hoje</SelectItem>
                    <SelectItem value="upcoming" className="text-[10px]">Próximos Dias</SelectItem>
                    <SelectItem value="this-week" className="text-[10px]">Esta Semana</SelectItem>
                    <SelectItem value="this-month" className="text-[10px]">Este Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prioridade */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Prioridade</label>
                <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
                  <SelectTrigger className="h-9 bg-muted/20 border-border/40 rounded-xl text-[10px] font-medium focus:ring-1 focus:ring-primary/20">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="text-[10px]">Todas as Prioridades</SelectItem>
                    <SelectItem value="high" className="text-[10px]">Alta</SelectItem>
                    <SelectItem value="medium" className="text-[10px]">Média</SelectItem>
                    <SelectItem value="low" className="text-[10px]">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filters badges - simplified inline */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearFilters}
          className="h-9 w-9 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl border-none transition-all"
          title="Limpar todos os filtros"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}