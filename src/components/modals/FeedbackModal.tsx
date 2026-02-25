import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "sugestao" | "elogio";
}

export function FeedbackModal({ isOpen, onClose, type }: FeedbackModalProps) {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useCurrentUser();
  const { activeInstitution } = useActiveInstitution();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha a descrição.",
        variant: "destructive"
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tipoMap = {
        'sugestao': 'Sugestão',
        'elogio': 'Elogio'
      };

      const { error } = await supabase
        .from('feedback_ouvidoria')
        .insert({
          tipo: tipoMap[type],
          categoria: type,
          usuario_nome: profile.full_name || profile.email.split('@')[0],
          usuario_email: profile.email,
          mensagem: description,
          status: 'Novo',
          gabinete_nome: activeInstitution?.cabinet_name || ''
        });

      if (error) throw error;

      // Notificar admins
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('main_role', 'admin_plataforma');

      if (adminUsers && adminUsers.length > 0) {
        for (const admin of adminUsers) {
          try {
            await supabase.rpc('create_notification', {
              p_user_id: admin.user_id,
              p_title: `Novo${type === 'sugestao' ? 'a Sugestão' : ' Elogio'}`,
              p_message: `${profile.full_name || profile.email} enviou ${type === 'sugestao' ? 'uma sugestão' : 'um elogio'}`,
              p_type: 'info',
              p_related_entity_type: 'feedback_ouvidoria'
            });
          } catch (e) {
            console.error('Erro ao notificar:', e);
          }
        }
      }

      toast({
        title: type === 'sugestao' ? 'Sugestão enviada!' : 'Elogio enviado!',
        description: "Obrigado pelo seu feedback!",
      });

      setDescription("");
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {type === 'sugestao' ? 'Enviar Sugestão' : 'Enviar Elogio'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              {type === 'sugestao' ? 'Descrição da Sugestão *' : 'Descrição do Elogio *'}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'sugestao' 
                ? "Compartilhe sua sugestão para melhorar nossa plataforma..." 
                : "Conte-nos sobre sua experiência positiva..."}
              className="min-h-[150px]"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}