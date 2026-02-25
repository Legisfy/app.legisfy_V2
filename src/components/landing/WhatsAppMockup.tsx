import { Phone, Battery, Wifi, Signal, ChevronLeft, MoreVertical, Camera, Mic, Send } from "lucide-react";

export function WhatsAppMockup() {
  const messages = [
    { from: "user", text: "Oi! Preciso registrar uma indicação", time: "14:23" },
    { from: "ia", text: "Olá! Claro, vou ajudar com isso. Qual é o endereço da indicação?", time: "14:23" },
    { from: "user", text: "Rua das Palmeiras, 180 - Bairro Centro", time: "14:24" },
    { from: "ia", text: "Ótimo! Agora, pode me descrever qual é a indicação?", time: "14:24" },
    { from: "user", text: "Solicitação de reforma da calçada", time: "14:25" },
    { from: "ia", text: "Perfeito! Por favor, envie uma foto do local para completar o registro.", time: "14:25" },
    { from: "user", text: "📷 Foto enviada", time: "14:26" },
    { from: "ia", text: "Indicação registrada com sucesso! O protocolo é #3241. Você pode acompanhar o andamento pela plataforma.", time: "14:26" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Phone Frame */}
      <div className="relative rounded-[2.5rem] border-[8px] border-gray-800 bg-gray-900 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-40 bg-gray-800 rounded-b-2xl z-10"></div>
        
        {/* Screen */}
        <div className="relative rounded-[2rem] overflow-hidden bg-white">
          {/* Status Bar */}
          <div className="bg-[#075E54] px-4 py-2 flex items-center justify-between text-white text-xs">
            <span className="font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <Battery className="h-3 w-3" />
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="bg-[#075E54] px-3 py-2 flex items-center gap-3 text-white">
            <ChevronLeft className="h-5 w-5" />
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">
              IA
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Assessor IA - Legisfy</h3>
              <p className="text-xs text-gray-200">online</p>
            </div>
            <MoreVertical className="h-5 w-5" />
          </div>

          {/* Chat Background */}
          <div 
            className="h-[480px] overflow-y-auto px-3 py-4 bg-[#ECE5DD] relative"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          >
            <div className="space-y-2 animate-fade-in">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} animate-scale-in`}
                  style={{ animationDelay: `${idx * 0.3}s` }}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                      msg.from === "user"
                        ? "bg-[#DCF8C6] rounded-br-none"
                        : "bg-white rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] text-gray-500 float-right mt-1">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="bg-[#F0F0F0] px-2 py-2 flex items-center gap-2 border-t">
            <button className="text-gray-600 hover:text-gray-800">
              <Camera className="h-5 w-5" />
            </button>
            <div className="flex-1 bg-white rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Mensagem"
                className="w-full text-sm outline-none bg-transparent"
                disabled
              />
            </div>
            <button className="text-gray-600 hover:text-gray-800">
              <Mic className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
