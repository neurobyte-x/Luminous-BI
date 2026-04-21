import { BarChart3, History, Home, Settings, Upload, Save, GitCompare, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router';

export function AppSidebar() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/app/dashboard' },
    { icon: Sparkles, label: 'Query Explorer', path: '/app/query' },
    { icon: Upload, label: 'Upload Data', path: '/app/upload' },
    { icon: Save, label: 'Saved Dashboards', path: '/app/saved' },
    { icon: GitCompare, label: 'Comparison Mode', path: '/app/comparison' },
    { icon: History, label: 'History', path: '/app/history' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  return (
    <aside className="lg:fixed lg:left-0 lg:top-16 h-[calc(100vh-4rem)] w-64 lg:border-r border-border bg-sidebar overflow-y-auto">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground glow-effect'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}