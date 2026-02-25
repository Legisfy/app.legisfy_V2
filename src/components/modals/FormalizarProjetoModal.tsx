import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileCheck, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Projeto {
    id: string;
    titulo: string;
}

interface FormalizarProjetoModalProps {
    projeto: Projeto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (id: string, pdfUrl: string, comment: string) => Promise<void>;
}

export function FormalizarProjetoModal({
    projeto,
    open,
    onOpenChange,
    onSuccess
}: FormalizarProjetoModalProps) {
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [comment, setComment] = useState("");
    const { toast } = useToast();

    const handleFormalizar = async () => {
        if (!projeto || !selectedFile || !comment.trim()) {
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, anexe o PDF e adicione um comentário.",
                variant: "destructive"
            });
            return;
        }

        try {
            setUploading(true);

            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${projeto.id}/${Math.random()}.${fileExt}`;
            const filePath = `projetos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('projeto_pdfs')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('projeto_pdfs')
                .getPublicUrl(filePath);

            await onSuccess(projeto.id, publicUrl, comment);

            setComment("");
            setSelectedFile(null);
            onOpenChange(false);

            toast({
                title: "Projeto Formalizado",
                description: "O projeto foi marcado como formalizado com sucesso."
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao formalizar",
                description: error.message || "Ocorreu um erro no upload do arquivo.",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    if (!projeto) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-indigo-500" />
                        Formalizar Projeto
                    </DialogTitle>
                    <DialogDescription>
                        Anexe o documento PDF oficial para marcar o projeto "{projeto.titulo}" como formalizado.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="pdf-upload" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Documento PDF (Obrigatório)
                        </Label>
                        <div className="flex flex-col gap-2">
                            <Input
                                id="pdf-upload"
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="cursor-pointer"
                            />
                            {selectedFile && (
                                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 p-2 rounded-md">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Arquivo selecionado: {selectedFile.name}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Comentário da Formalização
                        </Label>
                        <Textarea
                            id="comment"
                            placeholder="Descreva o ato da formalização..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                            <strong>Atenção:</strong> Ao formalizar o projeto, ele avançará no fluxo e o documento anexado ficará disponível para consulta vitalícia no histórico.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleFormalizar}
                        disabled={uploading || !selectedFile || !comment.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <Upload className="h-3.5 w-3.5 mr-2" />
                                Confirmar Formalização
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
