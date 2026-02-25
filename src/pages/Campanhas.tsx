import { useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MultiStepCampaignModal } from "@/components/campaigns/MultiStepCampaignModal";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Plus, Calendar, Users, MoreVertical, Trash, LayoutGrid, List } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DAYS_MAP: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

const Campanhas = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { campaigns, isLoading, updateCampaign, deleteCampaign } = useCampaigns();

  // Fetch voter counts for each campaign based on their audience
  const { data: voterCounts } = useQuery({
    queryKey: ["voter-counts", campaigns],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      
      for (const campaign of campaigns || []) {
        let count = 0;
        
        if (campaign.audience_type === "publico") {
          // Count all eleitores (público geral)
          const { count: voterCount, error } = await supabase
            .from("eleitores")
            .select("id", { count: "exact", head: true });
          
          if (!error) {
            count = voterCount || 0;
          }
        } else if (campaign.audience_type === "tag" && campaign.tag_id) {
          // Get tag name and count eleitores with that tag
          const { data: tags } = await supabase
            .from("eleitor_tags")
            .select("name")
            .eq("id", campaign.tag_id)
            .single();
          
          if (tags) {
            const { count: voterCount, error } = await supabase
              .from("eleitores")
              .select("id", { count: "exact", head: true })
              .contains("tags", [tags.name]);
            
            if (!error) {
              count = voterCount || 0;
            }
          }
        }
        
        counts[campaign.id] = count;
      }
      
      return counts;
    },
    enabled: !!campaigns && campaigns.length > 0,
  });

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await updateCampaign.mutateAsync({ id, is_active: !currentStatus });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta campanha?")) {
      await deleteCampaign.mutateAsync(id);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Campanhas de WhatsApp</h1>
            <p className="text-muted-foreground">
              Envie mensagens personalizadas para grupos específicos de eleitores
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        <div className="flex gap-2 justify-end">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            
        {isLoading ? (
              <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma campanha criada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie sua primeira campanha para começar a enviar mensagens automaticamente
              </p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => {
              const campaignVoterCount = voterCounts?.[campaign.id] || 0;
              const totalMessages = campaign.messages_total || campaignVoterCount;
              const progress = totalMessages > 0
                ? ((campaign.messages_sent || 0) / totalMessages) * 100
                : 0;
              
              return (
                <Card key={campaign.id} className="relative hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg truncate">{campaign.title}</CardTitle>
                          <Badge variant={campaign.is_active ? "success" : "destructive"} className="text-xs shrink-0">
                            {campaign.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs font-medium">
                          {campaign.frequency === "once" ? "Única" : "Recorrente"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch
                          checked={campaign.is_active}
                          onCheckedChange={() => handleToggleActive(campaign.id, campaign.is_active)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDelete(campaign.id)} className="text-destructive">
                              <Trash className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      {campaign.frequency === "once" && campaign.scheduled_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span>
                            {format(new Date(campaign.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      )}

                      {campaign.frequency === "recurring" && campaign.recurring_days && campaign.recurring_days.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span>
                            {campaign.recurring_days
                              .sort((a, b) => a - b)
                              .map(day => DAYS_MAP[day])
                              .join(", ")}
                          </span>
                        </div>
                      )}

                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 shrink-0 text-primary" />
                          <span className="font-semibold">
                            {campaign.public_name || "Todos os eleitores"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {campaignVoterCount} eleitores no público
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progresso de envio</span>
                        <span className="font-medium">
                          {campaign.messages_sent || 0} / {totalMessages}
                        </span>
                      </div>
                      <Progress value={progress || 0} className="h-2" />
                    </div>
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      Criada em {format(new Date(campaign.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
            ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => {
              const campaignVoterCount = voterCounts?.[campaign.id] || 0;
              const totalMessages = campaign.messages_total || campaignVoterCount;
              const progress = totalMessages > 0
                ? ((campaign.messages_sent || 0) / totalMessages) * 100
                : 0;
              
              return (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-base truncate">{campaign.title}</h3>
                          <Badge variant={campaign.is_active ? "success" : "destructive"} className="text-xs">
                            {campaign.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {campaign.frequency === "once" ? "Única" : "Recorrente"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                          {campaign.frequency === "once" && campaign.scheduled_date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(campaign.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                          )}
                          
                          {campaign.frequency === "recurring" && campaign.recurring_days && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {campaign.recurring_days
                                  .sort((a, b) => a - b)
                                  .map(day => DAYS_MAP[day])
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-md">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">
                              {campaign.public_name || "Todos os eleitores"}
                            </span>
                            <span className="text-muted-foreground">
                              • {voterCounts?.["all"] || 0} eleitores
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 space-y-1">
                            <Progress value={progress || 0} className="h-2" />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[80px] text-right">
                            {campaign.messages_sent || 0} / {totalMessages}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={campaign.is_active}
                          onCheckedChange={() => handleToggleActive(campaign.id, campaign.is_active)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDelete(campaign.id)} className="text-destructive">
                              <Trash className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
            )}

        <MultiStepCampaignModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
        />
      </div>
    </AppLayout>
  );
};

export default Campanhas;
