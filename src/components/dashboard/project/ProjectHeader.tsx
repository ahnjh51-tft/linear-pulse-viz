import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DateRangeFilter } from '../DateRangeFilter';
import { Download } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface ProjectHeaderProps {
  selectedProject: string | null;
  projects: Project[];
  onProjectChange: (id: string) => void;
  labelFilter: string;
  labels: Label[];
  onLabelChange: (id: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onExport: () => void;
}

export const ProjectHeader = ({
  selectedProject,
  projects,
  onProjectChange,
  labelFilter,
  labels,
  onLabelChange,
  dateRange,
  onDateRangeChange,
  onExport,
}: ProjectHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Select value={selectedProject || undefined} onValueChange={onProjectChange}>
          <SelectTrigger className="w-full max-w-md bg-card border-border/50">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={labelFilter} onValueChange={onLabelChange}>
          <SelectTrigger className="w-48 bg-card border-border/50">
            <SelectValue placeholder="Filter by label" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All Labels</SelectItem>
            {labels.map((label) => (
              <SelectItem key={label.id} value={label.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
        <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
    </div>
  );
};
