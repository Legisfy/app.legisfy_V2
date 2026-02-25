import { usePermissions } from "@/hooks/usePermissions";
import { useAuthContext } from "@/components/AuthProvider";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export const PermissionDebugger = () => {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const { permissions, loading, hasPermission } = usePermissions();

  if (!user || loading) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Debug: Permissões do Usuário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Usuário:</strong> {user.email}
        </div>
        <div>
          <strong>Gabinete:</strong> {activeInstitution?.cabinet_name || 'N/A'}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(permissions).map(([module, perms]) => (
            <div key={module} className="space-y-2">
              <h4 className="font-medium capitalize">{module}</h4>
              <div className="space-y-1">
                <Badge variant={perms.can_read ? "default" : "secondary"}>
                  Ler: {perms.can_read ? "✓" : "✗"}
                </Badge>
                <Badge variant={perms.can_write ? "default" : "secondary"}>
                  Escrever: {perms.can_write ? "✓" : "✗"}
                </Badge>
                <Badge variant={perms.can_delete ? "default" : "secondary"}>
                  Excluir: {perms.can_delete ? "✓" : "✗"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Testes de Permissão:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Criar evento: {hasPermission('agenda', 'write') ? "✓" : "✗"}</div>
            <div>Criar eleitor: {hasPermission('eleitores', 'write') ? "✓" : "✗"}</div>
            <div>Criar demanda: {hasPermission('demandas', 'write') ? "✓" : "✗"}</div>
            <div>Ver indicações: {hasPermission('indicacoes', 'read') ? "✓" : "✗"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};