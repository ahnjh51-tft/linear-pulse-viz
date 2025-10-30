// Centralized chart configuration using design system tokens
export const chartConfig = {
  colors: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    destructive: 'hsl(var(--destructive))',
    muted: 'hsl(var(--muted))',
    accent: 'hsl(var(--accent))',
    border: 'hsl(var(--border))',
    mutedForeground: 'hsl(var(--muted-foreground))',
  },
  
  // Chart-specific color palettes
  palette: {
    categorical: [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
      'hsl(var(--success))',
      'hsl(var(--warning))',
    ],
    diverging: [
      'hsl(var(--success))',
      'hsl(var(--primary))',
      'hsl(var(--warning))',
      'hsl(var(--destructive))',
    ],
  },

  // Common chart styles
  styles: {
    grid: {
      strokeDasharray: '3 3',
      stroke: 'hsl(var(--border))',
    },
    axis: {
      stroke: 'hsl(var(--muted-foreground))',
    },
    tooltip: {
      contentStyle: {
        backgroundColor: 'hsl(var(--popover))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        color: 'hsl(var(--popover-foreground))',
      },
    },
  },
} as const;
