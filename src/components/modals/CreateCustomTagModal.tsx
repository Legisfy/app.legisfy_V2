import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateCustomTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gabineteId: string;
  onSuccess: () => void;
}

const iconOptions = [
  "Tag", "Users", "FileText", "CheckCircle", "AlertCircle",
  "Star", "Heart", "Flag", "Bookmark", "Target",
  "Award", "Trophy", "Zap", "Shield", "Crown", "Scale", "Gavel"
];

const categoryOptions = [
  { id: 'eleitores', label: 'Eleitores', icon: 'Users', description: 'Organize sua base de contatos' },
  { id: 'indicacoes', label: 'Indicações', icon: 'Flag', description: 'Classifique pedidos de zeladoria' },
  { id: 'demandas', label: 'Demandas', icon: 'MessageSquare', description: 'Gerencie fluxos de suporte' },
  { id: 'projetos_lei', label: 'Projetos de Lei', icon: 'FileText', description: 'Monitore o ciclo legislativo' },
];

export function CreateCustomTagModal({ open, onOpenChange, gabineteId, onSuccess }: CreateCustomTagModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [selectedIcon, setSelectedIcon] = useState("Tag");
  const [categories, setCategories] = useState<Record<string, boolean>>({
    eleitores: false,
    indicacoes: false,
    demandas: false,
    projetos_lei: false,
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("#6366f1");
    setSelectedIcon("Tag");
    setCategories({
      eleitores: false,
      indicacoes: false,
      demandas: false,
      projetos_lei: false,
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nome da TAG é obrigatório");
      return;
    }

    const selectedCategories = Object.entries(categories)
      .filter(([_, selected]) => selected)
      .map(([category]) => category);

    if (selectedCategories.length === 0) {
      toast.error("Selecione pelo menos uma área onde a TAG funcionará");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Separate categories: eleitores goes to eleitor_tags, others to gabinete_custom_tags
      const eleitorCategories = selectedCategories.filter(c => c === 'eleitores');
      const otherCategories = selectedCategories.filter(c => c !== 'eleitores');

      if (eleitorCategories.length > 0) {
        const { error: eleitorError } = await supabase
          .from('eleitor_tags')
          .insert({
            gabinete_id: gabineteId,
            name: name.trim(),
            color,
            icon: selectedIcon,
            created_by: user.id,
          });

        if (eleitorError) throw eleitorError;
      }

      if (otherCategories.length > 0) {
        const tagsToInsert = otherCategories.map(category => ({
          gabinete_id: gabineteId,
          name: name.trim(),
          category,
          subcategory: description.trim() || null,
          color,
          icon: selectedIcon,
          created_by: user.id,
        }));

        const { error: customError } = await supabase
          .from('gabinete_custom_tags')
          .insert(tagsToInsert);

        if (customError) throw customError;
      }

      toast.success("TAG criada com sucesso!");
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error("Erro ao criar TAG");
    } finally {
      setSaving(false);
    }
  };

  const renderIcon = (iconName: string, className?: string, style?: React.CSSProperties) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className={className || "h-5 w-5"} style={style} /> : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl bg-background rounded-3xl">
        <div className="flex h-full min-h-[500px]">
          {/* Sidebar de Preview */}
          <div className="w-[280px] bg-muted/30 border-r border-border/40 p-8 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Preview Real-time</span>
              <p className="text-[9px] text-muted-foreground/40 font-medium">Veja como sua TAG aparecerá no sistema</p>
            </div>

            <div
              className="px-4 py-2.5 rounded-2xl border-2 flex items-center gap-3 shadow-xl transition-all duration-500 scale-110"
              style={{
                borderColor: `${color}40`,
                backgroundColor: `${color}10`,
                color: color
              }}
            >
              {renderIcon(selectedIcon, "h-5 w-5")}
              <span className="font-bold text-sm tracking-tight">{name || "Título da TAG"}</span>
            </div>

            <div className="w-full bg-card border border-border/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/20 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Aplicações Ativas</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(categories).filter(([_, v]) => v).map(([id]) => (
                  <div key={id} className="px-2 py-1 rounded-lg bg-muted text-[8px] font-black uppercase tracking-tighter text-muted-foreground/80">
                    {categoryOptions.find(c => c.id === id)?.label}
                  </div>
                ))}
                {Object.values(categories).every(v => !v) && (
                  <span className="text-[9px] text-muted-foreground/30 italic">Nenhuma área selecionada</span>
                )}
              </div>
            </div>
          </div>

          {/* Área de Formulário */}
          <div className="flex-1 p-8 space-y-8 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black font-outfit text-foreground/80 tracking-tight flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <LucideIcons.Plus className="w-6 h-6" />
                </div>
                CRIAR NOVA TAG
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground/60 leading-relaxed max-w-sm">
                As tags ajudam a categorizar dados e automatizar processos inteligentes no seu gabinete.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Título da TAG</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: PRIORITÁRIO"
                    className="h-12 bg-muted/20 border-border/40 rounded-2xl font-bold text-sm focus:ring-primary/20"
                    maxLength={30}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-12 h-12 p-1 bg-muted/20 border-border/40 rounded-2xl cursor-pointer"
                      />
                    </div>
                    <Input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 h-12 bg-muted/20 border-border/40 rounded-2xl font-mono text-xs font-bold uppercase"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>

              {/* Ícone */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Simbolismo (Ícone)</Label>
                <div className="flex flex-wrap gap-2.5">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center transition-all border border-transparent shadow-sm hover:scale-105 active:scale-95",
                        selectedIcon === icon
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {renderIcon(icon, "h-5 w-5")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Áreas de Atuação */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Onde esta TAG funcionará?</Label>
                  <span className="text-[9px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">Obrigatório</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {categoryOptions.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => setCategories({ ...categories, [cat.id]: !categories[cat.id] })}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start group relative overflow-hidden",
                        categories[cat.id]
                          ? "bg-primary/[0.03] border-primary/40"
                          : "bg-muted/10 border-border/40 hover:border-border/80"
                      )}
                    >
                      <div className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        categories[cat.id] ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground group-hover:text-foreground"
                      )}>
                        {renderIcon(cat.icon, "w-5 h-5")}
                      </div>
                      <div className="space-y-1 pr-6">
                        <p className="text-[11px] font-black uppercase tracking-tight leading-none">{cat.label}</p>
                        <p className="text-[9px] text-muted-foreground/60 leading-tight">{cat.description}</p>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className={cn(
                          "w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center",
                          categories[cat.id] ? "bg-primary border-primary scale-110" : "border-muted-foreground/10"
                        )}>
                          {categories[cat.id] && <LucideIcons.Check className="w-2.5 h-2.5 text-white stroke-[4]" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Descrição Opcional */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Observações Internas (Opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Defina regras de uso para a equipe..."
                  className="min-h-[80px] bg-muted/20 border-border/40 rounded-2xl text-xs font-medium resize-none focus:ring-primary/20"
                  maxLength={150}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/40">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all"
              >
                Descartar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl h-12 px-10 font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                {saving ? (
                  <LucideIcons.Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Finalizar e Criar"
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
