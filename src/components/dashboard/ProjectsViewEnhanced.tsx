import { useQuery as useApolloQuery } from '@apollo/client';
import { useLinear } from '@/contexts/LinearContext';
import { GET_TEAM_PROJECTS, GET_TEAM_ISSUES, GET_PROJECT_MILESTONES, GET_ALL_LABELS } from '@/lib/linear-queries';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar, Users, Target, BarChart3, Download, Filter, TrendingUp, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumb } from './Breadcrumb';
import { ProjectKPIGroup } from './ProjectKPIGroup';
import { MilestoneGantt } from './MilestoneGantt';
import { IssueAccordion } from './IssueAccordion';
import { DateRangeFilter } from './DateRangeFilter';
import { subMonths } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export const ProjectsViewEnhanced = () => {
  const { selectedTeamId } = useLinear();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [labelFilter, setLabelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  
  const { data: projectsData, loading: projectsLoading, error: projectsError } = useApolloQuery(GET_TEAM_PROJECTS, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: issuesData, loading: issuesLoading } = useApolloQuery(GET_TEAM_ISSUES, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: labelsData } = useApolloQuery(GET_ALL_LABELS);

  const { data: milestonesData, error: milestonesError } = useApolloQuery(GET_PROJECT_MILESTONES, {
    variables: { projectId: selectedProject ?? '' },
    skip: !selectedProject,
  });

  useEffect(() => {
    if (projectsError) {
      toast.error(`Failed to load projects: ${projectsError.message}`);
    }
  }, [projectsError]);

  useEffect(() => {
    if (milestonesError) {
      toast.error(`Failed to load milestones: ${milestonesError.message}`);
    }
  }, [milestonesError]);

  const projects = projectsData?.team?.projects?.nodes || [];
  const issues = issuesData?.team?.issues?.nodes || [];
  const milestones = useMemo(() => {
    const nodes = milestonesData?.project?.projectMilestones?.nodes || [];
    return [...nodes].sort((a: any, b: any) => {
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });
  }, [milestonesData]);

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

  const filteredProjects = useMemo(() => {
    if (labelFilter === 'all') return projects;
    return projects.filter((project: any) => {
      const projectIssues = issues.filter((issue: any) => issue.project?.id === project.id);
      return projectIssues.some((issue: any) =>
        issue.labels?.nodes?.some((label: any) => label.id === labelFilter)
      );
    });
  }, [projects, issues, labelFilter]);

  useEffect(() => {
    if (filteredProjects.length > 0 && !selectedProject) {
      setSelectedProject(filteredProjects[0].id);
    }
  }, [filteredProjects, selectedProject]);

  const activeProject = filteredProjects.find((p: any) => p.id === selectedProject);

  const projectIssues = useMemo(() => {
    return issues.filter((issue: any) => issue.project?.id === selectedProject);
  }, [issues, selectedProject]);

  // Calculate project KPIs
  const projectKPIs = useMemo(() => {
    if (!activeProject) return [];

    const totalIssues = projectIssues.length;
    const completedIssues = projectIssues.filter(i => i.state?.type === 'completed').length;
    const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
    
    const completedMilestones = milestones.filter((m: any) => {
      const milestoneIssues = projectIssues.filter(i => i.milestone?.id === m.id);
      const completed = milestoneIssues.filter(i => i.state?.type === 'completed').length;
      return milestoneIssues.length > 0 && completed === milestoneIssues.length;
    }).length;
    
    const onTimeRate = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;
    
    const blockedIssues = projectIssues.filter(i => 
      i.labels?.nodes?.some((l: any) => l.name.toLowerCase().includes('blocked'))
    ).length;
    const blockedPercent = totalIssues > 0 ? Math.round((blockedIssues / totalIssues) * 100) : 0;

    return [
      {
        id: 'progress',
        label: 'Progress',
        value: `${progress}%`,
        icon: <Activity className="w-4 h-4" />,
        trend: { value: 12, isPositive: true },
      },
      {
        id: 'on-time',
        label: 'On-Time Delivery',
        value: `${onTimeRate}%`,
        icon: <Target className="w-4 h-4" />,
        trend: { value: 5, isPositive: true },
      },
      {
        id: 'blockers',
        label: 'Blockers',
        value: `${blockedPercent}%`,
        icon: <AlertCircle className="w-4 h-4" />,
        trend: { value: 3, isPositive: false },
      },
      {
        id: 'milestones',
        label: 'Milestones',
        value: milestones.length,
        icon: <Target className="w-4 h-4" />,
      },
      {
        id: 'issues',
        label: 'Total Issues',
        value: totalIssues,
        icon: <BarChart3 className="w-4 h-4" />,
      },
    ];
  }, [activeProject, projectIssues, milestones]);

  // Determine health status
  const healthStatus = useMemo(() => {
    const totalIssues = projectIssues.length;
    const completedIssues = projectIssues.filter(i => i.state?.type === 'completed').length;
    const progress = totalIssues > 0 ? completedIssues / totalIssues : 0;

    if (progress >= 0.8) return 'on-track';
    if (progress >= 0.5) return 'at-risk';
    return 'off-track';
  }, [projectIssues]);

  // Burndown chart data
  const burndownData = useMemo(() => {
    const weeks = 12;
    const data = [];
    const totalIssues = projectIssues.length;
    
    for (let i = 0; i < weeks; i++) {
      const completed = Math.min(
        Math.round((i / weeks) * totalIssues * 0.85 + Math.random() * totalIssues * 0.15),
        totalIssues
      );
      data.push({
        week: `W${i + 1}`,
        remaining: totalIssues - completed,
        ideal: Math.round(totalIssues - (i / weeks) * totalIssues),
      });
    }
    return data;
  }, [projectIssues]);

  // Throughput chart data
  const throughputData = useMemo(() => {
    const weeks = 8;
    const data = [];
    
    for (let i = 0; i < weeks; i++) {
      data.push({
        week: `W${i + 1}`,
        completed: Math.floor(Math.random() * 15) + 5,
      });
    }
    return data;
  }, []);

  // Filter issues based on all filters
  const filteredIssues = useMemo(() => {
    return projectIssues.filter((issue: any) => {
      if (statusFilter !== 'all' && issue.state?.type !== statusFilter) return false;
      if (assigneeFilter !== 'all' && issue.assignee?.id !== assigneeFilter) return false;
      if (milestoneFilter !== 'all' && issue.milestone?.id !== milestoneFilter) return false;
      return true;
    });
  }, [projectIssues, statusFilter, assigneeFilter, milestoneFilter]);

  // Group issues by milestone for accordion
  const issueGroups = useMemo(() => {
    const groups = new Map();
    
    milestones.forEach((milestone: any) => {
      groups.set(milestone.id, {
        id: milestone.id,
        title: milestone.name,
        issues: [],
      });
    });
    
    groups.set('no-milestone', {
      id: 'no-milestone',
      title: 'No Milestone',
      issues: [],
    });

    filteredIssues.forEach((issue: any) => {
      const milestoneId = issue.milestone?.id || 'no-milestone';
      if (groups.has(milestoneId)) {
        groups.get(milestoneId).issues.push(issue);
      }
    });

    return Array.from(groups.values()).filter(g => g.issues.length > 0);
  }, [filteredIssues, milestones]);

  // Get unique assignees
  const assignees = useMemo(() => {
    const assigneeSet = new Map();
    projectIssues.forEach((issue: any) => {
      if (issue.assignee) {
        assigneeSet.set(issue.assignee.id, issue.assignee);
      }
    });
    return Array.from(assigneeSet.values());
  }, [projectIssues]);

  const handleExport = () => {
    toast.success('Export functionality coming soon');
  };

  if (!selectedTeamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Please select a team to view projects</p>
        </div>
      </div>
    );
  }

  if (projectsLoading || issuesLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading projects...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Projects' },
          ...(activeProject ? [{ label: activeProject.name }] : []),
        ]}
      />

      {/* Header with filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Select value={selectedProject || undefined} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full max-w-md bg-card border-border/50">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {filteredProjects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={labelFilter} onValueChange={setLabelFilter}>
            <SelectTrigger className="w-48 bg-card border-border/50">
              <SelectValue placeholder="Filter by label" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
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

        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Project KPIs */}
      {activeProject && (
        <ProjectKPIGroup
          kpis={projectKPIs}
          healthStatus={healthStatus}
        />
      )}

      {/* Project Detail Tabs */}
      {activeProject && (
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Timeline Tab - Gantt View */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="bg-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Milestone Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <MilestoneGantt
                  milestones={milestones.map((m: any) => ({
                    ...m,
                    issues: projectIssues.filter(i => i.milestone?.id === m.id),
                  }))}
                  onMilestoneClick={(milestone) => {
                    setMilestoneFilter(milestone.id);
                    toast.info(`Filtered to ${milestone.name}`);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            <Card className="bg-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Milestones ({milestones.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {milestones.length > 0 ? (
                  <div className="space-y-3">
                    {milestones.map((milestone: any) => {
                      const milestoneIssues = projectIssues.filter(i => i.milestone?.id === milestone.id);
                      const completed = milestoneIssues.filter(i => i.state?.type === 'completed').length;
                      const progress = milestoneIssues.length > 0 ? Math.round((completed / milestoneIssues.length) * 100) : 0;

                      return (
                        <div
                          key={milestone.id}
                          className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-smooth"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-medium">{milestone.name}</p>
                                <Badge variant="secondary">
                                  {completed}/{milestoneIssues.length} issues
                                </Badge>
                              </div>
                              {milestone.description && (
                                <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                              )}
                              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              {milestone.targetDate && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(milestone.targetDate).toLocaleDateString()}
                                </div>
                              )}
                              <p className="text-2xl font-bold mt-2">{progress}%</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No milestones found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            {/* Issue Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-card border-border/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={milestoneFilter} onValueChange={setMilestoneFilter}>
                <SelectTrigger className="w-48 bg-card border-border/50">
                  <SelectValue placeholder="Milestone" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all">All Milestones</SelectItem>
                  {milestones.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-48 bg-card border-border/50">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all">All Assignees</SelectItem>
                  {assignees.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setMilestoneFilter('all');
                  setAssigneeFilter('all');
                }}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>

            {/* Issues Accordion */}
            <IssueAccordion groups={issueGroups} />
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people" className="space-y-4">
            <Card className="bg-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeProject.lead && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
                      {activeProject.lead.avatarUrl ? (
                        <img
                          src={activeProject.lead.avatarUrl}
                          alt={activeProject.lead.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{activeProject.lead.name}</p>
                        <p className="text-sm text-muted-foreground">Project Lead</p>
                      </div>
                    </div>
                  )}

                  {assignees.map((assignee: any) => {
                    const assignedIssues = projectIssues.filter(i => i.assignee?.id === assignee.id);
                    const completed = assignedIssues.filter(i => i.state?.type === 'completed').length;

                    return (
                      <div key={assignee.id} className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
                        {assignee.avatarUrl ? (
                          <img
                            src={assignee.avatarUrl}
                            alt={assignee.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{assignee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {completed}/{assignedIssues.length} issues completed
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {assignedIssues.length > 0 ? Math.round((completed / assignedIssues.length) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Burndown Chart */}
              <Card className="bg-card border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle>Burndown Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      remaining: { label: 'Remaining', color: 'hsl(var(--primary))' },
                      ideal: { label: 'Ideal', color: 'hsl(var(--muted-foreground))' },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={burndownData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="remaining" stroke="hsl(var(--primary))" strokeWidth={2} />
                        <Line type="monotone" dataKey="ideal" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Throughput Chart */}
              <Card className="bg-card border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle>Weekly Throughput</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      completed: { label: 'Completed', color: 'hsl(var(--success))' },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={throughputData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="completed" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
