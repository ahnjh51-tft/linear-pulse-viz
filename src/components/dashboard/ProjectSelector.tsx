import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderKanban } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  icon?: string | null;
}

interface ProjectSelectorProps {
  projects: Project[] | undefined;
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
}

export const ProjectSelector = ({ 
  projects, 
  selectedProjectId, 
  onProjectChange 
}: ProjectSelectorProps) => {
  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <Select value={selectedProjectId} onValueChange={onProjectChange}>
      <SelectTrigger className="w-[200px] bg-background">
        <FolderKanban className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Select project" />
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        <SelectItem value="all">All Projects</SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.icon && <span className="mr-2">{project.icon}</span>}
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
