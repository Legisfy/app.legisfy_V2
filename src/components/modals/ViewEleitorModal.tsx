import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Home, FileText, Users, History } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ViewEleitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eleitor: any;
}

const getStatusTag = (eleitor: any) => {
  const indicacoes = eleitor.indicacoes || 0;
  const demandas = eleitor.demandas || 0;
  const indicacoesAtendidas = eleitor.indicacoesAtendidas || 0;
  const demandasAtendidas = eleitor.demandasAtendidas || 0;

  const totalItens = indicacoes + demandas;
  const totalAtendidos = indicacoesAtendidas + demandasAtendidas;

  if (totalItens === 0) return null;

  if (totalAtendidos === totalItens) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        😊 Atendido
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
        😠 Pendente
      </Badge>
    );
  }
};

export function ViewEleitorModal({ open, onOpenChange, eleitor }: ViewEleitorModalProps) {
  const navigate = useNavigate();

  if (!eleitor) return null;

  const handleViewHistory = () => {
    onOpenChange(false);
    navigate(`/eleitores/${eleitor.id}/historico`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-white/5">
          <DialogTitle className="text-lg font-bold">Informações do Eleitor</DialogTitle>
        </DialogHeader>

        <div className="p-4 md:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Informações Pessoais */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-100 dark:border-white/5">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-white dark:border-zinc-800 shadow-sm">
                <AvatarImage src={eleitor.profile_photo_url} alt={eleitor.name || 'Eleitor'} />
                <AvatarFallback
                  className={`text-lg font-bold ${eleitor.sex === 'masculino' ? 'bg-blue-500 text-white' :
                      eleitor.sex === 'feminino' ? 'bg-pink-500 text-white' :
                        'bg-gray-500 text-white'
                    }`}
                >
                  {eleitor.name ? eleitor.name.split(' ').map((n: string) => n[0]).join('') : 'E'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">{eleitor.name || 'Nome não informado'}</h3>
                {eleitor.birth_date && (
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {Math.floor((new Date().getTime() - new Date(eleitor.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} anos
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-4">
              {eleitor.whatsapp && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{eleitor.whatsapp}</span>
                </div>
              )}
              {eleitor.email && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{eleitor.email}</span>
                </div>
              )}
              {eleitor.neighborhood && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{eleitor.neighborhood}</span>
                </div>
              )}
              {eleitor.address && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Home className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{eleitor.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Classificação</p>
              <div className="flex flex-wrap gap-1.5">
                {eleitor.tags && Array.isArray(eleitor.tags) && eleitor.tags.length > 0 ? eleitor.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-bold uppercase py-0.5">
                    {tag}
                  </Badge>
                )) : (
                  <span className="text-xs text-muted-foreground font-medium italic">Sem tags</span>
                )}
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status Geral</p>
              <div>{getStatusTag(eleitor) || <span className="text-xs text-zinc-400">Nenhuma interação</span>}</div>
            </div>
          </div>

          {/* Estatísticas Detalhadas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50/50 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-500/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Indicações</p>
                <Users className="w-3.5 h-3.5 text-blue-500 opacity-50" />
              </div>
              <div className="text-2xl font-black text-blue-600">{eleitor.totalIndicacoes || 0}</div>
              <p className="text-[10px] font-bold text-blue-600/70 mb-2">
                {eleitor.indicacoesAtendidas || 0} atendidas
              </p>
              <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{
                    width: (eleitor.totalIndicacoes || 0) > 0
                      ? `${((eleitor.indicacoesAtendidas || 0) / (eleitor.totalIndicacoes || 1)) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-purple-50/50 dark:bg-purple-500/5 p-4 rounded-2xl border border-purple-100/50 dark:border-purple-500/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-500">Demandas</p>
                <FileText className="w-3.5 h-3.5 text-purple-500 opacity-50" />
              </div>
              <div className="text-2xl font-black text-purple-600">{eleitor.totalDemandas || 0}</div>
              <p className="text-[10px] font-bold text-purple-600/70 mb-2">
                {eleitor.demandasAtendidas || 0} atendidas
              </p>
              <div className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-full h-1.5">
                <div
                  className="bg-purple-500 h-1.5 rounded-full"
                  style={{
                    width: (eleitor.totalDemandas || 0) > 0
                      ? `${((eleitor.demandasAtendidas || 0) / (eleitor.totalDemandas || 1)) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleViewHistory} variant="outline" className="flex-1 h-11 rounded-xl font-bold border-zinc-200 dark:border-white/5 transition-all active:scale-95">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </Button>
            <Button onClick={() => onOpenChange(false)} className="px-8 h-11 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}