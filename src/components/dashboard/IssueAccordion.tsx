import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, CheckCircle2, Circle } from 'lucide-react';

interface Issue {
  id: string;
  identifier: string;
  title: string;
  state?: {
    name: string;
    type: string;
  };
  assignee?: {
    name: string;
    avatarUrl?: string;
  };
  labels?: {
    nodes: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
  priority?: number;
  dueDate?: string;
}

interface IssueGroup {
  id: string;
  title: string;
  issues: Issue[];
  completedCount?: number;
}

interface IssueAccordionProps {
  groups: IssueGroup[];
  className?: string;
}

export const IssueAccordion = ({ groups, className }: IssueAccordionProps) => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const getIssueIcon = (issue: Issue) => {
    if (issue.state?.type === 'completed') return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (issue.state?.type === 'canceled') return <Circle className="w-4 h-4 text-muted-foreground" />;
    if (issue.priority && issue.priority >= 1) return <AlertCircle className="w-4 h-4 text-destructive" />;
    return <Circle className="w-4 h-4 text-primary" />;
  };

  const getPriorityBadge = (priority?: number) => {
    if (!priority || priority === 0) return null;
    
    const config = {
      1: { label: 'Urgent', className: 'bg-destructive/10 text-destructive border-destructive' },
      2: { label: 'High', className: 'bg-warning/10 text-warning border-warning' },
      3: { label: 'Medium', className: 'bg-primary/10 text-primary border-primary' },
      4: { label: 'Low', className: 'bg-muted' },
    };

    const priorityConfig = config[priority as keyof typeof config] || config[4];
    return (
      <Badge variant="outline" className={cn('text-xs', priorityConfig.className)}>
        {priorityConfig.label}
      </Badge>
    );
  };

  return (
    <Accordion
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className={cn('space-y-3', className)}
    >
      {groups.map((group) => {
        const completedCount = group.completedCount ?? group.issues.filter(i => i.state?.type === 'completed').length;
        const totalCount = group.issues.length;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return (
          <AccordionItem
            key={group.id}
            value={group.id}
            className="border border-border/50 rounded-lg bg-card shadow-card overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-secondary/30 transition-smooth hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{group.title}</span>
                  <Badge variant="secondary" className="font-normal">
                    {completedCount}/{totalCount}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  {/* Progress Bar */}
                  <div className="w-32 h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {progressPercent}%
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2 pt-2">
                {group.issues.length > 0 ? (
                  group.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-smooth group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getIssueIcon(issue)}
                        <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                          {issue.identifier}
                        </span>
                        <span className="font-medium truncate">{issue.title}</span>
                        
                        {/* Labels */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {issue.labels?.nodes?.slice(0, 2).map((label) => (
                            <Badge
                              key={label.id}
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: label.color,
                                color: label.color,
                              }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                          {(issue.labels?.nodes?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{issue.labels!.nodes.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {getPriorityBadge(issue.priority)}
                        
                        {/* State Badge */}
                        <Badge variant="outline" className="text-xs">
                          {issue.state?.name || 'No Status'}
                        </Badge>

                        {/* Assignee */}
                        {issue.assignee && (
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={issue.assignee.avatarUrl} alt={issue.assignee.name} />
                            <AvatarFallback className="text-xs">
                              {issue.assignee.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No issues in this group
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
