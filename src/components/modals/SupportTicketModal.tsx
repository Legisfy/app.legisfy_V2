import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Send } from "lucide-react";

interface SupportTicketModalProps {
  children: React.ReactNode;
}

export function SupportTicketModal({ children }: SupportTicketModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    category: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useCurrentUser();
  const { activeInstitution } = useActiveInstitution();

  const supportCategories = [
    { 
      value: "eleitores", 
      label: "Eleitores",
      description: "Problemas com cadastro de eleitor, visualização de dados na tabela, editar eleitor, mapa dos eleitores, categorias e outros"
    },
    { 
      value: "indicacao", 
      label: "Indicação",
      description: "Problemas com cadastro de indicação, visualização de dados na tabela, alterar status, mapa da indicação, categorias e outros"
    },
    { 
      value: "demandas", 
      label: "Demandas",
      description: "Problemas com cadastro de demandas, visualização de dados na tabela, alterar status, categorias e outros"
    },
    { 
      value: "ideias", 
      label: "Ideias",
      description: "Problemas em cadastrar ideia, aprovar ou outros problemas relacionados a ideias"
    },
    { 
      value: "agenda", 
      label: "Agenda",
      description: "Problemas em criar um evento na agenda, lembrete, visualização e outros"
    },
    { 
      value: "assessores", 
      label: "Assessores",
      description: "Problemas relacionado ao cadastro de assessores, ranking de assessores e outros"
    },
    { 
      value: "pontuacao_metas", 
      label: "Pontuação e Metas",
      description: "Problemas com sistema de pontuação, dados incorretos e outros"
    },
    { 
      value: "assessor_ia", 
      label: "Assessor IA",
      description: "Problemas técnicos com o assessor IA - Inteligência Artificial"
    }
  ];


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.category) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para abrir um chamado.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          description: formData.description,
          category: formData.category || 'geral',
          status: 'aberto'
        } as any);

      if (error) {
        throw error;
      }

      // Buscar usuários admin para notificar
      const { data: adminUsers, error: adminError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('main_role', 'admin_plataforma');

      if (!adminError && adminUsers && adminUsers.length > 0) {
        // Criar notificação para cada admin
        for (const admin of adminUsers) {
            try {
            await supabase.rpc('create_notification', {
              p_user_id: admin.user_id,
              p_title: 'Novo Chamado de Suporte',
              p_message: `${profile.full_name || profile.email} abriu um novo chamado na categoria ${formData.category}`,
              p_type: 'info',
              p_related_entity_type: 'support_tickets'
            });
          } catch (notificationError) {
            console.error('Erro ao criar notificação:', notificationError);
          }
        }
      }

      toast({
        title: "Chamado criado!",
        description: "Seu chamado foi aberto com sucesso. Nossa equipe analisará em breve.",
      });

      // Limpar formulário e fechar modal
      setFormData({
        description: "",
        category: ""
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar chamado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[580px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-primary/5 to-transparent border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            Abrir Chamado de Suporte
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Descreva seu problema e nossa equipe irá ajudá-lo o mais rápido possível
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Selecione o tipo do problema" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {supportCategories.map((category) => (
                  <SelectItem 
                    key={category.value} 
                    value={category.value}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 py-2">
                      <span className="font-semibold text-sm">{category.label}</span>
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {category.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium">
              Descrição do Problema *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explique detalhadamente o que está acontecendo. Quanto mais informações você fornecer, mais rápido conseguiremos ajudar..."
              className="min-h-[160px] text-base resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              Dica: Inclua prints de tela ou passos para reproduzir o problema
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="min-w-[100px]"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Chamado
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}