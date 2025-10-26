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

const PROJECT_STATE_COLORS: Record<string, string> = {
  completed: 'hsl(142, 76%, 36%)',
  started: 'hsl(261, 80%, 60%)',
  in_progress: 'hsl(261, 80%, 60%)',
  planned: 'hsl(218, 11%, 65%)',
  paused: 'hsl(38, 92%, 50%)',
  canceled: 'hsl(0, 84%, 60%)',
  unknown: 'hsl(213, 15%, 35%)',
};

const ISSUE_STATE_WEIGHTS: Record<string, number> = {
  completed: 100,
  done: 100,
  finished: 100,
  started: 60,
  in_progress: 60,
  inreview: 80,
  blocked: 30,
  backlog: 0,
  todo: 0,
  unstarted: 0,
  canceled: 0,
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

  const projectProgress = useMemo(() => {
    const accumulator: Record<string, { total: number; count: number }> = {};

    issues.forEach((issue: any) => {
      if (!issue.project?.id) return;
      const projectId = issue.project.id;
      const type: string = (issue.state?.type || '').toLowerCase();
      const stateName = issue.state?.name ? issue.state.name.toLowerCase() : '';
      const weight = ISSUE_STATE_WEIGHTS[type] ?? ISSUE_STATE_WEIGHTS[stateName] ?? 0;

      if (!accumulator[projectId]) {
        accumulator[projectId] = { total: 0, count: 0 };
      }

      accumulator[projectId].total += weight;
      accumulator[projectId].count += 1;
    });

    return Object.fromEntries(
      Object.entries(accumulator).map(([projectId, value]) => {
        const average = value.count > 0 ? Math.min(100, Math.max(0, value.total / value.count)) : 0;
        return [projectId, average];
      })
    );
  }, [issues]);

  const normalizedProjects = useMemo(() => {
    return projects.map((project: any) => {
      const stateType =
        (project?.state?.type || project?.state || 'unknown')
          .toString()
          .toLowerCase();
      const stateLabel =
        project?.state?.name ||
        stateType
          .split('_')
          .map((segment: string) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(' ');

      const progressRaw = projectProgress[project.id];
      let progressValue: number | null = null;

      if (typeof progressRaw === 'number') {
        progressValue = progressRaw;
      } else if (typeof project.progress === 'number') {
        progressValue = project.progress > 1 ? project.progress : project.progress * 100;
      } else if (typeof project.progress?.progress === 'number') {
        const normalized = project.progress.progress;
        progressValue = normalized > 1 ? normalized : normalized * 100;
      }

      return {
        ...project,
        stateType,
        stateLabel,
        progressValue,
      };
    });
  }, [projects, projectProgress]);

  const kpis = useMemo(() => {
    const projectsByState = normalizedProjects.reduce((acc: Record<string, number>, project: any) => {
      const key = project.stateType || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const issuesByState = issues.reduce((acc: any, i: any) => {
      const type = (i.state?.type || 'unknown').toLowerCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const completedIssues = issues.filter((i: any) => i.state?.type === 'completed').length;
    const totalIssues = issues.length;
    const progressPercent = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    return {
      totalProjects: normalizedProjects.length,
      activeProjects: projectsByState.started || projectsByState['in_progress'] || 0,
      completedProjects: projectsByState.completed || 0,
      totalIssues,
      completedIssues,
      progressPercent,
      projectsByState,
      issuesByState,
    };
  }, [normalizedProjects, issues]);

  const projectChartData = Object.entries(kpis.projectsByState).map(([state, count]) => {
    const label = state === 'unknown'
      ? 'Unknown'
      : state
          .split('_')
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(' ');
    return {
      name: label,
      value: count,
      state,
    };
  });

  const issueChartData = Object.entries(kpis.issuesByState).map(([type, count]) => ({
    name:
      type === 'unknown'
        ? 'Unknown'
        : type
            .split('_')
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(' '),
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
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {projectChartData.map((entry, index) => {
                      const color = PROJECT_STATE_COLORS[entry.state] || PROJECT_STATE_COLORS.unknown;
                      return <Cell key={`project-bar-${index}`} fill={color} />;
                    })}
                  </Bar>
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
                      <Cell
                        key={`cell-${index}`}
                        fill={Object.values(PROJECT_STATE_COLORS)[index % Object.values(PROJECT_STATE_COLORS).length]}
                      />
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
          {normalizedProjects.length > 0 ? (
            <div className="space-y-3">
              {[...normalizedProjects]
                .sort((a: any, b: any) => {
                  const aTime = a.updatedAt
                    ? new Date(a.updatedAt).getTime()
                    : a.targetDate
                      ? new Date(a.targetDate).getTime()
                      : 0;
                  const bTime = b.updatedAt
                    ? new Date(b.updatedAt).getTime()
                    : b.targetDate
                      ? new Date(b.targetDate).getTime()
                      : 0;
                  return bTime - aTime;
                })
                .slice(0, 10)
                .map((project: any) => {
                  const stateKey = project.stateType || 'unknown';
                  const stateLabel = project.stateLabel;
                  const progressValue = project.progressValue;

                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-smooth"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            stateKey === 'completed' && 'bg-success',
                            stateKey === 'started' && 'bg-primary',
                            stateKey === 'planned' && 'bg-muted-foreground',
                            stateKey === 'paused' && 'bg-warning',
                            stateKey === 'canceled' && 'bg-destructive',
                            stateKey === 'unknown' && 'bg-muted-foreground/70'
                          )}
                        />
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {stateLabel}
                            {project.lead && ` • ${project.lead.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {progressValue !== null && progressValue !== undefined && (
                          <p className="text-sm font-medium">{Math.round(progressValue)}%</p>
                        )}
                        {project.targetDate && (
                          <p className="text-xs text-muted-foreground">
                            Due {new Date(project.targetDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
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
