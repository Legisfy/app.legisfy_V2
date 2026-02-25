import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Save, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailTemplate {
  id: string;
  type: string;
  subject: string;
  htmlContent: string;
  name: string;
  description: string;
}

const EMAIL_TYPES = [
  { value: "invite_politico", label: "Convite para político criar gabinete" },
  { value: "welcome_politico", label: "Boas-vindas após criação do gabinete" },
  { value: "invite_chefe", label: "Convite para chefe de gabinete" },
  { value: "welcome_chefe", label: "Boas-vindas para chefe de gabinete" },
  { value: "invite_assessor", label: "Convite para assessor" },
  { value: "welcome_assessor", label: "Boas-vindas para assessor" },
];


const EmailTemplateEditor = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    subject: "",
    htmlContent: "",
    name: "",
    description: ""
  });

  // Load templates from database
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTemplates: EmailTemplate[] = data?.map(template => ({
        id: template.id,
        type: template.type,
        name: template.name,
        description: template.description || "",
        subject: template.subject,
        htmlContent: template.html_content
      })) || [];

      setTemplates(formattedTemplates);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: "Erro ao carregar templates",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSave = async () => {
    if (!formData.type || !formData.subject || !formData.htmlContent || !formData.name) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            type: formData.type,
            name: formData.name,
            description: formData.description,
            subject: formData.subject,
            html_content: formData.htmlContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: "✅ Sucesso",
          description: "Template atualizado com sucesso"
        });
      } else {
        // Create new template - first deactivate existing template of same type
        if (formData.type) {
          await supabase
            .from('email_templates')
            .update({ is_active: false })
            .eq('type', formData.type)
            .eq('is_active', true);
        }

        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            type: formData.type,
            name: formData.name,
            description: formData.description,
            subject: formData.subject,
            html_content: formData.htmlContent,
            is_active: true
          });

        if (error) throw error;

        toast({
          title: "✅ Sucesso", 
          description: "Template criado com sucesso"
        });
      }

      // Reload templates
      await loadTemplates();
      resetForm();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro ao salvar template",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      subject: template.subject,
      htmlContent: template.htmlContent,
      name: template.name,
      description: template.description
    });
    setIsEditing(true);
  };

  const handleDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "✅ Removido",
        description: "Template desativado com sucesso"
      });

      // Reload templates
      await loadTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro ao remover template",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: "",
      subject: "",
      htmlContent: "",
      name: "",
      description: ""
    });
    setEditingTemplate(null);
    setIsEditing(false);
  };

  const renderPreview = (htmlContent: string, subject: string) => {
    // Replace placeholders with sample data
    const previewData = {
      '{{name}}': 'João da Silva',
      '{{institution}}': 'Câmara Municipal de São Paulo',
      '{{cabinet}}': 'Gabinete do Vereador João da Silva',
      '{{link}}': '#'
    };

    let processedHtml = htmlContent;
    Object.entries(previewData).forEach(([placeholder, value]) => {
      processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value);
    });

    return { processedHtml, processedSubject: subject.replace(/\{\{name\}\}/g, 'João da Silva') };
  };

  return (
    <div className="space-y-6">
      {/* Editor Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEditing ? "Editar Template" : "Novo Template"}
          </CardTitle>
          <CardDescription>
            {isEditing ? "Edite o template de email selecionado" : "Crie um novo template de email"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                placeholder="Ex: Convite Político Padrão"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">Tipo de Email</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Descrição</Label>
            <Input
              id="template-description"
              placeholder="Descreva quando usar este template"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-subject">Assunto do Email</Label>
            <Input
              id="template-subject"
              placeholder="Ex: Bem-vindo ao Legisfy - {{name}}"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-html">Conteúdo HTML</Label>
            <Textarea
              id="template-html"
              placeholder="Cole ou digite o HTML do template aqui..."
              value={formData.htmlContent}
              onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!formData.htmlContent}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Preview do Template</DialogTitle>
                  <DialogDescription>
                    Assunto: {renderPreview(formData.htmlContent, formData.subject).processedSubject}
                  </DialogDescription>
                </DialogHeader>
                <div className="border rounded-lg p-4 bg-white">
                  <iframe
                    srcDoc={renderPreview(formData.htmlContent, formData.subject).processedHtml}
                    className="w-full h-96 border-0"
                    title="Preview do email"
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Atualizar" : "Salvar"} Template
            </Button>

            {isEditing && (
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Templates Existentes</CardTitle>
          <CardDescription>
            Gerencie os templates de email cadastrados
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Carregando templates...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {EMAIL_TYPES.find(t => t.value === template.type)?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Assunto:</strong> {template.subject}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {templates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum template cadastrado</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variables Help */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-3">Variáveis Disponíveis</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <code className="bg-blue-100 px-2 py-1 rounded">{"{{name}}"}</code>
              <span className="ml-2 text-blue-700">Nome do usuário</span>
            </div>
            <div>
              <code className="bg-blue-100 px-2 py-1 rounded">{"{{institution}}"}</code>
              <span className="ml-2 text-blue-700">Nome da instituição</span>
            </div>
            <div>
              <code className="bg-blue-100 px-2 py-1 rounded">{"{{cabinet}}"}</code>
              <span className="ml-2 text-blue-700">Nome do gabinete</span>
            </div>
            <div>
              <code className="bg-blue-100 px-2 py-1 rounded">{"{{link}}"}</code>
              <span className="ml-2 text-blue-700">Link de ação/convite</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplateEditor;