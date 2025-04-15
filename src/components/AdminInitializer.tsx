import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore';
import { authService } from '../services/auth.service';

interface AdminInitializerProps {
  masterEmail: string;
}

/**
 * Componente que verifica se o usuário master existe e o cria se necessário.
 * Este componente não renderiza nada visualmente.
 */
const AdminInitializer: React.FC<AdminInitializerProps> = ({ masterEmail }) => {
  const { user } = useAuth();
  const { setUser } = useStore();

  useEffect(() => {
    const initializeAdmin = async () => {
      if (!user && masterEmail) {
        try {
          const adminUser = await authService.getUserByEmail(masterEmail);
          if (adminUser) {
            setUser(adminUser);
          }
        } catch (error) {
          console.error('Error initializing admin:', error);
        }
      }
    };

    initializeAdmin();
  }, [user, masterEmail, setUser]);

  // Este componente não renderiza nada
  return null;
};

export default AdminInitializer; 