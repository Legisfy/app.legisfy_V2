import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Send,
    FileUp,
    User,
    Calendar,
    AlertCircle,
    Download,
    FileText,
    CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Projeto {
    id: string;
    titulo: string;
    status: string;
    created_at: string;
    user_name?: string;
}

interface ProtocolarProjetoModalProps {
    projeto: Projeto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (id: string, protocolo: string, pdfUrl: string) => Promise<void>;
}

export function ProtocolarProjetoModal({
    projeto,
    open,
    onOpenChange,
    onSuccess
}: ProtocolarProjetoModalProps) {
    const [uploading, setUploading] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [protocolo, setProtocolo] = useState("");
    const [formalizadoPdfUrl, setFormalizadoPdfUrl] = useState<string>("");
    const { toast } = useToast();

    // Buscar PDF da fase de formalização
    useEffect(() => {
        if (projeto && open) {
            fetchFormalizadoPdf();
        }
    }, [projeto, open]);

    const fetchFormalizadoPdf = async () => {
        if (!projeto) return;

        try {
            const { data, error } = await (supabase as any)
                .from('projeto_lei_status_events')
                .select('pdf_url')
                .eq('projeto_id', projeto.id)
                .eq('status', 'formalizado')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0 && data[0].pdf_url) {
                setFormalizadoPdfUrl(data[0].pdf_url);
            }
        } catch (error) {
            console.error('Erro ao buscar PDF formalizado:', error);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type === 'application/pdf') {
                setPdfFile(file);
            } else {
                toast({
                    title: "Formato inválido",
                    description: "Por favor, selecione apenas arquivos PDF.",
                    variant: "destructive",
                });
            }
        }
    };

    const uploadPdf = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projeto?.id}/protocolo-${Math.random()}.${fileExt}`;
        const filePath = `projetos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('projeto_pdfs')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('projeto_pdfs')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleProtocolar = async () => {
        if (!projeto || !protocolo.trim() || !pdfFile) {
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, informe o número do protocolo e anexe o PDF comprovante.",
                variant: "destructive",
            });
            return;
        }

        try {
            setUploading(true);
            const uploadedUrl = await uploadPdf(pdfFile);

            await onSuccess(projeto.id, protocolo.trim(), uploadedUrl);

            setPdfFile(null);
            setProtocolo("");
            onOpenChange(false);

            toast({
                title: "Projeto Protocolado!",
                description: "O projeto foi protocolado com sucesso.",
            });
        } catch (error: any) {
            console.error('Erro ao protocolar:', error);
            toast({
                title: "Erro ao protocolar",
                description: error.message || "Ocorreu um erro no upload do arquivo.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    if (!projeto) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-orange-500" />
                        Protocolar Projeto de Lei
                    </DialogTitle>
                    <DialogDescription>
                        Informe os dados do protocolo realizado na Câmara para o projeto "{projeto.titulo}".
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Card de Informações */}
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resumo do Projeto</span>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold bg-background">
                                {projeto.status}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">{projeto.titulo}</p>
                            <div className="flex gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    {projeto.user_name || "Autor"}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(projeto.created_at).toLocaleDateString("pt-BR")}
                                </div>
                            </div>
                        </div>

                        {formalizadoPdfUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-[10px] gap-2 rounded-lg border-primary/20 hover:bg-primary/5 text-primary"
                                onClick={() => window.open(formalizadoPdfUrl, '_blank')}
                            >
                                <Download className="h-3.5 w-3.5" />
                                Baixar PDF do Projeto Formalizado
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="protocolo" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Número do Protocolo *
                            </Label>
                            <Input
                                id="protocolo"
                                placeholder="Ex: 2026/000123"
                                value={protocolo}
                                onChange={(e) => setProtocolo(e.target.value)}
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Comprovante de Protocolo (PDF) *
                            </Label>
                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <input
                                        id="pdf-upload-proto"
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => document.getElementById('pdf-upload-proto')?.click()}
                                        className="w-full h-10 justify-start gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                                    >
                                        <FileUp className="h-4 w-4 text-muted-foreground" />
                                        {pdfFile ? (
                                            <span className="text-xs font-medium text-emerald-600 truncate">
                                                {pdfFile.name}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Selecionar comprovante em PDF</span>
                                        )}
                                    </Button>
                                </div>
                                {pdfFile && (
                                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Arquivo pronto para envio
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-orange-800 leading-relaxed">
                            <strong>Importante:</strong> Ao protocolar, o status do projeto mudará para "Protocolado" e os documentos ficarão disponíveis para consulta no histórico.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleProtocolar}
                        disabled={uploading || !pdfFile || !protocolo.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/10 min-w-[140px]"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="h-3.5 w-3.5 mr-2" />
                                Marcar Protocolado
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
