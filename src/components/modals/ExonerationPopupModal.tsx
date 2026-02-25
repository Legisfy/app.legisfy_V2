import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ExonerationPopupModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export const ExonerationPopupModal: React.FC<ExonerationPopupModalProps> = ({
  isOpen,
  onConfirm
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Você foi exonerado do Gabinete
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Você foi exonerado do gabinete pelo Político ou Chefe de Gabinete.
              <br />
              Sua conta será removida do sistema.
            </p>
          </div>

          <Button 
            onClick={onConfirm}
            variant="destructive"
            className="w-full"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};