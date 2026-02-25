import { Lock, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const MetaCard = () => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className="bg-muted p-1.5 rounded-lg">
            <Share2 className="h-4 w-4 text-blue-600" />
          </div>
          Meta Business
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700">
            Em breve
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Integração com Facebook e Instagram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-1 pt-0">
        <div className="text-xs text-muted-foreground">
          • Monitoramento de engajamento
          • Sistema de pontuação por curtidas
          • Análise de comentários e shares
          • Ranking de assessores engajados
        </div>
      </CardContent>
      <CardContent className="pt-0">
        <Button 
          variant="outline" 
          size="sm"
          disabled
          className="w-full cursor-not-allowed opacity-60"
        >
          <Lock className="mr-2 h-3 w-3" />
          Conectar Meta
        </Button>
      </CardContent>
    </Card>
  );
};