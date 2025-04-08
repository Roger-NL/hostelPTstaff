import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingFallback from './common/LoadingFallback';
import { useStore } from '../store/useStore';
import type { AppState } from '../store/useStore';

interface PrivateRouteProps {
  children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser: authUser, isLoading } = useAuth();
  const storeUser = useStore((state: AppState) => state.user);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!authUser && !storeUser) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute; 