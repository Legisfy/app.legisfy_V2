import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  ExternalLink, 
  Eye, 
  EyeOff,
  MoreHorizontal,
  Copy,
  RotateCcw,
  Trash2
} from "lucide-react";
import { usePublicPage } from "@/hooks/usePublicPage";
import { toast } from "sonner";

interface EditorHeaderProps {
  publicPage: any;
  formData: any;
  onBack: () => void;
  unsavedChanges: boolean;
}

export const EditorHeader = ({ publicPage, formData, onBack, unsavedChanges }: EditorHeaderProps) => {
  const { publishPage, hidePage } = usePublicPage();

  const handlePreviewInNewTab = () => {
    if (publicPage?.slug) {
      const url = `${window.location.origin}/p/${publicPage.slug}?preview=true`;
      window.open(url, '_blank');
    }
  };

  const handleCopyUrl = () => {
    if (publicPage?.slug) {
      const url = `${window.location.origin}/p/${publicPage.slug}`;
      navigator.clipboard.writeText(url);
      toast.success('URL copiada para a área de transferência!');
    }
  };

  const handlePublish = async () => {
    if (formData.status === 'published') {
      await hidePage();
    } else {
      await publishPage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'hidden': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publicada';
      case 'draft': return 'Rascunho';
      case 'hidden': return 'Oculta';
      default: return 'Rascunho';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Builder - Landing Pages & Forms</h1>
            <Badge variant={getStatusColor(formData.status)}>
              {getStatusText(formData.status)}
            </Badge>
            {unsavedChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                Salvando...
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePreviewInNewTab}
            disabled={!publicPage?.slug}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <Button 
            onClick={handlePublish}
            size="sm"
            variant={formData.status === 'published' ? 'secondary' : 'default'}
          >
            {formData.status === 'published' ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Ocultar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Publicar
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyUrl} disabled={!publicPage?.slug}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar URL
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar tema
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir página
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
