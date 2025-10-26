import { useEffect, useMemo, useState } from 'react';
import { useQuery as useApolloQuery } from '@apollo/client';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Star,
  Users,
} from 'lucide-react';
import { useLinear } from '@/contexts/LinearContext';
import { GET_PROJECT_MILESTONES, GET_TEAM_ISSUES, GET_TEAM_PROJECTS } from '@/lib/linear-queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  completed: 'hsl(142, 76%, 36%)',
  started: 'hsl(261, 80%, 60%)',
  planned: 'hsl(218, 11%, 65%)',
  paused: 'hsl(38, 92%, 50%)',
  canceled: 'hsl(0, 84%, 60%)',
  backlog: 'hsl(217, 15%, 50%)',
  unknown: 'hsl(213, 15%, 35%)',
};

type IssueNode = {
  id: string;
  identifier: string;
  title: string;
  priority: number | null;
  createdAt: string;
  completedAt: string | null;
  startedAt?: string | null;
  dueDate?: string | null;
  updatedAt?: string | null;
  estimate?: number | null;
  state?: { id: string; name: string; type: string } | null;
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
  labels?: { nodes?: { id: string; name: string; color?: string | null }[] } | null;
  project?: { id: string; name: string } | null;
};

type ProjectNode = {
  id: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  state?: string | null;
  progress?: number | null;
  updatedAt?: string | null;
  lead?: { id: string; name: string; avatarUrl?: string | null } | null;
  projectMilestones?: { nodes?: { id: string; name: string; targetDate?: string | null }[] } | null;
};

type MilestoneNode = { id: string; name: string; targetDate?: string | null; description?: string | null };

type Guardrail = { id: string; message: string; severity: 'warning' | 'critical' };

