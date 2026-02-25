import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, CheckCircle, AlertCircle, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  success: boolean;
  message: string;
  emailId?: string;
  timestamp?: string;
  error?: string;
}

const EmailTester = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailType, setEmailType] = useState("test");
  const [result, setResult] = useState<TestResult | null>(null);

  const testEmailConnection = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email para teste",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { email }
      });

      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "✅ Teste enviado!",
          description: "Verifique sua caixa de entrada"
        });
      } else {
        toast({
          title: "❌ Erro no teste",
          description: data.error || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro no teste de email:", error);
      setResult({
        success: false,
        message: "Erro na comunicação",
        error: error.message
      });
      toast({
        title: "Erro",
        description: error.message || "Erro na comunicação com o servidor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testTemplateEmail = async () => {
    if (!email || emailType === "test") {
      toast({
        title: "Erro",
        description: "Selecione um tipo de template para teste",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let payload: any = { 
        type: emailType, 
        email 
      };

      // Adicionar dados mock baseado no tipo
      switch (emailType) {
        case "invite_politico":
          payload = {
            ...payload,
            name: "João da Silva",
            institution: "Câmara Municipal de São Paulo",
            link: "https://app.legisfy.app.br/convite/aceitar?token=mock123"
          };
          break;
        case "welcome_politico":
          payload = {
            ...payload,
            name: "João da Silva",
            cabinet: "Gabinete do Vereador João da Silva"
          };
          break;
        case "invite_chefe":
          payload = {
            ...payload,
            name: "Maria Santos",
            cabinet: "Gabinete do Vereador João da Silva",
            link: "https://app.legisfy.app.br/convite/aceitar?token=mock456"
          };
          break;
        case "welcome_chefe":
          payload = {
            ...payload,
            name: "Maria Santos",
            cabinet: "Gabinete do Vereador João da Silva"
          };
          break;
        case "invite_assessor":
          payload = {
            ...payload,
            cabinet: "Gabinete do Vereador João da Silva",
            link: "https://app.legisfy.app.br/convite/aceitar?token=mock789"
          };
          break;
        case "welcome_assessor":
          payload = {
            ...payload,
            name: "Pedro Oliveira",
            cabinet: "Gabinete do Vereador João da Silva"
          };
          break;
      }

      const { data, error } = await supabase.functions.invoke('mail-dispatcher', {
        body: payload
      });

      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "✅ Template enviado!",
          description: `Email ${emailType} enviado com sucesso`
        });
      } else {
        toast({
          title: "❌ Erro no envio",
          description: data.error || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro no teste de template:", error);
      setResult({
        success: false,
        message: "Erro na comunicação",
        error: error.message
      });
      toast({
        title: "Erro",
        description: error.message || "Erro na comunicação com o servidor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Teste de Conexão - Resend
          </CardTitle>
          <CardDescription>
            Teste a configuração do sistema de emails do Legisfy
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Email para Teste</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={testEmailConnection} 
              disabled={loading || !email}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Testar Conexão
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Templates</CardTitle>
          <CardDescription>
            Teste os diferentes templates de email
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-type">Tipo de Email</Label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de email" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Selecione um tipo...</SelectItem>
                <SelectItem value="invite_politico">Convite Político</SelectItem>
                <SelectItem value="welcome_politico">Boas-vindas Político</SelectItem>
                <SelectItem value="invite_chefe">Convite Chefe</SelectItem>
                <SelectItem value="welcome_chefe">Boas-vindas Chefe</SelectItem>
                <SelectItem value="invite_assessor">Convite Assessor</SelectItem>
                <SelectItem value="welcome_assessor">Boas-vindas Assessor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={testTemplateEmail} 
            disabled={loading || !email || emailType === "test"}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando Template...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Testar Template
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado do Teste
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Status:</strong> {result.success ? "✅ Sucesso" : "❌ Erro"}</p>
                  <p><strong>Mensagem:</strong> {result.message}</p>
                  {result.emailId && (
                    <p><strong>ID do Email:</strong> {result.emailId}</p>
                  )}
                  {result.timestamp && (
                    <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString('pt-BR')}</p>
                  )}
                  {result.error && (
                    <p><strong>Erro:</strong> {result.error}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900">Instruções</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>1. <strong>Teste de Conexão:</strong> Verifica se o Resend está configurado corretamente</li>
                <li>2. <strong>Teste de Templates:</strong> Envia emails usando os templates reais do sistema</li>
                <li>3. Verifique sua caixa de entrada (e spam) após enviar os testes</li>
                <li>4. Se houver erro de domínio, configure o domínio no Resend</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTester;