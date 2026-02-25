import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  User, 
  Calendar,
  Eye,
  Plus,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Demanda } from "./DemandasTable";

interface DemandasKanbanProps {
  demandas: Demanda[];
  onView: (demanda: Demanda) => void;
  onAddUpdate: (demanda: Demanda) => void;
}

const statusColumns = [
  {
    id: "pendente",
    title: "Pendente",
    icon: Clock,
    color: "border-border/50 bg-card/60 dark:bg-background/80",
    headerColor: "text-red-500 dark:text-red-300 border-b border-red-500/40"
  },
  {
    id: "em_atendimento",
    title: "Em Andamento",
    icon: AlertCircle,
    color: "border-border/50 bg-card/60 dark:bg-background/80",
    headerColor: "text-blue-500 dark:text-blue-300 border-b border-blue-500/40"
  },
  {
    id: "resolvida",
    title: "Resolvida",
    icon: CheckCircle,
    color: "border-border/50 bg-card/60 dark:bg-background/80",
    headerColor: "text-emerald-500 dark:text-emerald-300 border-b border-emerald-500/40"
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "baixa":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/40";
    case "media":
      return "bg-yellow-500/10 text-yellow-300 border-yellow-500/40";
    case "urgente":
      return "bg-red-500/10 text-red-300 border-red-500/40";
    default:
      return "bg-muted/20 text-muted-foreground border-border/40";
  }
};

export function DemandasKanban({ demandas, onView, onAddUpdate }: DemandasKanbanProps) {
  const getDemandsByStatus = (status: string) => {
    return demandas.filter(d => d.status === status);
  };

  const formatDeadline = (date: Date) => {
    const today = new Date();
    const deadline = new Date(date);
    const diffInDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) {
      return { text: "Atrasada", color: "text-red-400", bg: "bg-red-500/10" };
    } else if (diffInDays === 0) {
      return { text: "Hoje", color: "text-orange-400", bg: "bg-orange-500/10" };
    } else if (diffInDays <= 3) {
      return { text: `${diffInDays}d restantes`, color: "text-yellow-300", bg: "bg-yellow-500/10" };
    } else {
      return { text: format(deadline, "dd/MM/yyyy", { locale: ptBR }), color: "text-muted-foreground", bg: "bg-muted/20" };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {statusColumns.map((column) => {
        const columnDemandas = getDemandsByStatus(column.id);
        const IconComponent = column.icon;
        
        return (
          <div
            key={column.id}
            className={`rounded-3xl border ${column.color} min-h-[600px] shadow-lg backdrop-blur-sm flex flex-col`}
          >
            <div className={`p-4 rounded-t-3xl flex items-center justify-between ${column.headerColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <h3 className="text-xs font-semibold tracking-[0.2em] uppercase">
                    {column.title}
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] border-border/40 bg-background/40">
                  {columnDemandas.length}
                </Badge>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto flex-1">
              {columnDemandas.map((demanda) => {
                const deadlineInfo = demanda.data_limite ? formatDeadline(new Date(demanda.data_limite)) : null;
                
                return (
                  <Card
                    key={demanda.id}
                    className="bg-card/90 dark:bg-background/80 border border-border/40 hover:border-primary/50 hover:shadow-xl transition-all cursor-pointer group rounded-2xl"
                  >
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-primary">
                          {demanda.eleitor?.name || demanda.eleitorSolicitante}
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`ml-2 text-[10px] uppercase font-bold tracking-wide border rounded-full px-2 py-0.5 ${getPriorityColor(demanda.priority || "media")}`}
                        >
                          {demanda.priority || "media"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground mt-1">
                        {demanda.titulo}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <CardDescription className="text-sm line-clamp-2 text-foreground">
                        {demanda.descricao}
                      </CardDescription>

                      {/* Informações básicas */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{demanda.autor}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(demanda.dataHora, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        </div>

                        {deadlineInfo && (
                          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${deadlineInfo.bg}`}>
                            <Clock className="h-3 w-3" />
                            <span className={deadlineInfo.color}>
                              Prazo: {deadlineInfo.text}
                            </span>
                          </div>
                        )}
                      </div>

                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide bg-purple-500/10 text-purple-300 border-purple-500/40 rounded-full">
                        {demanda.tag}
                      </Badge>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 text-[11px] h-8 border-border/40 hover:border-primary/60"
                          onClick={() => onView(demanda)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        
                        {demanda.status !== "resolvida" && (
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="flex-1 text-[11px] h-8"
                            onClick={() => onAddUpdate(demanda)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Atualizar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {columnDemandas.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma demanda {column.title.toLowerCase()}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
