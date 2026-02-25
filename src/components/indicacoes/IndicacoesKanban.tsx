import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FileText, 
  MapPin, 
  Calendar, 
  User, 
  Tag, 
  Clock,
  FileCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface Indicacao {
  id: string;
  title: string;
  description: string;
  address: string;
  tags: string[];
  status: "criada" | "formalizada" | "protocolada" | "pendente" | "atendida";
  requestedByVoter: boolean;
  voterId?: string;
  voterName?: string;
  createdAt: Date;
  updatedAt: Date;
  protocol?: string;
  photos?: string[];
  comments?: string;
}

interface IndicacoesKanbanProps {
  indicacoes: Indicacao[];
  onStatusChange: (id: string, newStatus: string) => void;
  onEdit: (indicacao: Indicacao) => void;
  onView: (indicacao: Indicacao) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  criada: {
    title: "Criada",
    icon: FileText,
    color: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    description: "Indicação criada e salva no sistema"
  },
  formalizada: {
    title: "Formalizada", 
    icon: FileCheck,
    color: "bg-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    description: "PDF gerado e formalizada"
  },
  protocolada: {
    title: "Protocolada",
    icon: Send,
    color: "bg-orange-500", 
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    description: "Protocolada na câmara"
  },
  pendente: {
    title: "Pendente",
    icon: AlertCircle,
    color: "bg-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20", 
    description: "Enviada ao executivo"
  },
  atendida: {
    title: "Atendida",
    icon: CheckCircle2,
    color: "bg-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    description: "Atendida pelo executivo"
  }
};

export function IndicacoesKanban({ 
  indicacoes, 
  onStatusChange, 
  onEdit, 
  onView, 
  onDelete 
}: IndicacoesKanbanProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const getIndicacoesByStatus = (status: string) => {
    return indicacoes.filter(indicacao => indicacao.status === status);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== newStatus) {
      onStatusChange(draggedItem, newStatus);
    }
    setDraggedItem(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "criada": return "bg-blue-100 text-blue-800";
      case "formalizada": return "bg-purple-100 text-purple-800";
      case "protocolada": return "bg-orange-100 text-orange-800";
      case "pendente": return "bg-yellow-100 text-yellow-800";
      case "atendida": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const IndicacaoCard = ({ indicacao }: { indicacao: Indicacao }) => {
    const StatusIcon = statusConfig[indicacao.status].icon;
    
    return (
      <Card 
        className="mb-3 cursor-move hover:shadow-md transition-shadow"
        draggable
        onDragStart={(e) => handleDragStart(e, indicacao.id)}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm line-clamp-2">
                  {indicacao.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {indicacao.description}
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(indicacao)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(indicacao)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
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

            {/* Endereço */}
            {indicacao.address && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{indicacao.address}</span>
              </div>
            )}

            {/* Tags */}
            {indicacao.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {indicacao.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {indicacao.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{indicacao.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Eleitor solicitante */}
            {indicacao.requestedByVoter && indicacao.voterName && (
              <div className="flex items-center gap-2 text-xs">
                <Avatar className="h-5 w-5">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-xs">
                    {indicacao.voterName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground truncate">
                  {indicacao.voterName}
                </span>
              </div>
            )}

            {/* Protocolo */}
            {indicacao.protocol && (
              <div className="text-xs">
                <span className="text-muted-foreground">Protocolo: </span>
                <span className="font-medium">{indicacao.protocol}</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{format(indicacao.updatedAt, "dd/MM/yyyy")}</span>
              </div>
              
              <Badge 
                className={`text-xs ${getStatusBadgeColor(indicacao.status)}`}
                variant="secondary"
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[indicacao.status].title}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {Object.entries(statusConfig).map(([status, config]) => {
        const indicacoesStatus = getIndicacoesByStatus(status);
        const StatusIcon = config.icon;
        
        return (
          <div
            key={status}
            className={`min-h-[600px] rounded-lg p-4 ${config.bgColor}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Header da coluna */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${config.color} text-white`}>
                  <StatusIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{config.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {indicacoesStatus.length} indicações
                </Badge>
              </div>
            </div>

            {/* Lista de indicações */}
            <div className="space-y-2">
              {indicacoesStatus.map((indicacao) => (
                <IndicacaoCard key={indicacao.id} indicacao={indicacao} />
              ))}
              
              {indicacoesStatus.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma indicação</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}