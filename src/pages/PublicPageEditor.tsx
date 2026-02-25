import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EditorHeader } from "@/components/public-page-editor/EditorHeader";
import { PreviewPanel } from "@/components/public-page-editor/PreviewPanel";
import { usePublicPage } from "@/hooks/usePublicPage";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  LayoutTemplate,
  MousePointer2,
  Rows3,
  FormInput,
  Goal,
  GitBranch,
  Users,
  Instagram,
  Mail,
  MessageCircle,
  ArrowRight,
  GripVertical,
  Link2
} from "lucide-react";

type FunnelStepType = "entrada" | "landing" | "form" | "qualificacao" | "lista";

interface FunnelStep {
  id: string;
  type: FunnelStepType;
  label: string;
  description: string;
}

const createInitialFunnel = (): FunnelStep[] => [
  {
    id: "step-entrada",
    type: "entrada",
    label: "Entrada: Bio do Instagram",
    description: "Cidadão clica no link da bio e acessa a landing page."
  },
  {
    id: "step-landing",
    type: "landing",
    label: "Landing Page do Gabinete",
    description: "Blocos com performance, agenda e atualizações do mandato."
  },
  {
    id: "step-form",
    type: "form",
    label: "Formulário do Cidadão",
    description: "Coleta nome, WhatsApp e motivo do contato com LGPD."
  },
  {
    id: "step-qualificacao",
    type: "qualificacao",
    label: "Qualificação automática",
    description: "Classifica demanda, indicação ou apoio político."
  },
  {
    id: "step-lista",
    type: "lista",
    label: "Envio para listas",
    description: "Atualiza Públicos e listas para campanhas futuras."
  }
];

