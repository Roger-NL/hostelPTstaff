import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useStore } from '../store/useStore';
import * as authService from '../services/auth.service';
import { User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User | null;
}

export const useAuth = () => {
  const { user, login: storeLogin, logout: storeLogout } = useStore();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: !!user,
    isLoading: true,
    currentUser: user as User | null
  });
  
  // Controle para evitar múltiplas chamadas à API de carregamento de usuários
  const isLoadingUsers = useRef(false);
  const lastLoadTime = useRef<number>(0);
  const USER_LOAD_COOLDOWN = 60000; // 1 minuto de cooldown entre carregamentos

  // Função para obter usuários do cache sem fazer requisição
  const getUsers = useCallback(() => {
    return useStore.getState().users;
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
      lastLoadTime.current = Date.now();
      
      // Converte User[] para UserData[] para o store
      try {
        const usersData = users.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          password: '', // A senha nunca é retornada/armazenada no cliente
          country: user.country,
          age: String(user.age), // Converter para string como esperado pelo UserData
          relationshipStatus: user.relationshipStatus as string,
          gender: user.gender as string,
          phone: user.phone,
          arrivalDate: user.arrivalDate,
          departureDate: user.departureDate,
          isAuthenticated: true,
          role: user.role,
          points: user.points
        }));
        
        // Atualiza o estado do store diretamente - solução mais robusta
        useStore.getState().setUsers(usersData);
        console.log("Store atualizado com os dados dos usuários");
        
        // Verifica se tem usuário autenticado para garantir que esteja na lista
        const currentUser = auth.currentUser;
        if (currentUser) {
          const currentProfile = await authService.getUserProfile(currentUser.uid);
          if (currentProfile) {
            // Atualiza o usuário atual no store
            useStore.getState().setUser(currentProfile);
          }
        }
      } catch (e) {
        console.error("Erro ao atualizar store:", e);
      }
      
      return users;
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      return usersInStore; // Retorna usuários em cache em caso de erro
    } finally {
      isLoadingUsers.current = false;
    }
  }, [getUsers]);

  // Escuta mudanças no estado de autenticação do Firebase
  useEffect(() => {
    let isFirstLoad = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('Firebase Auth: Usuário autenticado, buscando perfil...', firebaseUser.uid);
          // Busca os dados completos do usuário no Firestore
          const userProfile = await authService.getUserProfile(firebaseUser.uid);
          
          if (userProfile) {
            console.log('Perfil do usuário encontrado:', userProfile.email);
            // Atualiza o estado de autenticação
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              currentUser: userProfile
            });
            
            // Atualiza o estado global da aplicação
            storeLogin(userProfile.email, ''); 
            
            // Carrega usuários apenas na primeira vez ou se o cache estiver vazio
            const usersInStore = getUsers();
            if (isFirstLoad || usersInStore.length === 0) {
              isFirstLoad = false;
              console.log('Carregando dados na primeira autenticação ou cache vazio');
              
              // Carrega todos os usuários de forma não-bloqueante
              loadAllUsers().catch(e => 
                console.error('Erro ao carregar usuários durante inicialização:', e)
              );
            } else {
              console.log(`Evitando recarga, ${usersInStore.length} usuários em cache`);
            }
          } else {
            console.log('Perfil do usuário não encontrado no Firestore, criando perfil básico...');
            
            try {
              // Tenta criar um perfil básico para o usuário
              const basicUserData: Omit<User, 'id'> = {
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'Usuário',
                role: 'user',
                points: 0,
                country: '',
                age: 0,
                relationshipStatus: 'single',
                gender: 'other',
                phone: '',
                arrivalDate: new Date().toISOString(),
                departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
              };
              
              // Cria perfil no Firestore
              const newProfile = await authService.createUserProfile(firebaseUser.uid, basicUserData);
              
              if (newProfile) {
                console.log('Perfil básico criado com sucesso:', newProfile.email);
                // Atualiza o estado de autenticação
                setAuthState({
                  isAuthenticated: true,
                  isLoading: false,
                  currentUser: newProfile
                });
                
                // Atualiza o estado global da aplicação
                storeLogin(newProfile.email, '');
                
                // Carrega todos os usuários
                loadAllUsers().catch(e => 
                  console.error('Erro ao carregar usuários após criar perfil:', e)
                );
              } else {
                throw new Error('Falha ao criar perfil de usuário');
              }
            } catch (profileError) {
              console.error('Erro ao criar perfil básico:', profileError);
              // Limpa o estado de autenticação
              setAuthState({
                isAuthenticated: false,
                isLoading: false,
                currentUser: null
              });
            }
          }
        } catch (error) {
          console.error('Erro ao carregar perfil do usuário:', error);
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            currentUser: null
          });
        }
      } else {
        // Usuário não autenticado
        console.log('Firebase Auth: Nenhum usuário autenticado');
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          currentUser: null
        });
        
        // Limpa o usuário do estado global
        storeLogout();
      }
    });

    // Cleanup da inscrição
    return () => unsubscribe();
  }, [storeLogin, storeLogout, loadAllUsers, getUsers]);

  // Funções de autenticação
  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log('Tentando login com email:', email);
      const firebaseUser = await authService.login(email, password);
      console.log('Login bem-sucedido no Firebase Auth:', firebaseUser.uid);
      
      try {
        // Tenta obter o perfil do usuário
        const userProfile = await authService.getUserProfile(firebaseUser.uid);
        
        if (userProfile) {
          console.log('Perfil encontrado, completando login');
          
          // Atualiza o estado de autenticação primeiro
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            currentUser: userProfile
          });
          
          // Atualiza o estado global
          storeLogin(email, '');
          
          // Carrega todos os usuários (sem await para não bloquear)
          loadAllUsers().catch(e => console.error('Erro ao carregar usuários após login:', e));
          
          return userProfile;
        } else {
          console.log('Perfil não encontrado após login, criando perfil básico');
          
          // Cria um perfil básico para o usuário
          const basicUserData: Omit<User, 'id'> = {
            email: email,
            name: firebaseUser.displayName || 'Usuário',
            role: 'user',
            points: 0,
            country: '',
            age: 0,
            relationshipStatus: 'single',
            gender: 'other',
            phone: '',
            arrivalDate: new Date().toISOString(),
            departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          };
          
          // Cria perfil no Firestore
          const newProfile = await authService.createUserProfile(firebaseUser.uid, basicUserData);
          
          // Atualiza o estado de autenticação
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            currentUser: newProfile
          });
          
          // Atualiza o estado global
          storeLogin(email, '');
          
          // Carrega todos os usuários (sem await para não bloquear)
          loadAllUsers().catch(e => console.error('Erro ao carregar usuários após criar perfil:', e));
          
          return newProfile;
        }
      } catch (profileError) {
        console.error('Erro ao processar perfil após login:', profileError);
        // Faz logout já que o login foi bem-sucedido, mas o perfil falhou
        await authService.logout();
        throw new Error('Falha ao processar perfil de usuário');
      }
    } catch (error) {
      console.error('Erro durante login:', error);
      throw error;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    userData: Omit<User, 'id'>
  ): Promise<User> => {
    try {
      console.log('Tentando registrar novo usuário:', email);
      
      // Converter os dados do usuário para o formato esperado pelo authService
      const registrationData = {
        email,
        password,
        name: userData.name,
        country: userData.country,
        age: userData.age.toString(), // converter number para string
        relationshipStatus: userData.relationshipStatus,
        gender: userData.gender,
        phone: userData.phone,
        arrivalDate: userData.arrivalDate,
        departureDate: userData.departureDate
      };
      
      // Chamar a função register do authService
      const user = await authService.register(registrationData);
      
      if (!user) {
        throw new Error('Falha ao registrar usuário');
      }
      
      console.log('Registro bem-sucedido:', user.id);
      
      // Carrega todos os usuários após registro bem-sucedido
      loadAllUsers().catch(e => console.error('Erro ao carregar usuários após registro:', e));
      
      return user;
    } catch (error) {
      console.error('Erro durante registro:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('Realizando logout...');
      await authService.logout();
      storeLogout();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        currentUser: null
      });
    } catch (error) {
      console.error('Erro durante logout:', error);
      throw error;
    }
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    currentUser: authState.currentUser,
    login,
    logout,
    register,
    loadAllUsers,
    getUsers
  };
}; 