import { RouterProvider } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from './contexts/theme-context';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster />
      <Analytics />
    </ThemeProvider>
  );
}
