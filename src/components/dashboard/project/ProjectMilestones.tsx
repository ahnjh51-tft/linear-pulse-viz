import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface Milestone {
  id: string;
  name: string;
  targetDate?: string;
  description?: string;
}

interface Issue {
  id: string;
  state?: { type: string };
  milestone?: { id: string };
}

interface ProjectMilestonesProps {
  milestones: Milestone[];
  issues: Issue[];
}

export const ProjectMilestones = ({ milestones, issues }: ProjectMilestonesProps) => {
  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle>Milestones ({milestones.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {milestones.length > 0 ? (
          <div className="space-y-3">
            {milestones.map((milestone) => {
              const milestoneIssues = issues.filter(i => i.milestone?.id === milestone.id);
              const completed = milestoneIssues.filter(i => i.state?.type === 'completed').length;
              const progress = milestoneIssues.length > 0 ? Math.round((completed / milestoneIssues.length) * 100) : 0;

              return (
                <div
                  key={milestone.id}
                  className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-smooth"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium">{milestone.name}</p>
                        <Badge variant="secondary">
                          {completed}/{milestoneIssues.length} issues
                        </Badge>
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                      )}
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {milestone.targetDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(milestone.targetDate).toLocaleDateString()}
                        </div>
                      )}
                      <p className="text-2xl font-bold mt-2">{progress}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No milestones found
          </div>
        )}
      </CardContent>
    </Card>
  );
};
