import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { signup } from '../lib/api';
import { setAuthSession } from '../lib/auth-storage';

export function SignUpPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const response = await signup({
        full_name: fullName || undefined,
        email,
        password,
      });
      setAuthSession(response.access_token, response.user);
      toast.success('Account created successfully.');
      navigate('/app/dashboard', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign up failed.');
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
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Start building AI dashboards in minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Full name (optional)"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Already registered?{' '}
            <Link to="/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
