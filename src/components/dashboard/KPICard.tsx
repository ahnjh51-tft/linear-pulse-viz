import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive?: boolean;
  };
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}

export const KPICard = ({ title, value, change, icon, loading, className }: KPICardProps) => {
  return (
    <Card className={cn('p-6 bg-card border-border/50 shadow-card transition-smooth hover:shadow-elegant', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-muted animate-pulse-subtle rounded" />
          ) : (
            <p className="text-3xl font-bold">{value}</p>
          )}
          {change && (
            <div className="flex items-center gap-1 text-sm">
              <span className={change.isPositive !== false ? 'text-success' : 'text-destructive'}>
                {change.isPositive !== false ? '↑' : '↓'} {Math.abs(change.value)}%
              </span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
