import { Navigate, useLocation } from 'react-router';

import { isAuthenticated } from '../lib/auth-storage';


type RequireAuthProps = {
  children: JSX.Element;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  return children;
}


type RedirectIfAuthenticatedProps = {
  children: JSX.Element;
};

export function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  if (isAuthenticated()) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}
