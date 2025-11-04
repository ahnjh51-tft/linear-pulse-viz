import { useMemo, useState } from 'react';
import { getStatusColor } from '@/lib/manager-chart-colors';
import { differenceInDays, parseISO } from 'date-fns';

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

export interface ScatterDataPoint {
  id: string;
  identifier: string;
  title: string;
  createdDate: Date;
  daysToComplete: number | null;
  status: string;
  statusColor: string;
  projectId: string | null;
  projectName: string | null;
  completedAt: string | null;
}

export const useIssueScatterData = (issues: Issue[] | undefined) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>(['all']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'backlog', 'todo', 'in progress', 'done', 'canceled', 'duplicate', 'triage'
  ]);

  const scatterData = useMemo(() => {
    if (!issues || issues.length === 0) return [];

    return issues.map((issue) => {
      const createdDate = parseISO(issue.createdAt);
      const completedDate = issue.completedAt ? parseISO(issue.completedAt) : null;
      const daysToComplete = completedDate ? differenceInDays(completedDate, createdDate) : null;

      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        createdDate,
        daysToComplete,
        status: issue.state.name,
        statusColor: getStatusColor(issue.state.name),
        projectId: issue.project?.id || null,
        projectName: issue.project?.name || 'No Project',
        completedAt: issue.completedAt,
      };
    });
  }, [issues]);

  const filteredData = useMemo(() => {
    return scatterData.filter((point) => {
      // Filter by project
      const projectMatch = selectedProjects.includes('all') || 
        (point.projectId && selectedProjects.includes(point.projectId));
      
      // Filter by status (case-insensitive partial match)
      const statusMatch = selectedStatuses.some(status => 
        point.status.toLowerCase().includes(status.toLowerCase())
      );

      return projectMatch && statusMatch;
    });
  }, [scatterData, selectedProjects, selectedStatuses]);

  const availableProjects = useMemo(() => {
    const projectMap = new Map<string, string>();
    scatterData.forEach((point) => {
      if (point.projectId && point.projectName) {
        projectMap.set(point.projectId, point.projectName);
      }
    });
    return Array.from(projectMap.entries()).map(([id, name]) => ({ id, name }));
  }, [scatterData]);

  return {
    scatterData: filteredData,
    selectedProjects,
    setSelectedProjects,
    selectedStatuses,
    setSelectedStatuses,
    availableProjects,
  };
};
