import { useMemo, useState } from 'react';
import { startOfDay } from 'date-fns';

interface Issue {
  id: string;
  identifier: string;
  title: string;
  createdAt: string;
  completedAt?: string | null;
  state: {
    name: string;
    type: string;
  };
  project?: {
    id: string;
    name: string;
  } | null;
}

export interface IssueCountDataPoint {
  date: Date;
  count: number;
  issues: Issue[];
  statusBreakdown: { [status: string]: number };
}

export const useIssueCountData = (issues: Issue[] | undefined) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>(['all']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'backlog', 'todo', 'in progress', 'done', 'canceled', 'duplicate', 'triage'
  ]);

  const countData = useMemo(() => {
    if (!issues || issues.length === 0) return [];

    // Filter issues first
    const filteredIssues = issues.filter((issue) => {
      // Filter by project
      const projectMatch = selectedProjects.includes('all') || 
        (issue.project?.id && selectedProjects.includes(issue.project.id));
      
      // Filter by status (case-insensitive partial match)
      const statusMatch = selectedStatuses.some(status => 
        issue.state.name.toLowerCase().includes(status.toLowerCase())
      );

      return projectMatch && statusMatch;
    });

    // Group issues by creation date
    const dateMap = new Map<string, Issue[]>();
    
    filteredIssues.forEach((issue) => {
      const dateKey = startOfDay(new Date(issue.createdAt)).toISOString();
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(issue);
    });

    // Convert to array and calculate status breakdown
    return Array.from(dateMap.entries())
      .map(([dateKey, issuesForDate]) => {
        const statusBreakdown: { [status: string]: number } = {};
        issuesForDate.forEach((issue) => {
          const status = issue.state.name;
          statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
        });

        return {
          date: new Date(dateKey),
          count: issuesForDate.length,
          issues: issuesForDate,
          statusBreakdown,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [issues, selectedProjects, selectedStatuses]);

  const availableProjects = useMemo(() => {
    if (!issues) return [];
    const projectMap = new Map<string, string>();
    issues.forEach((issue) => {
      if (issue.project?.id && issue.project?.name) {
        projectMap.set(issue.project.id, issue.project.name);
      }
    });
    return Array.from(projectMap.entries()).map(([id, name]) => ({ id, name }));
  }, [issues]);

  return {
    countData,
    selectedProjects,
    setSelectedProjects,
    selectedStatuses,
    setSelectedStatuses,
    availableProjects,
  };
};
