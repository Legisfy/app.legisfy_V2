import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRealEleitores } from "@/hooks/useRealEleitores";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportedEleitor {
  nome?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  bairro?: string;
  sexo?: string;
  tags?: string;
  observacoes?: string[];
}

export function SpreadsheetImport({ open, onOpenChange }: ImportDialogProps) {
  const { toast } = useToast();
  const { createEleitor } = useRealEleitores();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedData, setImportedData] = useState<ImportedEleitor[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const processed: ImportedEleitor[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 2) continue; // Skip empty lines

        const eleitor: ImportedEleitor = {
          observacoes: []
        };

        // Mapear campos
        headers.forEach((header, index) => {
          const value = values[index]?.trim();
          
          switch (header) {
            case 'nome':
            case 'name':
              eleitor.nome = value;
              break;
            case 'email':
            case 'e-mail':
              eleitor.email = value;
              break;
            case 'telefone':
            case 'phone':
            case 'whatsapp':
              eleitor.telefone = value;
              break;
            case 'endereco':
            case 'endereço':
            case 'address':
              eleitor.endereco = value;
              break;
            case 'bairro':
            case 'neighborhood':
              eleitor.bairro = value;
              break;
            case 'sexo':
            case 'gender':
              eleitor.sexo = value;
              break;
            case 'tags':
              eleitor.tags = value;
              break;
          }
        });

        // Verificar campos obrigatórios e adicionar observações
        if (!eleitor.nome) {
          eleitor.observacoes?.push("falta nome");
        }
        if (!eleitor.telefone) {
          eleitor.observacoes?.push("falta telefone");
        }
        if (!eleitor.endereco) {
          eleitor.observacoes?.push("falta endereço");
        }
        if (!eleitor.bairro) {
          eleitor.observacoes?.push("falta bairro");
        }

        processed.push(eleitor);
      }

      setImportedData(processed);
      toast({
        title: "Planilha importada!",
        description: `${processed.length} eleitores foram processados.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao importar",
        description: "Erro ao processar a planilha. Verifique o formato.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const eleitor of importedData) {
        // Skip eleitores without required fields
        if (!eleitor.nome || !eleitor.telefone) {
          errorCount++;
          continue;
        }

        try {
          await createEleitor({
            name: eleitor.nome,
            whatsapp: eleitor.telefone,
            email: eleitor.email || null,
            address: eleitor.endereco || '',
            neighborhood: eleitor.bairro || '',
            sex: eleitor.sexo || null,
            tags: eleitor.tags ? eleitor.tags.split(',').map(t => t.trim()) : null,
          });
          successCount++;
        } catch (error) {
          console.error('Error creating eleitor:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Dados salvos!",
          description: `${successCount} eleitores foram adicionados ao sistema.`,
        });
      }

      if (errorCount > 0) {
        toast({
          title: "Alguns eleitores não foram salvos",
          description: `${errorCount} eleitores tiveram problemas ao salvar.`,
          variant: "destructive",
        });
      }
      
      setImportedData([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar os eleitores.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getGenderBadge = (gender: string) => {
    switch (gender?.toUpperCase()) {
      case 'MASCULINO':
      case 'HOMEM':
      case 'M':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">HOMEM</Badge>;
      case 'FEMININO':
      case 'MULHER':
      case 'F':
        return <Badge className="bg-pink-100 text-pink-800 border-pink-200">MULHER</Badge>;
      case 'NAO_BINARIO':
      case 'NÃO BINÁRIO':
      case 'NB':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">NÃO BINÁRIO</Badge>;
      default:
        return <Badge variant="secondary">{gender || "Não informado"}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Planilha de Eleitores
          </DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha CSV com dados dos eleitores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {importedData.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload da Planilha</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Selecione sua planilha CSV</h3>
                  <p className="text-muted-foreground mb-4">
                    Formato esperado: nome, email, telefone, endereco, bairro, sexo, tags
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isProcessing ? "Processando..." : "Selecionar Arquivo"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Dados Importados ({importedData.length} eleitores)
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportedData([])}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveData} 
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isSaving ? "Salvando..." : "Salvar Todos"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {importedData.map((eleitor, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-4">
                          <h4 className="font-medium">{eleitor.nome || "Nome não informado"}</h4>
                          {eleitor.sexo && getGenderBadge(eleitor.sexo)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <p>📧 {eleitor.email || "Email não informado"}</p>
                          <p>📱 {eleitor.telefone || "Telefone não informado"}</p>
                          <p>📍 {eleitor.endereco || "Endereço não informado"}</p>
                          <p>🏘️ {eleitor.bairro || "Bairro não informado"}</p>
                        </div>

                        {eleitor.tags && (
                          <div className="flex flex-wrap gap-1">
                            {eleitor.tags.split(',').map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {eleitor.observacoes && eleitor.observacoes.length > 0 && (
                        <div className="ml-4">
                          <div className="flex items-center gap-1 text-orange-600 mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Observações</span>
                          </div>
                          <div className="space-y-1">
                            {eleitor.observacoes.map((obs, i) => (
                              <Badge key={i} variant="outline" className="text-orange-600 border-orange-200">
                                {obs}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}