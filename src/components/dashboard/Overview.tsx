import { useQuery as useApolloQuery } from '@apollo/client';
import { useLinear } from '@/contexts/LinearContext';
import { GET_TEAM_PROJECTS, GET_TEAM_ISSUES, GET_ALL_LABELS } from '@/lib/linear-queries';
import { KPICard } from './KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder, CheckCircle2, AlertCircle, Users, Activity, ArrowUpRight, Inbox } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { KPICardSkeleton, ChartSkeleton, TableRowSkeleton } from '@/components/ui/loading-skeleton';
import { SearchInput } from '@/components/shared/SearchInput';
import { useSearch } from '@/hooks/useSearch';
import { useFavorites } from '@/hooks/useFavorites';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCSV, exportToJSON } from '@/lib/export-utils';
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
  const [projectLabelFilter, setProjectLabelFilter] = useState<string>('all');
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  
  const { data: projectsData, loading: projectsLoading } = useApolloQuery(GET_TEAM_PROJECTS, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: issuesData, loading: issuesLoading } = useApolloQuery(GET_TEAM_ISSUES, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: labelsData } = useApolloQuery(GET_ALL_LABELS);

  const projects = projectsData?.team?.projects?.nodes || [];
  const issues = issuesData?.team?.issues?.nodes || [];

  // Get all unique labels
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

  // Filter projects by label
  const labelFilteredProjects = useMemo(() => {
    if (projectLabelFilter === 'all') return projects;
    return projects.filter((project: any) => {
      const projectIssues = issues.filter((issue: any) => issue.project?.id === project.id);
      return projectIssues.some((issue: any) =>
        issue.labels?.nodes?.some((label: any) => label.id === projectLabelFilter)
      );
    });
  }, [projects, issues, projectLabelFilter]);

  const { searchQuery, setSearchQuery, filteredItems: filteredProjects } = useSearch(
    labelFilteredProjects,
    ['name', 'state', (p: any) => p.lead?.name || '']
  );

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
    <div className="content-spacing animate-fade-in">
      {/* KPI Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6" role="region" aria-label="Key Performance Indicators">
          {loading ? (
            <>
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
            </>
          ) : (
            <>
              <KPICard
                title="Total Projects"
                value={kpis.totalProjects}
                variant="info"
                icon={<Folder className="w-5 h-5" aria-hidden="true" />}
                loading={loading}
              />
              <KPICard
                title="Active Projects"
                value={kpis.activeProjects}
                variant="default"
                icon={<Activity className="w-5 h-5" aria-hidden="true" />}
                loading={loading}
              />
              <KPICard
                title="Progress"
                value={`${kpis.progressPercent}%`}
                variant="success"
                icon={<CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
                loading={loading}
                change={{ value: 12, isPositive: true }}
              />
              <KPICard
                title="Total Issues"
                value={kpis.totalIssues}
                icon={<Users className="w-5 h-5" aria-hidden="true" />}
                loading={loading}
              />
            </>
          )}
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6" role="region" aria-label="Status Distribution Charts">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <Card className="card-spacing bg-card border-border/50 shadow-card hover:shadow-lg transition-all duration-200">
              <h3 className="mb-4">Project Status Distribution</h3>
              <CardContent>
                {projectChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectChartData} role="img" aria-label="Bar chart showing project status distribution">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--popover-foreground))',
                        }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
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

            <Card className="card-spacing bg-card border-border/50 shadow-card hover:shadow-lg transition-all duration-200">
              <h3 className="mb-4">Issue Status Distribution</h3>
              <CardContent className="p-0">
                {issueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart role="img" aria-label="Pie chart showing issue status distribution">
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
                          color: 'hsl(var(--popover-foreground))',
                        }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
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
          </>
        )}
      </section>

      {/* Projects Table */}
      <Card className="card-spacing bg-card border-border/50 shadow-card hover:shadow-lg transition-all duration-200">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3>Recent Projects</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(filteredProjects, 'projects')}
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToJSON(filteredProjects, 'projects')}
              >
                Export JSON
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search projects..."
              className="flex-1"
            />
            <Select value={projectLabelFilter} onValueChange={setProjectLabelFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
          </div>
        </div>
        <div className="pt-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="space-y-2">
              {filteredProjects.slice(0, 10).map((project: any, index) => (
                <div
                  key={project.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:scale-[1.01] transition-all duration-200 gap-3 sm:gap-4 cursor-pointer group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(project.id);
                      }}
                      className="shrink-0 h-8 w-8 p-0"
                    >
                      <Star className={cn("w-4 h-4", isFavorite(project.id) && "fill-yellow-500 text-yellow-500")} />
                    </Button>
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        project.state?.toLowerCase() === 'completed' && 'bg-success',
                        project.state?.toLowerCase() === 'started' && 'bg-primary',
                        project.state?.toLowerCase() === 'planned' && 'bg-muted-foreground',
                        project.state?.toLowerCase() === 'paused' && 'bg-warning',
                        project.state?.toLowerCase() === 'canceled' && 'bg-destructive'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">{project.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.state.charAt(0).toUpperCase() + project.state.slice(1)}
                        {project.lead && ` • ${project.lead.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-left sm:text-right shrink-0">
                    {project.progress !== null && (
                      <p className="text-sm font-medium">{Math.round(project.progress * 100)}%</p>
                    )}
                    {project.targetDate && (
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(project.targetDate).toLocaleDateString()}
                      </p>
                    )}
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Inbox}
              title="No projects found"
              description="No projects found for the selected filters. Try adjusting your filters or select a different team."
            />
          )}
        </div>
      </Card>
    </div>
  );
};
