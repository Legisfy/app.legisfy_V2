
import { useState } from "react";
import { format, isValid } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  FileCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
  FileUp,
} from "lucide-react";

interface Indicacao {
  id: string;
  titulo: string;
  descricao: string;
  endereco_rua?: string;
  endereco_bairro?: string;
  tags?: string[];
  status: "criada" | "formalizada" | "protocolada" | "pendente" | "atendida";
  requestedByVoter?: boolean;
  voterId?: string;
  voterName?: string;
  created_at: string;
  updated_at: string;
  protocol?: string;
  photos?: string[];
  comments?: string;
  user_id: string;
  userName?: string;
  protocol_pdf_url?: string;
}

interface IndicacoesTableProps {
  indicacoes: Indicacao[];
  onStatusChange: (id: string, newStatus: string) => void;
  onEdit: (indicacao: Indicacao) => void;
  onView: (indicacao: Indicacao) => void;
  onDelete: (id: string) => void;
  onFormalizar: (indicacao: Indicacao) => void;
  onProtocolar: (id: string, protocol: string) => void;
  onEnviarExecutivo: (id: string) => void;
  onMarcarAtendida: (id: string) => void;
}

type SortField = "numero" | "titulo" | "autor" | "criacao" | "status" | "atualizacao";
type SortDirection = "asc" | "desc";

const statusConfig = {
  criada: {
    title: "Criada",
    icon: FileText,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  },
  formalizada: {
    title: "Formalizada",
    icon: FileCheck,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  },
  protocolada: {
    title: "Protocolada",
    icon: Send,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  },
  pendente: {
    title: "Pendente",
    icon: AlertCircle,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  },
  atendida: {
    title: "Atendida",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  },
};

const formatSafeDate = (dateValue: string | Date, formatString: string): string => {
  if (!dateValue) return "Data inválida";

  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (!isValid(date)) return "Data inválida";
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error, dateValue);
    return "Data inválida";
  }
};

export function IndicacoesTable({
  indicacoes,
  onStatusChange,
  onEdit,
  onView,
  onDelete,
  onFormalizar,
  onProtocolar,
  onEnviarExecutivo,
  onMarcarAtendida,
}: IndicacoesTableProps) {
  const [sortField, setSortField] = useState<SortField>("criacao");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedIndicacoes = [...indicacoes].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortField) {
      case "numero":
        aValue = parseInt(a.id);
        bValue = parseInt(b.id);
        break;
      case "titulo":
        aValue = a.titulo?.toLowerCase() || "";
        bValue = b.titulo?.toLowerCase() || "";
        break;
      case "autor":
        aValue = a.userName?.toLowerCase() || "";
        bValue = b.userName?.toLowerCase() || "";
        break;
      case "criacao":
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "atualizacao":
        aValue = new Date(a.updated_at);
        bValue = new Date(b.updated_at);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const getNextAction = (status: string, indicacao: Indicacao) => {
    switch (status) {
      case "criada":
        return { action: () => onFormalizar(indicacao), label: "Formalizar", icon: FileCheck };
      case "formalizada":
        return { action: () => onView(indicacao), label: "Protocolar", icon: Send };
      case "protocolada":
        return { action: () => onEnviarExecutivo(indicacao.id), label: "Atendido", icon: CheckCircle2 };
      case "pendente":
        return { action: () => onMarcarAtendida(indicacao.id), label: "Atendido", icon: CheckCircle2 };
      case "atendida":
        return null; // Não há próxima ação após atendida
      default:
        return null;
    }
  };

  const getDisplayAddress = (indicacao: Indicacao): string => {
    const parts = [];
    if (indicacao.endereco_rua) parts.push(indicacao.endereco_rua);
    if (indicacao.endereco_bairro) parts.push(indicacao.endereco_bairro);
    return parts.join(", ") || "Endereço não informado";
  };

  return (
    <div className="border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 w-20"
              onClick={() => handleSort("numero")}
            >
              <div className="flex items-center gap-2">
                Nº
                <SortIcon field="numero" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("titulo")}
            >
              <div className="flex items-center gap-2">
                Título/Assunto
                <SortIcon field="titulo" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("autor")}
            >
              <div className="flex items-center gap-2">
                Autor
                <SortIcon field="autor" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("criacao")}
            >
              <div className="flex items-center gap-2">
                Data de Criação
                <SortIcon field="criacao" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center gap-2">
                Status Atual
                <SortIcon field="status" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("atualizacao")}
            >
              <div className="flex items-center gap-2">
                Última Atualização
                <SortIcon field="atualizacao" />
              </div>
            </TableHead>
            <TableHead className="text-right w-32">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedIndicacoes.map((indicacao) => {
            const StatusIcon = statusConfig[indicacao.status]?.icon || FileText;
            const nextAction = getNextAction(indicacao.status, indicacao);

            return (
              <TableRow
                key={indicacao.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(indicacao)}
              >
                <TableCell className="font-medium">#{indicacoes.findIndex(i => i.id === indicacao.id) + 1}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{indicacao.titulo}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {indicacao.descricao}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getDisplayAddress(indicacao)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="text-xs">
                        {indicacao.userName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{indicacao.userName || 'Usuário não identificado'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {formatSafeDate(indicacao.created_at, "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${statusConfig[indicacao.status]?.color || ""}`}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[indicacao.status]?.title || indicacao.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {formatSafeDate(indicacao.updated_at, "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {nextAction && indicacao.status !== "atendida" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextAction.action();
                        }}
                      >
                        <nextAction.icon className="h-3 w-3 mr-1" />
                        {nextAction.label}
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border shadow-md">
                        <DropdownMenuItem onClick={() => onView(indicacao)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(indicacao)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {indicacao.status === "formalizada" && (
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </DropdownMenuItem>
                        )}
                        {indicacao.protocol_pdf_url && (
                          <DropdownMenuItem onClick={() => window.open(indicacao.protocol_pdf_url, '_blank')}>
                            <FileUp className="h-4 w-4 mr-2" />
                            Ver Protocolo Anexado
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(indicacao.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {sortedIndicacoes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma indicação encontrada</p>
        </div>
      )}
    </div>
  );
}
