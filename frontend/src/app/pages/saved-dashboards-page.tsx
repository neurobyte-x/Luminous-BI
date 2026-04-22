import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { BarChart3, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { deleteDashboard, listDashboards, type DashboardItem } from '../lib/api';

export function SavedDashboardsPage() {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDashboards = async () => {
    try {
      const response = await listDashboards();
      setDashboards(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load dashboards.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboards();
  }, []);

  const handleDelete = async (dashboardId: string) => {
    try {
      setDeletingId(dashboardId);
      await deleteDashboard(dashboardId);
      setDashboards((prev) => prev.filter((dashboard) => dashboard.id !== dashboardId));
      toast.success('Dashboard deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete dashboard.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Saved Dashboards</h1>
          <p className="mt-2 text-muted-foreground">
            Access your saved analyses and visualizations
          </p>
        </div>
        <Button className="glow-effect" onClick={() => navigate('/app/query')}>
          New Dashboard
        </Button>
      </div>

      {isLoading && (
        <Card className="glass-effect">
          <CardContent className="p-6 text-sm text-muted-foreground">Loading dashboards...</CardContent>
        </Card>
      )}

      {!isLoading && dashboards.length === 0 && (
        <Card className="glass-effect">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No dashboards saved yet. Run a query and click Save Dashboard.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((dashboard, index) => (
          <motion.div
            key={dashboard.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-effect group transition-all hover:glow-effect">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(dashboard.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {dashboard.query}
                </p>
                
                {/* Preview placeholder */}
                <div className="h-32 rounded-lg bg-linear-to-br from-primary/5 to-primary/10 mb-4 flex items-center justify-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() =>
                      navigate('/app/query', {
                        state: { savedDashboard: dashboard },
                      })
                    }
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === dashboard.id}
                    onClick={() => void handleDelete(dashboard.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
