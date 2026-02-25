import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Beaker, MessageSquare, Loader2, DatabaseZap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";

interface ColetaData {
  id: string;
  variableName: string;
  collectedData: string;
  voterName: string;
  whatsapp: string;
  campaignName: string;
  collectedAt: string;
}

const Coleta = () => {
  const navigate = useNavigate();
  const { cabinet } = useAuthContext();
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedVariable, setSelectedVariable] = useState<string>("all");
  const [coletaData, setColetaData] = useState<ColetaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColetaData = async () => {
      if (!cabinet?.cabinet_id) return;
      setLoading(true);
      try {
        // Busca dados de coleta de campanhas via WhatsApp
        // Tabela: coleta_dados (se existir) ou retorna vazio
        const { data, error } = await (supabase as any)
          .from('coleta_dados')
          .select(`
            id,
            variable_name,
            collected_data,
            collected_at,
            eleitores!inner(nome, telefone),
            campaigns!inner(name, gabinete_id)
          `)
          .eq('campaigns.gabinete_id', cabinet.cabinet_id)
          .order('collected_at', { ascending: false });

        if (error) {
          // Tabela não existe — mostrar estado vazio sem erro
          console.info('Tabela coleta_dados não encontrada:', error.message);
          setColetaData([]);
          return;
        }

        const formattedData: ColetaData[] = (data || []).map((item: any) => ({
          id: item.id,
          variableName: item.variable_name,
          collectedData: item.collected_data,
          voterName: item.eleitores?.nome || 'Desconhecido',
          whatsapp: item.eleitores?.telefone || '-',
          campaignName: item.campaigns?.name || 'Sem campanha',
          collectedAt: new Date(item.collected_at).toLocaleString('pt-BR'),
        }));

        setColetaData(formattedData);
      } catch (err) {
        console.info('Nenhum dado de coleta disponível');
        setColetaData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchColetaData();
  }, [cabinet?.cabinet_id]);

  // Filtrar dados
  let filteredData = coletaData;
  if (selectedCampaign !== "all") {
    filteredData = filteredData.filter(d => d.campaignName === selectedCampaign);
  }
  if (selectedVariable !== "all") {
    filteredData = filteredData.filter(d => d.variableName === selectedVariable);
  }

  const totalCollected = filteredData.length;
  const uniqueVoters = new Set(filteredData.map(d => d.whatsapp)).size;
  const uniqueCampaigns = new Set(coletaData.map(d => d.campaignName)).size;

  // Get unique campaigns and variables for filters
  const campaigns = Array.from(new Set(coletaData.map(d => d.campaignName)));
  const variables = Array.from(new Set(coletaData.map(d => d.variableName)));

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Beaker className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Coleta de Dados</h1>
              <p className="text-muted-foreground mt-1">
                Visualize os dados coletados pelas campanhas
              </p>
            </div>
          </div>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              className="rounded-none"
              onClick={() => navigate("/campanhas")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Campanhas
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : coletaData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <DatabaseZap className="h-12 w-12 text-muted-foreground/40" />
              <div>
                <h3 className="text-lg font-semibold text-muted-foreground">Nenhum dado coletado</h3>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Os dados serão exibidos aqui depois que suas campanhas coletarem respostas via WhatsApp.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/campanhas")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Ver Campanhas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">Filtrar por Campanha</label>
                    <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as campanhas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as campanhas</SelectItem>
                        {campaigns.map(campaign => (
                          <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">Filtrar por Variável</label>
                    <Select value={selectedVariable} onValueChange={setSelectedVariable}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as variáveis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as variáveis</SelectItem>
                        {variables.map(variable => (
                          <SelectItem key={variable} value={variable}>
                            <code className="text-xs">{variable}</code>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Total de Dados</div>
                  <div className="text-3xl font-bold text-primary">{totalCollected}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Eleitores Únicos</div>
                  <div className="text-3xl font-bold text-primary">{uniqueVoters}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Campanhas Ativas</div>
                  <div className="text-3xl font-bold text-primary">{uniqueCampaigns}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Dados Coletados */}
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Variável</TableHead>
                      <TableHead>Dado Coletado</TableHead>
                      <TableHead>Eleitor</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum dado encontrado com os filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((data) => (
                        <TableRow key={data.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {data.campaignName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {data.variableName}
                            </code>
                          </TableCell>
                          <TableCell className="font-medium">
                            {data.collectedData}
                          </TableCell>
                          <TableCell>{data.voterName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {data.whatsapp}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {data.collectedAt}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Coleta;
