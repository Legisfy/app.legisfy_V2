import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut } from "lucide-react";

interface SuspensionModalProps {
  isOpen: boolean;
  onLogout: () => void;
  countdown: number;
}

export const SuspensionModal: React.FC<SuspensionModalProps> = ({
  isOpen,
  onLogout,
  countdown
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden border-red-500/20 shadow-2xl shadow-red-500/10"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center space-y-6 py-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-500" />
          </div>
          
          <div className="space-y-4">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Acesso Suspenso
            </DialogTitle>
            
            <div className="space-y-4 text-muted-foreground">
              <p className="text-base font-medium text-foreground/90 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                O acesso deste gabinete está temporariamente suspenso. Por favor, contate o suporte para regularizar.
              </p>
              
              <div className="grid grid-cols-1 gap-2 text-sm text-left bg-secondary/50 p-4 rounded-lg">
                <p className="font-semibold text-foreground mb-1">Possíveis causas:</p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Atraso no pagamento</li>
                  <li>Manutenção do sistema</li>
                  <li>Uso indevido da plataforma</li>
                </ul>
              </div>

              <div className="space-y-1">
                <p className="text-sm">Basta aguardar até que o acesso seja restabelecido ou entre em contato:</p>
                <a 
                  href="mailto:contato@legisfy.app.br" 
                  className="text-primary font-bold hover:underline text-lg block"
                >
                  contato@legisfy.app.br
                </a>
              </div>
            </div>
          </div>

          <div className="w-full space-y-3 pt-2">
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 10) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Desconectando automaticamente em {countdown} segundos...
            </p>
            
            <Button 
              onClick={onLogout}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-red-500/50 hover:bg-red-50 text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Sair Agora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
