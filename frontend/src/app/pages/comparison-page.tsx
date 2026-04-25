import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Sparkles } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { LineChartComponent } from '../components/charts/line-chart-component';
import { BarChartComponent } from '../components/charts/bar-chart-component';
import { PieChartComponent } from '../components/charts/pie-chart-component';
import { InsightCard } from '../components/insight-card';
import { LoadingState } from '../components/loading-state';
import {
  analyzeDataset,
  fetchUploadedDatasets,
  type AnalyzeResponse,
  type ChartSpec,
  type UploadedDatasetItem,
} from '../lib/api';
import { getActiveDataset, setActiveDataset } from '../lib/storage';

const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

type ComparisonState = 'input' | 'loading' | 'results';

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

function AnalysisCharts({ analysis }: { analysis: AnalyzeResponse }) {
  if (!analysis.charts.length) {
    return <p className="text-sm text-muted-foreground">No charts were generated for this query.</p>;
  }

  return (
    <div className="space-y-6">
      {analysis.charts.map((chart, index) => {
        const isPie = chart.type === 'pie';
        const chartColor = CHART_COLORS[index % CHART_COLORS.length];
        const title = `${chart.type.toUpperCase()} Chart: ${chart.y} by ${chart.x}`;

        const chartData = isPie
          ? buildPieData(analysis.data, chart)
          : buildCartesianData(analysis.data, chart);

        return (
          <div key={`${chart.type}-${chart.x}-${chart.y}-${index}`} className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            {chartData.length === 0 && (
              <p className="text-sm text-muted-foreground">Not enough numeric rows to render this chart.</p>
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
          </div>
        );
      })}
    </div>
  );
}

export function ComparisonPage() {
  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');
  const [comparisonState, setComparisonState] = useState<ComparisonState>('input');
  const [analysisA, setAnalysisA] = useState<AnalyzeResponse | null>(null);
  const [analysisB, setAnalysisB] = useState<AnalyzeResponse | null>(null);
  const [availableDatasets, setAvailableDatasets] = useState<UploadedDatasetItem[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(
    () => getActiveDataset()?.datasetId ?? null,
  );

  useEffect(() => {
    let isMounted = true;

    const loadDatasets = async () => {
      try {
        setIsLoadingDatasets(true);
        const datasets = await fetchUploadedDatasets();
        if (!isMounted) {
          return;
        }

        setAvailableDatasets(datasets);

        if (!datasets.length) {
          return;
        }

        const preferredDatasetId = activeDatasetId || getActiveDataset()?.datasetId;
        const preferredDataset = preferredDatasetId
          ? datasets.find((item) => item.dataset_id === preferredDatasetId)
          : null;
        const selectedDataset = preferredDataset ?? datasets[0];

        setActiveDatasetId(selectedDataset.dataset_id);
        setActiveDataset({
          datasetId: selectedDataset.dataset_id,
          filename: selectedDataset.filename,
          columns: selectedDataset.columns,
          rows: selectedDataset.rows,
        });
      } catch (error) {
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : 'Failed to load uploaded datasets.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingDatasets(false);
        }
      }
    };

    void loadDatasets();

    return () => {
      isMounted = false;
    };
  }, []);

  const insightCardsA = useMemo(() => {
    if (!analysisA) {
      return [];
    }

    const types: Array<'positive' | 'warning' | 'neutral' | 'insight'> = [
      'positive',
      'insight',
      'warning',
      'neutral',
    ];

    return analysisA.insights.map((insight, index) => ({
      icon: types[index % types.length] === 'warning' ? '⚠️' : '💡',
      title: `Insight A${index + 1}`,
      description: insight,
      confidence: Math.max(70, 95 - index * 3),
      type: types[index % types.length],
    }));
  }, [analysisA]);

  const insightCardsB = useMemo(() => {
    if (!analysisB) {
      return [];
    }

    const types: Array<'positive' | 'warning' | 'neutral' | 'insight'> = [
      'positive',
      'insight',
      'warning',
      'neutral',
    ];

    return analysisB.insights.map((insight, index) => ({
      icon: types[index % types.length] === 'warning' ? '⚠️' : '💡',
      title: `Insight B${index + 1}`,
      description: insight,
      confidence: Math.max(70, 95 - index * 3),
      type: types[index % types.length],
    }));
  }, [analysisB]);

  const handleCompare = async () => {
    const trimmedA = queryA.trim();
    const trimmedB = queryB.trim();
    const selectedDatasetId = activeDatasetId || getActiveDataset()?.datasetId;

    if (!trimmedA || !trimmedB) {
      return;
    }

    if (!selectedDatasetId) {
      toast.error('Upload and select a dataset before running comparison.');
      return;
    }

    try {
      setComparisonState('loading');
      const [resultA, resultB] = await Promise.all([
        analyzeDataset({ query: trimmedA, dataset_id: selectedDatasetId }),
        analyzeDataset({ query: trimmedB, dataset_id: selectedDatasetId }),
      ]);

      setAnalysisA(resultA);
      setAnalysisB(resultB);
      setComparisonState('results');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Comparison failed.');
      setComparisonState('input');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Comparison Mode</h1>
        <p className="mt-2 text-muted-foreground">
          Compare two queries side by side
        </p>
        <div className="mt-4 max-w-xl space-y-2">
          <p className="text-sm text-muted-foreground">Choose CSV file</p>
          <Select
            value={activeDatasetId ?? undefined}
            onValueChange={(datasetId) => {
              const selected = availableDatasets.find((item) => item.dataset_id === datasetId);
              setActiveDatasetId(datasetId);

              if (selected) {
                setActiveDataset({
                  datasetId: selected.dataset_id,
                  filename: selected.filename,
                  columns: selected.columns,
                  rows: selected.rows,
                });
              } else {
                setActiveDataset({ datasetId });
              }
            }}
            disabled={isLoadingDatasets || availableDatasets.length === 0 || comparisonState === 'loading'}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingDatasets
                    ? 'Loading uploaded datasets...'
                    : 'No uploaded datasets found. Upload a CSV first.'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableDatasets.map((dataset) => (
                <SelectItem key={dataset.dataset_id} value={dataset.dataset_id}>
                  {dataset.filename} ({dataset.rows} rows)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Query A</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter first query..."
              value={queryA}
              onChange={(e) => setQueryA(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Query B</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter second query..."
              value={queryB}
              onChange={(e) => setQueryB(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleCompare}
          disabled={!queryA.trim() || !queryB.trim() || comparisonState === 'loading'}
          className="gap-2 glow-effect"
        >
          <Sparkles className="h-4 w-4" />
          {comparisonState === 'loading' ? 'Comparing...' : 'Compare'}
        </Button>
      </div>

      {comparisonState === 'loading' && (
        <Card className="glass-effect">
          <CardContent className="pt-6">
            <LoadingState />
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {comparisonState === 'results' && analysisA && analysisB && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Separator />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Summary A</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysisA.summary}</p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Summary B</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysisB.summary}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Comparison */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Results A</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalysisCharts analysis={analysisA} />
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Results B</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalysisCharts analysis={analysisB} />
              </CardContent>
            </Card>
          </div>

          {/* Insights Comparison */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Insights A</h3>
              {insightCardsA.length > 0 ? (
                <div className="space-y-4">
                  {insightCardsA.map((insight, index) => (
                    <InsightCard key={`a-${index}`} {...insight} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No insights were generated.</p>
              )}
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Insights B</h3>
              {insightCardsB.length > 0 ? (
                <div className="space-y-4">
                  {insightCardsB.map((insight, index) => (
                    <InsightCard key={`b-${index}`} {...insight} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No insights were generated.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
