import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  FileUp,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  Download,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Indicacao {
  id: string;
  titulo: string;
  descricao: string;
  endereco_rua?: string;
  endereco_bairro?: string;
  endereco_cep?: string;
  status: string;
  created_at: string;
  userName?: string;
  justificativa?: string;
}

interface ProtocolarIndicacaoModalProps {
  indicacao: Indicacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProtocolar: (id: string, protocolo: string, pdfUrl?: string) => void;
}

export function ProtocolarIndicacaoModal({
  indicacao,
  open,
  onOpenChange,
  onProtocolar
}: ProtocolarIndicacaoModalProps) {
  const [uploading, setUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [protocolo, setProtocolo] = useState("");
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>("");
  const { toast } = useToast();

  // Buscar PDF atual da indicação formalizada
  useEffect(() => {
    if (indicacao && open) {
      fetchCurrentPdf();
    }
  }, [indicacao, open]);

  const fetchCurrentPdf = async () => {
    if (!indicacao) return;

    try {
      const { data, error } = await supabase
        .from('indicacao_status_events')
        .select('pdf_url')
        .eq('indicacao_id', indicacao.id)
        .eq('status', 'formalizada')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && data[0].pdf_url) {
        setCurrentPdfUrl(data[0].pdf_url);
      }
    } catch (error) {
      console.error('Error fetching current PDF:', error);
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
    const fileName = `indicacao-protocolada-${indicacao?.id}-${Date.now()}.pdf`;
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

  const handleProtocolar = async () => {
    if (!indicacao || !protocolo.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, informe o número do protocolo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      let uploadedUrl = "";

      if (pdfFile) {
        uploadedUrl = await uploadPdf(pdfFile);
      }

      await onProtocolar(indicacao.id, protocolo.trim(), uploadedUrl);

      toast({
        title: "Indicação Protocolada!",
        description: "A indicação foi protocolada e enviada ao executivo com sucesso.",
      });

      // Reset form
      setPdfFile(null);
      setProtocolo("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error protocoling:', error);
      toast({
        title: "Erro ao protocolar",
        description: "Ocorreu um erro ao protocolar a indicação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadCurrentPdf = () => {
    if (currentPdfUrl) {
      window.open(currentPdfUrl, '_blank');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Protocolando a Indicação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Indicação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Informações da Indicação
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {indicacao.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Título</Label>
                <p className="font-medium">{indicacao.titulo}</p>
              </div>


              {indicacao.justificativa && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Justificativa</Label>
                  <p className="text-sm">{indicacao.justificativa}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Autor
                  </Label>
                  <p className="text-sm">{indicacao.userName || 'Usuário não identificado'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data de Criação
                  </Label>
                  <p className="text-sm">{formatDate(indicacao.created_at)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Endereço
                </Label>
                <p className="text-sm">
                  {[indicacao.endereco_rua, indicacao.endereco_bairro, indicacao.endereco_cep]
                    .filter(Boolean)
                    .join(', ') || 'Não informado'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* PDF Atual */}
          {currentPdfUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PDF Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">PDF da Indicação Formalizada</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCurrentPdf}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Texto Informativo */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    👉 Instruções para Protocolar
                  </p>
                  <p className="text-sm text-amber-700">
                    Baixe o PDF da indicação, anexe-o no portal da Câmara e conclua o protocolo. Depois, faça o upload do PDF gerado pela Câmara e informe o número do protocolo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Protocolo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Protocolo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="protocolo" className="text-sm font-medium">
                  Número do Protocolo *
                </Label>
                <Input
                  id="protocolo"
                  placeholder="Ex: 2024/001234"
                  value={protocolo}
                  onChange={(e) => setProtocolo(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pdf-upload" className="text-sm font-medium">
                  PDF gerado pela Câmara (opcional)
                </Label>
                <div className="mt-2">
                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('pdf-upload')?.click()}
                    className="w-full justify-start"
                    disabled={uploading}
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    {pdfFile ? pdfFile.name : 'Selecionar PDF da Câmara'}
                  </Button>
                </div>
                {pdfFile && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Arquivo selecionado: {pdfFile.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Anexe o PDF retornado pela câmara com o protocolo oficial
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProtocolar}
              className="flex-1"
              disabled={uploading || !protocolo.trim()}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Protocolando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Marcar como Protocolada
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}