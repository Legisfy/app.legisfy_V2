import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, Edit, Upload, Eye, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";

interface Documento {
  id: string;
  nome: string;
  tipo: 'indicacao' | 'demanda' | 'oficio' | 'relatorio';
  conteudo: string;
  criadoEm: Date;
  pdfUrl?: string;
  templateAnalysis?: any;
}

export function DocumentosModal({ children }: { children: React.ReactNode }) {
  const { cabinet } = useAuthContext();
  
  const [documentos, setDocumentos] = useState<Documento[]>([
    {
      id: '1',
      nome: 'Modelo de Indicação Padrão',
      tipo: 'indicacao',
      conteudo: `INDICAÇÃO Nº {NUMERO_PROTOCOLO}

{NOME_GABINETE}

Senhor Presidente,

Por meio desta, venho respeitosamente submeter à apreciação desta Casa a seguinte indicação:

ASSUNTO: {TITULO_INDICACAO}

JUSTIFICATIVA:
{JUSTIFICATIVA}

DESCRIÇÃO:
{DESCRICAO_INDICACAO}

LOCAL: {LOCAL_INDICACAO}

Considerando a importância da matéria para nossa comunidade, solicito que seja encaminhada ao Poder Executivo Municipal para as providências cabíveis.

{CIDADE}, {DATA}

_________________________________
{NOME_VEREADOR}
Vereador`,
      criadoEm: new Date()
    }
  ]);

  const [novoDocumento, setNovoDocumento] = useState<{
    nome: string;
    tipo: 'indicacao' | 'demanda' | 'oficio' | 'relatorio';
    conteudo: string;
    pdfFile?: File;
    pdfUrl?: string;
    templateAnalysis?: any;
  }>({
    nome: '',
    tipo: 'indicacao',
    conteudo: ''
  });

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const tiposDocumento = [
    { value: 'indicacao', label: 'Indicação' },
    { value: 'demanda', label: 'Demanda' },
    { value: 'oficio', label: 'Ofício' },
    { value: 'relatorio', label: 'Relatório' }
  ];

  const camposDisponiveis = {
    indicacao: [
      '{NUMERO_PROTOCOLO}', '{NOME_GABINETE}', '{TITULO_INDICACAO}',
      '{JUSTIFICATIVA}', '{DESCRICAO_INDICACAO}', '{LOCAL_INDICACAO}',
      '{CIDADE}', '{DATA}', '{NOME_VEREADOR}'
    ],
    demanda: [
      '{TITULO_DEMANDA}', '{DESCRICAO_DEMANDA}', '{ELEITOR_NOME}',
      '{ELEITOR_TELEFONE}', '{DATA_ABERTURA}', '{PRIORIDADE}', '{STATUS}'
    ],
    oficio: [
      '{NUMERO_OFICIO}', '{DESTINATARIO}', '{CARGO_DESTINATARIO}',
      '{ASSUNTO}', '{CORPO_TEXTO}', '{DATA}', '{NOME_VEREADOR}'
    ],
    relatorio: [
      '{PERIODO}', '{TOTAL_ELEITORES}', '{TOTAL_DEMANDAS}',
      '{TOTAL_INDICACOES}', '{TOTAL_IDEIAS}', '{DATA_RELATORIO}'
    ]
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são aceitos');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB');
      return;
    }

    setUploading(true);
    try {
      // Upload do PDF
      const fileName = `template-${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const pdfUrl = supabase.storage.from('uploads').getPublicUrl(uploadData.path).data.publicUrl;

      // Analisar PDF com IA
      setAnalyzing(true);
      const { data: analysisResult, error: analysisError } = await supabase.functions
        .invoke('analyze-pdf-template', {
          body: {
            pdfUrl,
            templateType: novoDocumento.tipo,
            gabineteName: cabinet?.cabinet_name || 'Gabinete'
          }
        });

      if (analysisError) {
        console.error('PDF analysis error:', analysisError);
        toast.error('Erro na análise do PDF. Continuando sem análise automática.');
      }

      setNovoDocumento({
        ...novoDocumento,
        pdfFile: file,
        pdfUrl,
        templateAnalysis: analysisResult?.analysis
      });

      setPreviewUrl(pdfUrl);

      toast.success('PDF anexado e analisado com sucesso!');

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload do PDF');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const adicionarDocumento = async () => {
    if (!novoDocumento.nome) {
      toast.error('Preencha o nome do documento');
      return;
    }

    if (!novoDocumento.pdfUrl) {
      toast.error('Anexe um PDF para criar o template');
      return;
    }

    if (!cabinet) {
      toast.error('Gabinete não encontrado');
      return;
    }

    try {
      // Salvar no banco de dados
      const { data, error } = await supabase
        .from('document_templates')
        .insert({
          name: novoDocumento.nome,
          type: novoDocumento.tipo,
          gabinete_id: cabinet.cabinet_id,
          original_pdf_url: novoDocumento.pdfUrl || '',
          template_analysis: novoDocumento.templateAnalysis,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      const documento: Documento = {
        id: data.id,
        nome: novoDocumento.nome,
        tipo: novoDocumento.tipo,
        conteudo: novoDocumento.conteudo,
        criadoEm: new Date(),
        pdfUrl: novoDocumento.pdfUrl,
        templateAnalysis: novoDocumento.templateAnalysis
      };

      setDocumentos([...documentos, documento]);
      setNovoDocumento({ nome: '', tipo: 'indicacao', conteudo: '' });
      setPreviewUrl('');
      toast.success('Template salvo com sucesso!');

    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const removerDocumento = (id: string) => {
    setDocumentos(documentos.filter(d => d.id !== id));
    toast.success('Documento removido com sucesso!');
  };

  const iniciarEdicao = (documento: Documento) => {
    setEditandoId(documento.id);
    setNovoDocumento({
      nome: documento.nome,
      tipo: documento.tipo,
      conteudo: documento.conteudo
    });
  };

  const salvarEdicao = () => {
    if (!editandoId) return;

    setDocumentos(documentos.map(doc => 
      doc.id === editandoId 
        ? { ...doc, nome: novoDocumento.nome, tipo: novoDocumento.tipo, conteudo: novoDocumento.conteudo }
        : doc
    ));
    
    setEditandoId(null);
    setNovoDocumento({ nome: '', tipo: 'indicacao', conteudo: '' });
    toast.success('Documento atualizado com sucesso!');
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setNovoDocumento({ nome: '', tipo: 'indicacao', conteudo: '' });
    setPreviewUrl('');
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'indicacao': return 'bg-blue-100 text-blue-800';
      case 'demanda': return 'bg-green-100 text-green-800';
      case 'oficio': return 'bg-purple-100 text-purple-800';
      case 'relatorio': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            Templates de Documentos
          </DialogTitle>
          <DialogDescription>
            Anexe PDFs modelo e a IA identificará automaticamente os campos padrão e dinâmicos
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {editandoId ? 'Editar Documento' : 'Novo Documento'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-documento">Nome do Documento</Label>
                <Input
                  id="nome-documento"
                  value={novoDocumento.nome}
                  onChange={(e) => setNovoDocumento({...novoDocumento, nome: e.target.value})}
                  placeholder="Ex: Modelo de Indicação Padrão"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo-documento">Tipo de Documento</Label>
                <select
                  id="tipo-documento"
                  className="w-full p-2 border rounded-md"
                  value={novoDocumento.tipo}
                  onChange={(e) => setNovoDocumento({...novoDocumento, tipo: e.target.value as any})}
                >
                  {tiposDocumento.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload de PDF */}
              <div className="space-y-2">
                <Label>Modelo PDF (Recomendado)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="pdf-upload" className="cursor-pointer">
                       <span className="mt-2 block text-sm font-medium text-gray-900">
                          Anexar PDF modelo
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          A IA analisará automaticamente e identificará dados padrão vs dinâmicos
                        </span>
                      </label>
                      <input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading || analyzing}
                      />
                    </div>
                    {uploading && (
                      <div className="mt-2 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-gray-600">Fazendo upload...</span>
                      </div>
                    )}
                    {analyzing && (
                      <div className="mt-2 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-gray-600">Analisando PDF...</span>
                      </div>
                    )}
                    {novoDocumento.pdfUrl && (
                      <div className="mt-2 flex items-center justify-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm">PDF anexado com sucesso</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Análise da IA */}
              {novoDocumento.templateAnalysis && (
                <div className="space-y-2">
                  <Label>Análise da IA</Label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Análise concluída ({novoDocumento.templateAnalysis.analysis_confidence || 85}% confiança)
                      </span>
                    </div>
                    {novoDocumento.templateAnalysis.variable_fields && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-blue-700">Campos Variáveis Identificados:</p>
                        <div className="flex flex-wrap gap-1">
                          {novoDocumento.templateAnalysis.variable_fields.map((field: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {field.field_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}


              <div className="flex gap-2">
                {editandoId ? (
                  <>
                    <Button onClick={salvarEdicao} className="flex-1">
                      Salvar Alterações
                    </Button>
                    <Button onClick={cancelarEdicao} variant="outline">
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={adicionarDocumento} 
                    className="w-full"
                    disabled={uploading || analyzing}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Documento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {previewUrl || novoDocumento.pdfUrl ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      src={previewUrl || novoDocumento.pdfUrl}
                      width="100%"
                      height="400"
                      className="border-0"
                      title="Preview do PDF"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(previewUrl || novoDocumento.pdfUrl, '_blank')}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver em Tela Cheia
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Anexe um PDF para ver o preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Documentos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Documentos Salvos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {documentos.map((documento) => (
                <div key={documento.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{documento.nome}</h4>
                      <Badge className={getTipoColor(documento.tipo)}>
                        {tiposDocumento.find(t => t.value === documento.tipo)?.label}
                      </Badge>
                      {documento.templateAnalysis && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          IA Analisado
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {documento.pdfUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(documento.pdfUrl, '_blank')}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => iniciarEdicao(documento)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerDocumento(documento.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Criado em: {documento.criadoEm.toLocaleDateString()}
                  </div>
                  {documento.templateAnalysis?.variable_fields && (
                    <div className="mb-2">
                      <p className="text-xs font-medium mb-1">Campos Identificados:</p>
                      <div className="flex flex-wrap gap-1">
                        {documento.templateAnalysis.variable_fields.slice(0, 5).map((field: any, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {field.field_name}
                          </Badge>
                        ))}
                        {documento.templateAnalysis.variable_fields.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{documento.templateAnalysis.variable_fields.length - 5} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {documento.conteudo && (
                    <div className="text-sm bg-gray-50 p-2 rounded max-h-32 overflow-hidden">
                      <pre className="whitespace-pre-wrap text-xs">
                        {documento.conteudo.substring(0, 200)}
                        {documento.conteudo.length > 200 && '...'}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
              
              {documentos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum documento criado ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}