import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMilestoneMetrics, EnrichedMilestone } from '@/hooks/useMilestoneMetrics';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getMilestoneStatusColor } from '@/lib/manager-chart-colors';

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

interface MilestoneProgressCardsProps {
  milestones: Milestone[] | undefined;
  projectStartDate?: string;
  onMilestoneClick?: (milestoneId: string) => void;
}

const getStatusIcon = (status: EnrichedMilestone['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'overdue':
    case 'at-risk':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusLabel = (status: EnrichedMilestone['status']) => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'on-track':
      return 'On Track';
    case 'at-risk':
      return 'At Risk';
    case 'overdue':
      return 'Overdue';
    case 'planned':
      return 'Planned';
  }
};

export const MilestoneProgressCards = ({ 
  milestones, 
  projectStartDate,
  onMilestoneClick 
}: MilestoneProgressCardsProps) => {
  const enrichedMilestones = useMilestoneMetrics(milestones, projectStartDate);

  if (!enrichedMilestones || enrichedMilestones.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No milestones defined for this project
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {enrichedMilestones.map((milestone) => (
        <Card
          key={milestone.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onMilestoneClick?.(milestone.id)}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm line-clamp-2 flex-1">
                {milestone.name}
              </h4>
              <Badge 
                variant={milestone.status === 'completed' ? 'default' : 'secondary'}
                className="shrink-0 text-xs"
                style={{ 
                  backgroundColor: getMilestoneStatusColor(milestone.status),
                  color: 'white'
                }}
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(milestone.status)}
                  {getStatusLabel(milestone.status)}
                </span>
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{milestone.completedIssues} / {milestone.totalIssues} issues</span>
                <span className="font-semibold">{milestone.completionRate.toFixed(0)}%</span>
              </div>
              <Progress 
                value={milestone.completionRate} 
                className="h-2"
                style={{
                  // @ts-ignore - Custom CSS variable
                  '--progress-background': getMilestoneStatusColor(milestone.status)
                }}
              />
            </div>

            {/* Target Date */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                Due {format(milestone.endDate, 'MMM dd, yyyy')}
              </span>
              <span className="text-xs">
                ({formatDistanceToNow(milestone.endDate, { addSuffix: true })})
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
