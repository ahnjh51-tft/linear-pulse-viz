// Manager-focused chart color palette with vibrant colors

export const linearStatusColors = {
  backlog: '#64748b',      // Slate
  todo: '#f59e0b',         // Amber
  'in progress': '#3b82f6', // Blue
  done: '#10b981',         // Green
  canceled: '#6b7280',     // Gray
  duplicate: '#8b5cf6',    // Purple
  triage: '#ef4444',       // Red
} as const;

export const managerChartPalette = {
  completed: '#10b981',    // Green
  inProgress: '#3b82f6',   // Blue
  todo: '#f59e0b',         // Amber
  overdue: '#ef4444',      // Red
  atRisk: '#f97316',       // Orange
  onTrack: '#22c55e',      // Light Green
  planned: '#64748b',      // Slate
  primary: '#6366f1',      // Indigo
  secondary: '#8b5cf6',    // Purple
  accent: '#ec4899',       // Pink
} as const;

// Get color for Linear issue state
export const getStatusColor = (stateName: string): string => {
  const normalizedState = stateName.toLowerCase();
  
  // Direct matches
  if (normalizedState in linearStatusColors) {
    return linearStatusColors[normalizedState as keyof typeof linearStatusColors];
  }
  
  // Partial matches for custom state names
  if (normalizedState.includes('backlog')) return linearStatusColors.backlog;
  if (normalizedState.includes('todo') || normalizedState.includes('to do')) return linearStatusColors.todo;
  if (normalizedState.includes('progress')) return linearStatusColors['in progress'];
  if (normalizedState.includes('done') || normalizedState.includes('complete')) return linearStatusColors.done;
  if (normalizedState.includes('cancel')) return linearStatusColors.canceled;
  if (normalizedState.includes('duplicate')) return linearStatusColors.duplicate;
  if (normalizedState.includes('triage')) return linearStatusColors.triage;
  
  // Default fallback
  return '#94a3b8'; // Slate-400
};

// Get milestone status color
export const getMilestoneStatusColor = (status: 'completed' | 'on-track' | 'at-risk' | 'overdue' | 'planned'): string => {
  const colorMap = {
    completed: managerChartPalette.completed,
    'on-track': managerChartPalette.onTrack,
    'at-risk': managerChartPalette.atRisk,
    overdue: managerChartPalette.overdue,
    planned: managerChartPalette.planned,
  };
  return colorMap[status];
};
