import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Users, Calendar, MapPin, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Eleitor {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  address: string;
  neighborhood: string;
  profile_photo_url?: string;
  tags?: string[];
}

interface Indicacao {
  id: string;
  titulo: string;
  justificativa: string;
  status: string;
  created_at: string;
}

interface Demanda {
  id: string;
  description: string;
  status: string;
  created_at: string;
  priority: string;
}

export default function EleitorHistorico() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeInstitution } = useActiveInstitution();
  
  const [eleitor, setEleitor] = useState<Eleitor | null>(null);
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && activeInstitution?.cabinet_id) {
      fetchData();
    }
  }, [id, activeInstitution?.cabinet_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do eleitor
      const { data: eleitorData, error: eleitorError } = await supabase
        .from('eleitores')
        .select('*')
        .eq('id', id)
        .eq('gabinete_id', activeInstitution?.cabinet_id)
        .single();

      if (eleitorError) throw eleitorError;
      
      setEleitor(eleitorData);

      // Buscar indicações do eleitor
      const { data: indicacoesData, error: indicacoesError } = await supabase
        .from('indicacoes')
        .select('*')
        .eq('eleitor_id', id)
        .eq('gabinete_id', activeInstitution?.cabinet_id)
        .order('created_at', { ascending: false });

      if (indicacoesError) throw indicacoesError;
      
      setIndicacoes(indicacoesData || []);

      // Buscar demandas do eleitor
      const { data: demandasData, error: demandasError } = await supabase
        .from('demandas')
        .select('*')
        .eq('eleitor_id', id)
        .eq('gabinete_id', activeInstitution?.cabinet_id)
        .order('created_at', { ascending: false });

      if (demandasError) throw demandasError;
      
      setDemandas(demandasData || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'em_andamento': 'bg-blue-100 text-blue-800',
      'concluida': 'bg-green-100 text-green-800',
      'cancelada': 'bg-red-100 text-red-800',
      'aprovada': 'bg-green-100 text-green-800',
      'rejeitada': 'bg-red-100 text-red-800',
      'em_analise': 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'baixa': 'bg-gray-100 text-gray-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!eleitor) {
    return (
      <AppLayout>
        <div className="p-6">
          <Button onClick={() => navigate('/eleitores')} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Eleitores
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Eleitor não encontrado</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/eleitores')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Histórico do Eleitor</h1>
            <p className="text-muted-foreground">Visualize todas as indicações e demandas</p>
          </div>
        </div>

        {/* Dados do Eleitor */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Eleitor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={eleitor.profile_photo_url} alt={eleitor.name} />
                <AvatarFallback className="text-lg">
                  {eleitor.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold">{eleitor.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {eleitor.whatsapp && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{eleitor.whatsapp}</span>
                    </div>
                  )}
                  {eleitor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{eleitor.email}</span>
                    </div>
                  )}
                  {eleitor.neighborhood && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{eleitor.neighborhood}</span>
                    </div>
                  )}
                </div>

                {eleitor.tags && eleitor.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {eleitor.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Indicações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{indicacoes.length}</div>
              <p className="text-xs text-muted-foreground">
                {indicacoes.filter(i => i.status === 'concluida' || i.status === 'aprovada').length} concluídas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Demandas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{demandas.length}</div>
              <p className="text-xs text-muted-foreground">
                {demandas.filter(d => d.status === 'concluida').length} concluídas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Indicações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Indicações ({indicacoes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {indicacoes.length > 0 ? (
              <div className="space-y-4">
                {indicacoes.map((indicacao) => (
                  <div key={indicacao.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{indicacao.titulo}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{indicacao.justificativa}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={getStatusColor(indicacao.status)}>
                          {indicacao.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(indicacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma indicação encontrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demandas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Demandas ({demandas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {demandas.length > 0 ? (
              <div className="space-y-4">
                {demandas.map((demanda) => (
                  <div key={demanda.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{demanda.description}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{demanda.description}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={getStatusColor(demanda.status)}>
                          {demanda.status.replace('_', ' ')}
                        </Badge>
                        {demanda.priority && (
                          <Badge variant="outline" className={getPriorityColor(demanda.priority)}>
                            {demanda.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(demanda.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma demanda encontrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}