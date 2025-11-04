import { useMemo } from 'react';
import { isBefore, isAfter, addDays, parseISO } from 'date-fns';

interface Issue {
  id: string;
  state: {
    type: string;
  };
}

interface Milestone {
  id: string;
  name: string;
  targetDate: string;
  description?: string | null;
  sortOrder: number;
}

interface MilestoneWithIssues extends Milestone {
  issues?: {
    nodes: Issue[];
  };
}

export interface EnrichedMilestone extends Milestone {
  completedIssues: number;
  totalIssues: number;
  completionRate: number;
  status: 'completed' | 'on-track' | 'at-risk' | 'overdue' | 'planned';
  startDate: Date;
  endDate: Date;
}

export const useMilestoneMetrics = (
  milestones: MilestoneWithIssues[] | undefined,
  projectStartDate?: string
) => {
  return useMemo(() => {
    if (!milestones || milestones.length === 0) return [];

    // Sort milestones by sortOrder
    const sortedMilestones = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder);
    
    const today = new Date();
    const projectStart = projectStartDate ? parseISO(projectStartDate) : today;

    const enrichedMilestones: EnrichedMilestone[] = [];

    sortedMilestones.forEach((milestone, index) => {
      const issues = milestone.issues?.nodes || [];
      const completedIssues = issues.filter((issue) => issue.state.type === 'completed').length;
      const totalIssues = issues.length;
      const completionRate = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;

      // Calculate sequential start dates
      let startDate: Date;
      if (index === 0) {
        // First milestone starts at project start
        startDate = projectStart;
      } else {
        // Subsequent milestones start at the previous milestone's end date
        startDate = enrichedMilestones[index - 1].endDate;
      }

      const endDate = parseISO(milestone.targetDate);

      // Determine milestone status
      let status: 'completed' | 'on-track' | 'at-risk' | 'overdue' | 'planned';
      
      if (completionRate === 100) {
        status = 'completed';
      } else if (isAfter(today, endDate)) {
        status = 'overdue';
      } else if (isBefore(today, startDate)) {
        status = 'planned';
      } else {
        // In progress - check if at risk
        const daysUntilDue = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const expectedProgress = totalIssues > 0 
          ? ((today.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100 
          : 0;
        
        if (completionRate < expectedProgress - 20 || daysUntilDue < 7) {
          status = 'at-risk';
        } else {
          status = 'on-track';
        }
      }

      enrichedMilestones.push({
        ...milestone,
        completedIssues,
        totalIssues,
        completionRate,
        status,
        startDate,
        endDate,
      });
    });

    return enrichedMilestones;
  }, [milestones, projectStartDate]);
};
