import { useState } from 'react';
import { Outlet } from 'react-router';
import { Menu } from 'lucide-react';
import { AppNavbar } from './app-navbar';
import { AppSidebar } from './app-sidebar';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      {/* Mobile Sidebar Toggle */}
      <div className="fixed left-4 top-20 z-40 lg:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="glow-effect">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="pt-4">
              <AppSidebar />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}