import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'started', label: 'Started' },
  { value: 'completed', label: 'Completed' },
];

export const StatusFilter = ({ value, onChange, className }: StatusFilterProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className || 'w-48 bg-card border-border/50'}>
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border z-50">
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
