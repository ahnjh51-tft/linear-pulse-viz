import { useQuery as useApolloQuery } from '@apollo/client';
import { useLinear } from '@/contexts/LinearContext';
import { GET_TEAM_PROJECTS, GET_TEAM_ISSUES } from '@/lib/linear-queries';
import { KPICard } from './KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, CheckCircle2, AlertCircle, Users, Activity } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = {
  completed: 'hsl(142, 76%, 36%)',
  started: 'hsl(261, 80%, 60%)',
  planned: 'hsl(218, 11%, 65%)',
  paused: 'hsl(38, 92%, 50%)',
  canceled: 'hsl(0, 84%, 60%)',
};

export const Overview = () => {
  const { selectedTeamId } = useLinear();
  
  const { data: projectsData, loading: projectsLoading } = useApolloQuery(GET_TEAM_PROJECTS, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: issuesData, loading: issuesLoading } = useApolloQuery(GET_TEAM_ISSUES, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const projects = projectsData?.team?.projects?.nodes || [];
  const issues = issuesData?.team?.issues?.nodes || [];

  const kpis = useMemo(() => {
    const projectsByState = projects.reduce((acc: any, p: any) => {
      const normalizedState = typeof p.state === 'string' ? p.state.toLowerCase() : 'planned';
      acc[normalizedState] = (acc[normalizedState] || 0) + 1;
      return acc;
    }, {});

    const issuesByState = issues.reduce((acc: any, i: any) => {
      const type = typeof i.state?.type === 'string' ? i.state.type.toLowerCase() : 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const completedIssues = issues.filter((i: any) => i.state.type === 'completed').length;
    const totalIssues = issues.length;
    const progressPercent = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    return {
      totalProjects: projects.length,
      activeProjects: projectsByState.started || 0,
      completedProjects: projectsByState.completed || 0,
      totalIssues,
      completedIssues,
      progressPercent,
      projectsByState,
      issuesByState,
    };
  }, [projects, issues]);

  const projectChartData = Object.entries(kpis.projectsByState).map(([state, count]) => ({
    name: state.charAt(0).toUpperCase() + state.slice(1),
    value: count,
  }));

  const issueChartData = Object.entries(kpis.issuesByState).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }));

  const loading = projectsLoading || issuesLoading;

  if (!selectedTeamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Please select a team to view KPIs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Projects"
          value={kpis.totalProjects}
          icon={<Folder className="w-5 h-5" />}
          loading={loading}
        />
        <KPICard
          title="Active Projects"
          value={kpis.activeProjects}
          icon={<Activity className="w-5 h-5" />}
          loading={loading}
        />
        <KPICard
          title="Progress"
          value={`${kpis.progressPercent}%`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          loading={loading}
          change={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Total Issues"
          value={kpis.totalIssues}
          icon={<Users className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {projectChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectChartData}>
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
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No projects found
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle>Issue Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {issueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={issueChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {issueChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No issues found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.slice(0, 10).map((project: any) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-smooth"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        project.state?.toLowerCase() === 'completed' && 'bg-success',
                        project.state?.toLowerCase() === 'started' && 'bg-primary',
                        project.state?.toLowerCase() === 'planned' && 'bg-muted-foreground',
                        project.state?.toLowerCase() === 'paused' && 'bg-warning',
                        project.state?.toLowerCase() === 'canceled' && 'bg-destructive'
                      )}
                    />
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.state.charAt(0).toUpperCase() + project.state.slice(1)}
                        {project.lead && ` • ${project.lead.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {project.progress !== null && (
                      <p className="text-sm font-medium">{Math.round(project.progress * 100)}%</p>
                    )}
                    {project.targetDate && (
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(project.targetDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No projects found for this team
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
