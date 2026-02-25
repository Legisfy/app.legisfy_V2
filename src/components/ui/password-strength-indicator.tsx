import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PasswordRequirement } from "@/utils/passwordValidation";

interface PasswordStrengthIndicatorProps {
  requirements: PasswordRequirement[];
  strength: number;
  className?: string;
}

export const PasswordStrengthIndicator = ({ 
  requirements, 
  strength, 
  className 
}: PasswordStrengthIndicatorProps) => {
  const getStrengthColor = (strength: number) => {
    if (strength < 40) return "bg-destructive";
    if (strength < 70) return "bg-warning";
    return "bg-success";
  };

  const getStrengthText = (strength: number) => {
    if (strength < 40) return "Senha fraca";
    if (strength < 70) return "Senha média";
    return "Senha forte";
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Barra de progresso */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Força da senha</span>
          <span>{getStrengthText(strength)}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", getStrengthColor(strength))}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requisitos */}
      <div className="space-y-1">
        {requirements.map((req) => (
          <div
            key={req.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.met ? "text-success" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};