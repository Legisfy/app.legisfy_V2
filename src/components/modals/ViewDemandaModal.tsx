import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  User, 
  Calendar, 
  Tag, 
  FileText, 
  Building, 
  Briefcase, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Play
} from "lucide-react";
import { Demanda } from "@/components/demandas/DemandasTable";

interface ViewDemandaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demanda: Demanda | null;
  onStatusChange: (id: string, novoStatus: Demanda["status"]) => void;
}

const statusConfig = {
  pendente: { 
    label: "Pendente", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    nextAction: { label: "Iniciar", status: "em_andamento" as const, icon: Play }
  },
  em_andamento: { 
    label: "Em Andamento", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertCircle,
    nextAction: { label: "Resolver", status: "resolvida" as const, icon: CheckCircle }
  },
  resolvida: { 
    label: "Resolvida", 
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    nextAction: null
  },
  cancelada: { 
    label: "Cancelada", 
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
    nextAction: null
  },
};

export function ViewDemandaModal({ 
  open, 
  onOpenChange, 
  demanda,
  onStatusChange 
}: ViewDemandaModalProps) {
  if (!demanda) return null;

  const statusInfo = statusConfig[demanda.status];
  const StatusIcon = statusInfo.icon;

  const handleStatusAction = () => {
    if (statusInfo.nextAction) {
      onStatusChange(demanda.id, statusInfo.nextAction.status);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{demanda.titulo}</DialogTitle>
          <DialogDescription>
            Detalhes completos da demanda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant="secondary" 
                  className={`${statusInfo.color} border`}
                >
                  {statusInfo.label}
                </Badge>
                {statusInfo.nextAction && (
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={handleStatusAction}
                  >
                    <statusInfo.nextAction.icon className="h-4 w-4 mr-2" />
                    {statusInfo.nextAction.label}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data/Hora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {format(demanda.dataHora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Descrição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{demanda.descricao}</p>
            </CardContent>
          </Card>

          {/* Pessoas Envolvidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Pessoas Envolvidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Autor:</span>
                <span className="text-sm">{demanda.autor}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Eleitor Solicitante:</span>
                <span className="text-sm">{demanda.eleitorSolicitante}</span>
              </div>
            </CardContent>
          </Card>

          {/* TAG e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  TAG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {demanda.tag}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {demanda.tipo === "trabalho_emprego" && (
                    <FileText className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="text-sm">
                    {demanda.tipo === "trabalho_emprego" ? "Trabalho/Emprego" : "Geral"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Específicas de Trabalho/Emprego */}
          {demanda.tipo === "trabalho_emprego" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Informações de Trabalho/Emprego
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {demanda.vagaPretendida && (
                  <div>
                    <span className="text-sm font-medium">Vaga Pretendida:</span>
                    <p className="text-sm mt-1">{demanda.vagaPretendida}</p>
                  </div>
                )}

                {demanda.curriculo && (
                  <div>
                    <span className="text-sm font-medium">Currículo:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{demanda.curriculo}</span>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                )}

                {demanda.empresaEmpregado && (
                  <div>
                    <span className="text-sm font-medium">Empresa onde foi empregado:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{demanda.empresaEmpregado}</span>
                    </div>
                  </div>
                )}

                {demanda.status === "resolvida" && !demanda.empresaEmpregado && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Esta demanda foi resolvida, mas ainda não foi informada a empresa onde o eleitor foi empregado.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}