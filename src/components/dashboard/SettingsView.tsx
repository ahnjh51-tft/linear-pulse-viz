import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Palette, Key, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLinear } from '@/contexts/LinearContext';
import { toast } from 'sonner';

export const SettingsView = () => {
  const { disconnect } = useLinear();

  const handleDisconnect = () => {
    disconnect();
    toast.success('Disconnected from Linear');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Manage your dashboard preferences and connections</p>
      </div>

      {/* API Connection */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            API Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div>
              <p className="font-medium">Linear API</p>
              <p className="text-sm text-success">Connected</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Your API key is stored locally in your browser and never sent to third-party servers.
          </p>
        </CardContent>
      </Card>

      {/* Theme Customization */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Theme Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accent-color">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accent-color"
                type="color"
                defaultValue="#7C3AED"
                className="w-20 h-10"
              />
              <Input
                type="text"
                defaultValue="#7C3AED"
                className="flex-1 bg-secondary/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Button
              variant="outline"
              className="h-12 bg-[#7C3AED]"
              onClick={() => toast.success('Purple theme applied')}
            >
              Purple
            </Button>
            <Button
              variant="outline"
              className="h-12 bg-[#3B82F6]"
              onClick={() => toast.success('Blue theme applied')}
            >
              Blue
            </Button>
            <Button
              variant="outline"
              className="h-12 bg-[#10B981]"
              onClick={() => toast.success('Green theme applied')}
            >
              Green
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Calculation */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Progress Calculation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium text-sm">By Issue State</p>
                <p className="text-xs text-muted-foreground">Weight states for progress calculation</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium text-sm">By Milestone Completion</p>
                <p className="text-xs text-muted-foreground">Based on completed milestones</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium text-sm">By Story Points</p>
                <p className="text-xs text-muted-foreground">Calculate from completed points</p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Guardrails */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            KPI Guardrail Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium text-sm">Velocity Alerts</p>
                <p className="text-xs text-muted-foreground">Alert when velocity drops &gt;20%</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium text-sm">Milestone Alerts</p>
                <p className="text-xs text-muted-foreground">Alert for overdue milestones</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium text-sm">Blocker Alerts</p>
                <p className="text-xs text-muted-foreground">Alert when &gt;25% issues blocked</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
