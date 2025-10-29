import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const kpiCardVariants = cva(
  'p-4 sm:p-6 transition-smooth hover:shadow-elegant',
  {
    variants: {
      variant: {
        default: 'bg-card border-border/50 shadow-card',
        success: 'bg-success/5 border-success/20 shadow-card',
        warning: 'bg-warning/5 border-warning/20 shadow-card',
        error: 'bg-destructive/5 border-destructive/20 shadow-card',
        info: 'bg-primary/5 border-primary/20 shadow-card',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface KPICardProps extends VariantProps<typeof kpiCardVariants> {
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

export const KPICard = ({ 
  title, 
  value, 
  change, 
  icon, 
  loading, 
  variant,
  className 
}: KPICardProps) => {
  return (
    <Card className={cn(kpiCardVariants({ variant }), className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-muted animate-pulse-subtle rounded" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
          )}
          {change && !loading && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className={cn(
                'font-medium',
                change.isPositive !== false ? 'text-success' : 'text-destructive'
              )}>
                {change.isPositive !== false ? '↑' : '↓'} {Math.abs(change.value)}%
              </span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'rounded-lg p-2.5 sm:p-3 shrink-0',
            variant === 'success' && 'bg-success/10 text-success',
            variant === 'warning' && 'bg-warning/10 text-warning',
            variant === 'error' && 'bg-destructive/10 text-destructive',
            variant === 'info' && 'bg-primary/10 text-primary',
            !variant && 'bg-primary/10 text-primary'
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
