import { useAuthContext } from "@/components/AuthProvider";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useRealEleitores } from "@/hooks/useRealEleitores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DataDebug = () => {
  const { user, session } = useAuthContext();
  const { activeInstitution, loading: institutionLoading, error: institutionError } = useActiveInstitution();
  const { eleitores, loading: eleitoresLoading, error: eleitoresError } = useRealEleitores();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md max-h-96 overflow-auto">
      <Card className="bg-background/95 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm">Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-xs font-semibold">Auth:</p>
            <pre className="text-xs bg-muted p-2 rounded">
              {JSON.stringify({
                hasUser: !!user,
                userId: user?.id,
                email: user?.email,
                hasSession: !!session
              }, null, 2)}
            </pre>
          </div>
          
          <div>
            <p className="text-xs font-semibold">Institution:</p>
            <pre className="text-xs bg-muted p-2 rounded">
              {JSON.stringify({
                cabinet_id: activeInstitution?.cabinet_id,
                role: activeInstitution?.user_role,
                loading: institutionLoading,
                error: institutionError
              }, null, 2)}
            </pre>
          </div>
          
          <div>
            <p className="text-xs font-semibold">Eleitores:</p>
            <pre className="text-xs bg-muted p-2 rounded">
              {JSON.stringify({
                count: eleitores?.length || 0,
                loading: eleitoresLoading,
                error: eleitoresError,
                firstEleitor: eleitores?.[0] ? {
                  id: eleitores[0].id,
                  name: eleitores[0].name,
                  gabinete_id: eleitores[0].gabinete_id
                } : null
              }, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
