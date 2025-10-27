import { useQuery as useApolloQuery } from '@apollo/client';
import { useLinear } from '@/contexts/LinearContext';
import { GET_TEAM_ISSUES, GET_ALL_LABELS } from '@/lib/linear-queries';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const IssuesTimelineView = () => {
  const { selectedTeamId } = useLinear();
  const [labelFilter, setLabelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: issuesData, loading: issuesLoading } = useApolloQuery(GET_TEAM_ISSUES, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: labelsData } = useApolloQuery(GET_ALL_LABELS);

  const issues = issuesData?.team?.issues?.nodes || [];

  const allLabels = useMemo(() => {
    const labelSet = new Map();
    issues.forEach((issue: any) => {
      issue.labels?.nodes?.forEach((label: any) => {
        if (!labelSet.has(label.id)) {
          labelSet.set(label.id, label);
        }
      });
    });
    labelsData?.issueLabels?.nodes?.forEach((label: any) => {
      if (!labelSet.has(label.id)) {
        labelSet.set(label.id, label);
      }
    });
    return Array.from(labelSet.values());
  }, [issues, labelsData]);

  const allStatuses = useMemo(() => {
    const statusSet = new Map();
    issues.forEach((issue: any) => {
      if (issue.state && !statusSet.has(issue.state.id)) {
        statusSet.set(issue.state.id, issue.state);
      }
    });
    return Array.from(statusSet.values());
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue: any) => {
      const matchesLabel = labelFilter === 'all' || 
        issue.labels?.nodes?.some((label: any) => label.id === labelFilter);
      const matchesStatus = statusFilter === 'all' || issue.state?.id === statusFilter;
      return matchesLabel && matchesStatus;
    });
  }, [issues, labelFilter, statusFilter]);

  // Group issues by creation month for timeline
  const issuesByMonth = useMemo(() => {
    const grouped = new Map<string, any[]>();
    
    filteredIssues.forEach((issue: any) => {
      const date = new Date(issue.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)?.push(issue);
    });

    // Sort by month
    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, issues]) => ({
        month,
        monthLabel: new Date(month + '-01').toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        }),
        issues: issues.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }));
  }, [filteredIssues]);

  if (!selectedTeamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Please select a team to view issues</p>
        </div>
      </div>
    );
  }

  if (issuesLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading issues...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Issues Timeline</h2>
        <p className="text-muted-foreground">View issues over time with label and status filters</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={labelFilter} onValueChange={setLabelFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Labels</SelectItem>
            {allLabels.map((label: any) => (
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map((status: any) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {issuesByMonth.length > 0 ? (
          issuesByMonth.map(({ month, monthLabel, issues }) => (
            <Card key={month} className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  {monthLabel}
                  <Badge variant="secondary">{issues.length} issues</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {issues.map((issue: any) => (
                    <div
                      key={issue.id}
                      className="flex items-start justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-smooth"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm text-muted-foreground font-mono">
                            {issue.identifier}
                          </span>
                          <p className="font-medium">{issue.title}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {issue.labels?.nodes?.map((label: any) => (
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
                          {issue.assignee && (
                            <Badge variant="secondary" className="text-xs">
                              {issue.assignee.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            issue.state?.type === 'completed' && 'bg-success/10 text-success border-success',
                            issue.state?.type === 'started' && 'bg-primary/10 text-primary border-primary',
                            issue.state?.type === 'unstarted' && 'bg-muted'
                          )}
                        >
                          {issue.state?.name}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </p>
                        {issue.completedAt && (
                          <p className="text-xs text-success mt-1">
                            ✓ {new Date(issue.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card border-border/50">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                No issues found matching the selected filters
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
