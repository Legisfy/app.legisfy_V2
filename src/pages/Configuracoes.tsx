import { useState } from "react";
import * as React from "react";
import { Settings, Upload, X, Plus, Edit, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { DocumentTemplatesCard } from "@/components/configuracoes/DocumentTemplatesCard";
import { AssessorIACard } from "@/components/configuracoes/AssessorIACard";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface GabineteConfig {
  nome: string;
  logomarca: string;
  tags: string[];
}

interface Tag {
  id: string;
  nome: string;
  cor: string;
}

const coresDisponiveis = [
  { nome: "Azul", valor: "bg-blue-500" },
  { nome: "Verde", valor: "bg-green-500" },
  { nome: "Vermelho", valor: "bg-red-500" },
  { nome: "Amarelo", valor: "bg-yellow-500" },
  { nome: "Roxo", valor: "bg-purple-500" },
  { nome: "Rosa", valor: "bg-pink-500" },
  { nome: "Laranja", valor: "bg-orange-500" },
  { nome: "Cinza", valor: "bg-gray-500" },
];

export default function Configuracoes() {
  const { toast } = useToast();
  const { 
    gabineteData, 
    loading: isLoading, 
    logoUploading, 
    uploadLogo, 
    updateGabineteInfo 
  } = useGabineteConfig();
  
  // Estado para tags (mantido local para agora)
  const [tags, setTags] = useState<Tag[]>(() => {
    const tagsLocal = localStorage.getItem('gabinete-tags');
    return tagsLocal ? JSON.parse(tagsLocal) : [
      { id: "1", nome: "Urgente", cor: "bg-red-500" },
      { id: "2", nome: "Saúde", cor: "bg-blue-500" },
      { id: "3", nome: "Educação", cor: "bg-green-500" },
      { id: "4", nome: "Infraestrutura", cor: "bg-orange-500" },
    ];
  });

  const [modalTagOpen, setModalTagOpen] = useState(false);
  const [tagEditando, setTagEditando] = useState<Tag | null>(null);
  const [nomeGabinete, setNomeGabinete] = useState(gabineteData?.nome || "");

  const form = useForm({
    defaultValues: {
      nome: "",
      cor: "bg-blue-500"
    }
  });

  // Atualizar nome quando dados carregarem
  React.useEffect(() => {
    setNomeGabinete(gabineteData?.nome || "");
  }, [gabineteData?.nome]);

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await uploadLogo(file);
    if (result) {
      toast({
        title: "Logomarca atualizada",
        description: "A logomarca do gabinete foi atualizada com sucesso.",
      });
    }
  };

  const removerLogo = async () => {
    // Implementar remoção diretamente via supabase já que updateGabineteInfo não aceita logomarca_url
    const { cabinet } = useAuthContext() || {};
    if (!cabinet?.cabinet_id) return;

    try {
      const { error } = await supabase
        .from('gabinetes')
        .update({ logomarca_url: null })
        .eq('id', cabinet.cabinet_id);

      if (error) throw error;
      
      toast({
        title: "Logomarca removida",
        description: "A logomarca do gabinete foi removida com sucesso.",
      });
      
      // Recarregar dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao remover logomarca:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a logomarca.",
        variant: "destructive",
      });
    }
  };

  const salvarConfiguracoes = async () => {
    if (!nomeGabinete.trim()) return;

    const success = await updateGabineteInfo({ nome: nomeGabinete.trim() });
    if (success) {
      toast({
        title: "Configurações salvas",
        description: "As configurações do gabinete foram atualizadas com sucesso.",
      });
    }
  };

  const abrirModalTag = (tag?: Tag) => {
    if (tag) {
      setTagEditando(tag);
      form.reset({ nome: tag.nome, cor: tag.cor });
    } else {
      setTagEditando(null);
      form.reset({ nome: "", cor: "bg-blue-500" });
    }
    setModalTagOpen(true);
  };

  const salvarTag = (data: { nome: string; cor: string }) => {
    let novasTags: Tag[];
    
    if (tagEditando) {
      novasTags = tags.map(tag => 
        tag.id === tagEditando.id 
          ? { ...tag, nome: data.nome, cor: data.cor }
          : tag
      );
      toast({
        title: "Tag atualizada",
        description: "A tag foi atualizada com sucesso.",
      });
    } else {
      const novaTag: Tag = {
        id: Date.now().toString(),
        nome: data.nome,
        cor: data.cor
      };
      novasTags = [...tags, novaTag];
      toast({
        title: "Tag criada",
        description: "A nova tag foi criada com sucesso.",
      });
    }
    
    setTags(novasTags);
    localStorage.setItem('gabinete-tags', JSON.stringify(novasTags));
    setModalTagOpen(false);
  };

  const excluirTag = (id: string) => {
    const novasTags = tags.filter(tag => tag.id !== id);
    setTags(novasTags);
    localStorage.setItem('gabinete-tags', JSON.stringify(novasTags));
    toast({
      title: "Tag excluída",
      description: "A tag foi removida com sucesso.",
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Carregando configurações...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-2">
            Personalize as configurações do seu gabinete
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Gabinete</CardTitle>
              <CardDescription>
                Configure o nome e identidade visual do gabinete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-gabinete">Nome do Gabinete</Label>
                <Input
                  id="nome-gabinete"
                  value={nomeGabinete}
                  onChange={(e) => setNomeGabinete(e.target.value)}
                  placeholder="Ex: Gabinete do Vereador João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label>Logomarca</Label>
                {gabineteData?.logomarca_url ? (
                  <div className="relative inline-block">
                    <img 
                      src={gabineteData.logomarca_url} 
                      alt="Logomarca" 
                      className="w-32 h-32 object-contain border rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={removerLogo}
                      disabled={logoUploading}
                    >
                      {logoUploading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {logoUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                        <p className="text-sm text-muted-foreground">
                          Fazendo upload da logomarca...
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Clique para adicionar uma logomarca
                        </p>
                        <Label htmlFor="upload-logo" className="cursor-pointer">
                          <Button variant="outline" asChild>
                            <span>Selecionar Arquivo</span>
                          </Button>
                        </Label>
                        <Input
                          id="upload-logo"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleUploadLogo}
                          disabled={logoUploading}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gerenciamento de Tags */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Tags do Sistema</CardTitle>
                  <CardDescription>
                    Gerencie as tags utilizadas para categorizar conteúdos
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => abrirModalTag()}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Tag
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${tag.cor}`} />
                      <span className="font-medium">{tag.nome}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirModalTag(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => excluirTag(tag.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {tags.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Nenhuma tag criada ainda.</p>
                    <p className="text-sm">Clique em "Nova Tag" para começar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meu Assessor IA */}
        <div className="col-span-full">
          <AssessorIACard />
        </div>

        {/* Modelos Inteligentes de Documentos */}
        <div className="col-span-full">
          <DocumentTemplatesCard />
        </div>

        {/* Modal para Criar/Editar Tag */}
        <Dialog open={modalTagOpen} onOpenChange={setModalTagOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {tagEditando ? "Editar Tag" : "Nova Tag"}
              </DialogTitle>
              <DialogDescription>
                {tagEditando ? "Edite os dados da tag" : "Crie uma nova tag para o sistema"}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(salvarTag)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  rules={{ required: "Nome da tag é obrigatório" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Tag</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Urgente" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor da Tag</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-4 gap-2">
                          {coresDisponiveis.map((cor) => (
                            <button
                              key={cor.valor}
                              type="button"
                              onClick={() => field.onChange(cor.valor)}
                              className={`w-full h-10 rounded-lg border-2 transition-all ${
                                field.value === cor.valor 
                                  ? "border-primary scale-105" 
                                  : "border-transparent hover:scale-105"
                              } ${cor.valor}`}
                              title={cor.nome}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setModalTagOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {tagEditando ? "Salvar Alterações" : "Criar Tag"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}