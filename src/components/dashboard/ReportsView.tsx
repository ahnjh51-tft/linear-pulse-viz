import { useLinear } from '@/contexts/LinearContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ReportsView = () => {
  const { selectedTeamId } = useLinear();

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Reports</h2>
        <p className="text-muted-foreground">Generate and export team reports</p>
      </div>

      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Manager Report Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Generate comprehensive reports with key metrics, charts, and insights for management presentations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              <Download className="w-6 h-6 text-primary" />
              <span>Export as PNG</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              <Download className="w-6 h-6 text-primary" />
              <span>Export as CSV</span>
            </Button>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Weekly Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="font-medium mb-2">🎯 This Week's Wins</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Team velocity increased by 12%</li>
                  <li>3 major projects moved to completion</li>
                  <li>Reduced blockers by 40%</li>
                </ul>
              </div>
              
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="font-medium mb-2">⚠️ Risks & Concerns</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>2 milestones approaching deadline</li>
                  <li>Capacity utilization at 85%</li>
                </ul>
              </div>
              
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="font-medium mb-2">📋 Next Steps</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Review milestone timelines in sprint planning</li>
                  <li>Prioritize blocker resolution</li>
                  <li>Continue current sprint velocity</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
