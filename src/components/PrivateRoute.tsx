import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin'; // Papel necessário para acessar a rota
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  
  // Se estiver carregando, exibe um indicador de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }
  
  // Se não estiver autenticado, redireciona para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Se um papel específico for necessário, verifica se o usuário tem esse papel
  if (requiredRole && currentUser?.role !== requiredRole) {
    // Se o usuário não tiver o papel necessário, redireciona para o dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  // Se autenticado e com permissões adequadas, renderiza os children
  return <>{children}</>;
};

export default PrivateRoute; 