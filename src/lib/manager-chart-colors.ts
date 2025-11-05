// Manager-focused chart color palette with vibrant colors

// Hawaiian Ocean color palette
export const linearStatusColors = {
  backlog: '#AED9DA',      // Chill (light teal)
  todo: '#3DDAD7',         // Californian Coral (cyan)
  'in progress': '#2A93D5', // Bondi Blue
  done: '#135589',         // Marina (dark blue)
  canceled: '#94a3b8',     // Gray
  duplicate: '#AED9DA',    // Chill
  triage: '#EDFAFD',       // Glass (very light)
} as const;

export const managerChartPalette = {
  completed: '#135589',    // Marina
  inProgress: '#2A93D5',   // Bondi Blue
  todo: '#3DDAD7',         // Californian Coral
  overdue: '#ef4444',      // Red (kept for visibility)
  atRisk: '#f97316',       // Orange (kept for visibility)
  onTrack: '#22c55e',      // Green (kept for visibility)
  planned: '#AED9DA',      // Chill
  primary: '#2A93D5',      // Bondi Blue
  secondary: '#3DDAD7',    // Californian Coral
  accent: '#EDFAFD',       // Glass
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
