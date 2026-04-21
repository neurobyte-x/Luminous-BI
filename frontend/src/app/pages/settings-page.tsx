import { motion } from 'motion/react';
import { CheckCircle2, Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { useTheme } from '../contexts/theme-context';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your preferences and configuration
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl space-y-6"
      >
        {/* Appearance */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how Luminous BI looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                <span>Dark Mode</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Switch between light and dark themes
                </span>
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Status */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Backend service connection status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">API Status</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Mock Mode
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Available Endpoints
              </Label>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  POST /upload
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  POST /analyze
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  GET /history
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  POST /dashboard
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  POST /feedback
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Adjust your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex flex-col gap-1">
                <span>Notifications</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Receive updates about your queries
                </span>
              </Label>
              <Switch id="notifications" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-save" className="flex flex-col gap-1">
                <span>Auto-save Dashboards</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Automatically save your analyses
                </span>
              </Label>
              <Switch id="auto-save" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
