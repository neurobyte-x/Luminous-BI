import { Link } from 'react-router';
import { Home, Search } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link to="/app/query">
            <Button className="gap-2 glow-effect">
              <Search className="h-4 w-4" />
              Start Exploring
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
