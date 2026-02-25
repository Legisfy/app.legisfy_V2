import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConvitesEnviados } from "@/components/assessores/ConvitesEnviados";

interface ConvitesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export const ConvitesModal = ({ open, onOpenChange, onRefresh }: ConvitesModalProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    onRefresh?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card/60 backdrop-blur-xl border-border/40 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold font-outfit uppercase tracking-tight">Gerenciar Convites</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <ConvitesEnviados key={refreshKey} onRefresh={handleRefresh} />
        </div>
      </DialogContent>
    </Dialog>
  );
};