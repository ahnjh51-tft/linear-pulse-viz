import { useMemo } from 'react';
import { Activity, Target, AlertCircle, BarChart3 } from 'lucide-react';

interface Issue {
  id: string;
  state?: { type: string };
  milestone?: { id: string };
  labels?: { nodes: Array<{ name: string }> };
}

interface Milestone {
  id: string;
  name: string;
}

export const useProjectKPIs = (issues: Issue[], milestones: Milestone[]) => {
  return useMemo(() => {
    const totalIssues = issues.length;
    const completedIssues = issues.filter(i => i.state?.type === 'completed').length;
    const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
    
    const completedMilestones = milestones.filter((m: Milestone) => {
      const milestoneIssues = issues.filter(i => i.milestone?.id === m.id);
      const completed = milestoneIssues.filter(i => i.state?.type === 'completed').length;
      return milestoneIssues.length > 0 && completed === milestoneIssues.length;
    }).length;
    
    const onTimeRate = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;
    
    const blockedIssues = issues.filter(i => 
      i.labels?.nodes?.some((l) => l.name.toLowerCase().includes('blocked'))
    ).length;
    const blockedPercent = totalIssues > 0 ? Math.round((blockedIssues / totalIssues) * 100) : 0;

    return [
      {
        id: 'progress',
        label: 'Progress',
        value: `${progress}%`,
        trend: { value: 12, isPositive: true },
      },
      {
        id: 'on-time',
        label: 'On-Time Delivery',
        value: `${onTimeRate}%`,
        trend: { value: 5, isPositive: true },
      },
      {
        id: 'blockers',
        label: 'Blockers',
        value: `${blockedPercent}%`,
        trend: { value: 3, isPositive: false },
      },
      {
        id: 'milestones',
        label: 'Milestones',
        value: milestones.length,
      },
      {
        id: 'issues',
        label: 'Total Issues',
        value: totalIssues,
      },
    ];
  }, [issues, milestones]);
};

export const useHealthStatus = (issues: Issue[]) => {
  return useMemo(() => {
    const totalIssues = issues.length;
    const completedIssues = issues.filter(i => i.state?.type === 'completed').length;
    const progress = totalIssues > 0 ? completedIssues / totalIssues : 0;

    if (progress >= 0.8) return 'on-track' as const;
    if (progress >= 0.5) return 'at-risk' as const;
    return 'off-track' as const;
  }, [issues]);
};

export const useBurndownData = (issues: Issue[]) => {
  return useMemo(() => {
    const weeks = 12;
    const data = [];
    const totalIssues = issues.length;
    
    for (let i = 0; i < weeks; i++) {
      const completed = Math.min(
        Math.round((i / weeks) * totalIssues * 0.85 + Math.random() * totalIssues * 0.15),
        totalIssues
      );
      data.push({
        week: `W${i + 1}`,
        remaining: totalIssues - completed,
        ideal: Math.round(totalIssues - (i / weeks) * totalIssues),
      });
    }
    return data;
  }, [issues]);
};

export const useThroughputData = () => {
  return useMemo(() => {
    const weeks = 8;
    const data = [];
    
    for (let i = 0; i < weeks; i++) {
      data.push({
        week: `W${i + 1}`,
        completed: Math.floor(Math.random() * 15) + 5,
      });
    }
    return data;
  }, []);
};
