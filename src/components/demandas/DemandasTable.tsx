import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, CheckCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  autor: string;
  eleitorSolicitante: string;
  dataHora: Date;
  tag: string;
  status: "pendente" | "em_atendimento" | "resolvida" | "cancelada";
  tipo: "geral" | "trabalho_emprego";
  priority?: string;
  data_limite?: Date;
  // Campos relacionais
  author?: {
    full_name?: string;
  };
  eleitor?: {
    name: string;
  };
  tag_relation?: {
    name: string;
  };
  categoria?: string;
  // Campos específicos para trabalho/emprego
  curriculo?: string;
  vagaPretendida?: string;
  empresaEmpregado?: string;
}

interface DemandasTableProps {
  demandas: Demanda[];
  onView: (demanda: Demanda) => void;
  onEdit: (demanda: Demanda) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, novoStatus: Demanda["status"]) => void;
}

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  em_atendimento: { label: "Em Andamento", color: "bg-blue-100 text-blue-800" },
  resolvida: { label: "Resolvida", color: "bg-green-100 text-green-800" },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800" },
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "baixa":
      return "bg-green-100 text-green-800 border-green-200";
    case "media":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "urgente":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function DemandasTable({
  demandas,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: DemandasTableProps) {
  const [sortField, setSortField] = useState<keyof Demanda>("dataHora");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedDemandas = useMemo(() => {
    return [...demandas].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [demandas, sortField, sortDirection]);

  const handleSort = (field: keyof Demanda) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getNextStatusAction = (status: Demanda["status"]) => {
    switch (status) {
      case "pendente":
        return { label: "Iniciar", nextStatus: "em_atendimento" as const };
      case "em_atendimento":
        return { label: "Resolver", nextStatus: "resolvida" as const };
      default:
        return null;
    }
  };

  if (demandas.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma demanda encontrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("titulo")}
            >
              Título
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("autor")}
            >
              Pessoas Envolvidas
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("dataHora")}
            >
              Data/Hora
            </TableHead>
            <TableHead>TAG</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDemandas.map((demanda) => {
            const nextAction = getNextStatusAction(demanda.status);

            return (
              <TableRow key={demanda.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{demanda.titulo}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {demanda.descricao}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="font-medium">Autor:</span> {
                        demanda.author?.full_name ||
                        demanda.autor ||
                        'Usuário não encontrado'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Eleitor:</span> {
                        demanda.eleitor?.name || 'Eleitor não informado'
                      }
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {format(demanda.dataHora, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {demanda.tag_relation?.name || demanda.categoria || demanda.tag || 'Sem categoria'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={statusConfig[demanda.status].color}
                  >
                    {statusConfig[demanda.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {demanda.priority && (
                    <Badge
                      variant="outline"
                      className={`border ${getPriorityColor(demanda.priority)}`}
                    >
                      {demanda.priority}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(demanda)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(demanda)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {nextAction && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(demanda.id, nextAction.nextStatus)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {nextAction.label}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDelete(demanda.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
