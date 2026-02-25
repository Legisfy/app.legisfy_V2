import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  FileUp,
  FileCheck,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  Brain,
  Wand2,
  Eye,
  CheckCircle,
  ImageIcon,
  Check,
  FileDown
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";

interface Indicacao {
  id: string;
  titulo: string;
  descricao: string;
  endereco_rua?: string;
  endereco_bairro?: string;
  endereco_cep?: string;
  status: string;
  created_at: string;
  photos?: string[];
  userName?: string;
  justificativa?: string;
}

interface FormalizarIndicacaoModalProps {
  indicacao: Indicacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormalizar: (id: string, pdfUrl?: string) => void;
}

export function FormalizarIndicacaoModal({
  indicacao,
  open,
  onOpenChange,
  onFormalizar
}: FormalizarIndicacaoModalProps) {
  const [uploading, setUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [useAI, setUseAI] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [correctionPrompt, setCorrectionPrompt] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const { toast } = useToast();
  const { cabinet } = useAuthContext();

  // Carregar templates disponíveis
  useEffect(() => {
    const loadTemplates = async () => {
      if (!cabinet?.cabinet_id) return;

      try {
        const { data, error } = await (supabase as any)
          .from('document_templates')
          .select('*')
          .eq('gabinete_id', cabinet.cabinet_id)
          .eq('is_active', true);

        if (error) throw error;
        setTemplates(data || []);

        // Selecionar primeiro template automaticamente se houver
        if (data && data.length > 0) {
          setSelectedTemplate(data[0].id);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };

    if (open) {
      loadTemplates();
      // Reset selected photos when opening
      setSelectedPhotos(indicacao?.photos || []);
    }
  }, [cabinet?.cabinet_id, open, indicacao]);

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
    const fileName = `indicacao-${indicacao?.id}-${Date.now()}.pdf`;
    const filePath = `indicacoes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleGenerateWithAI = async () => {
    if (!indicacao || !selectedTemplate) return;

    try {
      setGenerating(true);

      // Validar dados obrigatórios
      const enderecoCompleto = [
        indicacao.endereco_rua,
        indicacao.endereco_bairro,
        indicacao.endereco_cep
      ].filter(Boolean).join(', ');

      if (!enderecoCompleto) {
        toast({
          title: "Endereço Incompleto",
          description: "Endereço completo obrigatório (Rua, nº, Bairro, Cidade – UF, CEP).",
          variant: "destructive",
        });
        return;
      }

      // Se justificativa for insuficiente, a IA irá gerar uma automaticamente
      let justificativaFinal = indicacao.justificativa || "";

      if (!justificativaFinal || justificativaFinal.length < 100) {
        console.log('Justificativa insuficiente, IA irá gerar automaticamente');
        // A IA no backend irá gerar uma justificativa adequada baseada nos dados da indicação
      }

      console.log('Generating document with AI for template:', selectedTemplate);

      const { data: result, error } = await supabase.functions
        .invoke('generate-document', {
          body: {
            templateId: selectedTemplate,
            gabineteName: cabinet?.cabinet_name,
            indicacaoData: {
              id: indicacao.id,
              titulo: indicacao.titulo,
              justificativa: indicacao.justificativa,
              endereco: enderecoCompleto,
              autor: indicacao.userName || cabinet?.cabinet_name,
              user_id: (await supabase.auth.getUser()).data.user?.id
            },
            photos: selectedPhotos
          }
        });

      if (error) {
        console.error('Document generation error:', error);
        throw new Error('Falha na geração do documento');
      }

      console.log('Document generated successfully:', result);

      // Usar o PDF gerado
      setPdfUrl(result.generatedPdfUrl);
      setHtmlContent(result.htmlContent || "");
      setShowPdfPreview(true);

      toast({
        title: "PDF Gerado!",
        description: `Documento gerado com sucesso. Número: ${result.numeroIndicacao}`,
      });

    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Erro na Geração",
        description: error instanceof Error ? error.message : "Falha ao gerar documento com IA.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateWithCorrection = async () => {
    if (!indicacao || !selectedTemplate || !correctionPrompt.trim()) return;

    try {
      setRegenerating(true);

      const enderecoCompleto = [
        indicacao.endereco_rua,
        indicacao.endereco_bairro,
        indicacao.endereco_cep
      ].filter(Boolean).join(', ');

      console.log('Regenerating document with correction:', correctionPrompt);

      const { data: result, error } = await supabase.functions
        .invoke('generate-document', {
          body: {
            templateId: selectedTemplate,
            gabineteName: cabinet?.cabinet_name,
            correctionPrompt: correctionPrompt,
            indicacaoData: {
              id: indicacao.id,
              titulo: indicacao.titulo,
              justificativa: indicacao.justificativa,
              endereco: enderecoCompleto,
              autor: indicacao.userName || cabinet?.cabinet_name,
              user_id: (await supabase.auth.getUser()).data.user?.id
            },
            photos: selectedPhotos
          }
        });

      if (error) {
        console.error('Document regeneration error:', error);
        throw new Error('Falha na regeneração do documento');
      }

      console.log('Document regenerated successfully:', result);

      // Atualizar com o novo PDF
      setPdfUrl(result.generatedPdfUrl);
      setHtmlContent(result.htmlContent || "");
      setCorrectionPrompt("");

      toast({
        title: "PDF Corrigido!",
        description: "Documento foi regenerado com as correções solicitadas.",
      });

    } catch (error) {
      console.error('Error regenerating document:', error);
      toast({
        title: "Erro na Correção",
        description: error instanceof Error ? error.message : "Falha ao corrigir documento.",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleFormalizar = async () => {
    if (!indicacao) return;

    try {
      setUploading(true);
      let uploadedUrl = pdfUrl;

      if (pdfFile) {
        uploadedUrl = await uploadPdf(pdfFile);
      }

      await onFormalizar(indicacao.id, uploadedUrl);

      toast({
        title: "Indicação formalizada!",
        description: "A indicação foi marcada como formalizada com sucesso.",
      });

      // Reset form
      setPdfFile(null);
      setPdfUrl("");
      setSelectedTemplate("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error formalizing:', error);
      toast({
        title: "Erro ao formalizar",
        description: "Ocorreu um erro ao formalizar a indicação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  if (!indicacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-4 w-4" />
            Formalizar Indicação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo compacto da indicação */}
          <div className="p-3 rounded-lg bg-muted/50 border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{indicacao.titulo}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {indicacao.status}
              </Badge>
            </div>
            {indicacao.justificativa && (
              <p className="text-xs text-muted-foreground line-clamp-2">{indicacao.justificativa}</p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{indicacao.userName || 'N/I'}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(indicacao.created_at)}</span>
            </div>
            {(indicacao.endereco_rua || indicacao.endereco_bairro) && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {[indicacao.endereco_rua, indicacao.endereco_bairro, indicacao.endereco_cep].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Geração Inteligente de PDF (se templates disponíveis) */}
          {templates.length > 0 && (
            <div className="p-3 rounded-lg border border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/10 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Gerar com IA</span>
              </div>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {indicacao.photos && indicacao.photos.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Fotos ({selectedPhotos.length}/{indicacao.photos.length})
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {indicacao.photos.map((photo, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedPhotos(prev =>
                          prev.includes(photo) ? prev.filter(p => p !== photo) : [...prev, photo]
                        )}
                        className={`relative aspect-square rounded overflow-hidden cursor-pointer border-2 transition-all ${selectedPhotos.includes(photo) ? 'border-blue-500 scale-95' : 'border-transparent opacity-60 grayscale'
                          }`}
                      >
                        <img src={photo} alt={`Anexo ${index + 1}`} className="w-full h-full object-cover" />
                        {selectedPhotos.includes(photo) && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white bg-blue-500 rounded-full p-0.5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerateWithAI}
                disabled={generating || !selectedTemplate}
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {generating ? (
                  <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />Gerando PDF...</>
                ) : (
                  <><Brain className="h-3.5 w-3.5 mr-2" />Gerar PDF com IA</>
                )}
              </Button>
              {/* Preview do PDF Gerado */}
              {pdfUrl && (
                <div className="p-3 rounded-lg border border-green-200/50 bg-green-50/30 dark:bg-green-950/10 space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Documento em Formato A4</span>
                  </div>

                  {/* Container que simula papel físico */}
                  <div className="relative border rounded-lg overflow-hidden bg-slate-100 p-6 flex justify-center group">
                    <div className="bg-white shadow-xl w-full max-w-[420px] transition-all duration-300" style={{ aspectRatio: '1/1.414' }}>
                      <iframe
                        srcDoc={htmlContent}
                        src={!htmlContent ? pdfUrl : undefined}
                        className="w-full h-full border-0 pointer-events-none"
                        title="Preview PDF"
                        id="pdf-preview-iframe"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
                        if (iframe && iframe.contentWindow) {
                          iframe.contentWindow.print();
                        }
                      }}
                      className="flex-1 text-xs bg-slate-900 hover:bg-black transition-colors"
                    >
                      <FileDown className="h-3.5 w-3.5 mr-1" />Baixar PDF (A4)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (htmlContent) {
                          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        } else {
                          window.open(pdfUrl, '_blank');
                        }
                      }}
                      className="flex-1 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />Tela Cheia
                    </Button>
                  </div>

                  {/* Refinamento via IA */}
                  <div className="space-y-1.5 pt-2 border-t border-green-200/30">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold px-1">Ajustar Conteúdo</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={correctionPrompt}
                        onChange={(e) => setCorrectionPrompt(e.target.value)}
                        placeholder="Ex: Deixe o texto mais rico e prolixo..."
                        rows={1}
                        className="text-xs resize-none min-h-[40px] flex-1"
                      />
                      <Button
                        onClick={handleRegenerateWithCorrection}
                        disabled={!correctionPrompt.trim() || regenerating}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 h-10 px-3"
                      >
                        {regenerating ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Manual */}
          <div className="space-y-2 border-t pt-4">
            <span className="text-sm font-medium block">{templates.length > 0 ? 'Anexar PDF manualmente (Opcional)' : 'Anexar PDF da indicação'}</span>
            <input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            <Button
              variant="outline"
              onClick={() => document.getElementById('pdf-upload')?.click()}
              className="w-full justify-start h-10 text-sm border-dashed"
              disabled={uploading}
            >
              <FileUp className="h-4 w-4 mr-2 text-muted-foreground" />
              {pdfFile ? pdfFile.name : 'Selecionar arquivo externo'}
            </Button>
            {pdfFile && <p className="text-[10px] text-green-600 font-medium ml-1 flex items-center gap-1"><Check className="h-3 w-3" /> Arquivo pronto para envio</p>}
            {pdfUrl && !pdfFile && <p className="text-[10px] text-blue-600 font-medium ml-1 flex items-center gap-1"><Check className="h-3 w-3" /> Usando versão gerada pela IA</p>}
          </div>

          {/* Ações de Finalização */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="px-6"
              size="sm"
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFormalizar}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
              disabled={uploading || (!pdfFile && !pdfUrl)}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                  Formalizando...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Formalizar agora
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}