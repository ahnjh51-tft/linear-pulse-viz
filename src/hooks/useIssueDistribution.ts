import { useMemo } from 'react';

interface Issue {
  id: string;
  state: {
    name: string;
    type: string;
  };
}

export interface IssueDistribution {
  backlog: number;
  todo: number;
  inProgress: number;
  done: number;
  canceled: number;
  duplicate: number;
  triage: number;
  total: number;
}

export const useIssueDistribution = (issues: Issue[] | undefined) => {
  return useMemo(() => {
    if (!issues || issues.length === 0) {
      return {
        backlog: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        canceled: 0,
        duplicate: 0,
        triage: 0,
        total: 0,
      };
    }

    const distribution = issues.reduce(
      (acc, issue) => {
        const stateName = issue.state.name.toLowerCase();
        
        // Map state names to categories
        if (stateName.includes('backlog')) {
          acc.backlog++;
        } else if (stateName.includes('todo') || stateName.includes('to do')) {
          acc.todo++;
        } else if (stateName.includes('progress')) {
          acc.inProgress++;
        } else if (stateName.includes('done') || stateName.includes('complete') || issue.state.type === 'completed') {
          acc.done++;
        } else if (stateName.includes('cancel')) {
          acc.canceled++;
        } else if (stateName.includes('duplicate')) {
          acc.duplicate++;
        } else if (stateName.includes('triage')) {
          acc.triage++;
        } else {
          // Default to todo if we can't categorize
          acc.todo++;
        }
        
        acc.total++;
        return acc;
      },
      {
        backlog: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        canceled: 0,
        duplicate: 0,
        triage: 0,
        total: 0,
      }
    );

    return distribution;
  }, [issues]);
};
