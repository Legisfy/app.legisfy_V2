import { useState, useEffect } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";

export const LogoUploadCard = () => {
  const { gabineteData, logoUploading, uploadLogo } = useGabineteConfig();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(Date.now());

  useEffect(() => {
    if (gabineteData?.logomarca_url) {
      setLogoPreview(null);
      setImageKey(Date.now());
    }
  }, [gabineteData?.logomarca_url]);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    const result = await uploadLogo(file);
    if (result) {
      // Add cache-buster to force browser reload
      const cacheBusted = result.includes('?') ? `${result}&t=${Date.now()}` : `${result}?t=${Date.now()}`;
      setLogoPreview(cacheBusted);
      setImageKey(Date.now());
    }
  };

  const currentLogo = logoPreview || gabineteData?.logomarca_url;

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Identidade</span>
        </div>

        {/* Preview area */}
        <div className="h-28 bg-muted/50 rounded-lg flex items-center justify-center border border-border/50">
          {currentLogo ? (
            <img
              key={`logo-preview-${imageKey}`}
              src={`${currentLogo}${currentLogo.includes('?') ? '&' : '?'}t=${imageKey}`}
              alt="Logomarca atual"
              className="max-w-full max-h-24 object-contain mx-auto"
            />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-1">
              <Upload className="h-6 w-6 opacity-30" />
              <span className="text-[10px] font-medium opacity-50">Sem logo</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Logomarca do Gabinete</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            SVG ou PNG com fundo transparente para documentos oficiais.
          </p>

          <Input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
            disabled={logoUploading}
          />
          <Label htmlFor="logo-upload" className="cursor-pointer w-full block">
            <Button
              disabled={logoUploading}
              className="w-full h-9 text-xs font-semibold rounded-lg pointer-events-none"
              variant="outline"
            >
              {logoUploading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Subindo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  {currentLogo ? 'Alterar Logo' : 'Enviar Logo'}
                </>
              )}
            </Button>
          </Label>
          <p className="text-[10px] text-muted-foreground text-center">
            PNG, JPG, SVG (Máx 5MB)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};