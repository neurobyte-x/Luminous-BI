import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto rounded-full bg-muted p-6 w-fit">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action && (
          <Button onClick={action.onClick} className="glow-effect">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
