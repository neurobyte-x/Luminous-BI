import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Save, Sparkles, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LoadingState } from '../components/loading-state';
import { LineChartComponent } from '../components/charts/line-chart-component';
import { BarChartComponent } from '../components/charts/bar-chart-component';
import { PieChartComponent } from '../components/charts/pie-chart-component';
import { InsightCard } from '../components/insight-card';
import { DataTableView } from '../components/data-table-view';
import { SQLView } from '../components/sql-view';
import { FeedbackModal } from '../components/feedback-modal';
import { exampleQueries } from '../data/mock-data';
import { analyzeDataset, createDashboard, type AnalyzeResponse, type ChartSpec } from '../lib/api';
import { getActiveDataset, setActiveDataset, setLastAnalysis } from '../lib/storage';

type QueryState = 'input' | 'loading' | 'results';

const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

function toNumeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function buildPieData(data: Array<Record<string, unknown>>, chart: ChartSpec) {
  return data
    .map((row) => {
      const name = row[chart.x];
      const value = toNumeric(row[chart.y]);

      if (!name || value === null) {
        return null;
      }

      return {
        [chart.x]: String(name),
        [chart.y]: value,
      };
    })
    .filter((entry): entry is Record<string, string | number> => entry !== null);
}

function buildCartesianData(data: Array<Record<string, unknown>>, chart: ChartSpec) {
  return data
    .map((row) => {
      const xValue = row[chart.x];
      const yValue = toNumeric(row[chart.y]);

      if (xValue === null || xValue === undefined || yValue === null) {
        return null;
      }

      return {
        [chart.x]: xValue,
        [chart.y]: yValue,
      };
    })
    .filter((entry): entry is Record<string, string | number> => entry !== null);
}

