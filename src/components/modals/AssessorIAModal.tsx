import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Users, FileText, MessageSquare, Database } from 'lucide-react';
import qrCodeImage from '@/assets/qr-code-assessor-ia.jpg';

interface AssessorIAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssessorIAModal({ open, onOpenChange }: AssessorIAModalProps) {

  const features = [
    {
      icon: Users,
      title: 'Cadastrar Eleitor',
      description: 'Registre novos eleitores diretamente via WhatsApp'
    },
    {
      icon: MessageSquare,
      title: 'Cadastrar Demanda',
      description: 'Crie e gerencie demandas dos cidadãos'
    },
    {
      icon: FileText,
      title: 'Cadastro de Indicações',
      description: 'Registre indicações de forma rápida e prática'
    },
    {
      icon: Database,
      title: 'Busca de Dados do Gabinete',
      description: 'Consulte informações e estatísticas em tempo real'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            Assessor IA - WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code Section */}
          <div className="flex flex-col items-center gap-4 p-6 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold">Escaneie o QR Code</h3>
            <p className="text-sm text-muted-foreground text-center">
              Use a câmera do seu celular ou WhatsApp para escanear
            </p>
            
            <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
              <img 
                src={qrCodeImage} 
                alt="QR Code do Assessor IA"
                className="w-48 h-48 object-contain"
              />
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-base font-medium text-foreground">
                Tome seu cafezinho e relaxe ☕
              </p>
              <p className="text-sm text-muted-foreground">
                o Assessor IA da Legisfy Funciona 24 horas por dia, 7 dias da semana
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Funcionalidades do Assessor IA</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Bot className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Atendimento Inteligente
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  O Assessor IA está sempre disponível para ajudar sua equipe e os cidadãos. 
                  Ele aprende com cada interação e melhora continuamente o atendimento do gabinete.
                </p>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium">Como usar:</h4>
            <ol className="text-sm text-muted-foreground space-y-2 pl-4">
              <li>1. Escaneie o QR Code com seu celular</li>
              <li>2. Você será direcionado para o WhatsApp</li>
              <li>3. Inicie uma conversa com o Assessor IA</li>
              <li>4. Solicite qualquer uma das funcionalidades disponíveis</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
