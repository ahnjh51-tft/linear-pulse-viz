import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TeamSelector } from './TeamSelector';
import { useLinear } from '@/contexts/LinearContext';
import { Overview } from './Overview';
import { TeamView } from './TeamView';
import { IssuesView } from './LabelsView';
import { ProjectsView } from './ProjectsView';
import { PeopleView } from './PeopleView';
import { ReportsView } from './ReportsView';
import { BenchmarkView } from './BenchmarkView';
import { SettingsView } from './SettingsView';
import {
  BarChart3,
  Users,
  Tag,
  FileText,
  Settings,
  TrendingUp,
  LogOut,
  Home,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children?: ReactNode;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: Home, component: Overview },
  { id: 'team', label: 'Team', icon: Users, component: TeamView },
  { id: 'projects', label: 'Projects', icon: Folder, component: ProjectsView },
  { id: 'issues', label: 'Issues', icon: Tag, component: IssuesView },
  { id: 'people', label: 'People', icon: Users, component: PeopleView },
  { id: 'reports', label: 'Reports', icon: FileText, component: ReportsView },
  { id: 'benchmark', label: 'Benchmark', icon: TrendingUp, component: BenchmarkView },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [activeView, setActiveView] = useState('overview');
  const { disconnect } = useLinear();

  const ActiveComponent = navItems.find(item => item.id === activeView)?.component || Overview;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-bold">Linear KPI</h1>
              </div>
              <TeamSelector />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('settings')}
                className={cn(
                  'text-muted-foreground hover:text-foreground',
                  activeView === 'settings' && 'text-foreground'
                )}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card/30">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    'rounded-none border-b-2 border-transparent px-4 py-3 transition-smooth',
                    activeView === item.id
                      ? 'border-primary text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <ActiveComponent />
      </main>
    </div>
  );
};
