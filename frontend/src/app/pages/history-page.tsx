import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Clock, BarChart3, Table, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { fetchHistory, type HistoryItem } from '../lib/api';

export function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await fetchHistory();
        setItems(history);
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistory();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'chart':
        return BarChart3;
      case 'table':
        return Table;
      case 'insight':
        return Lightbulb;
      default:
        return BarChart3;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">History</h1>
        <p className="mt-2 text-muted-foreground">
          Review your previous queries and analyses
        </p>
      </div>

      {isLoading && (
        <Card className="glass-effect">
          <CardContent className="p-6 text-sm text-muted-foreground">Loading history...</CardContent>
        </Card>
      )}

      {!isLoading && items.length === 0 && (
        <Card className="glass-effect">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No query history yet. Run an analysis from Query Explorer.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {items.map((item, index) => {
          const Icon = getIcon('chart');
          const date = new Date(item.created_at);
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect group transition-all hover:glow-effect">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium">{item.query}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{item.summary}</p>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate('/app/query', {
                        state: { query: item.query, datasetId: item.dataset_id },
                      })
                    }
                  >
                    View Results
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
