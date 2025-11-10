import { useMemo, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMilestoneMetrics } from '@/hooks/useMilestoneMetrics';
import { format, differenceInDays } from 'date-fns';
import { getMilestoneStatusColor } from '@/lib/manager-chart-colors';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Milestone {
  id: string;
  name: string;
  targetDate: string;
  description?: string | null;
  sortOrder: number;
  issues?: {
    nodes: Array<{
      id: string;
      state: {
        type: string;
      };
    }>;
  };
}

interface EnhancedMilestoneGanttProps {
  milestones: Milestone[] | undefined;
  projectStartDate?: string;
  highlightedMilestoneId?: string;
  projectSelected?: boolean;
}

export const EnhancedMilestoneGantt = ({ 
  milestones, 
  projectStartDate,
  highlightedMilestoneId,
  projectSelected = true
}: EnhancedMilestoneGanttProps) => {
  const enrichedMilestones = useMilestoneMetrics(milestones, projectStartDate);
  const highlightedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedMilestoneId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedMilestoneId]);

  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (!enrichedMilestones || enrichedMilestones.length === 0) {
      return { timelineStart: new Date(), timelineEnd: new Date(), totalDays: 0 };
    }

    const start = enrichedMilestones[0].startDate;
    const end = enrichedMilestones[enrichedMilestones.length - 1].endDate;
    const days = differenceInDays(end, start);

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: days,
    };
  }, [enrichedMilestones]);

  const getPositionAndWidth = (startDate: Date, endDate: Date) => {
    const startOffset = differenceInDays(startDate, timelineStart);
    const duration = differenceInDays(endDate, startDate);
    
    const left = totalDays > 0 ? (startOffset / totalDays) * 100 : 0;
    const width = totalDays > 0 ? (duration / totalDays) * 100 : 0;
    
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const todayPosition = useMemo(() => {
    const today = new Date();
    const daysFromStart = differenceInDays(today, timelineStart);
    return totalDays > 0 ? (daysFromStart / totalDays) * 100 : 0;
  }, [timelineStart, totalDays]);

  if (!enrichedMilestones || enrichedMilestones.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            No milestones to display
          </p>
          <p className="text-sm text-muted-foreground">
            Add milestones in Linear to visualize project timeline
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Project Timeline</h3>
          <div className="text-sm text-muted-foreground">
            {format(timelineStart, 'MMM dd')} - {format(timelineEnd, 'MMM dd, yyyy')}
          </div>
        </div>

        <div className="relative">
          {/* Timeline Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-48 shrink-0" />
            <div className="flex-1 relative h-8 border-b border-border">
              <div className="absolute inset-0 flex items-end justify-between text-xs text-muted-foreground px-1">
                <span>{format(timelineStart, 'MMM dd')}</span>
                <span>{format(new Date((timelineStart.getTime() + timelineEnd.getTime()) / 2), 'MMM dd')}</span>
                <span>{format(timelineEnd, 'MMM dd')}</span>
              </div>
            </div>
            <div className="w-24 shrink-0" />
          </div>

          {/* Milestones */}
          <div className="space-y-3 relative">
            {enrichedMilestones.map((milestone) => {
              const position = getPositionAndWidth(milestone.startDate, milestone.endDate);
              const isHighlighted = milestone.id === highlightedMilestoneId;

              return (
                <div
                  key={milestone.id}
                  ref={isHighlighted ? highlightedRef : undefined}
                  className={`flex items-center gap-3 ${isHighlighted ? 'ring-2 ring-primary rounded-md p-1' : ''}`}
                >
                  {/* Milestone Name */}
                  <div className="w-48 shrink-0">
                    <p className="text-sm font-medium line-clamp-2">{milestone.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {milestone.completedIssues}/{milestone.totalIssues} issues
                    </p>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative h-12">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            style={{
                              left: position.left,
                              width: position.width,
                              backgroundColor: getMilestoneStatusColor(milestone.status),
                              opacity: 0.9,
                            }}
                          >
                            {/* Progress Fill */}
                            <div
                              className="h-full bg-white/30"
                              style={{ width: `${milestone.completionRate}%` }}
                            />
                            
                            {/* Issue Count Badge */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-semibold text-white px-2 py-0.5 bg-black/20 rounded">
                                {milestone.totalIssues}
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold">{milestone.name}</p>
                            <p className="text-xs">
                              {format(milestone.startDate, 'MMM dd, yyyy')} → {format(milestone.endDate, 'MMM dd, yyyy')}
                            </p>
                            <p className="text-xs">
                              Progress: {milestone.completionRate.toFixed(0)}% 
                              ({milestone.completedIssues}/{milestone.totalIssues} issues)
                            </p>
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: getMilestoneStatusColor(milestone.status),
                                color: 'white'
                              }}
                            >
                              {milestone.status}
                            </Badge>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Status Badge */}
                  <div className="w-24 shrink-0">
                    <Badge 
                      variant="secondary" 
                      className="text-xs w-full justify-center"
                      style={{ 
                        backgroundColor: getMilestoneStatusColor(milestone.status),
                        color: 'white'
                      }}
                    >
                      {milestone.completionRate.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              );
            })}

            {/* Today Indicator */}
            {todayPosition >= 0 && todayPosition <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                style={{ left: `calc(12rem + (100% - 12rem - 6rem) * ${todayPosition / 100})` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-red-500 font-semibold whitespace-nowrap">
                  Today
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-border text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getMilestoneStatusColor('completed') }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getMilestoneStatusColor('on-track') }} />
            <span>On Track</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getMilestoneStatusColor('at-risk') }} />
            <span>At Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getMilestoneStatusColor('overdue') }} />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getMilestoneStatusColor('planned') }} />
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-red-500" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
