import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, RotateCcw, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface SimpleTrashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore?: () => void;
}

interface DeletedCamara {
  id: string;
  nome: string;
  deleted_at: string;
  cidades?: {
    nome: string;
    estados: { nome: string; sigla: string };
  };
}

export function SimpleTrashModal({ open, onOpenChange, onRestore }: SimpleTrashModalProps) {
  const [deletedCamaras, setDeletedCamaras] = useState<DeletedCamara[]>([]);
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (open) {
      fetchDeletedCamaras();
    }
  }, [open]);

  const fetchDeletedCamaras = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("camaras")
        .select(`
          id,
          nome,
          deleted_at,
          cidades (
            nome,
            estados (
              nome,
              sigla
            )
          )
        `)
        .eq("is_deleted", true)
        .order("deleted_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar itens da lixeira");
        return;
      }

      // Transform data to properly handle array relationships
      const transformedData = (data || []).map(camara => ({
        ...camara,
        cidades: Array.isArray(camara.cidades) && camara.cidades.length > 0
          ? {
            nome: camara.cidades[0].nome,
            estados: Array.isArray(camara.cidades[0].estados) && camara.cidades[0].estados.length > 0
              ? camara.cidades[0].estados[0]
              : { nome: '', sigla: '' }
          }
          : undefined
      }));

      setDeletedCamaras(transformedData);
    } catch (error) {
      toast.error("Erro inesperado ao carregar lixeira");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (camaraId: string) => {
    try {
      const { error } = await supabase
        .from("camaras")
        .update({
          is_deleted: false,
          deleted_at: null
        })
        .eq("id", camaraId);

      if (error) {
        toast.error("Erro ao restaurar instituição");
        return;
      }

      toast.success("Instituição restaurada com sucesso!");
      fetchDeletedCamaras();
      onRestore?.();
    } catch (error) {
      toast.error("Erro inesperado ao restaurar instituição");
    }
  };

  const handlePermanentDelete = async (camaraId: string) => {
    const confirmed = await confirm({
      title: "Exclusão Permanente",
      description: "Tem certeza que deseja excluir permanentemente? Esta ação não pode ser desfeita!",
      variant: "destructive",
      confirmText: "Excluir Permanentemente",
      cancelText: "Manter"
    });

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from("camaras")
        .delete()
        .eq("id", camaraId);

      if (error) {
        toast.error("Erro ao excluir permanentemente");
        return;
      }

      toast.success("Instituição excluída permanentemente!");
      fetchDeletedCamaras();
    } catch (error) {
      toast.error("Erro inesperado ao excluir permanentemente");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Lixeira ({deletedCamaras.length} itens)
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instituições Excluídas</CardTitle>
            <CardDescription>
              Gerencie as instituições que foram movidas para a lixeira
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : deletedCamaras.length === 0 ? (
              <div className="text-center py-8">
                <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma instituição na lixeira
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Excluída em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedCamaras.map((camara) => (
                    <TableRow key={camara.id}>
                      <TableCell>
                        <p className="font-medium">{camara.nome}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {camara.cidades?.nome}, {camara.cidades?.estados?.sigla}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {new Date(camara.deleted_at).toLocaleDateString("pt-BR")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore(camara.id)}
                            className="gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restaurar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handlePermanentDelete(camara.id)}
                            className="gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}