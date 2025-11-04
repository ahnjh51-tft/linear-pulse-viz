import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { useIssueDistribution } from '@/hooks/useIssueDistribution';
import { linearStatusColors } from '@/lib/manager-chart-colors';

interface Issue {
  id: string;
  state: {
    name: string;
    type: string;
  };
}

interface IssueDistributionChartProps {
  issues: Issue[] | undefined;
}

export const IssueDistributionChart = ({ issues }: IssueDistributionChartProps) => {
  const distribution = useIssueDistribution(issues);

  const chartData = [
    { name: 'Backlog', value: distribution.backlog, color: linearStatusColors.backlog },
    { name: 'To Do', value: distribution.todo, color: linearStatusColors.todo },
    { name: 'In Progress', value: distribution.inProgress, color: linearStatusColors['in progress'] },
    { name: 'Done', value: distribution.done, color: linearStatusColors.done },
    { name: 'Canceled', value: distribution.canceled, color: linearStatusColors.canceled },
    { name: 'Duplicate', value: distribution.duplicate, color: linearStatusColors.duplicate },
    { name: 'Triage', value: distribution.triage, color: linearStatusColors.triage },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / distribution.total) * 100).toFixed(1);
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} issues ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (distribution.total === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No issues found
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Issue Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
