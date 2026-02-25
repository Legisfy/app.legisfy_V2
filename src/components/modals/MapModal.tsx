import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EleitoresMap } from "@/components/maps/EleitoresMap";

interface Eleitor {
  id: number;
  nome: string;
  bairro: string;
  telefone: string;
  email: string;
  endereco: string;
  tags: string[];
  foto: string;
  indicacoes: number;
  demandas: number;
}

interface MapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eleitores: Eleitor[];
  bairros: string[];
  tags: string[];
}

export const MapModal: React.FC<MapModalProps> = ({
  open,
  onOpenChange,
  eleitores,
  bairros,
  tags
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mapa de Eleitores</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <EleitoresMap 
            eleitores={eleitores}
            bairros={bairros}
            tags={tags}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};