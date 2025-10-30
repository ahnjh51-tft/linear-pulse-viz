import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Assignee {
  id: string;
  name: string;
}

interface AssigneeFilterProps {
  value: string;
  onChange: (value: string) => void;
  assignees: Assignee[];
  className?: string;
}

export const AssigneeFilter = ({ value, onChange, assignees, className }: AssigneeFilterProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className || 'w-48 bg-card border-border/50'}>
        <SelectValue placeholder="Assignee" />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border z-50">
        <SelectItem value="all">All Assignees</SelectItem>
        {assignees.map((assignee) => (
          <SelectItem key={assignee.id} value={assignee.id}>
            {assignee.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
