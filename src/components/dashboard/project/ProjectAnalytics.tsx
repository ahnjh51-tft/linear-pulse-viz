import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartConfig } from '@/lib/chart-config';

interface ChartDataPoint {
  week: string;
  remaining?: number;
  ideal?: number;
  completed?: number;
}

interface ProjectAnalyticsProps {
  burndownData: ChartDataPoint[];
  throughputData: ChartDataPoint[];
}

export const ProjectAnalytics = ({ burndownData, throughputData }: ProjectAnalyticsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Burndown Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={burndownData}>
              <CartesianGrid {...chartConfig.styles.grid} />
              <XAxis dataKey="week" {...chartConfig.styles.axis} />
              <YAxis {...chartConfig.styles.axis} />
              <Tooltip {...chartConfig.styles.tooltip} />
              <Line
                type="monotone"
                dataKey="remaining"
                stroke={chartConfig.colors.primary}
                strokeWidth={2}
                name="Remaining"
                dot={{ fill: chartConfig.colors.primary }}
              />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke={chartConfig.colors.mutedForeground}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Ideal"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Throughput</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={throughputData}>
              <CartesianGrid {...chartConfig.styles.grid} />
              <XAxis dataKey="week" {...chartConfig.styles.axis} />
              <YAxis {...chartConfig.styles.axis} />
              <Tooltip {...chartConfig.styles.tooltip} />
              <Bar
                dataKey="completed"
                fill={chartConfig.colors.success}
                name="Completed Issues"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
