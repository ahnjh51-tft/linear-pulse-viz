import { useEffect, useMemo, useState } from 'react';
import { useQuery as useApolloQuery } from '@apollo/client';
import { useLinear } from '@/contexts/LinearContext';
import { GET_TEAM_PROJECTS, GET_TEAM_ISSUES } from '@/lib/linear-queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Calendar, Filter, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check } from 'lucide-react';

const QUICK_RANGE_OPTIONS = [
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '60', label: 'Last 60 days', days: 60 },
  { id: '90', label: 'Last 90 days', days: 90 },
  { id: 'quarter', label: 'This Quarter', days: 120 },
  { id: 'all', label: 'All time' },
] as const;

type QuickRangeId = (typeof QUICK_RANGE_OPTIONS)[number]['id'];

const formatDate = (date: string | null | undefined) => {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  } catch (error) {
    return '—';
  }
};

const getRangeStart = (range: QuickRangeId) => {
  if (range === 'all') return null;
  const option = QUICK_RANGE_OPTIONS.find((o) => o.id === range);
  if (!option || !('days' in option)) return null;
  const now = new Date();
  now.setDate(now.getDate() - (option.days ?? 0));
  return now;
};

const formatProjectState = (state: string) =>
  state ? state.charAt(0).toUpperCase() + state.slice(1) : 'Unknown';

const getStatusVariant = (state: string) => {
  const normalized = state.toLowerCase();
  if (normalized === 'completed') return 'default';
  if (normalized === 'started') return 'secondary';
  if (normalized === 'paused') return 'outline';
  if (normalized === 'canceled') return 'destructive';
  return 'outline';
};

