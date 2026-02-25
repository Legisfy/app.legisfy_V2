import { useState } from "react";
import { User, Mail, Phone, MapPin, Tag, Calendar, Camera } from "lucide-react";
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

interface NewVoterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewVoterModal({ open, onOpenChange }: NewVoterModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    address: "",
    neighborhood: "",
    whatsapp: "",
    email: "",
    socialMedia: "",
    tags: "",
    profilePhoto: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aqui será implementada a integração com Supabase
    toast({
      title: "Eleitor cadastrado!",
      description: "O eleitor foi adicionado com sucesso ao sistema.",
    });
    
    onOpenChange(false);
    setFormData({
      name: "",
      birthDate: "",
      address: "",
      neighborhood: "",
      whatsapp: "",
      email: "",
      socialMedia: "",
      tags: "",
      profilePhoto: null,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Cadastrar Novo Eleitor
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do eleitor para adicioná-lo ao sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <Button type="button" variant="outline" size="sm">
              Adicionar Foto
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo*
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Nascimento
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                WhatsApp*
              </Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço Completo*
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Rua, número, complemento"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bairro */}
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro*</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                placeholder="Digite o bairro"
                required
              />
            </div>

            {/* Redes Sociais */}
            <div className="space-y-2">
              <Label htmlFor="socialMedia">Redes Sociais</Label>
              <Input
                id="socialMedia"
                value={formData.socialMedia}
                onChange={(e) => handleInputChange("socialMedia", e.target.value)}
                placeholder="@usuario ou link"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags (separadas por vírgula)
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
              placeholder="liderança, jovem, comerciante"
            />
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
              Cadastrar Eleitor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}