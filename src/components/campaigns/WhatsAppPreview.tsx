import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

interface WhatsAppPreviewProps {
  message: string;
  agentName?: string;
  agentPhoto?: string;
}

export const WhatsAppPreview = ({ message, agentName = "Assessor IA", agentPhoto }: WhatsAppPreviewProps) => {
  // Replace variables with example values and make them bold
  const renderMessage = () => {
    if (!message) return null;

    // Split by variable patterns and replace with examples
    const parts = message.split(/(\{\{[^}]+\}\})/g);
    
    return parts.map((part, index) => {
      // Check if it's a variable
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const variable = part.slice(2, -2);
        let exampleValue = variable;
        
        // Map to example values
        switch(variable.toLowerCase()) {
          case 'nome':
            exampleValue = 'João Silva';
            break;
          case 'bairro':
            exampleValue = 'Centro';
            break;
          case 'demanda':
            exampleValue = 'Iluminação Pública';
            break;
          case 'indicacao':
            exampleValue = 'Reforma da Praça';
            break;
        }
        
        return <strong key={index} className="font-bold">{exampleValue}</strong>;
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#E5DDD5] rounded-lg p-4 min-h-[400px]" style={{ 
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'whatsapp\' x=\'0\' y=\'0\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M20 0 L0 20 M40 0 L0 40 M60 0 L0 60 M80 0 L0 80 M100 0 L0 100 M100 20 L20 100 M100 40 L40 100 M100 60 L60 100 M100 80 L80 100\' stroke=\'%23D9D0C7\' stroke-width=\'1\' opacity=\'0.3\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23whatsapp)\'/%3E%3C/svg%3E")'
      }}>
        <div className="flex items-start space-x-2">
          <Avatar className="h-10 w-10 flex-shrink-0">
            {agentPhoto ? (
              <AvatarImage src={agentPhoto} alt={agentName} />
            ) : (
              <AvatarFallback className="bg-primary">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1">
            <div className="bg-white rounded-lg rounded-tl-none shadow-sm p-3 relative">
              <div className="text-xs font-semibold text-primary mb-1">
                {agentName}
              </div>
              
              {message ? (
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                  {renderMessage()}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Digite sua mensagem para visualizar aqui...
                </p>
              )}
              
              <div className="flex items-center justify-end mt-1 space-x-1">
                <span className="text-[10px] text-muted-foreground">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};