import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIssueScatterData } from '@/hooks/useIssueScatterData';
import { format } from 'date-fns';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';
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
}

interface IssueScatterPlotProps {
  issues: Issue[] | undefined;
}

export const IssueScatterPlot = ({ issues }: IssueScatterPlotProps) => {
  const {
    scatterData,
    selectedProjects,
    setSelectedProjects,
    selectedStatuses,
    setSelectedStatuses,
    availableProjects,
  } = useIssueScatterData(issues);

  const [showFilters, setShowFilters] = useState(false);

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-1">{data.identifier}</p>
          <p className="text-sm mb-2 line-clamp-2">{data.title}</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Status: <Badge variant="secondary" className="ml-1">{data.status}</Badge></p>
            <p>Created: {format(data.createdDate, 'MMM dd, yyyy')}</p>
            {data.completedAt ? (
              <p>Completed: {format(new Date(data.completedAt), 'MMM dd, yyyy')}</p>
            ) : (
              <p>Status: Still open</p>
            )}
            {data.daysToComplete !== null && (
              <p>Time to complete: {data.daysToComplete} days</p>
            )}
            <p>Project: {data.projectName}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Transform data for chart (only show completed issues for Y axis, others at Y=0)
  const chartData = scatterData.map(point => ({
    ...point,
    x: point.createdDate.getTime(),
    y: point.daysToComplete || 0,
  }));

  const uniqueStatuses = Array.from(new Set(scatterData.map(d => d.status)));

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
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header with Filters */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Issue Timeline Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Created date vs. completion time • {scatterData.length} issues
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
              <DropdownMenuContent align="start" className="w-56">
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
              <DropdownMenuContent align="start" className="w-56">
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
              name="Created Date"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              label={{ value: 'Created Date', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Days to Complete"
              label={{ value: 'Days to Complete', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Scatter
              name="Issues"
              data={chartData}
              onClick={(data) => {
                if (data && data.identifier) {
                  window.open(`https://linear.app/issue/${data.identifier}`, '_blank');
                }
              }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.statusColor}
                  opacity={0.7}
                  className="cursor-pointer hover:opacity-100"
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
          {uniqueStatuses.map(status => {
            const point = scatterData.find(d => d.status === status);
            return (
              <div key={status} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: point?.statusColor }}
                />
                <span>{status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
