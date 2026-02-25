import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StandardCardProps {
  title: string;
  description?: string;
  value?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export const StandardCard = ({
  title,
  description,
  value,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  className,
  children,
  onClick,
  ...props
}: StandardCardProps) => {
  return (
    <Card
      className={cn(
        "relative hover:shadow-md transition-all duration-200 border-none",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-[10px]">
              {description}
            </CardDescription>
          )}
        </div>
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg",
          iconBgColor
        )}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </CardHeader>
      {(value || children) && (
        <CardContent className="pt-0">
          {value && (
            <div className="text-xl font-bold text-foreground mb-1">
              {value}
            </div>
          )}
          {children}
        </CardContent>
      )}
    </Card>
  );
};

// Variações pré-definidas para diferentes tipos
export const StatsCard = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  iconBgColor,
  className
}: StandardCardProps & { change?: string }) => {
  const isPositive = change?.startsWith('+');
  const isNegative = change?.startsWith('-');
  const changeColor = isPositive
    ? "text-emerald-500 bg-emerald-500/5"
    : isNegative
      ? "text-rose-500 bg-rose-500/5"
      : "text-muted-foreground bg-muted/5";

  return (
    <Card className={cn(
      "transition-all duration-300 border border-border/40 bg-card/95 dark:bg-card/20 backdrop-blur-sm group hover:border-border/60 shadow-none",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className={cn(
          "p-2 rounded-lg flex items-center justify-center transition-all duration-500",
          iconBgColor,
          "bg-opacity-[0.15] dark:bg-opacity-10 border border-black/5 dark:border-white/5"
        )}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        {change && (
          <Badge variant="outline" className={cn("border-none font-bold text-[9px] px-1.5 py-0 rounded-md", changeColor)}>
            {change}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-0 pb-5">
        <p className="text-[9px] uppercase font-bold text-muted-foreground/80 dark:text-muted-foreground/50 tracking-[0.15em] mb-1">
          {title}
        </p>
        <h3 className="text-xl font-bold text-foreground font-outfit tracking-tight group-hover:text-primary/80 transition-colors duration-300">
          {value}
        </h3>
      </CardContent>
    </Card>
  );
};

export const ActionCard = ({ ...props }: StandardCardProps) => (
  <StandardCard
    {...props}
    className={cn("border-2 border-dashed border-muted-foreground/20 hover:border-primary/40", props.className)}
  />
);

export const InfoCard = ({ ...props }: StandardCardProps) => (
  <StandardCard
    {...props}
    className={cn("bg-muted/30", props.className)}
  />
);