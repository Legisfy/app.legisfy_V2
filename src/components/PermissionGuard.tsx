import { usePermissions } from '@/hooks/usePermissions';
import { ShieldX } from 'lucide-react';

interface PermissionGuardProps {
    module: 'agenda' | 'eleitores' | 'demandas' | 'projetos_lei' | 'indicacoes' | 'publicos';
    action?: 'read' | 'write' | 'delete';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const DefaultFallback = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive/60" />
        </div>
        <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-foreground/80">Acesso Restrito</h2>
            <p className="text-sm text-muted-foreground/60">
                Você não tem permissão para acessar esta área. Contate o administrador do gabinete.
            </p>
        </div>
    </div>
);

export const PermissionGuard = ({ module, action = 'read', children, fallback }: PermissionGuardProps) => {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
        return null;
    }

    if (!hasPermission(module, action)) {
        return fallback ? <>{fallback}</> : <DefaultFallback />;
    }

    return <>{children}</>;
};
