import { useState } from "react";
import { Lightbulb, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRealIdeias } from "@/hooks/useRealIdeias";

interface NewIdeaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewIdeaModal({ open, onOpenChange }: NewIdeaModalProps) {
  const { toast } = useToast();
  const { createIdeia } = useRealIdeias();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    link: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, digite o título da ideia.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.descricao.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, descreva a ideia.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await createIdeia({
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        link_url: formData.link.trim() || null, // Usando o novo campo link_url
        status: "rascunho",
        prioridade: "media",
      });

      toast({
        title: "Ideia de projeto de lei registrada!",
        description: "A ideia foi adicionada com sucesso ao sistema.",
      });

      // Fechar modal e limpar formulário
      onOpenChange(false);
      setFormData({
        titulo: "",
        descricao: "",
        link: "",
      });
    } catch (error) {
      console.error('Error creating ideia:', error);
      toast({
        title: "Erro ao criar ideia",
        description: "Ocorreu um erro ao criar a ideia. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Limpar formulário quando o modal é fechado
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData({
        titulo: "",
        descricao: "",
        link: "",
      });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Criar Nova Ideia
          </DialogTitle>
          <DialogDescription>
            Compartilhe sua ideia para melhorar nosso trabalho
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Título da Ideia*
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleInputChange("titulo", e.target.value)}
              placeholder="Digite o título da ideia"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição*</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange("descricao", e.target.value)}
              placeholder="Descreva detalhadamente a ideia"
              rows={4}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link (opcional)
            </Label>
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => handleInputChange("link", e.target.value)}
              placeholder="https://exemplo.com"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Salvando..." : "Salvar Ideia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}