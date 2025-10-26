import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLinear } from '@/contexts/LinearContext';
import { createApolloClientWithKey } from '@/lib/apollo-client';
import { GET_VIEWER } from '@/lib/linear-queries';
import { toast } from 'sonner';
import { Loader2, Link2, Sparkles } from 'lucide-react';

export const ConnectLinear = () => {
  const [apiKey, setApiKey] = useState('');
  const { connect } = useLinear();

  const validateMutation = useMutation({
    mutationFn: async (key: string) => {
      const client = createApolloClientWithKey(key);
      const { data } = await client.query({ query: GET_VIEWER });
      return data;
    },
    onSuccess: (data: any) => {
      connect(apiKey);
      toast.success(`Connected as ${data.viewer.name}`);
    },
    onError: () => {
      toast.error('Invalid API key. Please check and try again.');
    },
  });

  const handleConnect = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Linear API key');
      return;
    }
    validateMutation.mutate(apiKey);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Linear KPI Dashboard</h1>
          <p className="text-muted-foreground">
            Connect to Linear to visualize team health and progress
          </p>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Connect to Linear
            </CardTitle>
            <CardDescription>
              Enter your Linear API key to get started. You can find this in your Linear settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="lin_api_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                className="bg-secondary/50 border-border"
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to any third-party servers.
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={validateMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {validateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect
            </Button>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Don't have an API key?{' '}
                <a
                  href="https://linear.app/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Generate one in Linear
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
