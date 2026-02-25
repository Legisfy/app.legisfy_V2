import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, Check, X, RotateCcw, Loader2 } from "lucide-react";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useEmailInvitations } from "@/hooks/useEmailInvitations";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface ConvitesEnviadosProps {
  onRefresh?: () => void;
}

export const ConvitesEnviados = ({ onRefresh }: ConvitesEnviadosProps) => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const { activeInstitution } = useActiveInstitution();
  const { createInvitation } = useEmailInvitations();
  const { toast } = useToast();

  useEffect(() => {
    console.log('ConvitesEnviados useEffect - activeInstitution:', activeInstitution);
    if (activeInstitution?.cabinet_id) {
      fetchInvitations();
    } else {
      console.log('ConvitesEnviados - No activeInstitution.cabinet_id found:', activeInstitution);
    }
  }, [activeInstitution, onRefresh]);

  const fetchInvitations = async () => {
    console.log('fetchInvitations called - activeInstitution:', activeInstitution);
    if (!activeInstitution?.cabinet_id) {
      console.log('No activeInstitution.cabinet_id found, activeInstitution:', activeInstitution);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching invitations for cabinet_id:', activeInstitution.cabinet_id);

      const { data: invitationsData, error } = await (supabase as any)
        .from('invitations')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { ascending: false });

      console.log('Invitations query result:', {
        cabinet_id: activeInstitution.cabinet_id,
        invitationsData,
        error,
        count: invitationsData?.length || 0
      });

      if (error) {
        console.error('Error fetching invitations:', error);
        setInvitations([]);
        return;
      }

      console.log('Setting invitations:', invitationsData || []);
      setInvitations(invitationsData || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (invitation: any) => {
    try {
      if (!activeInstitution?.cabinet_id) return;

      await createInvitation({
        email: invitation.email,
        name: invitation.name || '',
        role: invitation.role || 'assessor',
        institution_id: activeInstitution.cabinet_id,
        cabinet_name: activeInstitution.cabinet_name
      });

      // Refresh the invitations list
      await fetchInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    setCancelingId(invitationId);
    try {
      const { error } = await (supabase as any)
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error canceling invitation:', error);
        toast({
          title: "Erro ao cancelar convite",
          description: "Não foi possível cancelar o convite. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Remove from local state
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      onRefresh?.();
      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso.",
      });
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast({
        title: "Erro ao cancelar convite",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusBadge = (invitation: any) => {
    if (invitation.accepted_at) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Check className="h-3 w-3 mr-1" />
          Aceito
        </Badge>
      );
    }

    if (invitation.email_sent) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <X className="h-3 w-3 mr-1" />
        Erro no envio
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convites Enviados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando convites...</p>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convites Enviados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum convite enviado ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div key={invitation.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-300 gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary/60" />
              </div>
              <div>
                <p className="font-bold font-outfit uppercase tracking-tight text-foreground/80">{invitation.name}</p>
                <p className="text-xs font-medium text-muted-foreground/60">{invitation.email}</p>
              </div>
              <div className="sm:ml-2">
                {getStatusBadge(invitation)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Enviado: {format(new Date(invitation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {invitation.accepted_at && (
                <p className="text-[10px] font-black uppercase tracking-widest text-green-500/50 flex items-center gap-1.5">
                  <Check className="h-3 w-3" />
                  Aceito: {format(new Date(invitation.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!invitation.accepted_at && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResendInvite(invitation)}
                  className="h-9 px-4 rounded-xl bg-muted/20 hover:bg-primary/10 hover:text-primary font-bold text-[10px] uppercase tracking-widest gap-2 transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reenviar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelInvite(invitation.id)}
                  disabled={cancelingId === invitation.id}
                  className="h-9 px-4 rounded-xl bg-destructive/5 hover:bg-destructive hover:text-destructive-foreground font-bold text-[10px] uppercase tracking-widest gap-2 transition-all"
                >
                  {cancelingId === invitation.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  {cancelingId === invitation.id ? 'Cancelando...' : 'Cancelar'}
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};