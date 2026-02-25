import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, UserPlus, Shield, Calendar, Users, FileText, MapPin, Globe, Gavel } from "lucide-react";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useEmailInvitations, InvitationRole } from "@/hooks/useEmailInvitations";
import { cn } from "@/lib/utils";

interface AddAssessorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteCreated?: () => void;
}

type PermissionLevel = 'permitido' | 'somente_ver' | 'sem_permissao';

interface ModulePermission {
  key: string;
  name: string;
  icon: React.ElementType;
  level: PermissionLevel;
}

const DEFAULT_MODULES: ModulePermission[] = [
  { key: 'demandas', name: 'Demandas', icon: FileText, level: 'permitido' },
  { key: 'indicacoes', name: 'Indicações', icon: MapPin, level: 'permitido' },
  { key: 'agenda', name: 'Agenda', icon: Calendar, level: 'permitido' },
  { key: 'eleitores', name: 'Eleitores', icon: Users, level: 'permitido' },
  { key: 'projetos_lei', name: 'Projeto de Lei', icon: Gavel, level: 'permitido' },
  { key: 'publicos', name: 'Público', icon: Globe, level: 'permitido' },
];

const PERMISSION_LABELS: Record<PermissionLevel, { label: string; color: string }> = {
  'permitido': { label: 'Permitido', color: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' },
  'somente_ver': { label: 'Somente ver', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' },
  'sem_permissao': { label: 'Sem permissão', color: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400' },
};

export const AddAssessorModal = ({ open, onOpenChange, onInviteCreated }: AddAssessorModalProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<InvitationRole>("assessor");
  const [permissions, setPermissions] = useState<ModulePermission[]>([...DEFAULT_MODULES]);
  const { toast } = useToast();
  const { activeInstitution } = useActiveInstitution();
  const { createInvitation, loading: isLoading } = useEmailInvitations();

  const updatePermissionLevel = (moduleKey: string, level: PermissionLevel) => {
    setPermissions(prev =>
      prev.map(p => p.key === moduleKey ? { ...p, level } : p)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name || !role) {
      toast({
        title: "Erro",
        description: "Por favor, informe o nome, email e tipo do membro da equipe.",
        variant: "destructive",
      });
      return;
    }

    if (!activeInstitution?.cabinet_id) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar o gabinete ativo.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert permissions to the format expected by the backend
      const permissionsData = role === 'assessor' ? permissions.reduce((acc, p) => {
        acc[p.key] = {
          can_read: p.level === 'permitido' || p.level === 'somente_ver',
          can_write: p.level === 'permitido',
          can_delete: p.level === 'permitido',
        };
        return acc;
      }, {} as Record<string, { can_read: boolean; can_write: boolean; can_delete: boolean }>) : undefined;

      await createInvitation({
        email: email.trim(),
        name: name.trim(),
        role: role,
        institution_id: activeInstitution.cabinet_id,
        cabinet_name: activeInstitution.cabinet_name,
        permissions: permissionsData,
      });

      // Notificar que um convite foi criado
      onInviteCreated?.();

      // Limpar formulário e fechar modal
      setEmail("");
      setName("");
      setRole("assessor");
      setPermissions([...DEFAULT_MODULES]);
      onOpenChange(false);
    } catch (error: any) {
      // Error handling is done in the hook
      console.error('Erro ao enviar convite:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] bg-card/60 backdrop-blur-xl border-border/40 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold font-outfit">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            Convidar Membro
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground/60 font-medium">
            Envie um convite exclusivo para integrar um novo membro à sua equipe de gabinete.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pt-3 px-1">
          <div className="space-y-2">
            <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Função no Gabinete</Label>
            <Select value={role} onValueChange={(value: InvitationRole) => setRole(value)}>
              <SelectTrigger className="h-12 bg-background/50 border-border/40 rounded-xl focus:ring-primary/20 transition-all">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-card/90 backdrop-blur-lg border-border/40 rounded-xl">
                <SelectItem value="assessor" className="rounded-lg">
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Assessor</p>
                      <p className="text-[10px] text-muted-foreground">Acesso operacional configurável</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="chefe" className="rounded-lg">
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Chefe de Gabinete</p>
                      <p className="text-[10px] text-muted-foreground">Acesso administrativo total</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Nome Completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 bg-background/50 border-border/40 rounded-xl focus-visible:ring-primary/20 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">E-mail Profissional</Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-12 bg-background/50 border-border/40 rounded-xl focus-visible:ring-primary/20 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Permissões - só aparece para assessor */}
          {role === 'assessor' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary/60" />
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Configurar Permissões</Label>
              </div>
              <div className="bg-muted/10 border border-border/30 rounded-2xl overflow-hidden">
                {/* Header da tabela */}
                <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-4 py-2.5 bg-muted/20 border-b border-border/20">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Módulo</span>
                  <div className="grid grid-cols-3 gap-1 w-[240px]">
                    {(['somente_ver', 'permitido', 'sem_permissao'] as PermissionLevel[]).map(level => (
                      <span key={level} className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/40 text-center">
                        {PERMISSION_LABELS[level].label}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Linhas de permissão */}
                <div className="divide-y divide-border/10">
                  {permissions.map((module) => {
                    const Icon = module.icon;
                    return (
                      <div key={module.key} className="grid grid-cols-[1fr_auto] items-center gap-2 px-4 py-2.5 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                            <Icon className="h-3.5 w-3.5 text-primary/60" />
                          </div>
                          <span className="text-xs font-bold text-foreground/80">{module.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 w-[240px]">
                          {(['somente_ver', 'permitido', 'sem_permissao'] as PermissionLevel[]).map(level => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => updatePermissionLevel(module.key, level)}
                              className={cn(
                                "h-7 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all duration-200",
                                module.level === level
                                  ? PERMISSION_LABELS[level].color
                                  : "bg-transparent border-transparent text-muted-foreground/30 hover:bg-muted/20 hover:text-muted-foreground/50"
                              )}
                            >
                              {module.level === level ? '●' : '○'}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700" />
            <h4 className="font-bold text-xs uppercase tracking-widest text-primary mb-2">
              Fluxo de Segurança:
            </h4>
            <ul className="text-xs text-foreground/70 space-y-1.5 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1 shrink-0" />
                Um link exclusivo de acesso será enviado ao e-mail informado.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1 shrink-0" />
                O novo membro deverá validar a conta e definir sua credencial.
              </li>
              <li className="flex items-start gap-2 font-bold text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                {role === 'chefe' ? "Atenção: Privilégios administrativos plenos concedidos." : "Permissões configuradas acima serão aplicadas automaticamente."}
              </li>
            </ul>
          </div>

          <DialogFooter className="gap-3 pt-2 pb-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all"
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {isLoading ? "PROCESSANDO..." : "ENVIAR CONVITE SEGURO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};