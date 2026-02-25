import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Search
} from "lucide-react";
import { toast } from "sonner";

interface PublishTabProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  publicPage: any;
}

export const PublishTab = ({ formData, onFormChange, publicPage }: PublishTabProps) => {
  const [slugValidation, setSlugValidation] = useState<{
    isValid: boolean;
    message: string;
    isChecking: boolean;
  }>({
    isValid: true,
    message: '',
    isChecking: false
  });

  // Generate slug from gabinete name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens
      .trim();
  };

  // Validate slug in real-time
  useEffect(() => {
    if (!formData.slug) return;

    setSlugValidation(prev => ({ ...prev, isChecking: true }));
    
    const timeout = setTimeout(() => {
      const isValidFormat = /^[a-z0-9-]+$/.test(formData.slug);
      const isNotEmpty = formData.slug.length >= 3;
      const isNotTooLong = formData.slug.length <= 50;
      
      if (!isValidFormat) {
        setSlugValidation({
          isValid: false,
          message: 'Use apenas letras minúsculas, números e hífens',
          isChecking: false
        });
      } else if (!isNotEmpty) {
        setSlugValidation({
          isValid: false,
          message: 'Slug deve ter pelo menos 3 caracteres',
          isChecking: false
        });
      } else if (!isNotTooLong) {
        setSlugValidation({
          isValid: false,
          message: 'Slug deve ter no máximo 50 caracteres',
          isChecking: false
        });
      } else {
        setSlugValidation({
          isValid: true,
          message: 'Slug disponível',
          isChecking: false
        });
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData.slug]);

  const handleCopyUrl = () => {
    if (formData.slug) {
      const url = `${window.location.origin}/p/${formData.slug}`;
      navigator.clipboard.writeText(url);
      toast.success('URL copiada para a área de transferência!');
    }
  };

  const handlePreview = () => {
    if (formData.slug) {
      const url = `${window.location.origin}/p/${formData.slug}?preview=true`;
      window.open(url, '_blank');
    }
  };

  // Generate SEO title and description
  useEffect(() => {
    if (!formData.seo_title) {
      onFormChange('seo_title', `Vereador ${publicPage?.gabinete_name || 'Nome'} – Gabinete Cidade/UF`);
    }
    if (!formData.seo_description) {
      onFormChange('seo_description', 'Conheça o trabalho do nosso gabinete. Indicações, demandas atendidas, transparência e participação popular.');
    }
  }, [publicPage, formData.seo_title, formData.seo_description, onFormChange]);

  const checklist = [
    {
      id: 'slug',
      label: 'Slug válido e único',
      completed: slugValidation.isValid && formData.slug.length >= 3,
      required: true
    },
    {
      id: 'content',
      label: 'Texto de boas-vindas preenchido',
      completed: formData.welcome_text.length > 0,
      required: false
    },
    {
      id: 'links',
      label: 'Pelo menos um link social',
      completed: formData.instagram || formData.whatsapp || formData.site,
      required: false
    },
    {
      id: 'form',
      label: 'Formulário configurado',
      completed: formData.show_form && formData.form_title,
      required: formData.show_form
    }
  ];

  const canPublish = checklist.filter(item => item.required).every(item => item.completed);

  return (
    <div className="space-y-6">
      {/* Configuração de URL */}
      <div className="space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          URL da Página
        </Label>
        
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground pointer-events-none">
                {window.location.origin}/p/
              </div>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => onFormChange('slug', e.target.value.toLowerCase())}
                className="pl-[140px]"
                placeholder="meu-gabinete"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              disabled={!formData.slug || !slugValidation.isValid}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreview}
              disabled={!formData.slug || !slugValidation.isValid}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          {slugValidation.isChecking && (
            <p className="text-xs text-muted-foreground">Verificando disponibilidade...</p>
          )}
          
          {!slugValidation.isChecking && slugValidation.message && (
            <p className={`text-xs ${slugValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {slugValidation.message}
            </p>
          )}
        </div>
      </div>

      {/* Status da Página */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Status</Label>
        <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Estado atual:</span>
            <Badge variant={formData.status === 'published' ? 'default' : 'secondary'} className="ml-2">
              {formData.status === 'published' ? 'Publicada' : 
               formData.status === 'draft' ? 'Rascunho' : 'Oculta'}
            </Badge>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="space-y-4">
        <Label className="text-base font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          SEO & OpenGraph
        </Label>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="seo_title">Título (Meta Title)</Label>
            <Input
              id="seo_title"
              value={formData.seo_title}
              onChange={(e) => onFormChange('seo_title', e.target.value)}
              maxLength={60}
              placeholder="Vereador Nome – Gabinete Cidade/UF"
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.seo_title.length}/60 caracteres
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seo_description">Descrição (Meta Description)</Label>
            <Textarea
              id="seo_description"
              value={formData.seo_description}
              onChange={(e) => onFormChange('seo_description', e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Conheça o trabalho do nosso gabinete..."
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.seo_description.length}/160 caracteres
            </p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Checklist de Publicação</Label>
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
              {item.completed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={`text-sm ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                {item.label}
                {item.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ações de Publicação */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Ações</Label>
        
        {!canPublish && formData.status === 'draft' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Complete os itens obrigatórios do checklist para publicar a página.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline"
            disabled={!canPublish}
          >
            Publicar
          </Button>
          <Button variant="outline">
            Salvar Rascunho
          </Button>
        </div>
      </div>
    </div>
  );
};