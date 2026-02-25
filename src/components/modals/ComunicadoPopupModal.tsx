import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Comunicado {
  id: string;
  titulo: string;
  descricao?: string;
  imagem_url?: string;
  texto_botao: string;
  link_botao: string;
  link_destino?: string;
  tipo?: 'texto' | 'banner' | 'dashboard' | 'login' | 'popup';
}

interface ComunicadoPopupModalProps {
  comunicado: Comunicado | null;
  onClose: () => void;
  onTrackClick?: (comunicadoId: string) => void;
}

export const ComunicadoPopupModal = ({ 
  comunicado, 
  onClose,
  onTrackClick 
}: ComunicadoPopupModalProps) => {
  if (!comunicado) return null;

  const handleButtonClick = async () => {
    const linkToOpen = comunicado.link_destino || comunicado.link_botao;
    console.log('🔗 Popup Link original:', linkToOpen);
    
    if (linkToOpen && linkToOpen !== '#') {
      if (onTrackClick) {
        onTrackClick(comunicado.id);
      }
      // Corrigir duplicação de links
      let finalUrl = linkToOpen;
      if (!linkToOpen.startsWith('http')) {
        finalUrl = `https://${linkToOpen}`;
      }
      console.log('🚀 Popup URL final:', finalUrl);
      window.open(finalUrl, '_blank');
    }
    onClose();
  };

  return (
    <Dialog open={!!comunicado} onOpenChange={() => onClose()}>
      <DialogContent className="p-0 gap-0 border-0 bg-transparent overflow-hidden rounded-lg" style={{ width: '600px', height: '600px', maxWidth: '600px', maxHeight: '600px' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
          aria-label="Fechar"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Image only - full size */}
        {comunicado.imagem_url && (
          <div className="w-full h-full rounded-lg overflow-hidden cursor-pointer" onClick={handleButtonClick}>
            <img 
              src={comunicado.imagem_url} 
              alt={comunicado.titulo}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};