import { useQuery } from '@apollo/client';
import { useLinear } from '@/contexts/LinearContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { GET_TEAM_ISSUES, GET_TEAM_PROJECTS, GET_PROJECT_MILESTONES } from '@/lib/linear-queries';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Download, Calendar } from 'lucide-react';
import { IssueDistributionChart } from '@/components/dashboard/charts/IssueDistributionChart';
import { MilestoneProgressCards } from '@/components/dashboard/charts/MilestoneProgressCards';
import { EnhancedMilestoneGantt } from '@/components/dashboard/charts/EnhancedMilestoneGantt';
import { IssueCountScatterPlot } from '@/components/dashboard/charts/IssueCountScatterPlot';
import { ProjectSelector } from '@/components/dashboard/ProjectSelector';
import { useIssueDistribution } from '@/hooks/useIssueDistribution';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { useState, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

const ExecutiveSummary = () => {
  const { selectedTeamId } = useLinear();
  const { dateRange, setDateRange, refresh, lastRefreshed } = useDashboard();
  const [highlightedMilestoneId, setHighlightedMilestoneId] = useState<string>();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const { data: issuesData, loading: issuesLoading } = useQuery(GET_TEAM_ISSUES, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const { data: projectsData, loading: projectsLoading, error: projectsError } = useQuery(GET_TEAM_PROJECTS, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  // Add fallback arrays to prevent undefined
  const issues = issuesData?.team?.issues?.nodes || [];
  const projects = projectsData?.team?.projects?.nodes || [];

  // Debug logging for project selector
  if (projectsError) {
    console.error('GraphQL Error fetching projects:', projectsError);
  }
  console.log('Raw projectsData:', projectsData);
  console.log('Team ID:', selectedTeamId);
  console.log('Projects loading:', projectsLoading);
  console.log('Projects array:', projects);
  console.log('Projects length:', projects.length);

  // Get all milestones from all projects and calculate their progress from issues
  const allMilestones = projects?.flatMap((project: any) => 
    project.projectMilestones?.nodes?.map((milestone: any) => {
      // Calculate milestone progress from issues that belong to this milestone
      const milestoneIssues = issues?.filter((issue: any) => 
        issue.project?.id === project.id
      ) || [];
      
      return {
        ...milestone,
        projectId: project.id,
        projectName: project.name,
        projectStartDate: project.startDate,
        issues: { nodes: milestoneIssues },
      };
    }) || []
  ) || [];

  // Filter milestones and issues by selected project
  const filteredMilestones = useMemo(() => {
    if (selectedProjectId === 'all') return allMilestones;
    return allMilestones.filter((m: any) => m.projectId === selectedProjectId);
  }, [allMilestones, selectedProjectId]);

  const filteredIssues = useMemo(() => {
    if (!issues || issues.length === 0) return [];
    if (selectedProjectId === 'all') return issues;
    return issues.filter((issue: any) => issue.project?.id === selectedProjectId);
  }, [issues, selectedProjectId]);

  const distribution = useIssueDistribution(filteredIssues);

  const handleRefresh = () => {
    refresh();
    toast({
      title: "Dashboard refreshed",
      description: "All data has been updated",
    });
  };

  const handleExport = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      summary: {
        totalIssues: distribution.total,
        completionRate: distribution.total > 0 ? (distribution.done / distribution.total * 100).toFixed(1) : 0,
        distribution,
      },
      milestones: allMilestones.length,
      projects: projects?.length || 0,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-summary-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: "Summary data has been downloaded",
    });
  };

  if (!selectedTeamId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">No Team Selected</h2>
            <p className="text-muted-foreground">
              Please select a team from the header to view the executive summary
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Executive Summary</h1>
          <p className="text-muted-foreground mt-1">
            Performance overview and progress tracking
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectChange={setSelectedProjectId}
          />
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Issues</p>
            {issuesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold">{distribution.total}</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            {issuesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold">
                {distribution.total > 0 
                  ? ((distribution.done / distribution.total) * 100).toFixed(1)
                  : 0}%
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Active Projects</p>
            {projectsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold">{projects?.length || 0}</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Milestones</p>
            {projectsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold">{allMilestones.length}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Section 1: Milestone Progress */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Milestone Progress</h2>
          <p className="text-sm text-muted-foreground">
            Track completion status across all project milestones
          </p>
        </div>
        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : (
          <MilestoneProgressCards 
            milestones={filteredMilestones}
            onMilestoneClick={setHighlightedMilestoneId}
            projectSelected={selectedProjectId !== 'all'}
          />
        )}
      </div>

      {/* Section 2: Project Timeline */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Project Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Sequential Gantt chart showing milestone dependencies and progress
          </p>
        </div>
        {projectsLoading ? (
          <Card className="p-6">
            <Skeleton className="h-64 w-full" />
          </Card>
        ) : (
          <EnhancedMilestoneGantt 
            milestones={filteredMilestones}
            highlightedMilestoneId={highlightedMilestoneId}
            projectSelected={selectedProjectId !== 'all'}
          />
        )}
      </div>

      {/* Section 3: Issue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {issuesLoading ? (
            <Card className="p-6">
              <Skeleton className="h-64 w-full" />
            </Card>
          ) : (
            <IssueDistributionChart issues={filteredIssues} />
          )}
        </div>
        
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{distribution.inProgress}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">To Do</p>
              <p className="text-2xl font-bold">{distribution.todo}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Backlog</p>
              <p className="text-2xl font-bold">{distribution.backlog}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Section 4: Issue Creation Frequency */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Issue Creation Frequency</h2>
          <p className="text-sm text-muted-foreground">
            Track issue creation patterns over time
          </p>
        </div>
        {issuesLoading ? (
          <Card className="p-6">
            <Skeleton className="h-96 w-full" />
          </Card>
        ) : (
          <IssueCountScatterPlot issues={filteredIssues} />
        )}
      </div>
    </div>
  );
};

export default ExecutiveSummary;
