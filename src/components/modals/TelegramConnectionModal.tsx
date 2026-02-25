import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, Send, QrCode, Link as LinkIcon, Hash, Copy, Check, Users, FileText, MessageSquare, Calendar, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TelegramConnectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pairingCode: string;
    botUsername: string;
}

export function TelegramConnectionModal({
    open,
    onOpenChange,
    pairingCode = "LEG-123-456",
    botUsername = "Legisfy_bot"
}: TelegramConnectionModalProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState<'link' | 'code' | null>(null);

    const botLink = `https://t.me/${botUsername}?start=${pairingCode}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(botLink)}`;

    const handleCopy = (text: string, type: 'link' | 'code') => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        toast({
            description: `${type === 'link' ? 'Link' : 'Código'} copiado!`,
        });
        setTimeout(() => setCopied(null), 2000);
    };

    const features = [
        { text: "Cadastre eleitores de forma instantânea", icon: Users },
        { text: "Crie indicações parlamentares por voz ou texto", icon: FileText },
        { text: "Registre demandas e acompanhe status", icon: MessageSquare },
        { text: "Consulte sua agenda e e-mails do gabinete", icon: Calendar },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] border-border/40 bg-white dark:bg-[#020817] p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-[#0088cc]/10 to-transparent p-5 pb-0">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2.5 text-lg font-black font-outfit uppercase tracking-tight text-foreground/90">
                            <div className="p-1.5 rounded-lg bg-[#0088cc]/20 border border-[#0088cc]/30">
                                <Send className="h-4 w-4 text-[#0088cc]" />
                            </div>
                            Conectar Telegram
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="p-5 space-y-6">
                    {/* O que o bot faz */}
                    <div className="space-y-2">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#0088cc]">Funcionalidades do Robô</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                            {features.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-border/5">
                                    <f.icon className="h-3 w-3 text-[#0088cc]/60 shrink-0" />
                                    <span className="text-[9px] font-semibold text-foreground/80 leading-tight">{f.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* QR Code Centralizado e Maior */}
                    <div className="space-y-4 pt-2">
                        <div className="flex flex-col items-center p-6 rounded-3xl border-2 border-dashed border-[#0088cc]/20 bg-[#0088cc]/5 gap-4 group hover:border-[#0088cc]/40 transition-colors">
                            <div className="p-2 rounded-2xl bg-white border border-[#0088cc]/10 shadow-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <img src={qrCodeUrl} alt="QR Code" className="h-40 w-40" />
                            </div>
                            <div className="text-center space-y-1">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0088cc]">Escanear QR Code</span>
                                <p className="text-[10px] text-muted-foreground font-medium">Aponte a câmera para parear instantaneamente</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Botão Abrir Chat */}
                            <Button
                                variant="outline"
                                className="flex flex-col h-auto py-4 rounded-2xl gap-2 border-border/40 hover:border-[#0088cc]/30 hover:bg-[#0088cc]/5 group"
                                onClick={() => window.open(botLink, '_blank')}
                            >
                                <ExternalLink className="h-4 w-4 text-[#0088cc] group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/80">Abrir no Telegram</span>
                            </Button>

                            {/* Código de Pareamento */}
                            <div className="flex flex-col p-4 rounded-2xl border border-border/40 items-center justify-center gap-1.5 bg-muted/5 relative group">
                                <span className="text-[11px] font-black font-outfit tracking-wider text-foreground">{pairingCode}</span>
                                <button
                                    onClick={() => handleCopy(pairingCode, 'code')}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-background border border-border/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    {copied === 'code' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                                </button>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Código de Pareamento</span>
                            </div>
                        </div>
                    </div>

                    <div className="py-2 text-center">
                        <p className="text-[9px] text-muted-foreground font-medium italic opacity-60">
                            Certifique-se de ter o Telegram instalado em seu dispositivo.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
