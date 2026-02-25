import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileUp, X } from "lucide-react";
import { Demanda } from "@/components/demandas/DemandasTable";
import { useDemandCategories } from "@/hooks/useDemandCategories";

interface NewDemandaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (demanda: Omit<Demanda, "id" | "dataHora">) => void;
}

const tagsPreDefinidas = [
  "Saúde", "Educação", "Infraestrutura", "Segurança", "Trabalho", "Habitação", 
  "Transporte", "Meio Ambiente", "Cultura", "Esporte", "Assistência Social", "Outro"
];

export function NewDemandaModal({ open, onOpenChange, onSubmit }: NewDemandaModalProps) {
  const { toast } = useToast();
  const { tags: allDemandTags, loading: loadingTags } = useDemandCategories();
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    autor: "",
    eleitorSolicitante: "",
    tag: "",
    status: "pendente" as Demanda["status"],
    tipo: "geral" as Demanda["tipo"],
    // Campos específicos para trabalho/emprego
    curriculo: "",
    vagaPretendida: "",
    empresaEmpregado: "",
  });

  const [customTag, setCustomTag] = useState("");
  const [showCustomTag, setShowCustomTag] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Separate tags into default and custom
  const defaultTags = tagsPreDefinidas;
  const customTags = allDemandTags.filter(tag => tag.is_custom);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagSelect = (value: string) => {
    if (value === "custom") {
      setShowCustomTag(true);
    } else {
      setFormData(prev => ({ ...prev, tag: value }));
      setShowCustomTag(false);
      setCustomTag("");
    }
  };

  const handleCustomTagSubmit = () => {
    if (customTag.trim()) {
      setFormData(prev => ({ ...prev, tag: customTag.trim() }));
      setShowCustomTag(false);
      setCustomTag("");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        setUploadedFile(file);
        setFormData(prev => ({ ...prev, curriculo: file.name }));
      } else {
        toast({
          title: "Formato inválido",
          description: "Apenas arquivos PDF ou imagens são aceitos.",
          variant: "destructive",
        });
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFormData(prev => ({ ...prev, curriculo: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.descricao || !formData.autor || !formData.eleitorSolicitante || !formData.tag) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.tipo === "trabalho_emprego" && !formData.vagaPretendida) {
      toast({
        title: "Campo obrigatório",
        description: "Para demandas de trabalho/emprego, a vaga pretendida é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      titulo: "",
      descricao: "",
      autor: "",
      eleitorSolicitante: "",
      tag: "",
      status: "pendente",
      tipo: "geral",
      curriculo: "",
      vagaPretendida: "",
      empresaEmpregado: "",
    });
    setUploadedFile(null);
    setShowCustomTag(false);
    setCustomTag("");
    
    toast({
      title: "Demanda criada",
      description: "A demanda foi criada com sucesso.",
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Demanda</DialogTitle>
          <DialogDescription>
            Cadastre uma nova demanda no sistema
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => handleInputChange("titulo", e.target.value)}
                    placeholder="Título da demanda"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Demanda Geral</SelectItem>
                      <SelectItem value="trabalho_emprego">Trabalho/Emprego</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
                  placeholder="Descreva a demanda em detalhes"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="autor">Autor *</Label>
                  <Input
                    id="autor"
                    value={formData.autor}
                    onChange={(e) => handleInputChange("autor", e.target.value)}
                    placeholder="Nome do autor"
                  />
                </div>
                
                <div>
                  <Label htmlFor="eleitorSolicitante">Eleitor Solicitante *</Label>
                  <Input
                    id="eleitorSolicitante"
                    value={formData.eleitorSolicitante}
                    onChange={(e) => handleInputChange("eleitorSolicitante", e.target.value)}
                    placeholder="Nome do eleitor solicitante"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tag">TAG *</Label>
                {!showCustomTag ? (
                  <Select value={formData.tag} onValueChange={handleTagSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Tags Padrão</div>
                      {tagsPreDefinidas.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                      {customTags.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t mt-1 pt-1">Tags Personalizadas</div>
                          {customTags.map((tag) => (
                            <SelectItem key={tag.id} value={tag.name}>
                              <span className="flex items-center gap-2">
                                {tag.color && (
                                  <span 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: tag.color }}
                                  />
                                )}
                                {tag.name}
                              </span>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      <SelectItem value="custom">+ Criar nova tag</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="Digite a nova tag"
                      onKeyPress={(e) => e.key === "Enter" && handleCustomTagSubmit()}
                    />
                    <Button type="button" onClick={handleCustomTagSubmit} size="sm">
                      Adicionar
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCustomTag(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
                {formData.tag && (
                  <div className="mt-2">
                    <Badge variant="secondary">{formData.tag}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campos específicos para trabalho/emprego */}
          {formData.tipo === "trabalho_emprego" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações de Trabalho/Emprego</CardTitle>
                <CardDescription>
                  Campos específicos para demandas relacionadas a trabalho e emprego
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vagaPretendida">Vaga Pretendida *</Label>
                  <Input
                    id="vagaPretendida"
                    value={formData.vagaPretendida}
                    onChange={(e) => handleInputChange("vagaPretendida", e.target.value)}
                    placeholder="Ex: Assistente Administrativo, Vendedor, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="curriculo">Currículo</Label>
                  <div className="space-y-2">
                    {!uploadedFile ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <FileUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Clique para anexar o currículo (PDF ou imagem)
                        </p>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById("file-upload")?.click()}
                        >
                          Selecionar arquivo
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">{uploadedFile.name}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="empresaEmpregado">Empresa onde foi empregado</Label>
                  <Input
                    id="empresaEmpregado"
                    value={formData.empresaEmpregado}
                    onChange={(e) => handleInputChange("empresaEmpregado", e.target.value)}
                    placeholder="Preencher quando a demanda for resolvida"
                    disabled={formData.status !== "resolvida"}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este campo será habilitado quando a demanda for marcada como resolvida
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Demanda
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}