import { useState } from "react";
import { Lightbulb, Link, MessageCircle, CheckCircle } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface NewIdeaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewIdeaModal({ open, onOpenChange }: NewIdeaModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    status: "aguardando",
    comments: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Aqui será implementada a integração com Supabase
    toast({
      title: "Ideia de projeto de lei registrada!",
      description: "A ideia foi adicionada com sucesso ao sistema.",
    });

    onOpenChange(false);
    setFormData({
      title: "",
      description: "",
      link: "",
      status: "aguardando",
      comments: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovada":
        return "text-green-600";
      case "rejeitada":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovada":
        return <CheckCircle className="h-4 w-4" />;
      case "rejeitada":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Criar Nova Ideia
          </DialogTitle>
          <DialogDescription>
            Registre uma nova ideia para o gabinete avaliar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Título da Ideia*
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Digite o título da ideia"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição*</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva detalhadamente a ideia"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Link */}
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
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {getStatusIcon(formData.status)}
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Aguardando
                    </span>
                  </SelectItem>
                  <SelectItem value="aprovada">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Aprovada
                    </span>
                  </SelectItem>
                  <SelectItem value="rejeitada">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Rejeitada
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comentários */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comentários/Atualizações
            </Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleInputChange("comments", e.target.value)}
              placeholder="Adicione comentários ou atualizações sobre a ideia"
              rows={3}
            />
          </div>

          {/* Informações do Responsável */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Informações do Registro</h4>
            <p className="text-sm text-muted-foreground">
              Responsável: <span className="font-medium">Usuário Atual</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Data: <span className="font-medium">{new Date().toLocaleDateString("pt-BR")}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Hora: <span className="font-medium">{new Date().toLocaleTimeString("pt-BR")}</span>
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Criar Ideia
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}