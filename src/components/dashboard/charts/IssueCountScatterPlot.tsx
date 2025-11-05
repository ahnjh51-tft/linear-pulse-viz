import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIssueCountData } from '@/hooks/useIssueCountData';
import { IssueDetailsDialog } from './IssueDetailsDialog';
import { format } from 'date-fns';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';
import { managerChartPalette } from '@/lib/manager-chart-colors';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  assignee?: {
    name: string;
  } | null;
}

interface IssueCountScatterPlotProps {
  issues: Issue[] | undefined;
}

export const IssueCountScatterPlot = ({ issues }: IssueCountScatterPlotProps) => {
  const {
    countData,
    selectedProjects,
    setSelectedProjects,
    selectedStatuses,
    setSelectedStatuses,
    availableProjects,
  } = useIssueCountData(issues);

  const [showFilters, setShowFilters] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Issue[]>([]);

  const statusOptions = ['backlog', 'todo', 'in progress', 'done', 'canceled', 'duplicate', 'triage'];

  const handleProjectToggle = (projectId: string) => {
    if (projectId === 'all') {
      setSelectedProjects(['all']);
    } else {
      const newSelection = selectedProjects.includes(projectId)
        ? selectedProjects.filter(id => id !== projectId)
        : [...selectedProjects.filter(id => id !== 'all'), projectId];
      
      setSelectedProjects(newSelection.length === 0 ? ['all'] : newSelection);
    }
  };

  const handleStatusToggle = (status: string) => {
    const newSelection = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    
    setSelectedStatuses(newSelection.length === 0 ? statusOptions : newSelection);
  };

  const resetFilters = () => {
    setSelectedProjects(['all']);
    setSelectedStatuses(statusOptions);
  };

  const handleDotClick = (data: any) => {
    if (data && data.date) {
      setSelectedDate(data.date);
      setSelectedIssues(data.issues);
      setDialogOpen(true);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const issueList = data.issues.slice(0, 3);
      const remaining = data.count - 3;

      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-2">{format(data.date, 'MMM dd, yyyy')}</p>
          <p className="text-sm mb-2">{data.count} issue{data.count !== 1 ? 's' : ''} created</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            {issueList.map((issue: Issue, idx: number) => (
              <p key={idx} className="truncate">• {issue.identifier}: {issue.title}</p>
            ))}
            {remaining > 0 && (
              <p className="text-primary font-medium">+ {remaining} more (click to view all)</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Transform data for chart
  const chartData = countData.map(point => ({
    ...point,
    x: point.date.getTime(),
    y: point.count,
  }));

  if (!issues || issues.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No issues to display
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header with Filters */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Issue Creation Frequency</h3>
              <p className="text-sm text-muted-foreground">
                Number of issues created per day • {chartData.length} unique dates
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              {(selectedProjects.length > 1 || !selectedProjects.includes('all') || selectedStatuses.length < statusOptions.length) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Projects ({selectedProjects.includes('all') ? 'All' : selectedProjects.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover z-50">
                  <DropdownMenuLabel>Filter by Project</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedProjects.includes('all')}
                    onCheckedChange={() => handleProjectToggle('all')}
                  >
                    All Projects
                  </DropdownMenuCheckboxItem>
                  {availableProjects.map(project => (
                    <DropdownMenuCheckboxItem
                      key={project.id}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleProjectToggle(project.id)}
                    >
                      {project.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Status ({selectedStatuses.length}/{statusOptions.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover z-50">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {statusOptions.map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => handleStatusToggle(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                dataKey="x"
                name="Date"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                label={{ value: 'Creation Date', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Issue Count"
                label={{ value: 'Number of Issues Created', angle: -90, position: 'insideLeft' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="Issues per Day"
                data={chartData}
                onClick={handleDotClick}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={managerChartPalette.primary}
                    opacity={0.7}
                    className="cursor-pointer hover:opacity-100"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Click on any dot to view detailed issue list for that day
          </p>
        </div>
      </Card>

      <IssueDetailsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        date={selectedDate}
        issues={selectedIssues}
      />
    </>
  );
};
