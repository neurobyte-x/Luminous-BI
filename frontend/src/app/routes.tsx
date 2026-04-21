import { createBrowserRouter, Navigate } from 'react-router';
import { LandingPage } from './components/landing-page';
import { AppLayout } from './components/app-layout';
import { RedirectIfAuthenticated, RequireAuth } from './components/require-auth';
import { DashboardPage } from './pages/dashboard-page';
import { QueryExplorerPage } from './pages/query-explorer-page';
import { UploadPage } from './pages/upload-page';
import { SavedDashboardsPage } from './pages/saved-dashboards-page';
import { ComparisonPage } from './pages/comparison-page';
import { HistoryPage } from './pages/history-page';
import { SettingsPage } from './pages/settings-page';
import { SignInPage } from './pages/signin-page';
import { SignUpPage } from './pages/signup-page';
import { NotFoundPage } from './pages/not-found-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/signin',
    element: (
      <RedirectIfAuthenticated>
        <SignInPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: '/login',
    element: <Navigate to="/signin" replace />,
  },
  {
    path: '/signup',
    element: (
      <RedirectIfAuthenticated>
        <SignUpPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'query',
        element: <QueryExplorerPage />,
      },
      {
        path: 'upload',
        element: <UploadPage />,
      },
      {
        path: 'saved',
        element: <SavedDashboardsPage />,
      },
      {
        path: 'comparison',
        element: <ComparisonPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);