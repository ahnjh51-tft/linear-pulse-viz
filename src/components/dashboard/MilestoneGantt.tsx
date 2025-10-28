import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Milestone {
  id: string;
  name: string;
  targetDate?: string;
  description?: string;
  progress?: number;
  issues?: any[];
}

interface MilestoneGanttProps {
  milestones: Milestone[];
  onMilestoneClick?: (milestone: Milestone) => void;
  className?: string;
}

export const MilestoneGantt = ({ milestones, onMilestoneClick, className }: MilestoneGanttProps) => {
  const { startDate, endDate, totalDays } = useMemo(() => {
    if (!milestones.length) return { startDate: new Date(), endDate: new Date(), totalDays: 0 };

    const dates = milestones
      .filter(m => m.targetDate)
      .map(m => new Date(m.targetDate!));

    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);

    return {
      startDate: start,
      endDate: end,
      totalDays: differenceInDays(end, start),
    };
  }, [milestones]);

  const getMilestonePosition = (targetDate: string) => {
    const date = new Date(targetDate);
    const daysPassed = differenceInDays(date, startDate);
    return (daysPassed / totalDays) * 100;
  };

  const getMilestoneStatus = (milestone: Milestone) => {
    if (!milestone.targetDate) return 'planned';
    const now = new Date();
    const target = new Date(milestone.targetDate);
    const progress = milestone.progress || 0;

    if (progress >= 1) return 'completed';
    if (isAfter(now, target)) return 'overdue';
    if (differenceInDays(target, now) <= 7) return 'at-risk';
    return 'on-track';
  };

  const statusConfig = {
    completed: { color: 'bg-success', text: 'text-success', label: 'Completed' },
    overdue: { color: 'bg-destructive', text: 'text-destructive', label: 'Overdue' },
    'at-risk': { color: 'bg-warning', text: 'text-warning', label: 'At Risk' },
    'on-track': { color: 'bg-primary', text: 'text-primary', label: 'On Track' },
    planned: { color: 'bg-muted-foreground', text: 'text-muted-foreground', label: 'Planned' },
  };

  if (!milestones.length) {
    return (
      <Card className="p-12 text-center bg-card border-border/50">
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No milestones to display</p>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('space-y-6', className)}>
        {/* Timeline Header */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{format(startDate, 'MMM d, yyyy')}</span>
          <span>{format(endDate, 'MMM d, yyyy')}</span>
        </div>

        {/* Gantt Chart */}
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const status = getMilestoneStatus(milestone);
            const config = statusConfig[status];
            const progress = milestone.progress || 0;
            const completedIssues = milestone.issues?.filter(i => i.state?.type === 'completed').length || 0;
            const totalIssues = milestone.issues?.length || 0;

            return (
              <div key={milestone.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-40 flex-shrink-0">
                    <button
                      onClick={() => onMilestoneClick?.(milestone)}
                      className="text-sm font-medium text-left hover:text-primary transition-smooth truncate block w-full"
                    >
                      {milestone.name}
                    </button>
                    <div className="text-xs text-muted-foreground">
                      {totalIssues > 0 ? `${completedIssues}/${totalIssues} issues` : 'No issues'}
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative h-8 bg-secondary/30 rounded-lg overflow-hidden">
                    {/* Progress Bar */}
                    {milestone.targetDate && (
                      <div
                        className="absolute top-0 left-0 h-full"
                        style={{ width: `${getMilestonePosition(milestone.targetDate)}%` }}
                      >
                        <div className={cn('h-full', config.color, 'opacity-30')} />
                      </div>
                    )}

                    {/* Milestone Marker */}
                    {milestone.targetDate && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-0 h-full w-1 cursor-pointer hover:w-2 transition-all"
                            style={{ left: `${getMilestonePosition(milestone.targetDate)}%` }}
                          >
                            <div className={cn('h-full w-full', config.color)} />
                            <div className={cn(
                              'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-0',
                              'w-3 h-3 rounded-full border-2 border-background',
                              config.color
                            )} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover border-border">
                          <div className="space-y-1">
                            <p className="font-medium">{milestone.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {format(new Date(milestone.targetDate), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Progress: {Math.round(progress * 100)}%
                            </p>
                            <Badge variant="outline" className={cn('text-xs', config.text)}>
                              {config.label}
                            </Badge>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Current Date Indicator */}
                    {(() => {
                      const now = new Date();
                      const isInRange = isAfter(now, startDate) && isBefore(now, endDate);
                      if (!isInRange) return null;

                      const position = (differenceInDays(now, startDate) / totalDays) * 100;
                      return (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-foreground/40 z-10"
                          style={{ left: `${position}%` }}
                        >
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-foreground" />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Status Badge */}
                  <Badge variant="outline" className={cn('w-24 justify-center', config.text)}>
                    {status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {status === 'overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {config.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>On Track</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span>At Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-foreground/40" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
