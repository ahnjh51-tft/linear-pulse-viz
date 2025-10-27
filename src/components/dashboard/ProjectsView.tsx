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
import { AlertCircle, Calendar, Users, Target, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProjectsView = () => {
  const { selectedTeamId } = useLinear();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [labelFilter, setLabelFilter] = useState<string>('all');
  
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

  // Show GraphQL errors
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

  // Get all unique labels from issues
  const allLabels = useMemo(() => {
    const labelSet = new Map();
    issues.forEach((issue: any) => {
      issue.labels?.nodes?.forEach((label: any) => {
        if (!labelSet.has(label.id)) {
          labelSet.set(label.id, label);
        }
      });
    });
    // Also add from labelsData if available
    labelsData?.issueLabels?.nodes?.forEach((label: any) => {
      if (!labelSet.has(label.id)) {
        labelSet.set(label.id, label);
      }
    });
    return Array.from(labelSet.values());
  }, [issues, labelsData]);

  // Filter projects by label (checking issues within projects)
  const filteredProjects = useMemo(() => {
    if (labelFilter === 'all') return projects;
    return projects.filter((project: any) => {
      const projectIssues = issues.filter((issue: any) => issue.project?.id === project.id);
      return projectIssues.some((issue: any) =>
        issue.labels?.nodes?.some((label: any) => label.id === labelFilter)
      );
    });
  }, [projects, issues, labelFilter]);

  // Auto-select first project
  useEffect(() => {
    if (filteredProjects.length > 0 && !selectedProject) {
      setSelectedProject(filteredProjects[0].id);
    }
  }, [filteredProjects, selectedProject]);

  const activeProject = filteredProjects.find((p: any) => p.id === selectedProject);

  // Get issues for selected project
  const projectIssues = useMemo(() => {
    return issues.filter((issue: any) => issue.project?.id === selectedProject);
  }, [issues, selectedProject]);

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
      {/* Project Selection Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Select value={selectedProject || undefined} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {filteredProjects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Select value={labelFilter} onValueChange={setLabelFilter}>
          <SelectTrigger className="w-48">
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

      {/* Project Overview Card */}
      {activeProject && (
        <Card className="bg-card border-border/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{activeProject.name}</CardTitle>
                <p className="text-muted-foreground mt-2">{activeProject.description}</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  activeProject.state?.toLowerCase() === 'completed' && 'bg-success/10 text-success border-success',
                  activeProject.state?.toLowerCase() === 'started' && 'bg-primary/10 text-primary border-primary',
                  activeProject.state?.toLowerCase() === 'planned' && 'bg-muted',
                  activeProject.state?.toLowerCase() === 'paused' && 'bg-warning/10 text-warning border-warning',
                  activeProject.state?.toLowerCase() === 'canceled' && 'bg-destructive/10 text-destructive border-destructive'
                )}
              >
                {activeProject.state}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="w-4 h-4" />
                  Progress
                </div>
                <div className="text-2xl font-semibold">
                  {activeProject.progress ? Math.round(activeProject.progress * 100) : 0}%
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  Milestones
                </div>
                <div className="text-2xl font-semibold">{milestones.length}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  Issues
                </div>
                <div className="text-2xl font-semibold">{projectIssues.length}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Target Date
                </div>
                <div className="text-sm font-medium">
                  {activeProject.targetDate
                    ? new Date(activeProject.targetDate).toLocaleDateString()
                    : 'Not set'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Detail Tabs */}
      {activeProject && (
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.length > 0 ? (
                    <div className="relative">
                      {/* Timeline visualization */}
                      <div className="space-y-6">
                        {milestones.map((milestone: any, index: number) => (
                          <div key={milestone.id} className="relative pl-8">
                            <div
                              className="absolute left-0 top-2 w-3 h-3 rounded-full bg-primary"
                            />
                            {index < milestones.length - 1 && (
                              <div className="absolute left-1.5 top-5 bottom-0 w-0.5 bg-border" />
                            )}
                            <div className="bg-secondary/30 border border-border/50 rounded-lg p-4 hover:bg-secondary/50 transition-smooth">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">{milestone.name}</h4>
                                  {milestone.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {milestone.description}
                                    </p>
                                  )}
                                </div>
                                {milestone.targetDate && (
                                  <Badge variant="outline" className="ml-4">
                                    {new Date(milestone.targetDate).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No milestones found for this project
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                {milestones.length > 0 ? (
                  <div className="space-y-3">
                    {milestones.map((milestone: any) => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-smooth"
                      >
                        <div>
                          <p className="font-medium">{milestone.name}</p>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {milestone.targetDate && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(milestone.targetDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No milestones found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle>Issues ({projectIssues.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {projectIssues.length > 0 ? (
                  <div className="space-y-3">
                    {projectIssues.map((issue: any) => (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-smooth"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground font-mono">
                            {issue.identifier}
                          </span>
                          <p className="font-medium">{issue.title}</p>
                          {issue.labels?.nodes?.map((label: any) => (
                            <Badge
                              key={label.id}
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: label.color,
                                color: label.color,
                              }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                        <Badge variant="outline">{issue.state?.name}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No issues found for this project
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="people" className="space-y-4">
            <Card className="bg-card border-border/50">
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
                      <div>
                        <p className="font-medium">{activeProject.lead.name}</p>
                        <p className="text-sm text-muted-foreground">Project Lead</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
