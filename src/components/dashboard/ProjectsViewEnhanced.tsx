import { useQuery as useApolloQuery } from '@apollo/client';
import { useLinear } from '@/contexts/LinearContext';
import { GET_TEAM_PROJECTS, GET_TEAM_ISSUES, GET_PROJECT_MILESTONES, GET_ALL_LABELS } from '@/lib/linear-queries';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Download } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { exportToCSV, exportToJSON } from '@/lib/export-utils';
import { BulkActions } from '@/components/shared/BulkActions';
import { Breadcrumb } from './Breadcrumb';
import { ProjectKPIGroup } from './ProjectKPIGroup';
import { IssueAccordion } from './IssueAccordion';
import { subMonths } from 'date-fns';
import { ProjectHeader } from './project/ProjectHeader';
import { ProjectTimeline } from './project/ProjectTimeline';
import { ProjectMilestones } from './project/ProjectMilestones';
import { ProjectAnalytics } from './project/ProjectAnalytics';
import { StatusFilter } from '@/components/shared/StatusFilter';
import { AssigneeFilter } from '@/components/shared/AssigneeFilter';
import { useProjectKPIs, useHealthStatus, useBurndownData, useThroughputData } from './project/useProjectData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Users } from 'lucide-react';

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
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());

  useKeyboardShortcuts([
    {
      key: 'e',
      ctrl: true,
      action: () => handleExport(),
      description: 'Export data',
    },
    {
      key: 'f',
      ctrl: true,
      action: () => {
        setStatusFilter('all');
        setMilestoneFilter('all');
        setAssigneeFilter('all');
      },
      description: 'Clear filters',
    },
  ]);
  
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

  const projectKPIs = useProjectKPIs(projectIssues, milestones);
  const healthStatus = useHealthStatus(projectIssues);
  const burndownData = useBurndownData(projectIssues);
  const throughputData = useThroughputData();

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
    if (filteredIssues.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const exportData = filteredIssues.map((issue: any) => ({
      title: issue.title,
      state: issue.state?.name,
      assignee: issue.assignee?.name || 'Unassigned',
      milestone: issue.milestone?.name || 'No milestone',
      priority: issue.priority,
      createdAt: issue.createdAt,
    }));

    exportToCSV(exportData, `project-${activeProject?.name || 'export'}`);
    toast.success('Data exported successfully');
  };

  const handleBulkMarkComplete = () => {
    toast.info(`Marking ${selectedIssues.size} issues as complete`);
    setSelectedIssues(new Set());
  };

  const handleBulkMarkIncomplete = () => {
    toast.info(`Marking ${selectedIssues.size} issues as incomplete`);
    setSelectedIssues(new Set());
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
    <div className="content-spacing animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Projects' },
          ...(activeProject ? [{ label: activeProject.name }] : []),
        ]}
      />

      <ProjectHeader
        selectedProject={selectedProject}
        projects={filteredProjects}
        onProjectChange={setSelectedProject}
        labelFilter={labelFilter}
        labels={allLabels}
        onLabelChange={setLabelFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
      />

      {activeProject && (
        <ProjectKPIGroup
          kpis={projectKPIs}
          healthStatus={healthStatus}
        />
      )}

      {activeProject && (
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <ProjectTimeline
              milestones={milestones}
              issues={projectIssues}
              onMilestoneClick={(milestone) => {
                setMilestoneFilter(milestone.id);
                toast.info(`Filtered to ${milestone.name}`);
              }}
            />
          </TabsContent>

          <TabsContent value="milestones">
            <ProjectMilestones milestones={milestones} issues={projectIssues} />
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {selectedIssues.size > 0 && (
              <BulkActions
                selectedCount={selectedIssues.size}
                totalCount={filteredIssues.length}
                onSelectAll={() => setSelectedIssues(new Set(filteredIssues.map((i: any) => i.id)))}
                onClearSelection={() => setSelectedIssues(new Set())}
                onMarkComplete={handleBulkMarkComplete}
                onMarkIncomplete={handleBulkMarkIncomplete}
              />
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <StatusFilter value={statusFilter} onChange={setStatusFilter} />

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

              <AssigneeFilter
                value={assigneeFilter}
                onChange={setAssigneeFilter}
                assignees={assignees}
              />

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

            <IssueAccordion groups={issueGroups} />
          </TabsContent>

          <TabsContent value="people">
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
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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

          <TabsContent value="analytics">
            <ProjectAnalytics
              burndownData={burndownData}
              throughputData={throughputData}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
