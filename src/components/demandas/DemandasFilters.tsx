import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { Demanda } from "./DemandasTable";

interface DemandasFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  tipoFilter: string;
  onTipoFilterChange: (value: string) => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  availableTags: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function DemandasFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  tipoFilter,
  onTipoFilterChange,
  tagFilter,
  onTagFilterChange,
  availableTags,
  onClearFilters,
  hasActiveFilters,
}: DemandasFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por título, descrição, autor ou eleitor..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro de Status */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_atendimento">Em Andamento</SelectItem>
            <SelectItem value="resolvida">Resolvida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de Tipo */}
        <Select value={tipoFilter} onValueChange={onTipoFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="geral">Geral</SelectItem>
            <SelectItem value="trabalho_emprego">Trabalho/Emprego</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de TAG */}
        <Select value={tagFilter} onValueChange={onTagFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas as tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as tags</SelectItem>
            {availableTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtros ativos e botão limpar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>

          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{searchTerm}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onSearchChange("")}
              />
            </Badge>
          )}

          {statusFilter !== "todos" && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onStatusFilterChange("todos")}
              />
            </Badge>
          )}

          {tipoFilter !== "todos" && (
            <Badge variant="secondary" className="gap-1">
              Tipo: {tipoFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onTipoFilterChange("todos")}
              />
            </Badge>
          )}

          {tagFilter !== "todas" && (
            <Badge variant="secondary" className="gap-1">
              TAG: {tagFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onTagFilterChange("todas")}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}