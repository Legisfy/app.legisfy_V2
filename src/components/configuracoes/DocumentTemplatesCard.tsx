import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload, Eye, Trash2, CheckCircle, AlertCircle, Loader2, Brain, Wand2, FileSearch, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  original_pdf_url: string;
  template_analysis: any;
  is_active: boolean;
  header_style?: string;
  footer_style?: string;
  signature_style?: string;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
}

// Context is now a free-text field describing where the template will be used

export const DocumentTemplatesCard = () => {
  const { toast } = useToast();
  const { cabinet } = useAuthContext();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    context: '',
    header_style: 'minimal',
    footer_style: 'minimal',
    signature_style: 'cursive',
    primary_color: '#1e3a8a',
    secondary_color: '#f97316',
    file: null as File | null
  });

  useEffect(() => {
    if (cabinet?.cabinet_id) {
      loadTemplates();
    }
  }, [cabinet?.cabinet_id]);

  const loadTemplates = async () => {
    if (!cabinet?.cabinet_id) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('document_templates')
        .select('*')
        .eq('gabinete_id', cabinet.cabinet_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates((data as DocumentTemplate[]) || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast({ title: "Erro", description: "Apenas arquivos PDF são aceitos.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Erro", description: "O arquivo deve ter no máximo 10MB.", variant: "destructive" });
      return;
    }
    setFormData(prev => ({ ...prev, file }));
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.context || !formData.file || !cabinet?.cabinet_id) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    try {
      // Sanitize filename: remove accents, spaces, and special chars
      const sanitizedName = formData.file.name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/\s+/g, '_') // spaces to underscores
        .replace(/[^a-zA-Z0-9._-]/g, ''); // remove special chars
      const fileName = `templates/${cabinet.cabinet_id}/${Date.now()}-${sanitizedName}`;

      console.log('Uploading file:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads').upload(fileName, formData.file, { upsert: true });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      const pdfUrl = supabase.storage.from('uploads').getPublicUrl(uploadData.path).data.publicUrl;
      console.log('PDF URL:', pdfUrl);

      console.log('Inserting template...');
      const { error: insertError } = await (supabase as any)
        .from('document_templates')
        .insert({
          gabinete_id: cabinet.cabinet_id,
          name: formData.name,
          type: formData.context,
          original_pdf_url: pdfUrl,
          template_analysis: null,
          is_active: true,
          header_style: formData.header_style,
          footer_style: formData.footer_style,
          signature_style: formData.signature_style,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Erro ao salvar: ${insertError.message}`);
      }

      toast({ title: "Sucesso!", description: "Modelo salvo com sucesso." });
      setFormData({
        name: '',
        context: '',
        header_style: 'minimal',
        footer_style: 'minimal',
        signature_style: 'cursive',
        primary_color: '#1e3a8a',
        secondary_color: '#f97316',
        file: null
      });
      setUploadModalOpen(false);
      loadTemplates();
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({ title: "Erro", description: error?.message || "Falha ao processar o modelo.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await (supabase as any).from('document_templates').delete().eq('id', templateId);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Modelo removido." });
      loadTemplates();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível remover o modelo.", variant: "destructive" });
    }
  };

  const getTypeLabel = (type: string) => {
    // Show first ~30 chars of context as label
    return type.length > 30 ? type.slice(0, 30) + '...' : type;
  };

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Documentos</span>
          </div>
          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-semibold rounded-md px-2.5">
                <Upload className="w-3 h-3 mr-1.5" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl border shadow-xl p-0 overflow-hidden">
              <div className="flex flex-col md:flex-row h-full">
                {/* Coluna Esquerda: Formulário */}
                <div className="flex-1 p-6 space-y-4 border-r border-border/50 bg-card">
                  <DialogHeader className="space-y-1">
                    <DialogTitle className="text-base flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Novo Papel Timbrado
                    </DialogTitle>
                    <DialogDescription className="text-[11px] leading-tight text-muted-foreground">
                      Suba um PDF para treino da IA e escolha o design.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <Label htmlFor="template-name" className="text-[10px] font-bold uppercase text-muted-foreground">Nome do Modelo</Label>
                      <Input
                        id="template-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Oficial 2025"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Onde vamos usar?</Label>
                      <Textarea
                        value={formData.context}
                        onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                        placeholder="Ex: Indicações legislativas"
                        rows={2}
                        className="text-xs resize-none min-h-[50px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                        <Wand2 className="h-3 w-3" /> Escolha o Design (A4)
                      </Label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { id: 'brandino', name: 'Brandino', icon: '🎨' },
                          { id: 'classic', name: 'Clássico', icon: '🏛️' },
                          { id: 'modern', name: 'Moderno', icon: '✨' },
                          { id: 'republic', name: 'Brasília', icon: '⚖️' },
                          { id: 'executive', name: 'Executivo', icon: '👔' }
                        ].map((style) => (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, header_style: style.id }))}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border-2 transition-all duration-200 ${formData.header_style === style.id
                                ? 'border-primary bg-primary/5 shadow-sm scale-105'
                                : 'border-border/50 hover:border-primary/20 bg-card'
                              }`}
                          >
                            <span className="text-base mb-0.5">{style.icon}</span>
                            <span className="text-[8px] font-bold leading-none">{style.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 text-center">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Cor Primária</Label>
                        <div className="flex items-center justify-center gap-2 mt-0.5">
                          <Input
                            type="color"
                            value={formData.primary_color}
                            onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                            className="w-6 h-6 p-0 border border-border rounded-md cursor-pointer"
                          />
                          <span className="text-[10px] font-mono">{formData.primary_color}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-center">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Cor Secundária</Label>
                        <div className="flex items-center justify-center gap-2 mt-0.5">
                          <Input
                            type="color"
                            value={formData.secondary_color}
                            onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                            className="w-6 h-6 p-0 border border-border rounded-md cursor-pointer"
                          />
                          <span className="text-[10px] font-mono">{formData.secondary_color}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">PDF de Referência (Treino IA)</Label>
                      <div className={`relative border border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${formData.file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/20'}`}>
                        <Input
                          id="pdf-file" type="file" accept=".pdf"
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center justify-center gap-2">
                          <Upload className="h-3 w-3 text-muted-foreground" />
                          <p className="text-[11px] font-medium">{formData.file ? formData.file.name : 'Selecionar Arquivo'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-4 border-t border-border/50 gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setUploadModalOpen(false)} disabled={analyzing} className="h-8 text-[11px]">
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateTemplate}
                      disabled={!formData.name || !formData.context || !formData.file || analyzing}
                      className="h-8 text-[11px]"
                    >
                      {analyzing ? (
                        <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Treinando...</>
                      ) : (
                        <><CheckCircle className="w-3 h-3 mr-1.5" />Salvar Modelo</>
                      )}
                    </Button>
                  </DialogFooter>
                </div>

                {/* Coluna Direita: Preview Visual */}
                <div className="hidden md:flex w-[340px] bg-muted/20 flex-col items-center justify-center p-6 border-l border-border/50">
                  <div className="w-full text-center space-y-2 mb-4">
                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-background/50">Preview Digital</Badge>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-widest">Aparência da Folha A4</h4>
                  </div>

                  <div className="relative w-full aspect-[1/1.414] bg-white shadow-2xl rounded-sm border border-border/80 overflow-hidden transform scale-95 transition-all duration-500 hover:scale-100">
                    {/* Simulação do Cabeçalho */}
                    {formData.header_style === 'brandino' && (
                      <div className="absolute top-0 left-0 w-full h-[20%] overflow-hidden">
                        <div className="absolute top-0 left-0 w-[40px] h-[40px]" style={{ backgroundColor: formData.primary_color, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
                        <div className="absolute top-0 right-0 w-[120px] h-[100px]" style={{ backgroundColor: formData.secondary_color, clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                        <div className="absolute top-0 right-[20px] w-[50px] h-[40px] bg-emerald-500" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                      </div>
                    )}

                    {formData.header_style === 'classic' && (
                      <div className="absolute top-[25px] w-full flex items-center justify-center px-4">
                        <div className="flex-1 h-[0.5px]" style={{ backgroundColor: formData.primary_color }}></div>
                        <div className="mx-2 w-4 h-4 rounded-full border border-primary/30 flex items-center justify-center text-[5px]">LOGO</div>
                        <div className="flex-1 h-[0.5px]" style={{ backgroundColor: formData.primary_color }}></div>
                      </div>
                    )}

                    {formData.header_style === 'modern' && (
                      <div className="absolute top-0 w-full">
                        <div className="w-full h-[3px]" style={{ backgroundColor: formData.primary_color }}></div>
                        <div className="w-[30%] h-[1.5px] mt-0.5" style={{ backgroundColor: formData.secondary_color }}></div>
                      </div>
                    )}

                    {formData.header_style === 'republic' && (
                      <div className="absolute top-0 w-full h-[40px] flex items-center justify-center" style={{ backgroundColor: formData.primary_color }}>
                        <div className="text-[6px] font-bold text-white tracking-[0.2em] uppercase">Legislativo</div>
                      </div>
                    )}

                    {formData.header_style === 'executive' && (
                      <div className="absolute left-0 top-0 h-full w-[20px] flex">
                        <div className="h-full w-[80%]" style={{ backgroundColor: formData.primary_color }}></div>
                        <div className="h-full w-[20%]" style={{ backgroundColor: formData.secondary_color }}></div>
                      </div>
                    )}

                    {/* Conteúdo Placeholder */}
                    <div className="p-4 mt-[60px] space-y-2 opacity-20">
                      <div className="h-[2px] w-[40%] bg-foreground mx-auto mb-4"></div>
                      <div className="h-[1px] w-full bg-muted-foreground"></div>
                      <div className="h-[1px] w-[90%] bg-muted-foreground"></div>
                      <div className="h-[1px] w-full bg-muted-foreground"></div>
                      <div className="h-[1px] w-[60%] bg-muted-foreground"></div>

                      <div className="pt-4 h-[1px] w-[30%] bg-foreground mx-auto font-bold underline"></div>

                      <div className="pt-2 h-[1px] w-full bg-muted-foreground"></div>
                      <div className="h-[1px] w-full bg-muted-foreground"></div>
                      <div className="h-[1px] w-[80%] bg-muted-foreground"></div>

                      <div className="pt-10 text-center flex flex-col items-center">
                        <div className="h-4 w-[60%] mb-1" style={{ color: formData.primary_color, fontFamily: 'serif', fontStyle: 'italic', fontSize: '8px' }}>Assinatura</div>
                        <div className="h-[0.2px] w-[80%] bg-foreground"></div>
                        <div className="h-[1px] w-[40%] bg-foreground mt-1"></div>
                      </div>
                    </div>

                    {/* Rodapé */}
                    <div className="absolute bottom-3 left-0 w-full px-4 flex justify-between items-end opacity-30">
                      <div className="space-y-1">
                        <div className="h-[1.5px] w-[40px] bg-muted-foreground"></div>
                        <div className="h-[1.5px] w-[30px] bg-muted-foreground"></div>
                      </div>
                      <div className="w-3 h-3 bg-muted-foreground/20 rounded"></div>
                    </div>
                  </div>

                  <p className="mt-3 text-[9px] text-muted-foreground text-center leading-tight">
                    Padrão Profissional A4.<br />
                    O conteúdo será gerado em alta definição.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 px-3 bg-muted/30 rounded-lg border border-dashed border-border">
            <FileSearch className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs font-semibold text-foreground mb-1">Nenhum modelo ativo</p>
            <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
              Suba seu papel timbrado para formalizar documentos automaticamente.
            </p>
            <Button onClick={() => setUploadModalOpen(true)} variant="outline" size="sm" className="h-7 text-[10px] font-semibold rounded-md">
              <Plus className="w-3 h-3 mr-1.5" />
              Criar Modelo
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{template.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{getTypeLabel(template.type)}</Badge>
                        {template.is_active ? (
                          <span className="text-[9px] font-medium text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" /> Ativo
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-amber-600 flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" /> Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => window.open(template.original_pdf_url, '_blank')}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                      onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};