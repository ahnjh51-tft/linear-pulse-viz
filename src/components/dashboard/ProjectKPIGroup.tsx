import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Clock, AlertTriangle, Target, Activity } from 'lucide-react';

interface KPI {
  id: string;
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

interface ProjectKPIGroupProps {
  kpis: KPI[];
  healthStatus: 'on-track' | 'at-risk' | 'off-track';
  className?: string;
}

const healthConfig = {
  'on-track': {
    label: 'On Track',
    className: 'bg-success/10 text-success border-success',
    icon: Target,
  },
  'at-risk': {
    label: 'At Risk',
    className: 'bg-warning/10 text-warning border-warning',
    icon: AlertTriangle,
  },
  'off-track': {
    label: 'Off Track',
    className: 'bg-destructive/10 text-destructive border-destructive',
    icon: Clock,
  },
};

export const ProjectKPIGroup = ({ kpis, healthStatus, className }: ProjectKPIGroupProps) => {
  const health = healthConfig[healthStatus];
  const HealthIcon = health.icon;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Health Status Badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Health</h3>
        <Badge variant="outline" className={cn('gap-2', health.className)}>
          <HealthIcon className="w-4 h-4" />
          {health.label}
        </Badge>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.id}
            onClick={kpi.onClick}
            className={cn(
              'p-4 bg-card border-border/50 shadow-card transition-smooth hover:shadow-elegant',
              kpi.onClick && 'cursor-pointer hover:border-primary/50'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </span>
                {kpi.icon && (
                  <div className="text-primary/60">
                    {kpi.icon}
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.trend && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  kpi.trend.isPositive ? 'text-success' : 'text-destructive'
                )}>
                  {kpi.trend.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(kpi.trend.value)}%</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
