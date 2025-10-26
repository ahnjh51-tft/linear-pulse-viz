import { useQuery as useApolloQuery } from '@apollo/client';
import { useLinear } from '@/contexts/LinearContext';
import { GET_TEAM_ISSUES } from '@/lib/linear-queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const LABEL_COLORS = [
  'hsl(261, 80%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(200, 80%, 50%)',
  'hsl(280, 70%, 55%)',
];

export const LabelsView = () => {
  const { selectedTeamId } = useLinear();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  
  const { data: issuesData, loading } = useApolloQuery(GET_TEAM_ISSUES, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const issues = issuesData?.team?.issues?.nodes || [];

  const labelMetrics = useMemo(() => {
    const labelMap = new Map<string, { name: string; color: string; count: number; issues: any[] }>();
    
    issues.forEach((issue: any) => {
      issue.labels?.nodes?.forEach((label: any) => {
        if (!labelMap.has(label.id)) {
          labelMap.set(label.id, {
            name: label.name,
            color: label.color,
            count: 0,
            issues: [],
          });
        }
        const entry = labelMap.get(label.id)!;
        entry.count += 1;
        entry.issues.push(issue);
      });
    });

    return Array.from(labelMap.values()).sort((a, b) => b.count - a.count);
  }, [issues]);

  const chartData = labelMetrics.slice(0, 6).map((label) => ({
    name: label.name,
    value: label.count,
  }));

  const selectedLabelData = selectedLabel 
    ? labelMetrics.find(l => l.name === selectedLabel)
    : null;

  if (!selectedTeamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Please select a team to view labels</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Labels</h2>
        <p className="text-muted-foreground">Issue distribution across labels</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Labels List */}
        <Card className="bg-card border-border/50 shadow-card lg:col-span-1">
          <CardHeader>
            <CardTitle>All Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {labelMetrics.map((label, index) => (
                <Button
                  key={label.name}
                  variant="ghost"
                  onClick={() => setSelectedLabel(label.name)}
                  className={cn(
                    'w-full justify-between hover:bg-secondary',
                    selectedLabel === label.name && 'bg-secondary'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4" style={{ color: label.color || LABEL_COLORS[index % LABEL_COLORS.length] }} />
                    {label.name}
                  </span>
                  <span className="text-muted-foreground">{label.count}</span>
                </Button>
              ))}
              {labelMetrics.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No labels found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Label Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedLabelData ? (
            <>
              <Card className="bg-card border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" style={{ color: selectedLabelData.color }} />
                    {selectedLabelData.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Issues</span>
                      <span className="font-medium">{selectedLabelData.count}</span>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm font-medium mb-3">Issues with this label:</p>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedLabelData.issues.map((issue: any) => (
                          <div
                            key={issue.id}
                            className="p-3 rounded-lg bg-secondary/30 border border-border/50"
                          >
                            <p className="font-medium text-sm">{issue.identifier}</p>
                            <p className="text-sm text-muted-foreground">{issue.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{issue.state.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Label Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={LABEL_COLORS[index % LABEL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
