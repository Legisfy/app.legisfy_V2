import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, CheckCircle2 } from "lucide-react";

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
          case 'primeiro_nome':
            exampleValue = 'João';
            break;
          case 'bairro':
            exampleValue = 'Centro';
            break;
          case 'cidade':
            exampleValue = 'Vitória';
            break;
          case 'idade':
            exampleValue = '32';
            break;
          case 'sexo':
            exampleValue = 'Masculino';
            break;
          case 'profissao':
            exampleValue = 'Engenheiro';
            break;
          case 'total_demandas':
            exampleValue = '5';
            break;
          case 'total_indicacoes':
            exampleValue = '3';
            break;
          case 'demanda':
            exampleValue = 'Iluminação Pública';
            break;
          case 'indicacao':
            exampleValue = 'Reforma da Praça';
            break;
        }
        
        return <strong key={index} className="font-bold text-primary dark:text-primary">{exampleValue}</strong>;
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-md mx-auto border border-border/40 rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-500">
      {/* WhatsApp Header */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-3 flex items-center justify-between border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-black/5 dark:border-white/10">
            {agentPhoto ? (
              <AvatarImage src={agentPhoto} alt={agentName} />
            ) : (
              <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="text-sm font-bold text-[#111b21] dark:text-[#e9edef] leading-none">{agentName}</div>
            <div className="text-[10px] text-[#667781] dark:text-[#8696A0] mt-1 uppercase tracking-widest font-black">Online</div>
          </div>
        </div>
      </div>

      <div 
        className="p-4 min-h-[350px] transition-colors relative" 
        style={{ 
          backgroundColor: 'transparent',
        }}
      >
        {/* WhatsApp Background - Using CSS classes for theme switching instead of hardcoded style if possible, 
            but for the pattern we'll use a wrapper with background */}
        <div className="absolute inset-0 bg-[#efeae2] dark:bg-[#0b141a] opacity-100 transition-colors duration-300"></div>
        <div 
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none"
          style={{ 
            backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
            backgroundSize: '400px',
            backgroundRepeat: 'repeat'
          }}
        ></div>

        <div className="flex items-start space-x-2 relative z-10">
          <div className="flex-1 max-w-[90%] mx-auto">
            {/* Balão de mensagem (simulando como o eleitor verá) */}
            <div className="bg-[#dcf8c6] dark:bg-[#005c4b] rounded-2xl rounded-tl-none shadow-md p-3 relative transform transition-all duration-300 border border-black/5 dark:border-none">
              {/* Triângulozinho do balão */}
              <div 
                className="absolute top-0 -left-2 w-0 h-0 border-t-[0px] border-t-transparent border-r-[15px] border-r-[#dcf8c6] dark:border-r-[#005c4b] border-b-[15px] border-b-transparent"
              ></div>
              
              {message ? (
                <div className="text-[14.5px] text-[#111b21] dark:text-[#E9EDEF] whitespace-pre-wrap break-words leading-[20px] font-medium font-sans">
                  {renderMessage()}
                </div>
              ) : (
                <p className="text-[14.5px] text-[#667781] dark:text-[#8696A0] italic font-medium">
                  Digite sua mensagem para visualizar aqui...
                </p>
              )}
              
              <div className="flex items-center justify-end mt-1.5 space-x-1">
                <span className="text-[10px] text-gray-500 dark:text-[#E9EDEF]/60 font-bold">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex -space-x-1.5">
                  <CheckCircle2 className="w-3 h-3 text-[#53bdeb]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};