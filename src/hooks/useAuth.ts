import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useStore } from '../store/useStore';
import * as authService from '../services/auth.service';
import { User, UserData } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User | null;
}

export const useAuth = () => {
  const { user: storeUser, login: storeLogin, logout: storeLogout } = useStore();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: !!storeUser,
    isLoading: true,
    currentUser: storeUser as User | null
  });
  
  // Controle para evitar múltiplas chamadas à API de carregamento de usuários
  const isLoadingUsers = useRef(false);
  const lastLoadTime = useRef<number>(0);
  const USER_LOAD_COOLDOWN = 300000; // 5 minutos de cooldown entre carregamentos (aumentado para melhor performance)
  const cachedUsersRef = useRef<UserData[]>([]);

  // Função para obter usuários do cache sem fazer requisição
  const getUsers = useCallback(() => {
    const storeUsers = useStore.getState().users;
    
    // Retornar primeiro o cache local se existir para melhor performance
    if (cachedUsersRef.current.length > 0) {
      return cachedUsersRef.current;
    }
    
    // Ou retornar da store global
    if (storeUsers.length > 0) {
      cachedUsersRef.current = storeUsers;
    }
    
    return storeUsers;
  }, []);

  // Função para carregar todos os usuários
  const loadAllUsers = useCallback(async () => {
    // Verifica se já existe um carregamento em andamento
    if (isLoadingUsers.current) {
      console.log('Carregamento de usuários já em andamento, ignorando nova solicitação');
      return getUsers();
    }
    
    // Verifica se a última carga foi recente
    const now = Date.now();
    const usersInStore = getUsers();
    if (now - lastLoadTime.current < USER_LOAD_COOLDOWN && usersInStore.length > 0) {
      console.log(`Carregamento recente de usuários (${usersInStore.length} em cache), usando cache existente`);
      return usersInStore;
    }
    
    console.log('Carregando todos os usuários...');
    isLoadingUsers.current = true;
    
    try {
      const users = await authService.getAllUsers();
      console.log(`${users.length} usuários carregados com sucesso`);
      
      // Converter para UserData
      const userData: UserData[] = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        password: '',
        country: user.country,
        age: String(user.age),
        relationshipStatus: user.relationshipStatus,
        gender: user.gender,
        phone: user.phone,
        arrivalDate: user.arrivalDate,
        departureDate: user.departureDate,
        isAuthenticated: true,
        role: user.role,
        points: user.points
      }));
      
      // Atualiza cache local para acesso mais rápido
      cachedUsersRef.current = userData;
      
      // Atualiza timestamp
      lastLoadTime.current = Date.now();
      
      // Atualiza o cache global
      useStore.getState().setUsers(userData);
      
      isLoadingUsers.current = false;
      return userData;
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      isLoadingUsers.current = false;
      
      // Em caso de erro, retorna cache existente
      return getUsers();
    }
  }, [getUsers]);

  // Otimização: memoiza a função de login para não recriar a cada render
  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const userProfile = await authService.login(email, password);
      console.log('Login successful, user profile:', userProfile);
      
      // Primeiro atualiza o store
      useStore.getState().setUser(userProfile);
      
      // Depois atualiza o estado local
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        currentUser: userProfile
      });
      
      // Aguarda um momento para garantir que os estados foram atualizados
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return userProfile;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  // Otimização: memoiza a função de registro para não recriar a cada render
  const register = useCallback(async (email: string, password: string, userData: Partial<User>) => {
    try {
      if (!email) {
        throw new Error('Email é obrigatório para registro');
      }
      
      const registrationData = {
        email: email,
        password: password,
        name: userData.name || '',
        country: userData.country || '',
        age: String(userData.age || 0),
        relationshipStatus: userData.relationshipStatus || 'single',
        gender: userData.gender || 'other',
        phone: userData.phone || '',
        arrivalDate: userData.arrivalDate || '',
        departureDate: userData.departureDate || ''
      };
      
      // Verificar se o usuário atual é admin para determinar qual função usar
      const isAdmin = storeUser && storeUser.role === 'admin';
      
      // Se for admin, usar registerStaffOnly para não mudar a autenticação
      // Se não for admin (cadastro próprio), usar o método register normal
      const newUser = isAdmin 
        ? await authService.registerStaffOnly(registrationData)
        : await authService.register(registrationData);
      
      if (newUser) {
        // Se não for admin (cadastro próprio), fazer login com o novo usuário
        if (!isAdmin) {
          useStore.getState().setUser(newUser);
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            currentUser: newUser
          });
        }
        return newUser;
      } else {
        throw new Error('Falha ao registrar usuário');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, [storeUser, useStore.getState().setUser]);

  // Otimização: memoiza a função de logout para não recriar a cada render
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        currentUser: null
      });
      
      // Limpa o cache local ao fazer logout
      cachedUsersRef.current = [];
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  // Escutando mudanças de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        try {
          const userData = await authService.getUserByEmail(firebaseUser.email || '');
          console.log('User data from Firestore:', userData);
          
          if (userData) {
            useStore.getState().setUser(userData);
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              currentUser: userData
            });
          } else {
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              currentUser: null
            });
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            currentUser: null
          });
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          currentUser: null
        });
      }
    });

    return () => unsubscribe();
  }, [useStore.getState().setUser]);
  
  // Memoização dos valores do authState para evitar recálculos
  const authValues = useMemo(() => {
    return {
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      currentUser: authState.currentUser
    };
  }, [authState]);

  return {
    ...authValues,
    login,
    register,
    logout,
    loadAllUsers,
    getUsers,
  };
};

export default useAuth; 