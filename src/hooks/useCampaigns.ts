import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActiveInstitution } from "./useActiveInstitution";

export interface Campaign {
  id: string;
  gabinete_id: string;
  created_by: string;
  title: string;
  description: string | null;
  public_id: string | null;
  public_name: string | null;
  audience_type: 'publico' | 'tag';
  tag_id: string | null;
  is_active: boolean;
  frequency: 'once' | 'recurring';
  scheduled_date: string | null;
  recurring_days: number[] | null;
  recurring_time: string | null;
  recurring_day_times: Record<number, string> | null;
  recurring_end_date: string | null;
  message: string | null;
  collect_data_enabled: boolean;
  collect_data_label: string | null;
  collect_data_variable: string | null;
  collect_data_trigger: string | null;
  messages_sent: number;
  messages_total: number;
  created_at: string;
  updated_at: string;
}

export const useCampaigns = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeInstitution } = useActiveInstitution();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", activeInstitution?.cabinet_id],
    queryFn: async () => {
      if (!activeInstitution?.cabinet_id) return [];

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("gabinete_id", activeInstitution.cabinet_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!activeInstitution?.cabinet_id,
  });

  const createCampaign = useMutation({
    mutationFn: async (newCampaign: Omit<Campaign, "id" | "created_at" | "updated_at" | "created_by" | "gabinete_id">) => {
      if (!activeInstitution?.cabinet_id) {
        throw new Error("Gabinete não encontrado");
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          ...newCampaign,
          gabinete_id: activeInstitution.cabinet_id,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Campanha criada",
        description: "A campanha foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar campanha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Campanha atualizada",
        description: "A campanha foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar campanha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir campanha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    campaigns: campaigns || [],
    isLoading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
};