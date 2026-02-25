import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function DebugPoliticoLogin() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(null);

  const checkUserStatus = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-politico-login', {
        body: { action: 'check_user_status', email }
      });

      if (error) throw error;
      setResult({ type: 'status', data });
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-politico-login', {
        body: { action: 'test_login', email, password }
      });

      if (error) throw error;
      setResult({ type: 'login', data });
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!password) {
      setResult({ type: 'error', message: 'Por favor, digite a nova senha' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-politico-login', {
        body: { action: 'reset_password', email, password }
      });

      if (error) throw error;
      setResult({ type: 'reset', data });
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Debug Político Login</CardTitle>
          <CardDescription>
            Ferramenta para testar e debugar login de políticos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Político</Label>
            <Input
              id="email"
              type="email"
              placeholder="politico@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite a senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={checkUserStatus}
              disabled={loading || !email}
              variant="outline"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verificar Status
            </Button>

            <Button
              onClick={testLogin}
              disabled={loading || !email || !password}
              variant="default"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Testar Login
            </Button>

            <Button
              onClick={resetPassword}
              disabled={loading || !email || !password}
              variant="destructive"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Resetar Senha
            </Button>
          </div>

          {result && (
            <Alert variant={result.type === 'error' ? 'destructive' : 'default'}>
              <div className="flex items-start gap-2">
                {result.type === 'error' ? (
                  <XCircle className="h-5 w-5 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <pre className="text-xs overflow-auto max-h-96 p-2 bg-muted rounded">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              <strong>Como usar:</strong>
              <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                <li><strong>Verificar Status:</strong> Mostra informações do usuário, perfil e gabinete</li>
                <li><strong>Testar Login:</strong> Tenta fazer login com as credenciais fornecidas</li>
                <li><strong>Resetar Senha:</strong> Redefine a senha do político (use com cuidado)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
