import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const BenchmarkView = () => {
  const [compareMode, setCompareMode] = useState<'labels' | 'dates'>('labels');

  const mockBenchmarkData = [
    { metric: 'Velocity', before: 42, after: 56, unit: 'pts/week' },
    { metric: 'Throughput', before: 18, after: 24, unit: 'issues/week' },
    { metric: 'Progress', before: 67, after: 78, unit: '%' },
    { metric: 'Cycle Time', before: 5.2, after: 4.1, unit: 'days' },
    { metric: 'Completion Rate', before: 72, after: 85, unit: '%' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Benchmark</h2>
        <p className="text-muted-foreground">Compare metrics across labels or time periods</p>
      </div>

      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Comparison Mode</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={compareMode === 'labels' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCompareMode('labels')}
              >
                Compare Labels
              </Button>
              <Button
                variant={compareMode === 'dates' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCompareMode('dates')}
              >
                Compare Date Ranges
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            {compareMode === 'labels'
              ? 'Compare metrics between two different labels or projects'
              : 'Compare metrics before and after a specific date or between two time periods'}
          </p>

          <div className="space-y-4">
            {mockBenchmarkData.map((item) => {
              const delta = ((item.after - item.before) / item.before) * 100;
              const isPositive = delta > 0;
              const isBetter = item.metric === 'Cycle Time' ? delta < 0 : delta > 0;

              return (
                <div
                  key={item.metric}
                  className="p-4 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.metric}</span>
                    <div className="flex items-center gap-2">
                      {isBetter ? (
                        <TrendingUp className="w-4 h-4 text-success" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      )}
                      <span className={isBetter ? 'text-success' : 'text-destructive'}>
                        {isPositive ? '+' : ''}{Math.abs(delta).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Before</p>
                      <p className="font-medium">
                        {item.before} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">After</p>
                      <p className="font-medium">
                        {item.after} {item.unit}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium mb-2">💡 Insights</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Overall performance improved by 18% across key metrics</li>
              <li>• Cycle time reduced significantly, indicating faster delivery</li>
              <li>• Completion rate shows strong team efficiency gains</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
