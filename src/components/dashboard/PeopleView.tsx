import { useQuery as useApolloQuery } from '@apollo/client';
import { GET_WORKSPACE_USERS, GET_TEAM_ISSUES } from '@/lib/linear-queries';
import { useLinear } from '@/contexts/LinearContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, User, CheckCircle2, Clock } from 'lucide-react';
import { useMemo } from 'react';

export const PeopleView = () => {
  const { selectedTeamId } = useLinear();
  
  const { data: usersData, loading: usersLoading } = useApolloQuery(GET_WORKSPACE_USERS);
  
  const { data: issuesData, loading: issuesLoading } = useApolloQuery(GET_TEAM_ISSUES, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const users = usersData?.users?.nodes || [];
  const issues = issuesData?.team?.issues?.nodes || [];

  const userMetrics = useMemo(() => {
    return users.map((user: any) => {
      const userIssues = issues.filter((i: any) => i.assignee?.id === user.id);
      const completedIssues = userIssues.filter((i: any) => i.state.type === 'completed');
      
      const avgCycleTime = completedIssues
        .filter((i: any) => i.completedAt && i.createdAt)
        .reduce((sum: number, i: any) => {
          const created = new Date(i.createdAt).getTime();
          const completed = new Date(i.completedAt).getTime();
          return sum + (completed - created) / (1000 * 60 * 60 * 24);
        }, 0) / (completedIssues.length || 1);

      return {
        ...user,
        totalIssues: userIssues.length,
        completedIssues: completedIssues.length,
        avgCycleTime: Math.round(avgCycleTime * 10) / 10,
      };
    }).filter((u: any) => u.totalIssues > 0);
  }, [users, issues]);

  const loading = usersLoading || issuesLoading;

  if (!selectedTeamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Please select a team to view people</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">People</h2>
        <p className="text-muted-foreground">Team member directory and individual metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userMetrics.map((user: any) => (
          <Card key={user.id} className="bg-card border-border/50 shadow-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </span>
                  <span className="text-sm font-medium">
                    {user.completedIssues} / {user.totalIssues}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Avg Cycle Time
                  </span>
                  <span className="text-sm font-medium">{user.avgCycleTime}d</span>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-smooth"
                      style={{
                        width: `${(user.completedIssues / user.totalIssues) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {Math.round((user.completedIssues / user.totalIssues) * 100)}% completion rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {userMetrics.length === 0 && !loading && (
        <Card className="bg-card border-border/50 shadow-card">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No active team members found</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
