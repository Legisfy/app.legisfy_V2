import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Calendar, Users, FileText, MapPin, Globe, Gavel, Eye, Pencil, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";

interface Permission {
  id: string;
  permission_module: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

interface ManagePermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessor: {
    id: string;
    nome: string;
    cargo: string;
  } | null;
}

const PERMISSION_MODULES = [
  { key: 'agenda', name: 'Agenda', icon: Calendar, description: 'Gerenciar eventos e compromissos' },
  { key: 'eleitores', name: 'Eleitores', icon: Users, description: 'Cadastrar e gerenciar eleitores' },
  { key: 'demandas', name: 'Demandas', icon: FileText, description: 'Criar e acompanhar demandas' },
  { key: 'indicacoes', name: 'Indicações', icon: MapPin, description: 'Criar e gerenciar indicações' },
  { key: 'projetos_lei', name: 'Projeto de Lei', icon: Gavel, description: 'Gerenciar projetos de lei' },
  { key: 'publicos', name: 'Público', icon: Globe, description: 'Gerenciar página pública' },
];

export const ManagePermissionsModal = ({ open, onOpenChange, assessor }: ManagePermissionsModalProps) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { activeInstitution } = useActiveInstitution();

  useEffect(() => {
    if (open && assessor && activeInstitution?.cabinet_id) {
      fetchPermissions();
    }
  }, [open, assessor, activeInstitution?.cabinet_id]);

  const fetchPermissions = async () => {
    if (!assessor || !activeInstitution?.cabinet_id || assessor.id.startsWith('invite-')) {
      // For invited users, show default permissions
      if (assessor?.id.startsWith('invite-')) {
        const defaults = PERMISSION_MODULES.map(module => ({
          id: `default-${module.key}`,
          permission_module: module.key,
          can_read: true,
          can_write: false,
          can_delete: false
        }));
        setPermissions(defaults);
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('assessor_permissions')
        .select('*')
        .eq('user_id', assessor.id)
        .eq('cabinet_id', activeInstitution.cabinet_id);

      if (error) throw error;

      // Create default permissions if none exist
      const existingModules = (data || []).map((p: any) => p.permission_module);
      const missingModules = PERMISSION_MODULES.filter(m => !existingModules.includes(m.key));

      let allPermissions = data || [];

      if (missingModules.length > 0) {
        const defaultPermissions = missingModules.map(module => ({
          user_id: assessor.id,
          cabinet_id: activeInstitution.cabinet_id,
          permission_module: module.key,
          can_read: true,
          can_write: false,
          can_delete: false
        }));

        const { data: newPermissions, error: insertError } = await (supabase as any)
          .from('assessor_permissions')
          .upsert(defaultPermissions, { onConflict: 'user_id,cabinet_id,permission_module' })
          .select();

        if (insertError) throw insertError;
        allPermissions = [...allPermissions, ...(newPermissions || [])];
      }

      setPermissions(allPermissions);
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar permissões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (moduleKey: string, field: 'can_read' | 'can_write' | 'can_delete', value: boolean) => {
    setPermissions(prev =>
      prev.map(p =>
        p.permission_module === moduleKey
          ? { ...p, [field]: value }
          : p
      )
    );
  };

  const savePermissions = async () => {
    if (!assessor || !activeInstitution?.cabinet_id || assessor.id.startsWith('invite-')) {
      if (assessor?.id.startsWith('invite-')) {
        toast({
          title: "Atenção",
          description: "As permissões serão salvas quando o assessor aceitar o convite.",
        });
        onOpenChange(false);
      }
      return;
    }

    setSaving(true);
    try {
      const upsertData = permissions.map(permission => ({
        user_id: assessor.id,
        cabinet_id: activeInstitution.cabinet_id,
        permission_module: permission.permission_module,
        can_read: permission.can_read,
        can_write: permission.can_write,
        can_delete: permission.can_delete,
      }));

      const { error } = await (supabase as any)
        .from('assessor_permissions')
        .upsert(upsertData, { onConflict: 'user_id,cabinet_id,permission_module' });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso"
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar permissões",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getPermissionForModule = (moduleKey: string): Permission | undefined => {
    return permissions.find(p => p.permission_module === moduleKey);
  };

  const getPermissionSummary = (permission: Permission | undefined) => {
    if (!permission) return [];
    const items = [];
    if (permission.can_read) items.push({ label: 'Leitura', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' });
    if (permission.can_write) items.push({ label: 'Edição', color: 'bg-green-500/10 text-green-600 border-green-500/20' });
    if (permission.can_delete) items.push({ label: 'Exclusão', color: 'bg-red-500/10 text-red-600 border-red-500/20' });
    return items;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] bg-card/60 backdrop-blur-xl border-border/40 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col p-6 overflow-hidden">
        <DialogHeader className="mb-3">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold font-outfit uppercase tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-primary" />
            </div>
            Permissões: {assessor?.nome}
          </DialogTitle>
          {assessor?.id.startsWith('invite-') && (
            <p className="text-xs text-amber-500 mt-1">⚠ Assessor com convite pendente — as permissões serão aplicadas após o aceite.</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar py-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 animate-pulse">Carregando permissões...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PERMISSION_MODULES.map((module) => {
                const permission = getPermissionForModule(module.key);
                const Icon = module.icon;
                const summary = getPermissionSummary(permission);

                return (
                  <Card key={module.key} className="bg-card/40 backdrop-blur-md border border-border/40 rounded-xl hover:border-primary/20 transition-all duration-300 overflow-hidden group">
                    <CardHeader className="pb-2 bg-primary/[0.02] border-b border-border/10 p-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-xs font-bold font-outfit uppercase tracking-tight">
                          <div className="w-7 h-7 rounded-lg bg-background/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Icon className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                          </div>
                          {module.name}
                        </CardTitle>
                      </div>
                      {/* Preview das permissões atuais */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {summary.length > 0 ? (
                          summary.map((item) => (
                            <Badge key={item.label} variant="outline" className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0 ${item.color}`}>
                              {item.label}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0 bg-muted/20 text-muted-foreground/40 border-muted-foreground/10">
                            Sem acesso
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-3 p-3">
                      <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                        <Label htmlFor={`${module.key}-read`} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 cursor-pointer">
                          <Eye className="h-3 w-3" />
                          Visualizar
                        </Label>
                        <Switch
                          id={`${module.key}-read`}
                          checked={permission?.can_read || false}
                          onCheckedChange={(checked) => updatePermission(module.key, 'can_read', checked)}
                          className="data-[state=checked]:bg-blue-500 scale-90"
                        />
                      </div>

                      <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                        <Label htmlFor={`${module.key}-write`} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 cursor-pointer">
                          <Pencil className="h-3 w-3" />
                          Editar/Criar
                        </Label>
                        <Switch
                          id={`${module.key}-write`}
                          checked={permission?.can_write || false}
                          onCheckedChange={(checked) => updatePermission(module.key, 'can_write', checked)}
                          className="data-[state=checked]:bg-green-500 scale-90"
                        />
                      </div>

                      <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                        <Label htmlFor={`${module.key}-delete`} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 cursor-pointer text-destructive/60">
                          <Trash2 className="h-3 w-3" />
                          Excluir
                        </Label>
                        <Switch
                          id={`${module.key}-delete`}
                          checked={permission?.can_delete || false}
                          onCheckedChange={(checked) => updatePermission(module.key, 'can_delete', checked)}
                          className="data-[state=checked]:bg-destructive scale-90"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 pt-4 border-t border-border/10">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="flex-1 h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all"
          >
            Cancelar
          </Button>
          <Button
            onClick={savePermissions}
            disabled={loading || saving}
            className="flex-[1.5] h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {saving ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};