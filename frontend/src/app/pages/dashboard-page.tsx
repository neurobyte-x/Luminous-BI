import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LineChartComponent } from '../components/charts/line-chart-component';
import { BarChartComponent } from '../components/charts/bar-chart-component';
import { fetchHistory, listDashboards, type DashboardItem, type HistoryItem } from '../lib/api';
import { getActiveDataset, getLastAnalysis } from '../lib/storage';

export function DashboardPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [historyResult, dashboardResult] = await Promise.all([
          fetchHistory(),
          listDashboards(),
        ]);

        setHistory(historyResult);
        setDashboards(dashboardResult);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, []);

  const uniqueDatasetCount = useMemo(
    () => new Set(history.map((item) => item.dataset_id)).size,
    [history],
  );

  const queryTrendData = useMemo(() => {
    const countsByDate: Record<string, number> = {};

    history.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      countsByDate[date] = (countsByDate[date] || 0) + 1;
    });

    return Object.entries(countsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);
  }, [history]);

  const datasetUsageData = useMemo(() => {
    const countsByDataset: Record<string, number> = {};

    history.forEach((item) => {
      countsByDataset[item.dataset_id] = (countsByDataset[item.dataset_id] || 0) + 1;
    });

    return Object.entries(countsByDataset)
      .map(([dataset, queries]) => ({
        dataset: dataset.slice(0, 8),
        queries,
      }))
      .sort((a, b) => b.queries - a.queries)
      .slice(0, 6);
  }, [history]);

  const activeDataset = getActiveDataset();
  const lastAnalysis = getLastAnalysis();

  const stats = [
    {
      label: 'Total Queries',
      value: String(history.length),
      change: dashboards.length > 0 ? `${dashboards.length} saved` : 'No saved dashboards',
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      label: 'Saved Dashboards',
      value: String(dashboards.length),
      change: history.length > 0 ? 'Based on query results' : 'Run first analysis',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      label: 'Active Dataset',
      value: activeDataset?.datasetId ? activeDataset.datasetId.slice(0, 8) : 'None',
      change: activeDataset?.rows ? `${activeDataset.rows} rows` : 'Upload CSV to begin',
      icon: TrendingUp,
      color: 'text-purple-500',
    },
    {
      label: 'Datasets Used',
      value: String(uniqueDatasetCount),
      change: lastAnalysis?.createdAt
        ? `Last run ${new Date(lastAnalysis.createdAt).toLocaleDateString()}`
        : 'No recent analysis',
      icon: BarChart3,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here is what is happening with your connected data.
        </p>
      </div>

      {isLoading && (
        <Card className="glass-effect">
          <CardContent className="p-6 text-sm text-muted-foreground">Loading dashboard...</CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect transition-all hover:glow-effect">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-green-500">{stat.change}</span> from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Query Activity (Last 7 Entries)</CardTitle>
            </CardHeader>
            <CardContent>
              {queryTrendData.length > 0 ? (
                <LineChartComponent
                  data={queryTrendData}
                  xKey="date"
                  lines={[{ key: 'count', color: '#3B82F6', name: 'Queries' }]}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No query history available yet.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Dataset Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {datasetUsageData.length > 0 ? (
                <BarChartComponent
                  data={datasetUsageData}
                  xKey="dataset"
                  bars={[{ key: 'queries', color: '#8B5CF6', name: 'Queries' }]}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Dataset usage appears after running analyses.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
