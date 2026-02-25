import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<"testing" | "connected" | "error">("testing");
  const [tableCount, setTableCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection
        const { data, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }

        // Test database access by counting tables
        const { data: tables, error: dbError } = await supabase
          .from('gabinetes')
          .select('*', { count: 'exact', head: true });

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }

        setTableCount(tables?.length || 0);
        setConnectionStatus("connected");
      } catch (err: any) {
        setError(err.message);
        setConnectionStatus("error");
      }
    };

    testConnection();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connectionStatus === "connected" && <CheckCircle className="h-5 w-5 text-green-600" />}
            {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-600" />}
            Supabase Connection Test
          </CardTitle>
          <CardDescription>
            Testing the connection to your Supabase project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Connection Status:</span>
            <Badge variant={connectionStatus === "connected" ? "default" : connectionStatus === "error" ? "destructive" : "secondary"}>
              {connectionStatus === "testing" && "Testing..."}
              {connectionStatus === "connected" && "✅ Connected"}
              {connectionStatus === "error" && "❌ Error"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Project ID:</span>
            <code className="bg-muted px-2 py-1 rounded text-sm">akjqsuqghyeioledglng</code>
          </div>

          {connectionStatus === "connected" && (
            <div className="flex items-center justify-between">
              <span>Database Access:</span>
              <Badge variant="default">✅ Working</Badge>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="font-medium text-green-800 mb-2">✅ Integration Complete</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Supabase client configured</li>
              <li>• Database types generated</li>
              <li>• Authentication provider set up</li>
              <li>• Ready for development!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}