import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Sparkles } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { LineChartComponent } from '../components/charts/line-chart-component';
import { InsightCard } from '../components/insight-card';
import { mockChartData, mockInsights } from '../data/mock-data';

export function ComparisonPage() {
  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleCompare = () => {
    if (queryA.trim() && queryB.trim()) {
      setShowResults(true);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Comparison Mode</h1>
        <p className="mt-2 text-muted-foreground">
          Compare two queries side by side
        </p>
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
          disabled={!queryA.trim() || !queryB.trim()}
          className="gap-2 glow-effect"
        >
          <Sparkles className="h-4 w-4" />
          Compare
        </Button>
      </div>

      {/* Results Section */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Separator />

          {/* Charts Comparison */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Results A</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChartComponent
                  data={mockChartData}
                  xKey="month"
                  lines={[
                    { key: 'revenue', color: '#3B82F6', name: 'Revenue' },
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Results B</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChartComponent
                  data={mockChartData}
                  xKey="month"
                  lines={[
                    { key: 'profit', color: '#10B981', name: 'Profit' },
                  ]}
                />
              </CardContent>
            </Card>
          </div>

          {/* Insights Comparison */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Insights A</h3>
              <InsightCard {...mockInsights[0]} />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Insights B</h3>
              <InsightCard {...mockInsights[1]} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
