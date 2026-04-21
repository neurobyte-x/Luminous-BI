import { Mic, Search, Sparkles, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ThemeToggle } from './theme-toggle';
import { logout, signout } from '../lib/api';
import { clearAuthSession, getAuthUser } from '../lib/auth-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function AppNavbar() {
  const [query, setQuery] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();
  const authUser = useMemo(() => getAuthUser(), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate('/app/query', { state: { query } });
      setQuery('');
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await logout();
    } catch {
      try {
        await signout();
      } catch {
        // Fall through to local sign-out.
      }
    } finally {
      clearAuthSession();
      setIsSigningOut(false);
      toast.success('Signed out.');
      navigate('/signin', { replace: true });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="flex h-full items-center gap-2 sm:gap-4 px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 w-auto sm:w-64">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-lg sm:text-xl font-semibold hidden sm:inline">Luminous BI</span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ask your data..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 hidden sm:flex"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </form>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{authUser?.email || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void handleSignOut()} disabled={isSigningOut}>
                {isSigningOut ? 'Signing out...' : 'Log out / Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}