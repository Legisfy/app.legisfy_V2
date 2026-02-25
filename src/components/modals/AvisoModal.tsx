import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Bell, Users } from "lucide-react";

interface Assessor {
  id: string;
  nome: string;
  email: string;
  cargo: string;
}

interface AvisoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessores: Assessor[];
}

export const AvisoModal = ({ open, onOpenChange, assessores }: AvisoModalProps) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [todosAssessores, setTodosAssessores] = useState(true);
  const [assessoresSelecionados, setAssessoresSelecionados] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAssessorToggle = (assessorId: string) => {
    setAssessoresSelecionados(prev =>
      prev.includes(assessorId)
        ? prev.filter(id => id !== assessorId)
        : [...prev, assessorId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo || !descricao) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título e a descrição do aviso.",
        variant: "destructive",
      });
      return;
    }

    if (!todosAssessores && assessoresSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um assessor para receber o aviso.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simular envio do aviso
      await new Promise(resolve => setTimeout(resolve, 1500));

      const destinatarios = todosAssessores ? assessores.length : assessoresSelecionados.length;

      toast({
        title: "Aviso enviado!",
        description: `O aviso "${titulo}" foi enviado para ${destinatarios} assessor(es).`,
      });

      // Limpar formulário e fechar modal
      setTitulo("");
      setDescricao("");
      setTodosAssessores(true);
      setAssessoresSelecionados([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar o aviso. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] bg-card/60 backdrop-blur-xl border-border/40 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col p-8 overflow-hidden">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold font-outfit uppercase tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            Comunicado Interno
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Título do Comunicado</Label>
            <Input
              id="titulo"
              placeholder="Ex: Reunião de Pauta Extraordinária"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="h-12 bg-background/50 border-border/40 rounded-xl focus:ring-primary/20 transition-all font-bold placeholder:font-normal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Mensagem Detalhada</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o objetivo e detalhes do comunicado..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="min-h-[120px] bg-background/50 border-border/40 rounded-xl focus:ring-primary/20 transition-all font-medium resize-none p-4"
              required
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Público-Alvo</Label>

            <div className="flex items-center space-x-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
              <Checkbox
                id="todos"
                checked={todosAssessores}
                onCheckedChange={(checked) => {
                  setTodosAssessores(checked as boolean);
                  if (checked) {
                    setAssessoresSelecionados([]);
                  }
                }}
                className="w-5 h-5 rounded-md border-primary/40 data-[state=checked]:bg-primary"
              />
              <Label htmlFor="todos" className="flex items-center gap-2 cursor-pointer font-bold font-outfit text-sm">
                <Users className="h-4 w-4 text-primary" />
                Toda a Equipe ({assessores.length})
              </Label>
            </div>

            {!todosAssessores && (
              <div className="space-y-3 pt-2 pl-4 border-l-2 border-primary/20 animate-in slide-in-from-left-2 duration-300">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Selecionar Específicos:
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {assessores.map((assessor) => (
                    <div key={assessor.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer group">
                      <Checkbox
                        id={`assessor-${assessor.id}`}
                        checked={assessoresSelecionados.includes(assessor.id)}
                        onCheckedChange={() => handleAssessorToggle(assessor.id)}
                        className="w-4 h-4 rounded border-border/40 group-hover:border-primary/40"
                      />
                      <Label
                        htmlFor={`assessor-${assessor.id}`}
                        className="text-xs font-bold font-outfit cursor-pointer flex-1"
                      >
                        {assessor.nome}
                        <span className="ml-2 font-normal text-[10px] text-muted-foreground/60 uppercase tracking-widest tracking-tighter">— {assessor.cargo}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden bg-orange-500/5 border border-orange-500/10 p-5 rounded-2xl group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
            <p className="text-xs text-orange-700/80 font-medium leading-relaxed">
              <strong className="text-orange-900 block mb-1">Avisos de Notificação:</strong>
              O comunicado será exibido como um alerta prioritário no dashboard de cada membro selecionado.
            </p>
          </div>

          <DialogFooter className="gap-3 pt-4 border-t border-border/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all"
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {isLoading ? "DISPARANDO..." : "ENVIAR COMUNICADO AGORA"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};