import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ArrowUpRight } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Inbox } from 'lucide-react';

interface ProjectsListProps {
  projects: any[];
  loading?: boolean;
}

export const ProjectsList = ({ projects, loading }: ProjectsListProps) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading projects...</div>;
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No projects found"
        description="No projects found for the selected team."
      />
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project: any, index) => (
        <div
          key={project.id}
          onClick={() => navigate(`/dashboard/project/${project.id}`)}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-card border border-border/50 hover:bg-secondary/50 hover:scale-[1.01] transition-all duration-200 gap-3 sm:gap-4 cursor-pointer group animate-fade-in"
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
  );
};
