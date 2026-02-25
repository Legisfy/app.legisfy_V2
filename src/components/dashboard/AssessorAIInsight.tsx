import { Suspense, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Filter, LayoutDashboard, MessageCircle, Send, X, ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import SplineRobot from "@/components/auth/SplineRobot";
import { useIAChat } from "@/hooks/useIAChat";
import { useAssessorIA } from "@/hooks/useAssessorIA";

interface AssessorAIInsightProps {
    stats: {
        totalEleitores: number;
        totalIndicacoes: number;
        totalDemandas: number;
        totalIdeias: number;
    };
    className?: string;
}

export const AssessorAIInsight = ({ stats, className }: AssessorAIInsightProps) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const { messages, sendMessage, sendingMessage } = useIAChat();
    const { nome: assessorNome, isConfigured } = useAssessorIA();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        if (isChatOpen) {
            scrollToBottom();
        }
    }, [messages, isChatOpen]);

    // Simple logic to generate a "report" based on stats
    const getPerformanceInsight = () => {
        const total = (stats?.totalEleitores || 0) + (stats?.totalIndicacoes || 0) + (stats?.totalDemandas || 0);
        if (total === 0 || !total) return "SISTEMA_INICIAL: RECOMENDO MAPEAMENTO IMEDIATO DE DEMANDAS LOCAIS.";

        if ((stats?.totalDemandas || 0) > (stats?.totalIndicacoes || 0)) {
            return `ALERTA_FLUXO: VOLUME DE DEMANDAS (${stats?.totalDemandas || 0}) SUPERA INDICAÇÕES. RECOMENDO CONVERSÃO EM PAUTAS LEGISLATIVAS.`;
        }

        return `OTIMIZAÇÃO_ATIVADA: GABINETE MANTÉM RITMO SÓLIDO COM ${stats?.totalIndicacoes || 0} INDICAÇÕES. FOCO EM DISSEMINAÇÃO DIGITAL.`;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || sendingMessage) return;

        const msgToSend = messageInput.trim();
        setMessageInput(""); // Clear input immediately
        await sendMessage(msgToSend);
    };

    const now = new Date();
    const lastUpdate = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <Card className={cn(
            "overflow-hidden border border-border/40 relative group transition-all duration-500 shadow-none flex flex-col h-full bg-card/20 backdrop-blur-sm",
            className
        )}>
            {/* Background Decor - Theme Aware Gradient */}
            <div className="absolute inset-0 bg-transparent z-0" />

            {/* AI Character Section - Spline Robot */}
            <div className={cn(
                "relative transition-all duration-700 ease-in-out z-10 overflow-hidden bg-muted/10",
                isChatOpen ? "h-24 md:h-28 opacity-40 grayscale" : "h-40 md:h-48"
            )}>
                {/* Floating IA Name and Status */}
                <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-1 select-none pointer-events-none">
                    <div className="flex flex-col items-end px-2 py-1 rounded-lg bg-background/20 backdrop-blur-md border border-border/40">
                        <span className="text-[10px] font-bold uppercase tracking-tight text-foreground/80 leading-tight font-outfit">{assessorNome}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500/60" />
                            <span className="text-[6px] font-black text-muted-foreground uppercase tracking-widest">Ativo</span>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 scale-125 translate-y-4 transition-none select-none pointer-events-none opacity-80">
                    <Suspense fallback={null}>
                        <SplineRobot />
                    </Suspense>
                </div>
                {/* Overlay for depth - Smoother */}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent z-20" />
            </div>

            <div className="relative z-20 flex-1 flex flex-col">
                {!isChatOpen ? (
                    <CardContent className="space-y-3 pt-4 flex-1 flex flex-col">
                        <div className="p-3.5 rounded-lg bg-muted/10 border border-border/40 backdrop-blur-sm relative overflow-hidden group/insight">
                            <div className="absolute top-0 left-0 w-[1.5px] h-full bg-primary/40" />
                            <div className="flex items-center gap-2 mb-1.5">
                                <Sparkles className="w-3 h-3 text-primary/60" />
                                <span className="text-[8px] font-mono font-bold text-muted-foreground tracking-widest uppercase">{assessorNome}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-foreground/70 font-mono tracking-tight">
                                <span className="text-primary/30 mr-1">{">"}</span>
                                {getPerformanceInsight()}
                            </p>
                        </div>

                        <div className="flex-1 space-y-2">
                            <Button
                                onClick={() => setIsChatOpen(true)}
                                className="w-full bg-metallic hover:opacity-90 text-zinc-900 h-9 font-bold text-[9px] gap-2 tracking-widest uppercase shadow-[0_0_15px_rgba(255,255,255,0.1)] border-none rounded-lg"
                            >
                                <MessageCircle className="w-3.5 h-3.5 opacity-70" />
                                Conversar
                            </Button>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/5 border border-border/20">
                                    <LayoutDashboard className="h-2.5 w-2.5 text-muted-foreground/40" />
                                    <div>
                                        <p className="text-[7px] text-muted-foreground/40 uppercase font-bold tracking-tight">Agente</p>
                                        <p className="text-[9px] font-bold text-foreground/60 uppercase tracking-tighter">Proativo</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/5 border border-border/20">
                                    <Sparkles className="h-2.5 w-2.5 text-muted-foreground/40" />
                                    <div>
                                        <p className="text-[7px] text-muted-foreground/40 uppercase font-bold tracking-tight">Cérebro</p>
                                        <p className="text-[9px] font-bold text-foreground/60 uppercase tracking-tighter">GPT-4o</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                ) : (
                    <CardContent className="flex-1 flex flex-col p-0 h-[280px]">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-950/20">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsChatOpen(false)}
                                className="h-7 px-2 text-[10px] gap-1.5 hover:bg-zinc-200 dark:hover:bg-white/5 text-muted-foreground"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                VOLTAR
                            </Button>
                            <Badge variant="outline" className="text-[8px] border-zinc-200 dark:border-white/10 text-zinc-400 dark:text-white/40">GPT-4O_AGENT</Badge>
                        </div>

                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10">
                            {messages.length === 0 && (
                                <div className="text-center py-10 space-y-2 opacity-50">
                                    <Sparkles className="w-8 h-8 mx-auto text-zinc-300 dark:text-white/20 animate-bounce" />
                                    <p className="text-[10px] font-mono text-zinc-400 dark:text-white/30 uppercase tracking-widest">Olá! Eu sou {assessorNome}, seu assistente virtual. Como posso ajudar com os dados de seu gabinete hoje?</p>
                                </div>
                            )}
                            {messages.map((chat, idx) => (
                                <div key={idx} className={cn(
                                    "flex flex-col gap-1 max-w-[85%]",
                                    chat.role === 'user' ? "ml-auto items-end" : "items-start"
                                )}>
                                    <div className={cn(
                                        "px-3 py-2 rounded-2xl text-[12px] leading-relaxed shadow-sm",
                                        chat.role === 'user'
                                            ? "bg-zinc-900 text-white rounded-tr-none"
                                            : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-300 rounded-tl-none font-sans"
                                    )}>
                                        {chat.content}
                                    </div>
                                </div>
                            ))}
                            {sendingMessage && (
                                <div className="flex items-center gap-2 text-zinc-400 animate-pulse pl-2">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span className="text-[10px] font-mono uppercase tracking-tighter">{assessorNome} processando...</span>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/80 dark:bg-zinc-950/40 backdrop-blur-xl">
                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                                <Input
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={`Perguntar ao ${assessorNome}...`}
                                    disabled={sendingMessage}
                                    className="bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 h-9 text-xs focus-visible:ring-primary/20 pr-10 rounded-full"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    variant="ghost"
                                    disabled={sendingMessage || !messageInput.trim()}
                                    className="absolute right-1 top-1 w-7 h-7 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-primary rounded-full transition-all"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                )}
            </div>
        </Card>
    );
};
