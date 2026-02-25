import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Calendar, ExternalLink, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { useRealIdeias } from "@/hooks/useRealIdeias";
import { useAuthContext } from "@/components/AuthProvider";

export const MinhasIdeias = () => {
  const { ideias, loading } = useRealIdeias();
  const { user } = useAuthContext();

  // Filter ideas created by current user
  const minhasIdeias = ideias.filter(idea => idea.user_id === user?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovada":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejeitada":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "em_analise":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovada":
        return <CheckCircle className="h-4 w-4" />;
      case "rejeitada":
        return <XCircle className="h-4 w-4" />;
      case "em_analise":
        return <Clock className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "aprovada":
        return "Aprovada";
      case "rejeitada":
        return "Rejeitada";
      case "em_analise":
        return "Em Análise";
      default:
        return "Rascunho";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "aprovada":
        return "Sua ideia foi aprovada! Será considerada para implementação.";
      case "rejeitada":
        return "Sua ideia foi rejeitada e não será implementada.";
      case "em_analise":
        return "Sua ideia está sendo analisada pela equipe.";
      default:
        return "Sua ideia está salva como rascunho.";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando suas ideias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Minhas Ideias</h3>
        <Badge variant="secondary">{minhasIdeias.length}</Badge>
      </div>

      {minhasIdeias.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não criou nenhuma ideia</p>
              <p className="text-sm mt-2">Suas ideias aparecerão aqui com o status de avaliação</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {minhasIdeias.map((idea) => (
            <Card key={idea.id} className="border-l-4" style={{
              borderLeftColor: 
                idea.status === 'aprovada' ? '#22c55e' :
                idea.status === 'rejeitada' ? '#ef4444' :
                idea.status === 'em_analise' ? '#3b82f6' : '#eab308'
            }}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{idea.titulo}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(idea.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className={getStatusColor(idea.status || "rascunho")}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(idea.status || "rascunho")}
                      {getStatusText(idea.status || "rascunho")}
                    </div>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{idea.descricao}</p>

                {idea.link_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={idea.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Link relacionado
                    </a>
                  </div>
                )}

                {/* Status feedback */}
                <div className={`p-3 rounded-md ${
                  idea.status === 'aprovada' ? 'bg-green-50 dark:bg-green-900/20' :
                  idea.status === 'rejeitada' ? 'bg-red-50 dark:bg-red-900/20' :
                  idea.status === 'em_analise' ? 'bg-blue-50 dark:bg-blue-900/20' :
                  'bg-yellow-50 dark:bg-yellow-900/20'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(idea.status || "rascunho")}
                    <span className={`text-sm font-medium ${
                      idea.status === 'aprovada' ? 'text-green-800 dark:text-green-200' :
                      idea.status === 'rejeitada' ? 'text-red-800 dark:text-red-200' :
                      idea.status === 'em_analise' ? 'text-blue-800 dark:text-blue-200' :
                      'text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {getStatusText(idea.status || "rascunho")}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    idea.status === 'aprovada' ? 'text-green-700 dark:text-green-300' :
                    idea.status === 'rejeitada' ? 'text-red-700 dark:text-red-300' :
                    idea.status === 'em_analise' ? 'text-blue-700 dark:text-blue-300' :
                    'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {getStatusMessage(idea.status || "rascunho")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};