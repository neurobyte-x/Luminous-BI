import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
  index?: number;
}

export function StatCard({ label, value, change, icon: Icon, color, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="glass-effect transition-all hover:glow-effect">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-green-500">{change}</span> from last month
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
