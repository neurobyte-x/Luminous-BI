import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { signin } from '../lib/api';
import { setAuthSession } from '../lib/auth-storage';

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fromPath =
    typeof location.state === 'object' && location.state && 'from' in location.state
      ? String((location.state as { from?: string }).from || '/app/dashboard')
      : '/app/dashboard';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const response = await signin({ email, password });
      setAuthSession(response.access_token, response.user);
      toast.success('Signed in successfully.');
      navigate(fromPath, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <Card className="w-full max-w-md glass-effect">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Luminous BI</span>
          </div>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Access your analytics workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground text-center">
            New user?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
