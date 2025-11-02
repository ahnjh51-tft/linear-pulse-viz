import { useParams, useNavigate } from 'react-router-dom';
import { useQuery as useApolloQuery } from '@apollo/client';
import { useLinear } from '@/contexts/LinearContext';
import { GET_TEAM_PROJECTS, GET_TEAM_ISSUES, GET_PROJECT_MILESTONES } from '@/lib/linear-queries';
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { ProjectHeader } from '@/components/dashboard/project/ProjectHeader';
import { ProjectKPIGroup } from '@/components/dashboard/ProjectKPIGroup';
import { ProjectTimeline } from '@/components/dashboard/project/ProjectTimeline';
import { ProjectMilestones } from '@/components/dashboard/project/ProjectMilestones';
import { ProjectAnalytics } from '@/components/dashboard/project/ProjectAnalytics';
import { IssueAccordion } from '@/components/dashboard/IssueAccordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusFilter } from '@/components/shared/StatusFilter';
import { AssigneeFilter } from '@/components/shared/AssigneeFilter';
import { BulkActions } from '@/components/shared/BulkActions';
import { useProjectKPIs, useHealthStatus, useBurndownData, useThroughputData } from '@/components/dashboard/project/useProjectData';
import { useState, useMemo } from 'react';
import { Filter, Users } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export-utils';
import { subMonths } from 'date-fns';

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { selectedTeamId } = useLinear();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('all');
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [dateRange] = useState({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });

  const { data: projectsData } = useApolloQuery(GET_TEAM_PROJECTS, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: issuesData } = useApolloQuery(GET_TEAM_ISSUES, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: milestonesData } = useApolloQuery(GET_PROJECT_MILESTONES, {
    variables: { projectId: projectId ?? '' },
    skip: !projectId,
  });

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

  const activeProject = projects.find((p: any) => p.id === projectId);

  const projectIssues = useMemo(() => {
    return issues.filter((issue: any) => issue.project?.id === projectId);
  }, [issues, projectId]);

  const projectKPIs = useProjectKPIs(projectIssues, milestones);
  const healthStatus = useHealthStatus(projectIssues);
  const burndownData = useBurndownData(projectIssues);
  const throughputData = useThroughputData();

  const filteredIssues = useMemo(() => {
    return projectIssues.filter((issue: any) => {
      if (statusFilter !== 'all' && issue.state?.type !== statusFilter) return false;
      if (assigneeFilter !== 'all' && issue.assignee?.id !== assigneeFilter) return false;
      if (milestoneFilter !== 'all' && issue.milestone?.id !== milestoneFilter) return false;
      return true;
    });
  }, [projectIssues, statusFilter, assigneeFilter, milestoneFilter]);

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

  if (!activeProject) {
    return <div className="content-spacing">Project not found</div>;
  }

  return (
    <div className="content-spacing animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Projects', onClick: () => navigate('/dashboard/projects') },
          { label: activeProject.name },
        ]}
      />

      <ProjectHeader
        selectedProject={projectId || ''}
        projects={projects}
        onProjectChange={(id) => navigate(`/dashboard/project/${id}`)}
        labelFilter="all"
        labels={[]}
        onLabelChange={() => {}}
        dateRange={dateRange}
        onDateRangeChange={() => {}}
        onExport={handleExport}
      />

      <ProjectKPIGroup
        kpis={projectKPIs}
        healthStatus={healthStatus}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{activeProject.state}</p>
                </div>
                {activeProject.lead && (
                  <div>
                    <p className="text-sm text-muted-foreground">Project Lead</p>
                    <p className="font-medium">{activeProject.lead.name}</p>
                  </div>
                )}
                {activeProject.targetDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Target Date</p>
                    <p className="font-medium">{new Date(activeProject.targetDate).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <ProjectMilestones milestones={milestones} issues={projectIssues} />
          </div>
        </TabsContent>

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
              onMarkComplete={() => {
                toast.info(`Marking ${selectedIssues.size} issues as complete`);
                setSelectedIssues(new Set());
              }}
              onMarkIncomplete={() => {
                toast.info(`Marking ${selectedIssues.size} issues as incomplete`);
                setSelectedIssues(new Set());
              }}
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

        <TabsContent value="analytics">
          <ProjectAnalytics
            burndownData={burndownData}
            throughputData={throughputData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