const ToggleCommandList = ({
  items,
  selected,
  onToggle,
  placeholder,
}: {
  items: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  placeholder: string;
}) => {
  return (
    <Command>
      <CommandInput placeholder={`Search ${placeholder}`} className="border-none" />
      <CommandList>
        <CommandEmpty>No {placeholder} found.</CommandEmpty>
        <CommandGroup>
          {items.map((item) => (
            <CommandItem
              key={item.id}
              value={item.name}
              className="flex items-center gap-2"
              onSelect={() => onToggle(item.id)}
            >
              <Check
                className={cn(
                  'h-4 w-4 shrink-0',
                  selected.includes(item.id) ? 'opacity-100' : 'opacity-0'
                )}
              />
              <span className="truncate">{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export const ProjectsView = () => {
  const { selectedTeamId } = useLinear();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [range, setRange] = useState<QuickRangeId>('60');
  const [followedProjects, setFollowedProjects] = useState<Record<string, boolean>>({});
  const [capacityOverrides, setCapacityOverrides] = useState<Record<string, number>>({});
  const [projectSearch, setProjectSearch] = useState('');

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

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find((project: any) => project.id === selectedProjectId) || null;

  const filteredProjects = useMemo(() => {
    if (!projectSearch) return projects;
    const term = projectSearch.toLowerCase();
    return projects.filter((project: any) => project.name.toLowerCase().includes(term));
  }, [projects, projectSearch]);

  const availableStatuses = useMemo(() => {
    const set = new Map<string, string>();
    issues.forEach((issue: any) => {
      if (issue.state) {
        set.set(issue.state.type, issue.state.name);
      }
    });
    return Array.from(set, ([id, name]) => ({ id, name }));
  }, [issues]);

  const availableLabels = useMemo(() => {
    const set = new Map<string, string>();
    issues.forEach((issue: any) => {
      issue.labels?.nodes?.forEach((label: any) => {
        set.set(label.id, label.name);
      });
    });
    return Array.from(set, ([id, name]) => ({ id, name }));
  }, [issues]);

  const availableAssignees = useMemo(() => {
    const set = new Map<string, string>();
    issues.forEach((issue: any) => {
      if (issue.assignee) {
        set.set(issue.assignee.id, issue.assignee.name);
      }
    });
    return Array.from(set, ([id, name]) => ({ id, name }));
  }, [issues]);

  const issuesForProject = useMemo(() => {
    if (!selectedProjectId) return [];
    const startBoundary = getRangeStart(range)?.getTime();
    return issues.filter((issue: any) => {
      if (issue.project?.id !== selectedProjectId) return false;
      if (statusFilter.length && !statusFilter.includes(issue.state?.type)) return false;
      if (labelFilter.length) {
        const labelIds = (issue.labels?.nodes || []).map((l: any) => l.id);
        if (!labelIds.some((id: string) => labelFilter.includes(id))) return false;
      }
      if (assigneeFilter.length && (!issue.assignee || !assigneeFilter.includes(issue.assignee.id))) {
        return false;
      }
      if (startBoundary) {
        const createdAt = issue.createdAt ? new Date(issue.createdAt).getTime() : null;
        if (!createdAt || createdAt < startBoundary) return false;
      }
      return true;
    });
  }, [issues, selectedProjectId, statusFilter, labelFilter, assigneeFilter, range]);

  const timelineData = useMemo(() => {
    if (!selectedProject) return { lanes: [], milestones: [], start: null, end: null };
    const milestones = selectedProject.projectMilestones?.nodes || [];
    const projectIssues = issues.filter((issue: any) => issue.project?.id === selectedProject.id);
    const allDates: Date[] = [];

    const lanesMap = new Map<string, { label: string; issues: any[] }>();

    projectIssues.forEach((issue: any) => {
      const startDate = issue.startedAt || issue.createdAt || selectedProject.startDate;
      const endDate = issue.completedAt || issue.dueDate || selectedProject.targetDate;
      if (startDate) allDates.push(new Date(startDate));
      if (endDate) allDates.push(new Date(endDate));

      const issueLabels = issue.labels?.nodes?.length
        ? issue.labels.nodes
        : [{ id: 'none', name: 'No Label' }];

      issueLabels.forEach((label: any) => {
        if (!lanesMap.has(label.id)) {
          lanesMap.set(label.id, { label: label.name, issues: [] });
        }
        lanesMap.get(label.id)?.issues.push({ issue, startDate, endDate });
      });
    });

    milestones.forEach((milestone: any) => {
      if (milestone.targetDate) allDates.push(new Date(milestone.targetDate));
    });

    if (selectedProject.startDate) allDates.push(new Date(selectedProject.startDate));
    if (selectedProject.targetDate) allDates.push(new Date(selectedProject.targetDate));

    const start = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : null;
    const end = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : null;

    const lanes = Array.from(lanesMap.values()).map((lane) => ({
      ...lane,
      issues: lane.issues.sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime()),
    }));

    return { lanes, milestones, start, end };
  }, [issues, selectedProject]);

  const projectStats = useMemo(() => {
    if (!selectedProject) return null;
    const projectIssues = issues.filter((issue: any) => issue.project?.id === selectedProject.id);
    const completed = projectIssues.filter((issue: any) => issue.state?.type === 'completed').length;
    const progress = projectIssues.length > 0 ? (completed / projectIssues.length) * 100 : 0;
    const blocked = projectIssues.filter((issue: any) =>
      issue.labels?.nodes?.some((label: any) => label.name.toLowerCase().includes('blocked'))
    ).length;

    const people = projectIssues.reduce((acc: Record<string, any>, issue: any) => {
      if (issue.assignee) {
        const id = issue.assignee.id;
        if (!acc[id]) {
          acc[id] = {
            id,
            name: issue.assignee.name,
            avatarUrl: issue.assignee.avatarUrl,
            issues: 0,
            points: 0,
          };
        }
        acc[id].issues += 1;
        acc[id].points += issue.estimate || 1;
      }
      return acc;
    }, {});

    const velocityWindowStart = getRangeStart('30')?.getTime() ?? 0;
    const recentCompleted = projectIssues.filter((issue: any) => {
      if (!issue.completedAt) return false;
      return new Date(issue.completedAt).getTime() >= velocityWindowStart;
    }).length;

    return {
      progress: Math.round(progress),
      totalIssues: projectIssues.length,
      completed,
      blocked,
      blockedRatio: projectIssues.length ? blocked / projectIssues.length : 0,
      people: Object.values(people),
      velocity: recentCompleted,
    };
  }, [issues, selectedProject]);

  const guardrailAlerts = useMemo(() => {
    if (!projectStats || !selectedProject) return [];
    const alerts: string[] = [];
    if (projectStats.blockedRatio > 0.25) {
      alerts.push('Blocked issues exceed 25% of project workload');
    }

    const upcomingMilestones = (selectedProject.projectMilestones?.nodes || []).filter((milestone: any) => {
      if (!milestone.targetDate) return false;
      const target = new Date(milestone.targetDate);
      const now = new Date();
      const diff = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7 && !milestone.completedAt;
    });
    if (upcomingMilestones.length > 0) {
      alerts.push(`${upcomingMilestones.length} milestone(s) due within 7 days`);
    }

    return alerts;
  }, [projectStats, selectedProject]);

  const toggleFollowProject = (projectId: string) => {
    setFollowedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const updateCapacity = (userId: string, value: number) => {
    setCapacityOverrides((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const renderTimeline = () => {
    if (!selectedProject) {
      return (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          Select a project to view its timeline.
        </div>
      );
    }

    const { lanes, milestones, start, end } = timelineData;
    if (!start || !end || lanes.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          Not enough data to render a timeline.
        </div>
      );
    }

    const totalDuration = end.getTime() - start.getTime() || 1;

    const getPosition = (date: string | null | undefined) => {
      if (!date) return 0;
      const diff = new Date(date).getTime() - start.getTime();
      return Math.min(100, Math.max(0, (diff / totalDuration) * 100));
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Start: {formatDate(start.toISOString())}</span>
          <span>End: {formatDate(end.toISOString())}</span>
        </div>
        <div className="space-y-4">
          {lanes.map((lane) => (
            <div key={lane.label} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Badge variant="secondary">{lane.label}</Badge>
                <span className="text-muted-foreground">{lane.issues.length} issues</span>
              </div>
              <div className="relative h-20 rounded-xl bg-secondary/30">
                {lane.issues.map(({ issue, startDate, endDate }) => {
                  const left = getPosition(startDate || selectedProject.startDate);
                  const right = getPosition(endDate || selectedProject.targetDate);
                  const width = Math.max(8, right - left);
                  return (
                    <div
                      key={issue.id}
                      className="absolute top-2 h-12 rounded-lg border border-border/60 bg-primary/60 backdrop-blur text-xs"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <div className="p-2">
                        <p className="font-semibold text-foreground/90">
                          {issue.identifier || issue.title}
                        </p>
                        <p className="text-muted-foreground">{issue.title}</p>
                      </div>
                    </div>
                  );
                })}
                {milestones.map((milestone: any) => {
                  if (!milestone.targetDate) return null;
                  const left = getPosition(milestone.targetDate);
                  return (
                    <div
                      key={milestone.id}
                      className="absolute inset-y-0 w-0.5 bg-warning"
                      style={{ left: `${left}%` }}
                    >
                      <div className="absolute -top-6 -translate-x-1/2 whitespace-nowrap rounded bg-warning/20 px-2 py-1 text-xs font-medium text-warning">
                        {milestone.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderIssuesTable = () => {
    if (!selectedProject) {
      return null;
    }
    return (
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>
            {issuesForProject.length} issue(s) matching current filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Estimate</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issuesForProject.map((issue: any) => (
                <TableRow key={issue.id} className="hover:bg-secondary/30">
                  <TableCell>
                    <div className="font-medium">{issue.identifier}</div>
                    <div className="text-sm text-muted-foreground">{issue.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {issue.labels?.nodes?.map((label: any) => (
                        <Badge key={label.id} variant="outline">
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{issue.state?.name}</Badge>
                  </TableCell>
                  <TableCell>{issue.assignee?.name ?? 'Unassigned'}</TableCell>
                  <TableCell>{issue.estimate ?? '—'}</TableCell>
                  <TableCell>{formatDate(issue.createdAt)}</TableCell>
                  <TableCell>{formatDate(issue.dueDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  if (!selectedTeamId) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
        <AlertCircle className="h-12 w-12" />
        <p className="text-lg">Select a team to inspect project health.</p>
      </div>
    );
  }

  const loading = projectsLoading || issuesLoading;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">
            Track progress, milestones, and workloads with a Linear-inspired view.
          </p>
        </div>
        {selectedProject && (
          <Button
            variant={followedProjects[selectedProject.id] ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => toggleFollowProject(selectedProject.id)}
            className="gap-2"
          >
            <Star className="h-4 w-4" fill={followedProjects[selectedProject.id] ? 'currentColor' : 'none'} />
            {followedProjects[selectedProject.id] ? 'Following' : 'Follow project'}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle>Project list</CardTitle>
            <CardDescription>Choose a project to drill down into its health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search projects..."
              className="bg-background/60"
              value={projectSearch}
              onChange={(event) => setProjectSearch(event.target.value)}
            />
            <ScrollArea className="h-[520px] pr-2">
              <div className="space-y-3">
                {filteredProjects.map((project: any) => {
                  const projectIssues = issues.filter((issue: any) => issue.project?.id === project.id);
                  const completed = projectIssues.filter((issue: any) => issue.state?.type === 'completed').length;
                  const progress = projectIssues.length > 0 ? Math.round((completed / projectIssues.length) * 100) : 0;
                  const isActive = selectedProjectId === project.id;
                  return (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className={cn(
                        'w-full rounded-xl border border-border/60 bg-secondary/30 p-4 text-left transition-smooth hover:bg-secondary/50',
                        isActive && 'border-primary bg-primary/10'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold leading-tight">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.description ?? 'No description'}</p>
                        </div>
                        <Badge variant={getStatusVariant(project.state)}>
                          {formatProjectState(project.state)}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {project.targetDate ? `Due ${formatDate(project.targetDate)}` : 'No target date'}
                        </span>
                        <span>{progress}% done</span>
                      </div>
                      <Progress value={progress} className="mt-2" />
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border/50 shadow-card">
            <CardHeader className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>{selectedProject?.name ?? 'Select a project'}</CardTitle>
                <CardDescription>
                  {selectedProject?.description || 'Choose a project to view key performance indicators.'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {selectedProject?.lead && (
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Lead: {selectedProject.lead.name}
                  </span>
                )}
                {selectedProject?.targetDate && <span>Target: {formatDate(selectedProject.targetDate)}</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-background/40 border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{projectStats?.progress ?? 0}%</p>
                    <Progress value={projectStats?.progress ?? 0} className="mt-3" />
                  </CardContent>
                </Card>
                <Card className="bg-background/40 border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Velocity (30d)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{projectStats?.velocity ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Issues completed in the last 30 days</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/40 border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Open Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">
                      {(projectStats?.totalIssues ?? 0) - (projectStats?.completed ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">{projectStats?.totalIssues ?? 0} total</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/40 border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{projectStats?.blocked ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Guardrails warn at 25%</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-background/30 border-border/40">
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Shared filters</CardTitle>
                    <CardDescription>Applies to issues, people, and analytics tabs.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setStatusFilter([]);
                    setLabelFilter([]);
                    setAssigneeFilter([]);
                    setRange('60');
                  }}>
                    Reset filters
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" /> Status
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-popover p-0">
                      <ToggleCommandList
                        items={availableStatuses}
                        selected={statusFilter}
                        onToggle={(id) =>
                          setStatusFilter((prev) =>
                            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                          )
                        }
                        placeholder="statuses"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" /> Labels
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-popover p-0">
                      <ToggleCommandList
                        items={availableLabels}
                        selected={labelFilter}
                        onToggle={(id) =>
                          setLabelFilter((prev) =>
                            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                          )
                        }
                        placeholder="labels"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" /> Assignees
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-popover p-0">
                      <ToggleCommandList
                        items={availableAssignees}
                        selected={assigneeFilter}
                        onToggle={(id) =>
                          setAssigneeFilter((prev) =>
                            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                          )
                        }
                        placeholder="people"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" /> Date range
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-popover">
                      <div className="space-y-2">
                        {QUICK_RANGE_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setRange(option.id)}
                            className={cn(
                              'w-full rounded-md px-3 py-2 text-left text-sm transition-smooth hover:bg-secondary/40',
                              range === option.id && 'bg-secondary/40 text-foreground'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>

              {guardrailAlerts.length > 0 && (
                <Card className="border-warning/40 bg-warning/10">
                  <CardHeader className="flex flex-row items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <div>
                      <CardTitle className="text-base text-warning">Guardrail alerts</CardTitle>
                      <CardDescription className="text-warning/80">
                        Monitor these items to keep the project on track.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-warning">
                    {guardrailAlerts.map((alert) => (
                      <div key={alert} className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{alert}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-background/60">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="milestones">Milestones</TabsTrigger>
                  <TabsTrigger value="issues">Issues</TabsTrigger>
                  <TabsTrigger value="people">People</TabsTrigger>
                  <TabsTrigger value="settings">Project settings</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4">
                  {renderTimeline()}
                </TabsContent>

                <TabsContent value="milestones" className="space-y-4">
                  <Card className="bg-background/40 border-border/40">
                    <CardHeader>
                      <CardTitle>Milestones</CardTitle>
                      <CardDescription>
                        Track target dates and completion status. Click a milestone to inspect linked issues.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(selectedProject?.projectMilestones?.nodes || []).length === 0 && (
                        <p className="text-muted-foreground">No milestones for this project.</p>
                      )}
                      {(selectedProject?.projectMilestones?.nodes || []).map((milestone: any) => {
                        const isComplete = Boolean(milestone.completedAt);
                        return (
                          <div
                            key={milestone.id}
                            className="rounded-xl border border-border/40 bg-secondary/20 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">{milestone.name}</p>
                                <p className="text-sm text-muted-foreground">{milestone.description || 'No description'}</p>
                              </div>
                              <Badge variant={isComplete ? 'default' : 'secondary'}>
                                {isComplete ? 'Completed' : 'In progress'}
                              </Badge>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              <span>Target {formatDate(milestone.targetDate)}</span>
                              {isComplete && <span>Completed {formatDate(milestone.completedAt)}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="issues" className="space-y-4">
                  {renderIssuesTable()}
                </TabsContent>

                <TabsContent value="people" className="space-y-4">
                  <Card className="bg-background/40 border-border/40">
                    <CardHeader>
                      <CardTitle>Workload vs capacity</CardTitle>
                      <CardDescription>
                        Compare active assignments against configurable weekly capacity per person.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {projectStats?.people?.length ? (
                        projectStats.people.map((person: any) => {
                          const capacity = capacityOverrides[person.id] ?? 20;
                          const utilization = capacity > 0 ? Math.min(100, Math.round((person.points / capacity) * 100)) : 0;
                          const utilizationColor =
                            utilization < 80 ? 'text-success' : utilization <= 100 ? 'text-warning' : 'text-destructive';
                          return (
                            <div key={person.id} className="rounded-xl border border-border/40 bg-secondary/20 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                  <p className="font-semibold">{person.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {person.issues} issues • {person.points} pts assigned
                                  </p>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                  Capacity
                                  <Input
                                    type="number"
                                    min={1}
                                    value={capacity}
                                    onChange={(event) => updateCapacity(person.id, Number(event.target.value))}
                                    className="mt-1 w-24 bg-background/70"
                                  />
                                </div>
                              </div>
                              <div className="mt-4 space-y-2">
                                <Progress value={utilization} className="h-2" />
                                <div className={cn('text-sm font-medium', utilizationColor)}>
                                  Utilization {utilization}%
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground">No assignments found for this project.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <Card className="bg-background/40 border-border/40">
                    <CardHeader>
                      <CardTitle>Project preferences</CardTitle>
                      <CardDescription>
                        Configure calculation basis, guardrail thresholds, and pinned swimlanes for this project.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">Progress basis</p>
                        <p>Currently using completed issues / total issues. Update this in Settings → Progress basis.</p>
                      </div>
                      <Separator className="bg-border/40" />
                      <div>
                        <p className="font-medium text-foreground">Guardrails</p>
                        <p>Alert when blocked issues exceed 25% and milestones are within 7 days without completion.</p>
                      </div>
                      <Separator className="bg-border/40" />
                      <div>
                        <p className="font-medium text-foreground">Pinned lanes</p>
                        <p>Swimlanes are ordered automatically by label. Pin lanes from the timeline view.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading latest project data…</div>
      )}
    </div>
  );
};

