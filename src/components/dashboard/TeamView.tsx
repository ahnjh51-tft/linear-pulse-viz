import { useQuery as useApolloQuery } from '@apollo/client';
import { useLinear } from '@/contexts/LinearContext';
import { GET_TEAM_ISSUES, GET_WORKSPACE_USERS } from '@/lib/linear-queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Users, Clock, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { KPICard } from './KPICard';

export const TeamView = () => {
  const { selectedTeamId } = useLinear();
  
  const { data: issuesData, loading: issuesLoading } = useApolloQuery(GET_TEAM_ISSUES, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: usersData, loading: usersLoading } = useApolloQuery(GET_WORKSPACE_USERS, {
    skip: !selectedTeamId,
  });

  const issues = issuesData?.team?.issues?.nodes || [];
  const users = usersData?.users?.nodes || [];

  const teamMetrics = useMemo(() => {
    const workloadByPerson = issues.reduce((acc: any, issue: any) => {
      if (issue.assignee) {
        const userId = issue.assignee.id;
        if (!acc[userId]) {
          acc[userId] = {
            name: issue.assignee.name,
            count: 0,
            estimate: 0,
          };
        }
        acc[userId].count += 1;
        acc[userId].estimate += issue.estimate || 0;
      }
      return acc;
    }, {});

    const blockers = issues.filter((i: any) => 
      i.labels?.nodes?.some((l: any) => l.name.toLowerCase().includes('blocked'))
    ).length;

    const avgCycleTime = issues
      .filter((i: any) => i.completedAt && i.createdAt)
      .reduce((sum: number, i: any) => {
        const created = new Date(i.createdAt).getTime();
        const completed = new Date(i.completedAt).getTime();
        return sum + (completed - created) / (1000 * 60 * 60 * 24);
      }, 0) / (issues.filter((i: any) => i.completedAt).length || 1);

    return {
      workloadByPerson: Object.values(workloadByPerson),
      blockers,
      avgCycleTime: Math.round(avgCycleTime * 10) / 10,
      activeMembers: Object.keys(workloadByPerson).length,
    };
  }, [issues]);

  const loading = issuesLoading || usersLoading;

  if (!selectedTeamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Please select a team to view team metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Team Performance</h2>
        <p className="text-muted-foreground">Workload distribution and team health metrics</p>
      </div>

      {/* Team KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Members"
          value={teamMetrics.activeMembers}
          icon={<Users className="w-5 h-5" />}
          loading={loading}
        />
        <KPICard
          title="Avg Cycle Time"
          value={`${teamMetrics.avgCycleTime}d`}
          icon={<Clock className="w-5 h-5" />}
          loading={loading}
        />
        <KPICard
          title="Blockers"
          value={teamMetrics.blockers}
          icon={<AlertTriangle className="w-5 h-5" />}
          loading={loading}
        />
        <KPICard
          title="Total Issues"
          value={issues.length}
          icon={<Users className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Workload Chart */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Workload by Person</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={teamMetrics.workloadByPerson}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" name="Issues" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(teamMetrics.workloadByPerson as any[]).map((member: any) => (
              <div
                key={member.name}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.count} issues assigned</p>
                  </div>
                </div>
                {member.estimate > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-medium">{member.estimate} pts</p>
                    <p className="text-xs text-muted-foreground">Story points</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
