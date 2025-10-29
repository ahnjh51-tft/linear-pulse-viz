import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = ({ className, variant = 'rectangular', ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      role="status"
      aria-label="Loading..."
      {...props}
    />
  );
};

export const KPICardSkeleton = () => (
  <div className="bg-card border border-border rounded-lg p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" className="h-4 w-24" />
      <Skeleton variant="circular" className="w-10 h-10" />
    </div>
    <Skeleton variant="text" className="h-8 w-16" />
    <Skeleton variant="text" className="h-3 w-20" />
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-card border border-border rounded-lg p-6 space-y-4">
    <Skeleton variant="text" className="h-6 w-48" />
    <Skeleton variant="rectangular" className="h-[300px] w-full" />
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
    <div className="flex items-center gap-4 flex-1">
      <Skeleton variant="circular" className="w-2 h-2" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" className="h-4 w-16" />
      <Skeleton variant="text" className="h-3 w-24" />
    </div>
  </div>
);

export const GanttSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="space-y-2">
        <Skeleton variant="text" className="h-4 w-32" />
        <Skeleton variant="rectangular" className="h-12 w-full" />
      </div>
    ))}
  </div>
);
