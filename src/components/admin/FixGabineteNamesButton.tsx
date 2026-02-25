import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Wrench } from "lucide-react";

export const FixGabineteNamesButton = () => {
  const [isFixing, setIsFixing] = useState(false);

  const handleFixNames = async () => {
    setIsFixing(true);
    try {
      console.log("🔧 Calling fix-gabinete-names function...");
      
      const { data, error } = await supabase.functions.invoke('fix-gabinete-names');
      
      if (error) {
        console.error("❌ Error calling function:", error);
        toast.error("Erro ao corrigir nomes: " + error.message);
        return;
      }

      console.log("✅ Function response:", data);
      
      if (data.success) {
        toast.success(`✅ ${data.message}. Processados: ${data.total_processed}, Atualizados: ${data.updated_count}`);
        // Refresh the page to show updated names
        window.location.reload();
      } else {
        toast.error("Erro: " + (data.error || "Falha na correção"));
      }
    } catch (error) {
      console.error("❌ Exception:", error);
      toast.error("Erro inesperado ao corrigir nomes dos gabinetes");
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      onClick={handleFixNames}
      disabled={isFixing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isFixing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wrench className="h-4 w-4" />
      )}
      {isFixing ? "Corrigindo..." : "Corrigir Nomes dos Gabinetes"}
    </Button>
  );
};