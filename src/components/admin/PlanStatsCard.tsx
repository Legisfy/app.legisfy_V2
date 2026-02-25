import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, TrendingUp } from 'lucide-react';

interface PlanStats {
  plan_id: string;
  plan_title: string;
  gabinetes_count: number;
  monthly_revenue: number;
  yearly_revenue: number;
}

interface PlanStatsCardProps {
  stat: PlanStats;
}

export const PlanStatsCard = ({ stat }: PlanStatsCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const annualDiscount = stat.yearly_revenue > 0 && stat.monthly_revenue > 0
    ? ((stat.monthly_revenue * 12 - stat.yearly_revenue) / (stat.monthly_revenue * 12)) * 100
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {stat.plan_title}
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {stat.gabinetes_count}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">MRR</span>
          </div>
          <span className="font-semibold">{formatCurrency(stat.monthly_revenue)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">ARR</span>
          </div>
          <span className="font-semibold">{formatCurrency(stat.yearly_revenue)}</span>
        </div>

        {annualDiscount > 0 && (
          <div className="text-xs text-muted-foreground">
            Desconto anual: {annualDiscount.toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
};