const DATE_PRESETS = [
  { label: 'Last 14 days', value: '14' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 60 days', value: '60' },
  { label: 'Quarter to date', value: '90' },
  { label: 'All time', value: 'all' },
];

const getStateKey = (value?: string | null) => {
  if (!value) return 'unknown';
  return value.toLowerCase();
};

const formatStateLabel = (value: string) => {
  if (!value || value === 'unknown') return 'Unknown';
  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const toDate = (value?: string | null) => (value ? new Date(value) : null);

const normalizeLinearColor = (value?: string | null) => {
  if (!value) return undefined;
  return value.startsWith('#') ? value : `#${value}`;
};

const STATE_WEIGHTS: Record<string, number> = {
  completed: 100,
  done: 100,
  started: 60,
  in_progress: 60,
  inreview: 80,
  unstarted: 0,
  backlog: 0,
  canceled: 0,
};

export const ProjectsView = () => {
  const { selectedTeamId } = useLinear();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<string>('30');
  const [followedProjects, setFollowedProjects] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('followed_projects');
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch (error) {
      console.error('Failed to read followed projects from storage', error);
      return [];
    }
  });

  const { data: projectsData, loading: projectsLoading } = useApolloQuery(GET_TEAM_PROJECTS, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: issuesData, loading: issuesLoading } = useApolloQuery(GET_TEAM_ISSUES, {
    variables: { teamId: selectedTeamId, first: 500 },
    skip: !selectedTeamId,
  });

  const { data: milestoneData } = useApolloQuery(GET_PROJECT_MILESTONES, {
    variables: { projectId: selectedProjectId || '' },
    skip: !selectedProjectId,
  });

  useEffect(() => {
    localStorage.setItem('followed_projects', JSON.stringify(followedProjects));
  }, [followedProjects]);

  const projects = (projectsData?.team?.projects?.nodes || []) as ProjectNode[];
  const issues = (issuesData?.team?.issues?.nodes || []) as IssueNode[];

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId(null);
      return;
    }

    if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;

  const projectMilestones = (milestoneData?.project?.projectMilestones?.nodes ||
    selectedProject?.projectMilestones?.nodes ||
    []) as MilestoneNode[];

  const projectProgressById = useMemo(() => {
    if (!issues.length) return {} as Record<string, number>;

    const accumulator: Record<string, { total: number; count: number }> = {};

    issues.forEach((issue) => {
      const projectId = issue.project?.id;
      if (!projectId) return;
      const stateKey =
        issue.state?.type?.toLowerCase() || (issue.state?.name ? issue.state.name.toLowerCase() : 'unstarted');
      const weight = STATE_WEIGHTS[stateKey] ?? 0;
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

  const projectIssues = useMemo(() => {
    if (!selectedProjectId) return [] as IssueNode[];
    return issues.filter((issue) => issue.project?.id === selectedProjectId);
  }, [issues, selectedProjectId]);

  const availableLabels = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color?: string | null }>();
    projectIssues.forEach((issue) => {
      issue.labels?.nodes?.forEach((label) => {
        if (label && !map.has(label.id)) {
          map.set(label.id, label);
        }
      });
    });
    return Array.from(map.values());
  }, [projectIssues]);

  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    projectIssues.forEach((issue) => {
      if (issue.state?.type) set.add(issue.state.type.toLowerCase());
    });
    return Array.from(set);
  }, [projectIssues]);

  const availableAssignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    projectIssues.forEach((issue) => {
      if (issue.assignee) {
        map.set(issue.assignee.id, { id: issue.assignee.id, name: issue.assignee.name });
      }
    });
    return Array.from(map.values());
  }, [projectIssues]);

  const filteredIssues = useMemo(() => {
    if (!projectIssues.length) return [] as IssueNode[];

    const now = new Date();
    const fromDate = (() => {
      if (datePreset === 'all') return null;
      const days = Number(datePreset);
      if (!Number.isFinite(days)) return null;
      const base = new Date();
      base.setDate(now.getDate() - days);
      return base;
    })();

    return projectIssues.filter((issue) => {
      if (labelFilter.length) {
        const issueLabelIds = issue.labels?.nodes?.map((label) => label.id) || [];
        if (!issueLabelIds.some((id) => labelFilter.includes(id))) return false;
      }

      if (statusFilter.length) {
        const statusKey = issue.state?.type?.toLowerCase();
        if (!statusKey || !statusFilter.includes(statusKey)) return false;
      }

      if (assigneeFilter.length) {
        const assigneeId = issue.assignee?.id;
        if (!assigneeId || !assigneeFilter.includes(assigneeId)) return false;
      }

      if (fromDate) {
        const createdAt = toDate(issue.createdAt);
        if (!createdAt || createdAt < fromDate) return false;
      }

      return true;
    });
  }, [projectIssues, labelFilter, statusFilter, assigneeFilter, datePreset]);

  const progressPercent = selectedProjectId
    ? Math.round(projectProgressById[selectedProjectId] ?? 0)
    : 0;

  const guardrailAlerts: Guardrail[] = useMemo(() => {
    if (!selectedProject) return [];

    const alerts: Guardrail[] = [];
    const blockedIssues = projectIssues.filter((issue) =>
      issue.labels?.nodes?.some((label) => label.name.toLowerCase().includes('blocked'))
    );
    const blockedRatio = projectIssues.length ? blockedIssues.length / projectIssues.length : 0;

    if (blockedRatio > 0.25) {
      alerts.push({
        id: 'blocked',
        severity: 'warning',
        message: `${Math.round(blockedRatio * 100)}% of issues are blocked`,
      });
    }

    if (selectedProject.targetDate) {
      const target = new Date(selectedProject.targetDate);
      const today = new Date();
      const timeToTarget = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      if (timeToTarget <= 14 && progressPercent < 60) {
        alerts.push({
          id: 'timeline',
          severity: 'critical',
          message: `Target date approaching (${target.toLocaleDateString()}) with progress at ${progressPercent}%`,
        });
      }
    }

    return alerts;
  }, [selectedProject, projectIssues, progressPercent]);

  const timelineMetrics = useMemo(() => {
    if (!filteredIssues.length && !selectedProject) {
      return { lanes: [], milestones: [], range: null };
    }

    const issuesForTimeline = filteredIssues.length ? filteredIssues : projectIssues;

    const projectStart = toDate(selectedProject?.startDate) ||
      issuesForTimeline.reduce<Date | null>((earliest, issue) => {
        const candidate = toDate(issue.startedAt || issue.createdAt);
        if (!candidate) return earliest;
        if (!earliest || candidate < earliest) return candidate;
        return earliest;
      }, null) || new Date();

    const projectEnd = toDate(selectedProject?.targetDate) ||
      issuesForTimeline.reduce<Date | null>((latest, issue) => {
        const candidate = toDate(issue.completedAt || issue.dueDate || issue.updatedAt || issue.createdAt);
        if (!candidate) return latest;
        if (!latest || candidate > latest) return candidate;
        return latest;
      }, null) || new Date(projectStart.getTime() + 1000 * 60 * 60 * 24 * 14);

    const totalDuration = Math.max(projectEnd.getTime() - projectStart.getTime(), 1);

    const lanes = new Map<
      string,
      {
        id: string;
        label: string;
        color?: string | null;
        issues: {
          id: string;
          identifier: string;
          title: string;
          start: number;
          end: number;
          width: number;
          left: number;
          state: string;
        }[];
      }
    >();

    issuesForTimeline.forEach((issue) => {
      const laneLabel = issue.labels?.nodes?.[0]?.name || 'No Label';
      const laneId = issue.labels?.nodes?.[0]?.id || 'no-label';
      const laneColor = issue.labels?.nodes?.[0]?.color;
      if (!lanes.has(laneId)) {
        lanes.set(laneId, {
          id: laneId,
          label: laneLabel,
          color: laneColor,
          issues: [],
        });
      }

      const startDate = toDate(issue.startedAt || issue.createdAt) || projectStart;
      const endDate = toDate(issue.completedAt || issue.dueDate) || projectEnd;
      const startOffset = Math.max(0, startDate.getTime() - projectStart.getTime());
      const endOffset = Math.max(0, endDate.getTime() - projectStart.getTime());
      const left = Math.min(100, (startOffset / totalDuration) * 100);
      const width = Math.max(4, Math.min(100, ((Math.max(startOffset, endOffset) - startOffset) / totalDuration) * 100));

      lanes.get(laneId)?.issues.push({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        start: startOffset,
        end: endOffset,
        width,
        left,
        state: issue.state?.type || 'unknown',
      });
    });

    const milestoneMarkers = projectMilestones
      .filter((milestone) => milestone.targetDate)
      .map((milestone) => {
        const target = new Date(milestone.targetDate!);
        const offset = Math.max(0, target.getTime() - projectStart.getTime());
        const left = Math.min(100, (offset / totalDuration) * 100);
        return { ...milestone, left };
      });

    return {
      lanes: Array.from(lanes.values()),
      milestones: milestoneMarkers,
      range: { start: projectStart, end: projectEnd },
    };
  }, [filteredIssues, projectIssues, projectMilestones, selectedProject]);

  const labelAnalytics = useMemo(() => {
    const counts: Record<string, { name: string; color?: string | null; value: number }> = {};
    projectIssues.forEach((issue) => {
      issue.labels?.nodes?.forEach((label) => {
        if (!counts[label.id]) {
          counts[label.id] = { name: label.name, color: label.color, value: 0 };
        }
        counts[label.id].value += 1;
      });
    });
    return Object.entries(counts)
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.value - a.value);
  }, [projectIssues]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    projectIssues.forEach((issue) => {
      const key = issue.state?.type?.toLowerCase() || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([state, value]) => ({ state, value, label: formatStateLabel(state) }));
  }, [projectIssues]);

  const peopleMetrics = useMemo(() => {
    const acc: Record<string, { id: string; name: string; issues: number; estimate: number; completed: number }> = {};
    projectIssues.forEach((issue) => {
      if (!issue.assignee) return;
      if (!acc[issue.assignee.id]) {
        acc[issue.assignee.id] = {
          id: issue.assignee.id,
          name: issue.assignee.name,
          issues: 0,
          estimate: 0,
          completed: 0,
        };
      }
      acc[issue.assignee.id].issues += 1;
      acc[issue.assignee.id].estimate += issue.estimate || 0;
      if (issue.completedAt) acc[issue.assignee.id].completed += 1;
    });
    return Object.values(acc);
  }, [projectIssues]);

  const velocityMetrics = useMemo(() => {
    if (!projectIssues.length) return { velocity: 0, throughput: 0, cycleTime: 0 };

    const completedIssues = projectIssues.filter((issue) => issue.completedAt);
    if (!completedIssues.length) return { velocity: 0, throughput: 0, cycleTime: 0 };

    const now = new Date();
    const earliestCompletion = completedIssues.reduce<Date | null>((earliest, issue) => {
      const date = toDate(issue.completedAt!);
      if (!date) return earliest;
      if (!earliest || date < earliest) return date;
      return earliest;
    }, null) || now;

    const totalWeeks = Math.max(1, (now.getTime() - earliestCompletion.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const velocity = completedIssues.length / totalWeeks;

    const throughput = completedIssues.length;
    const cycleTime =
      completedIssues.reduce((sum, issue) => {
        const created = toDate(issue.createdAt);
        const completed = toDate(issue.completedAt!);
        if (!created || !completed) return sum;
        return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / completedIssues.length;

    return {
      velocity: Math.round(velocity * 10) / 10,
      throughput,
      cycleTime: Math.round(cycleTime * 10) / 10,
    };
  }, [projectIssues]);

  const isLoading = projectsLoading || issuesLoading;
  const isFollowed = selectedProjectId ? followedProjects.includes(selectedProjectId) : false;

  const toggleFollow = () => {
    if (!selectedProjectId) return;
    setFollowedProjects((current) => {
      if (current.includes(selectedProjectId)) {
        return current.filter((id) => id !== selectedProjectId);
      }
      return [...current, selectedProjectId];
    });
  };

  if (!selectedTeamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Select a team to explore projects</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-8 animate-fade-in">
        <Skeleton className="h-[520px] rounded-xl bg-secondary/30" />
        <Skeleton className="h-[520px] rounded-xl bg-secondary/30" />
      </div>
    );
  }

  if (!projects.length) {
    return (
      <Card className="bg-card border-border/50 shadow-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          No projects found for this team.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-8 animate-fade-in">
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Projects</span>
            <Badge variant="secondary" className="bg-secondary/40 text-xs">
              {projects.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[520px] pr-4">
            <div className="space-y-3">
              {projects.map((project) => {
                const stateKey = getStateKey(project.state);
                const stateColor = STATUS_COLORS[stateKey] || STATUS_COLORS.unknown;
                const projectProgress = projectProgressById[project.id] ?? 0;
                const isActive = project.id === selectedProjectId;
                const updatedAt = project.updatedAt ? new Date(project.updatedAt) : null;
                const targetDate = project.targetDate ? new Date(project.targetDate) : null;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={cn(
                      'w-full rounded-xl border border-border/50 bg-secondary/20 px-4 py-4 text-left transition-smooth',
                      'hover:bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/60',
                      isActive && 'border-primary/60 bg-secondary/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: stateColor }}
                        />
                        <p className="font-medium leading-tight">{project.name}</p>
                      </div>
                      {followedProjects.includes(project.id) && (
                        <Star className="h-4 w-4 fill-primary text-primary" />
                      )}
                    </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatStateLabel(stateKey)}
                  {project.lead?.name ? ` • ${project.lead.name}` : ''}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {targetDate ? `Due ${targetDate.toLocaleDateString()}` : 'No target date'}
                      </span>
                  <span>
                    {updatedAt ? `Updated ${updatedAt.toLocaleDateString()}` : '—'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-medium text-foreground">{Math.round(projectProgress)}%</span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-secondary/50">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, projectProgress)}%` }}
                  />
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {selectedProject && (
          <Card className="bg-card border-border/50 shadow-card">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                  {selectedProject.name}
                  <Badge variant="outline" className="border-border/60 bg-secondary/40">
                    {formatStateLabel(getStateKey(selectedProject.state))}
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {selectedProject.description || 'No project description provided.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={toggleFollow}>
                  <Star className={cn('mr-2 h-4 w-4', isFollowed ? 'fill-primary text-primary' : '')} />
                  {isFollowed ? 'Following' : 'Follow Project'}
                </Button>
                <Button variant="secondary" size="sm">
                  <Flame className="mr-2 h-4 w-4" />
                  Guardrails
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                <p className="text-xs uppercase text-muted-foreground">Progress</p>
                <p className="mt-2 text-2xl font-semibold">{progressPercent}%</p>
                <p className="text-xs text-muted-foreground">Issue-state weighted progress</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                <p className="text-xs uppercase text-muted-foreground">Active Issues</p>
                <p className="mt-2 text-2xl font-semibold">{projectIssues.length}</p>
                <p className="text-xs text-muted-foreground">Includes filtered issues</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                <p className="text-xs uppercase text-muted-foreground">Milestones</p>
                <p className="mt-2 text-2xl font-semibold">{projectMilestones.length}</p>
                <p className="text-xs text-muted-foreground">Linked to this project</p>
              </div>
            </CardContent>
          </Card>
        )}

        {guardrailAlerts.length > 0 && (
          <Card className="bg-card border-border/50 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <Flame className="h-4 w-4 text-warning" /> Guardrail Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {guardrailAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                    alert.severity === 'critical'
                      ? 'border-destructive/60 bg-destructive/10 text-destructive'
                      : 'border-warning/60 bg-warning/10 text-warning'
                  )}
                >
                  <AlertCircle className="h-4 w-4" />
                  {alert.message}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Project Explorer</CardTitle>
              <p className="text-sm text-muted-foreground">
                Filter issues by label, status, assignee, and time to focus on the right work.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" /> Labels
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-popover border-border">
                  {availableLabels.length ? (
                    availableLabels.map((label) => (
                      <DropdownMenuCheckboxItem
                        key={label.id}
                        checked={labelFilter.includes(label.id)}
                        onCheckedChange={(checked) => {
                          setLabelFilter((prev) =>
                            checked ? [...prev, label.id] : prev.filter((id) => id !== label.id)
                          );
                        }}
                      >
                        {label.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-xs text-muted-foreground">No labels</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" /> Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-popover border-border">
                  {availableStatuses.length ? (
                    availableStatuses.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={statusFilter.includes(status)}
                        onCheckedChange={(checked) => {
                          setStatusFilter((prev) =>
                            checked ? [...prev, status] : prev.filter((id) => id !== status)
                          );
                        }}
                      >
                        {formatStateLabel(status)}
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-xs text-muted-foreground">No statuses</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Users className="h-4 w-4" /> Assignees
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-popover border-border">
                  {availableAssignees.length ? (
                    availableAssignees.map((assignee) => (
                      <DropdownMenuCheckboxItem
                        key={assignee.id}
                        checked={assigneeFilter.includes(assignee.id)}
                        onCheckedChange={(checked) => {
                          setAssigneeFilter((prev) =>
                            checked ? [...prev, assignee.id] : prev.filter((id) => id !== assignee.id)
                          );
                        }}
                      >
                        {assignee.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-xs text-muted-foreground">No assignees</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={datePreset} onValueChange={setDatePreset}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {DATE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(labelFilter.length || statusFilter.length || assigneeFilter.length || datePreset !== '30') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLabelFilter([]);
                    setStatusFilter([]);
                    setAssigneeFilter([]);
                    setDatePreset('30');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="timeline" className="space-y-4">
              <TabsList className="bg-secondary/40">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="people">People</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-6">
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Project timeline</p>
                      {timelineMetrics.range && (
                        <p className="text-xs text-muted-foreground">
                          {timelineMetrics.range.start.toLocaleDateString()} – {timelineMetrics.range.end.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Completed
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-warning" /> In flight
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    {timelineMetrics.lanes.length ? (
                      timelineMetrics.lanes.map((lane) => (
                        <div key={lane.id}>
                          <div className="mb-2 flex items-center gap-2 text-sm">
                            <Badge style={{ backgroundColor: normalizeLinearColor(lane.color) || 'hsl(var(--secondary))' }}>
                              {lane.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {lane.issues.length} issue{lane.issues.length === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="relative h-16 rounded-lg border border-border/50 bg-background/60">
                            {timelineMetrics.milestones.map((milestone) => (
                              <div
                                key={milestone.id}
                                className="absolute bottom-0 top-0 flex w-px -translate-x-1/2 flex-col items-center"
                                style={{ left: `${milestone.left}%` }}
                              >
                                <div className="h-full w-px bg-primary/50" />
                                <span className="-mb-5 mt-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                  {milestone.name}
                                </span>
                              </div>
                            ))}

                            {lane.issues.map((issue) => (
                              <div
                                key={issue.id}
                                className="absolute top-1 flex h-[calc(100%-8px)] items-center overflow-hidden rounded-md border border-border/60 bg-primary/20 px-3 text-xs"
                                style={{
                                  left: `${issue.left}%`,
                                  width: `${issue.width}%`,
                                }}
                                title={`${issue.identifier} • ${issue.title}`}
                              >
                                <span className="truncate font-medium">{issue.identifier}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                        No timeline data for this selection.
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="issues">
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{filteredIssues.length} issues matching filters</p>
                    <p className="text-xs text-muted-foreground">Click an issue to open it in Linear</p>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-lg border border-border/40">
                    <Table>
                      <TableHeader className="bg-secondary/40">
                        <TableRow>
                          <TableHead>Issue</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assignee</TableHead>
                          <TableHead className="text-right">Estimate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredIssues.length ? (
                          filteredIssues.map((issue) => {
                            const stateKey = getStateKey(issue.state?.type);
                            return (
                              <TableRow
                                key={issue.id}
                                className="cursor-pointer hover:bg-secondary/40"
                                onClick={() => {
                                  window.open(`https://linear.app/issue/${issue.identifier}`, '_blank');
                                }}
                              >
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{issue.identifier}</p>
                                    <p className="text-sm text-muted-foreground">{issue.title}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className="border-none"
                                    style={{
                                      backgroundColor: `${(STATUS_COLORS[stateKey] || STATUS_COLORS.unknown)}20`,
                                      color: STATUS_COLORS[stateKey] || STATUS_COLORS.unknown,
                                    }}
                                  >
                                    {formatStateLabel(stateKey)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{issue.assignee?.name || 'Unassigned'}</TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {issue.estimate ?? '—'}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                              No issues match the current filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="bg-background border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Issues by Label</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                      {labelAnalytics.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={labelAnalytics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {labelAnalytics.map((entry, index) => (
                                <Cell
                                  key={entry.id}
                                  fill={normalizeLinearColor(entry.color) || 'hsl(var(--primary))'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No label data available.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-background border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Issue Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                      {statusDistribution.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusDistribution}
                              dataKey="value"
                              nameKey="label"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={(entry) => `${entry.label} (${entry.value})`}
                            >
                              {statusDistribution.map((entry, index) => (
                                <Cell
                                  key={entry.state}
                                  fill={STATUS_COLORS[entry.state] || Object.values(STATUS_COLORS)[index % Object.values(STATUS_COLORS).length]}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No status data available.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-background border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Throughput & Cycle Time</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-border/40 bg-secondary/20 p-4">
                      <p className="text-xs uppercase text-muted-foreground">Velocity</p>
                      <p className="mt-2 text-xl font-semibold">{velocityMetrics.velocity} / week</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-secondary/20 p-4">
                      <p className="text-xs uppercase text-muted-foreground">Throughput</p>
                      <p className="mt-2 text-xl font-semibold">{velocityMetrics.throughput}</p>
                      <p className="text-xs text-muted-foreground">Completed issues</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-secondary/20 p-4">
                      <p className="text-xs uppercase text-muted-foreground">Cycle Time</p>
                      <p className="mt-2 text-xl font-semibold">{velocityMetrics.cycleTime} days</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="people">
                <div className="grid gap-4 md:grid-cols-2">
                  {peopleMetrics.length ? (
                    peopleMetrics.map((person) => (
                      <Card key={person.id} className="bg-background border-border/60">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{person.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Assigned</span>
                            <span className="font-medium">{person.issues}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Completed</span>
                            <span className="font-medium">{person.completed}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Estimate</span>
                            <span className="font-medium">{person.estimate || '—'} pts</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full flex h-32 items-center justify-center rounded-xl border border-border/50 bg-secondary/20 text-sm text-muted-foreground">
                      No assignee data for this project yet.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
