import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PromotionalBannerProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  imageSrc?: string;
  onClose?: () => void;
}

export function PromotionalBanner({
  title = "Promoção Especial",
  description = "Aproveite nossa oferta especial por tempo limitado!",
  buttonText = "Saiba Mais",
  buttonLink = "#",
  imageSrc,
  onClose
}: PromotionalBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center space-x-4 flex-1">
          {imageSrc && (
            <div className="hidden md:block">
              <img 
                src={imageSrc} 
                alt="Promotional" 
                className="w-16 h-16 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 md:mb-0">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            size="sm" 
            className="hidden md:inline-flex"
            onClick={() => window.open(buttonLink, '_blank')}
          >
            {buttonText}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Mobile button */}
      <div className="md:hidden px-4 pb-4">
        <Button 
          size="sm" 
          className="w-full"
          onClick={() => window.open(buttonLink, '_blank')}
        >
          {buttonText}
        </Button>
      </div>
    </Card>
  );
}