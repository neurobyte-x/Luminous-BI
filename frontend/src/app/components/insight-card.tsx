import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';

interface InsightCardProps {
  icon: string;
  title: string;
  description: string;
  confidence: number;
  type: 'positive' | 'negative' | 'warning' | 'neutral' | 'insight';
  index?: number;
}

export function InsightCard({ icon, title, description, confidence, type, index = 0 }: InsightCardProps) {
  const typeColors = {
    positive: 'bg-green-500/10 text-green-500 border-green-500/20',
    negative: 'bg-red-500/10 text-red-500 border-red-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    neutral: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    insight: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="glass-effect transition-all hover:glow-effect">
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="text-3xl">{icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold">{title}</h4>
              <Badge variant="outline" className={`mt-2 ${typeColors[type]}`}>
                {confidence}% confidence
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
