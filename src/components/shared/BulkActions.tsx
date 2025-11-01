import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle2, XCircle, Tag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onMarkComplete?: () => void;
  onMarkIncomplete?: () => void;
  onAddLabel?: () => void;
}

export const BulkActions = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onMarkComplete,
  onMarkIncomplete,
  onAddLabel,
}: BulkActionsProps) => {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/30 border border-border/50 rounded-lg animate-fade-in">
      <Checkbox
        checked={allSelected}
        onCheckedChange={allSelected ? onClearSelection : onSelectAll}
      />
      <Badge variant="secondary">
        {selectedCount} selected
      </Badge>
      
      {selectedCount > 0 && (
        <>
          <div className="flex gap-2 ml-auto">
            {onMarkComplete && (
              <Button size="sm" variant="outline" onClick={onMarkComplete}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
            {onMarkIncomplete && (
              <Button size="sm" variant="outline" onClick={onMarkIncomplete}>
                <XCircle className="w-4 h-4 mr-2" />
                Mark Incomplete
              </Button>
            )}
            {onAddLabel && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Tag className="w-4 h-4 mr-2" />
                    Add Label
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={onAddLabel}>
                    Add labels to selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button size="sm" variant="ghost" onClick={onClearSelection}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
