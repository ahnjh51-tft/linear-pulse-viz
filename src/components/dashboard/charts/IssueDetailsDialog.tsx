import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { getStatusColor } from '@/lib/manager-chart-colors';

interface Issue {
  id: string;
  identifier: string;
  title: string;
  createdAt: string;
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

interface IssueDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  date: Date | null;
  issues: Issue[];
}

export const IssueDetailsDialog = ({ open, onClose, date, issues }: IssueDetailsDialogProps) => {
  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Issues Created on {format(date, 'MMMM dd, yyyy')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {issues.length} issue{issues.length !== 1 ? 's' : ''} created
          </p>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{issue.identifier}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{issue.title}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ backgroundColor: getStatusColor(issue.state.name), color: 'white' }}
                    >
                      {issue.state.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {issue.project?.name || 'No Project'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {issue.assignee?.name || 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://linear.app/issue/${issue.identifier}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