export function QueryExplorerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<QueryState>('input');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isSavingDashboard, setIsSavingDashboard] = useState(false);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(
    () => getActiveDataset()?.datasetId ?? null,
  );

  const handleAnalyze = useCallback(
    async (queryText?: string, datasetIdOverride?: string) => {
      const q = (queryText || query).trim();
      if (!q) {
        return;
      }

      const selectedDatasetId = datasetIdOverride || activeDatasetId || getActiveDataset()?.datasetId;
      if (!selectedDatasetId) {
        toast.error('Upload and import a dataset before running analysis.');
        navigate('/app/upload');
        return;
      }

      try {
        setState('loading');
        const response = await analyzeDataset({
          query: q,
          dataset_id: selectedDatasetId,
        });

        setAnalysis(response);
        setState('results');

        setLastAnalysis({
          query: q,
          datasetId: selectedDatasetId,
          summary: response.summary,
          charts: response.charts as Array<Record<string, unknown>>,
          data: response.data,
          createdAt: new Date().toISOString(),
        });

        if (!activeDatasetId) {
          setActiveDataset({ datasetId: selectedDatasetId });
          setActiveDatasetId(selectedDatasetId);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Analysis failed.');
        setState('input');
      }
    },
    [activeDatasetId, navigate, query],
  );

  useEffect(() => {
    const routeState = (location.state || {}) as { query?: string; datasetId?: string };
    if (!routeState.query && !routeState.datasetId) {
      return;
    }

    if (routeState.datasetId) {
      setActiveDatasetId(routeState.datasetId);
      setActiveDataset({ datasetId: routeState.datasetId });
    }

    if (routeState.query) {
      setQuery(routeState.query);
      void handleAnalyze(routeState.query, routeState.datasetId);
    }
  }, [handleAnalyze, location.state]);

  const insightCards = useMemo(() => {
    if (!analysis) {
      return [];
    }

    const types: Array<'positive' | 'warning' | 'neutral' | 'insight'> = [
      'positive',
      'insight',
      'warning',
      'neutral',
    ];

    return analysis.insights.map((insight, index) => ({
      icon: types[index % types.length] === 'warning' ? '⚠️' : '💡',
      title: `Insight ${index + 1}`,
      description: insight,
      confidence: Math.max(70, 95 - index * 3),
      type: types[index % types.length],
    }));
  }, [analysis]);

  const handleSaveDashboard = async () => {
    if (!analysis || !activeDatasetId) {
      return;
    }

    try {
      setIsSavingDashboard(true);
      await createDashboard({
        name: query.trim().slice(0, 60) || `Dashboard ${new Date().toISOString()}`,
        query: query.trim(),
        dataset_id: activeDatasetId,
        charts: analysis.charts,
      });

      toast.success('Dashboard saved.');
      navigate('/app/saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save dashboard.');
    } finally {
      setIsSavingDashboard(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Query Explorer</h1>
        <p className="mt-2 text-muted-foreground">
          Ask questions about your data in natural language
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Active dataset: {activeDatasetId || 'Not selected'}
        </p>
      </div>

      {/* Input Section */}
      <Card className="glass-effect">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Textarea
              placeholder="Ask your data anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[120px] resize-none text-lg"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {exampleQueries.slice(0, 3).map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery(example);
                      void handleAnalyze(example);
                    }}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
              
              <Button
                onClick={() => void handleAnalyze()}
                disabled={!query.trim() || state === 'loading'}
                className="gap-2 glow-effect"
              >
                <Sparkles className="h-4 w-4" />
                Analyze
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {state === 'loading' && (
        <Card className="glass-effect">
          <CardContent className="pt-6">
            <LoadingState />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {state === 'results' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {analysis?.summary || 'Query executed successfully'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDashboard}
                disabled={isSavingDashboard}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSavingDashboard ? 'Saving...' : 'Save Dashboard'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackOpen(true)}
                className="gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Give Feedback
              </Button>
            </div>
          </div>

          <Tabs defaultValue="charts" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="charts">📊 Charts</TabsTrigger>
              <TabsTrigger value="data">📋 Data</TabsTrigger>
              <TabsTrigger value="insights">💡 Insights</TabsTrigger>
              <TabsTrigger value="sql">🧾 SQL</TabsTrigger>
            </TabsList>

            {/* Charts Tab */}
            <TabsContent value="charts" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {(analysis?.charts || []).map((chart, index) => {
                  const chartTitle = `${chart.type.toUpperCase()} Chart: ${chart.y} by ${chart.x}`;
                  const isPie = chart.type === 'pie';
                  const chartColor = CHART_COLORS[index % CHART_COLORS.length];

                  const chartData = isPie
                    ? buildPieData(analysis?.data || [], chart)
                    : buildCartesianData(analysis?.data || [], chart);

                  return (
                    <Card
                      key={`${chart.type}-${chart.x}-${chart.y}-${index}`}
                      className={`glass-effect ${analysis?.charts.length === 1 ? 'lg:col-span-2' : ''}`}
                    >
                      <CardHeader>
                        <CardTitle>{chartTitle}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {chartData.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Not enough numeric rows to render this chart.
                          </p>
                        )}

                        {chartData.length > 0 && isPie && (
                          <PieChartComponent
                            data={chartData}
                            nameKey={chart.x}
                            valueKey={chart.y}
                            colors={CHART_COLORS}
                          />
                        )}

                        {chartData.length > 0 && chart.type === 'line' && (
                          <LineChartComponent
                            data={chartData}
                            xKey={chart.x}
                            lines={[{ key: chart.y, color: chartColor, name: chart.y }]}
                          />
                        )}

                        {chartData.length > 0 && chart.type === 'bar' && (
                          <BarChartComponent
                            data={chartData}
                            xKey={chart.x}
                            bars={[{ key: chart.y, color: chartColor, name: chart.y }]}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Query Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTableView data={analysis?.data || []} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights">
              <div className="grid gap-6 md:grid-cols-2">
                {insightCards.map((insight, index) => (
                  <InsightCard key={index} {...insight} index={index} />
                ))}
              </div>
            </TabsContent>

            {/* SQL Tab */}
            <TabsContent value="sql">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Generated SQL Query</CardTitle>
                </CardHeader>
                <CardContent>
                  <SQLView
                    sql={[
                      'Natural language query:',
                      query,
                      '',
                      'Dataset ID:',
                      activeDatasetId || 'N/A',
                      '',
                      'Summary:',
                      analysis?.summary || 'N/A',
                    ].join('\n')}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />
    </div>
  );
}