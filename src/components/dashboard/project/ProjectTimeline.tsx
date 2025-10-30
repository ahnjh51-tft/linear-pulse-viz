import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MilestoneGantt } from '../MilestoneGantt';

interface Milestone {
  id: string;
  name: string;
  targetDate?: string;
  description?: string;
}

interface Issue {
  id: string;
  milestone?: { id: string };
}

interface ProjectTimelineProps {
  milestones: Milestone[];
  issues: Issue[];
  onMilestoneClick: (milestone: Milestone) => void;
}

export const ProjectTimeline = ({ milestones, issues, onMilestoneClick }: ProjectTimelineProps) => {
  const milestonesWithIssues = milestones.map((m) => ({
    ...m,
    issues: issues.filter(i => i.milestone?.id === m.id),
  }));

  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle>Milestone Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <MilestoneGantt
          milestones={milestonesWithIssues}
          onMilestoneClick={onMilestoneClick}
        />
      </CardContent>
    </Card>
  );
};
