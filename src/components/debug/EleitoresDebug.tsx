import { useRealEleitores } from "@/hooks/useRealEleitores";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useAuthContext } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EleitoresDebug = () => {
  const { user } = useAuthContext();
  const { activeInstitution, loading: institutionLoading, error: institutionError } = useActiveInstitution();
  const { eleitores, loading: eleitoresLoading, error: eleitoresError } = useRealEleitores();

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug - Auth</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify({
              hasUser: !!user,
              userId: user?.id,
              userEmail: user?.email
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug - Active Institution</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify({
              activeInstitution,
              institutionLoading,
              institutionError
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug - Eleitores</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify({
              eleitoresCount: eleitores?.length || 0,
              eleitoresLoading,
              eleitoresError,
              firstEleitor: eleitores?.[0] || null
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};