export default function PublicPageEditor() {
  const navigate = useNavigate();
  const { publicPage, loading, createPublicPage, updatePublicPage } = usePublicPage();
  const { gabineteData } = useGabineteConfig();
  
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>(createInitialFunnel);
  const [selectedStepId, setSelectedStepId] = useState<string | null>("step-landing");
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    welcome_text: "",
    instagram: "",
    whatsapp: "",
    site: "",
    show_kpis: true,
    show_timeline: true,
    show_form: true,
    primary_color: "#2563eb",
    secondary_color: "#10b981",
    theme_mode: "light",
    font_family: "system",
    header_layout: "compact",
    cover_image_url: "",
    logo_url: "",
    form_title: "Fale com o Gabinete",
    form_description: "Envie sua sugestão, elogio ou reclamação",
    lgpd_text: "Seus dados serão tratados conforme nossa Política de Privacidade.",
    captcha_enabled: true,
    rate_limit: 5,
    slug: "",
    status: "draft",
    seo_title: "",
    seo_description: ""
  });

  useEffect(() => {
    if (publicPage) {
      setFormData({
        welcome_text: publicPage.welcome_text || "",
        instagram: publicPage.links?.instagram || "",
        whatsapp: publicPage.links?.whatsapp || "",
        site: publicPage.links?.site || "",
        show_kpis: publicPage.show_sections?.kpis !== false,
        show_timeline: publicPage.show_sections?.timeline !== false,
        show_form: publicPage.show_sections?.form !== false,
        primary_color: publicPage.theme?.primary || "#2563eb",
        secondary_color: publicPage.theme?.secondary || "#10b981",
        theme_mode: publicPage.theme?.mode || "light",
        font_family: "system",
        header_layout: "compact",
        cover_image_url: "",
        logo_url: "",
        form_title: "Fale com o Gabinete",
        form_description: "Envie sua sugestão, elogio ou reclamação",
        lgpd_text: "Seus dados serão tratados conforme nossa Política de Privacidade.",
        captcha_enabled: true,
        rate_limit: 5,
        slug: publicPage.slug || "",
        status: publicPage.status || "draft",
        seo_title: "",
        seo_description: ""
      });
    }
  }, [publicPage]);

  useEffect(() => {
    if (!loading && !publicPage && gabineteData?.nome) {
      createPublicPage(gabineteData.nome);
    }
  }, [loading, publicPage, gabineteData, createPublicPage]);

  useEffect(() => {
    if (!unsavedChanges || !publicPage) return;

    const timeout = setTimeout(async () => {
      const updates = {
        welcome_text: formData.welcome_text,
        theme: {
          primary: formData.primary_color,
          secondary: formData.secondary_color,
          mode: formData.theme_mode as 'light' | 'dark'
        },
        links: {
          instagram: formData.instagram,
          whatsapp: formData.whatsapp,
          site: formData.site
        },
        show_sections: {
          kpis: formData.show_kpis,
          timeline: formData.show_timeline,
          form: formData.show_form
        }
      };
      
      await updatePublicPage(updates);
      setUnsavedChanges(false);
      toast.success("Alterações salvas automaticamente");
    }, 800);

    return () => clearTimeout(timeout);
  }, [formData, unsavedChanges, publicPage, updatePublicPage]);

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleFunnelDragStart = (id: string) => {
    setDraggedStepId(id);
  };

  const handleFunnelDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleFunnelDrop = (targetId: string) => {
    if (!draggedStepId || draggedStepId === targetId) {
      setDraggedStepId(null);
      return;
    }

    const updated = [...funnelSteps];
    const fromIndex = updated.findIndex(step => step.id === draggedStepId);
    const toIndex = updated.findIndex(step => step.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedStepId(null);
      return;
    }

    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFunnelSteps(updated);
    setDraggedStepId(null);
  };

  const handleAddCustomStep = () => {
    const id = `step-${Date.now()}`;
    const newStep: FunnelStep = {
      id,
      type: "qualificacao",
      label: "Etapa personalizada",
      description: "Conecte esta etapa a automações ou listas específicas."
    };
    setFunnelSteps(prev => [...prev, newStep]);
    setSelectedStepId(id);
  };

  const selectedStep = funnelSteps.find(step => step.id === selectedStepId) || funnelSteps[0];

  const handleSelectedStepChange = (field: "label" | "description", value: string) => {
    setFunnelSteps(prev =>
      prev.map(step =>
        step.id === selectedStep.id ? { ...step, [field]: value } : step
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EditorHeader 
        publicPage={publicPage}
        formData={formData}
        onBack={() => navigate('/comunicacao')}
        unsavedChanges={unsavedChanges}
      />
      
      <div className="pt-16 px-6 pb-6 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Blocos da Landing Page</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                  Builder
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Arrume quais blocos aparecem na página e ajuste textos principais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Performance do gabinete</span>
                  <Switch
                    checked={formData.show_kpis}
                    onCheckedChange={checked => handleFormChange("show_kpis", checked)}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Bloco com cards de Eleitores, Demandas, Indicações e Taxa de Atendimento.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Últimas atualizações</span>
                  <Switch
                    checked={formData.show_timeline}
                    onCheckedChange={checked => handleFormChange("show_timeline", checked)}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Linha do tempo com atividades recentes do mandato.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Formulário do cidadão</span>
                  <Switch
                    checked={formData.show_form}
                    onCheckedChange={checked => handleFormChange("show_form", checked)}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Bloco de captura com nome, WhatsApp e mensagem.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FormInput className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Texto do formulário</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Personalize o call to action do formulário de contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium">Título</div>
                <Input
                  value={formData.form_title}
                  onChange={e => handleFormChange("form_title", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium">Descrição</div>
                <Textarea
                  value={formData.form_description}
                  onChange={e => handleFormChange("form_description", e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium">Texto LGPD</div>
                <Textarea
                  value={formData.lgpd_text}
                  onChange={e => handleFormChange("lgpd_text", e.target.value)}
                  rows={2}
                  className="text-[11px]"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px]">Proteção contra spam</span>
                </div>
                <Switch
                  checked={formData.captcha_enabled}
                  onCheckedChange={checked => handleFormChange("captcha_enabled", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Rows3 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Aparência rápida</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Cores principais usadas nos blocos da landing e do formulário.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium">Cor primária</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Botões e destaques</span>
                </div>
                <Input
                  type="color"
                  value={formData.primary_color}
                  onChange={e => handleFormChange("primary_color", e.target.value)}
                  className="h-10 p-1"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium">Cor secundária</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Detalhes e gráficos</span>
                </div>
                <Input
                  type="color"
                  value={formData.secondary_color}
                  onChange={e => handleFormChange("secondary_color", e.target.value)}
                  className="h-10 p-1"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium">Tema</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.theme_mode === "light" ? "default" : "outline"}
                    className="h-7 text-[11px] flex-1"
                    onClick={() => handleFormChange("theme_mode", "light")}
                  >
                    Light
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.theme_mode === "dark" ? "default" : "outline"}
                    className="h-7 text-[11px] flex-1"
                    onClick={() => handleFormChange("theme_mode", "dark")}
                  >
                    Dark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-4">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Goal className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">
                  Canvas da Landing Page
                </CardTitle>
              </div>
              <Tabs
                value={previewViewport}
                onValueChange={value => setPreviewViewport(value as "desktop" | "mobile")}
              >
                <TabsList className="grid grid-cols-2 h-7">
                  <TabsTrigger value="desktop" className="text-[11px] px-2">
                    Desktop
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="text-[11px] px-2">
                    Mobile
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border rounded-xl bg-white overflow-hidden mx-auto transition-all duration-300",
                  previewViewport === "mobile" ? "max-w-sm" : "w-full"
                )}
                style={{ maxHeight: "70vh" }}
              >
                <ScrollArea className="h-full">
                  <PreviewPanel
                    formData={formData}
                    gabineteData={gabineteData}
                    publicPage={publicPage}
                  />
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Links da página</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Configure para onde o cidadão é redirecionado a partir da landing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium flex items-center gap-2">
                  <Instagram className="h-3 w-3" />
                  Instagram
                </div>
                <Input
                  placeholder="@usuario"
                  value={formData.instagram}
                  onChange={e => handleFormChange("instagram", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium flex items-center gap-2">
                  <MessageCircle className="h-3 w-3" />
                  WhatsApp
                </div>
                <Input
                  placeholder="(11) 99999-9999"
                  value={formData.whatsapp}
                  onChange={e => handleFormChange("whatsapp", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Site ou página externa
                </div>
                <Input
                  placeholder="https://..."
                  value={formData.site}
                  onChange={e => handleFormChange("site", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Funil do cidadão</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                  Drag & Drop
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Arraste as etapas para definir a jornada entre landing, formulário e listas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-64 pr-2">
                <div className="relative pl-3">
                  <div className="absolute left-1 top-0 bottom-4 w-px bg-border" />
                  <div className="space-y-3">
                    {funnelSteps.map((step, index) => (
                      <div
                        key={step.id}
                        draggable
                        onDragStart={() => handleFunnelDragStart(step.id)}
                        onDragOver={handleFunnelDragOver}
                        onDrop={() => handleFunnelDrop(step.id)}
                        onClick={() => setSelectedStepId(step.id)}
                        className={cn(
                          "relative pl-3 pr-2 py-2 rounded-lg border bg-card cursor-move flex gap-2",
                          selectedStepId === step.id && "ring-2 ring-primary border-primary"
                        )}
                      >
                        <div className="absolute left-0 top-2 w-3 h-px bg-border" />
                        <div className="flex flex-col items-center pt-1">
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                          {index < funnelSteps.length - 1 && (
                            <div className="flex-1 w-px bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold">
                              {step.label}
                            </span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {step.type === "entrada"
                                ? "Entrada"
                                : step.type === "landing"
                                ? "Landing"
                                : step.type === "form"
                                ? "Formulário"
                                : step.type === "lista"
                                ? "Lista"
                                : "Ação"}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground mt-2 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-[11px] justify-center gap-1.5"
                onClick={handleAddCustomStep}
              >
                <Users className="h-3 w-3" />
                Adicionar etapa personalizada
              </Button>
            </CardContent>
          </Card>

          {selectedStep && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FormInput className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Detalhes da etapa</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Edite o nome e a descrição da etapa selecionada no funil.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium">Nome da etapa</div>
                  <Input
                    value={selectedStep.label}
                    onChange={e => handleSelectedStepChange("label", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium">Descrição</div>
                  <Textarea
                    value={selectedStep.description}
                    onChange={e => handleSelectedStepChange("description", e.target.value)}
                    rows={3}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
