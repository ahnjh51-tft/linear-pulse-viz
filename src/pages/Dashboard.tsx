import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import ExecutiveSummary from '@/pages/ExecutiveSummary';
import { TeamView } from '@/components/dashboard/TeamView';
import { IssuesView } from '@/components/dashboard/LabelsView';
import { ProjectsViewEnhanced } from '@/components/dashboard/ProjectsViewEnhanced';
import { ReportsView } from '@/components/dashboard/ReportsView';
import { BenchmarkView } from '@/components/dashboard/BenchmarkView';
import { SettingsView } from '@/components/dashboard/SettingsView';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <main className="flex-1 container mx-auto section-spacing">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<ExecutiveSummary />} />
                <Route path="/projects" element={<ProjectsViewEnhanced />} />
                <Route path="/issues" element={<IssuesView />} />
                <Route path="/team" element={<TeamView />} />
                <Route path="/reports" element={<ReportsView />} />
                <Route path="/benchmark" element={<BenchmarkView />} />
                <Route path="/settings" element={<SettingsView />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
