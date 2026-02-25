import { useState, useEffect } from "react";
import { FileStack, Upload, X, Wand2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PDFAnalyzer } from "@/utils/pdfAnalyzer";
import { useToast } from "@/hooks/use-toast";

interface ModeloDocumento {
  id: string;
  nome: string;
  tipo: "indicacao" | "oficio" | "projeto-lei" | "mocao";
  template: string;
  textosPadrao: {
    cabecalho: string;
    rodape: string;
    assinatura: string;
  };
  criadoEm: string;
  ativo: boolean;
}

interface ModeloDocumentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelo?: ModeloDocumento | null;
  onSave: (modelo: Omit<ModeloDocumento, "id" | "criadoEm">) => void;
}

export function ModeloDocumentoModal({ 
  open, 
  onOpenChange, 
  modelo, 
  onSave 
}: ModeloDocumentoModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "indicacao" as "indicacao" | "oficio" | "projeto-lei" | "mocao",
    template: "",
    textosPadrao: {
      cabecalho: "",
      rodape: "",
      assinatura: ""
    },
    ativo: true
  });

  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [analisandoPDF, setAnalisandoPDF] = useState(false);
  const [pdfAnalisado, setPdfAnalisado] = useState(false);

  useEffect(() => {
    if (modelo) {
      setFormData({
        nome: modelo.nome,
        tipo: modelo.tipo,
        template: modelo.template,
        textosPadrao: modelo.textosPadrao,
        ativo: modelo.ativo
      });
    } else {
      setFormData({
        nome: "",
        tipo: "indicacao",
        template: "",
        textosPadrao: {
          cabecalho: "",
          rodape: "",
          assinatura: ""
        },
        ativo: true
      });
    }
    setTemplateFile(null);
    setPdfAnalisado(false);
  }, [modelo, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTemplateFile(file);
      
      // Se for PDF, oferecer análise automática
      if (file.type === 'application/pdf') {
        toast({
          title: "PDF detectado",
          description: "Você pode analisar automaticamente este PDF para extrair textos padrão.",
        });
      } else {
        // Para imagens, apenas converter para base64
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({
            ...prev,
            template: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAnalisarPDF = async () => {
    if (!templateFile || templateFile.type !== 'application/pdf') return;
    
    setAnalisandoPDF(true);
    try {
      const resultado = await PDFAnalyzer.analisarPDF(templateFile);
      
      setFormData(prev => ({
        ...prev,
        nome: resultado.nome,
        tipo: resultado.tipo,
        template: resultado.template,
        textosPadrao: resultado.textosPadrao
      }));
      
      setPdfAnalisado(true);
      toast({
        title: "PDF analisado com sucesso!",
        description: "Textos padrão e template foram extraídos automaticamente. Você pode revisar e ajustar conforme necessário.",
      });
    } catch (error) {
      toast({
        title: "Erro ao analisar PDF",
        description: error instanceof Error ? error.message : "Erro desconhecido ao processar o arquivo.",
        variant: "destructive"
      });
    } finally {
      setAnalisandoPDF(false);
    }
  };

  const tipoOptions = [
    { value: "indicacao", label: "Indicação" },
    { value: "oficio", label: "Ofício" },
    { value: "projeto-lei", label: "Projeto de Lei" },
    { value: "mocao", label: "Moção" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileStack className="h-5 w-5 text-primary" />
            {modelo ? "Editar Modelo" : "Novo Modelo"} de Documento
          </DialogTitle>
          <DialogDescription>
            Configure o modelo de documento para geração automática de PDFs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Modelo*</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Modelo Oficial Indicação"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Documento*</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipoOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">Template/Papel Timbrado</TabsTrigger>
              <TabsTrigger value="textos">Textos Padrão</TabsTrigger>
            </TabsList>
            
            <TabsContent value="template" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload do Template (Papel Timbrado)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    {templateFile || formData.template ? (
                      <div className="text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <FileStack className="h-6 w-6 text-primary" />
                          <span className="font-medium">
                            {templateFile?.name || "Template carregado"}
                          </span>
                        </div>
                        
                        {templateFile?.type === 'application/pdf' && !pdfAnalisado && (
                          <div className="space-y-2">
                            <Alert>
                              <Wand2 className="h-4 w-4" />
                              <AlertDescription>
                                Detectamos um PDF! Clique em "Analisar PDF" para extrair automaticamente os textos padrão e o layout.
                              </AlertDescription>
                            </Alert>
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={handleAnalisarPDF}
                              disabled={analisandoPDF}
                              className="w-full bg-info hover:bg-info/90 text-info-foreground"
                            >
                              <Wand2 className="h-4 w-4 mr-2" />
                              {analisandoPDF ? "Analisando PDF..." : "Analisar PDF Automaticamente"}
                            </Button>
                          </div>
                        )}
                        
                        {pdfAnalisado && (
                          <Alert className="bg-success/10 border-success/20">
                            <AlertCircle className="h-4 w-4 text-success" />
                            <AlertDescription className="text-success-foreground">
                              PDF analisado com sucesso! Textos padrão extraídos automaticamente.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTemplateFile(null);
                            setFormData(prev => ({ ...prev, template: "" }));
                            setPdfAnalisado(false);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Faça upload do papel timbrado (PDF, PNG, JPG)
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          💡 <strong>Dica:</strong> Envie um PDF de indicação pronta para análise automática!
                        </p>
                        <Label htmlFor="template-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>Selecionar Arquivo</span>
                          </Button>
                        </Label>
                        <Input
                          id="template-upload"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O template será usado como fundo para todos os documentos deste tipo.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="textos" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cabecalho">Texto do Cabeçalho</Label>
                  <Input
                    id="cabecalho"
                    value={formData.textosPadrao.cabecalho}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      textosPadrao: { ...prev.textosPadrao, cabecalho: e.target.value }
                    }))}
                    placeholder="Ex: INDICAÇÃO Nº XXX/2024"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use XXX para numeração automática
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rodape">Texto do Rodapé</Label>
                  <Input
                    id="rodape"
                    value={formData.textosPadrao.rodape}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      textosPadrao: { ...prev.textosPadrao, rodape: e.target.value }
                    }))}
                    placeholder="Ex: Gabinete do Vereador João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assinatura">Bloco de Assinatura</Label>
                  <Textarea
                    id="assinatura"
                    value={formData.textosPadrao.assinatura}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      textosPadrao: { ...prev.textosPadrao, assinatura: e.target.value }
                    }))}
                    placeholder="Ex: João Silva&#10;Vereador"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
            <Label htmlFor="ativo">Modelo ativo</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {modelo ? "Salvar Alterações" : "Criar Modelo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}