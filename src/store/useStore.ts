import { create } from 'zustand';
import type { Schedule, ShiftTime, UserData, Task, TaskComment, TaskChecklistItem, Event, Message, UserSettings, SystemSettings, User } from '../types';
import * as authService from '../services/auth.service';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import * as scheduleService from '../services/schedule.service';
import * as messageService from '../services/message.service';
import * as eventService from '../services/event.service';
import * as taskService from '../services/task.service';
import { collection, getDocs } from 'firebase/firestore';
import { query, where, deleteDoc } from 'firebase/firestore';
import { 
  loadTasksFromFirebase, 
  saveTaskToFirebase, 
  deleteTaskFromFirebase, 
  updateTaskInFirebase, 
  deleteAllTasks, 
  cleanupDeletedTasks,
  uploadTaskPhoto,
  approveTaskPhoto,
  rejectTaskPhoto
} from '../services/task.service';

interface AppState {
  theme: 'light' | 'dark';
  language: 'en' | 'pt';
  user: UserData | null;
  users: UserData[];
  tasks: Task[];
  events: Event[];
  schedule: Schedule;
  messages: Message[];
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'en' | 'pt') => void;
  login: (email: string, password: string) => boolean;
  register: (userData: Omit<UserData, 'isAuthenticated' | 'role' | 'points' | 'id'>) => boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
  setUsers: (users: UserData[]) => void;
  makeAdmin: (userId: string) => boolean;
  removeAdmin: (userId: string) => boolean;
  updateUserPoints: (points: number) => void;
  assignShift: (date: string, shift: ShiftTime, volunteerId: string) => void;
  removeShift: (date: string, shift: ShiftTime, volunteerId?: string) => void;
  addStaff: (staffData: Omit<UserData, 'isAuthenticated' | 'role' | 'points' | 'id'>) => boolean;
  updateStaff: (id: string, staffData: Omit<UserData, 'isAuthenticated' | 'role' | 'points' | 'id'>) => boolean;
  removeStaff: (id: string) => boolean;
  // Task management
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'comments' | 'checklist' | 'createdBy'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  deleteAllTasks: () => Promise<boolean>;
  cleanupDeletedTasks: () => Promise<boolean>;
  moveTask: (taskId: string, newStatus: Task['status']) => void;
  assignTask: (taskId: string, userIds: string[]) => void;
  addTaskComment: (taskId: string, content: string) => void;
  deleteTaskComment: (taskId: string, commentId: string) => void;
  addTaskChecklistItem: (taskId: string, content: string) => void;
  toggleTaskChecklistItem: (taskId: string, itemId: string) => void;
  deleteTaskChecklistItem: (taskId: string, itemId: string) => void;
  addTaskTag: (taskId: string, tag: string) => void;
  removeTaskTag: (taskId: string, tag: string) => void;
  // Event management
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'status'>) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (eventId: string) => Promise<boolean>;
  deleteAllEvents: () => Promise<boolean>;
  joinEvent: (eventId: string, userId: string) => void;
  leaveEvent: (eventId: string, userId: string) => void;
  cancelEvent: (eventId: string) => void;
  addMessage: (content: string, attachments?: string[]) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  markMessageAsRead: (messageId: string) => void;
  markAllMessagesAsRead: () => void;
  clearAllMessages: () => void;
  
  // Settings state
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
  
  // System state
  systemSettings: SystemSettings;
  setSystemSettings: (settings: SystemSettings) => void;
  
  // Add initialization function to load data from Firebase
  init: () => Promise<void>;
  
  // Funções para gerenciamento de fotos
  approveTaskPhoto: (taskId: string, adminId: string) => Promise<void>;
  rejectTaskPhoto: (taskId: string) => Promise<void>;
}

// Definindo dados padrão vazios
const defaultUsers: UserData[] = [];
const defaultTasks: Task[] = [];
const defaultEvents: Event[] = [];

// Create default empty schedule
const defaultSchedule: Schedule = {};

// Create default empty messages array
const defaultMessages: Message[] = [];

// Default settings
const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    browser: true,
    tasks: true,
    events: true,
    schedule: true
  },
  preferences: {
    language: 'en',
    theme: 'dark',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '24h'
  },
  privacy: {
    showProfile: true,
    showPoints: true,
    showActivity: true
  }
};

// Default system settings
const defaultSystemSettings: SystemSettings = {
  maintenance: {
    enabled: false,
    message: 'System is under maintenance. Please try again later.'
  },
  registration: {
    enabled: true,
    requireApproval: false,
    allowedDomains: []
  },
  tasks: {
    maxPointsPerTask: 50,
    requireApproval: true,
    allowSelfAssign: true
  },
  events: {
    maxCapacity: 100,
    requireApproval: true,
    allowSelfOrganize: true
  }
};

// Default initial state
const initialState = {
  theme: 'dark' as const,
  language: 'en' as const,
  user: null,
  users: defaultUsers,
  tasks: defaultTasks,
  events: defaultEvents,
  schedule: defaultSchedule,
  messages: defaultMessages,
  settings: defaultSettings,
  systemSettings: defaultSystemSettings
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,
  
  // Add initialization function to load data from Firebase
  init: async () => {
    console.log('Inicializando aplicação...');
    
    // Verificar se a aplicação já foi inicializada antes
    const appInitialized = localStorage.getItem('app_initialized');
    
    const isFirstRun = !appInitialized;
    
    if (isFirstRun) {
      console.log('Primeira execução detectada, inicializando aplicação...');
      localStorage.setItem('app_initialized', 'true');
    } else {
      console.log('Aplicação já inicializada anteriormente, carregando dados existentes...');
      // Limpar eventos excluídos nas execuções subsequentes
      try {
        console.log('Executando limpeza de eventos excluídos...');
        await eventService.cleanupDeletedEvents();
        console.log('Executando limpeza de tarefas excluídas...');
        await taskService.cleanupDeletedTasks();
      } catch (cleanupError) {
        console.error('Erro ao limpar itens excluídos:', cleanupError);
      }
    }
    
    // Inicializar com valores vazios
    set({ 
      schedule: {},
      users: []
    });
    
    // Função segura para salvar agenda vazia
    function safeScheduleSave() {
      try {
        console.log('Tentando salvar agenda vazia...');
        void scheduleService.saveScheduleToFirebase({});
      } catch (e) {
        console.error('Erro ao salvar agenda vazia:', e);
      }
    }
    
    // Carregar a agenda de forma segura
    try {
      console.log('Tentando carregar agenda do Firebase...');
      
      const scheduleResult = await scheduleService.loadScheduleFromFirebase();
      
      if (scheduleResult && scheduleResult !== null) {
        console.log('Agenda carregada com sucesso');
        set({ schedule: scheduleResult });
      } else {
        console.log('Agenda nula retornada, mantendo vazia');
        safeScheduleSave();
      }
    } catch (e) {
      console.error('Erro ao carregar agenda:', e);
      safeScheduleSave();
    }
    
    // Carregar usuários de forma segura
    try {
      console.log('Tentando carregar usuários do Firebase...');
      
      const userResults = await authService.getAllUsers();
      
      if (userResults && Array.isArray(userResults) && userResults.length > 0) {
        console.log(`${userResults.length} usuários carregados`);
        
        const userData = userResults.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          password: '',
          country: user.country,
          age: user.age.toString(),
          relationshipStatus: user.relationshipStatus,
          phone: user.phone,
          arrivalDate: user.arrivalDate,
          departureDate: user.departureDate,
          gender: user.gender,
          isAuthenticated: true,
          role: user.role,
          points: user.points
        }));
        
        set({ users: userData });
      } else {
        console.log('Nenhum usuário encontrado, mantendo padrões');
      }
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
    }

    // Carregar eventos de forma segura
    try {
      console.log('Tentando carregar eventos do Firebase...');
      
      // Verificação de eventos
      console.log('1. Iniciando carregamento de eventos');
      const events = await eventService.loadEventsFromFirebase();
      console.log('2. Resposta recebida do loadEventsFromFirebase');
      
      if (events && Array.isArray(events)) {
        console.log(`3. Array de eventos válido com ${events.length} eventos`);
        
        if (events.length > 0) {
          console.log('4. Atualizando estado com eventos carregados');
          set({ events });
          console.log('5. Estado atualizado com sucesso');
        } else {
          console.log('4. Nenhum evento encontrado (array vazio)');
          set({ events: [] });
        }
      } else {
        console.error('3. ERRO: Resposta inválida do loadEventsFromFirebase:', events);
        set({ events: [] });
      }
    } catch (e) {
      console.error('ERRO crítico ao carregar eventos:', e);
      set({ events: [] });
    }

    // Carregar tarefas de forma segura
    try {
      console.log('Tentando carregar tarefas do Firebase...');
      
      // Verificação de tarefas
      console.log('1. Iniciando carregamento de tarefas');
      const tasks = await taskService.loadTasksFromFirebase();
      console.log('2. Resposta recebida do loadTasksFromFirebase');
      
      if (tasks && Array.isArray(tasks)) {
        console.log(`3. Array de tarefas válido com ${tasks.length} tarefas`);
        
        if (tasks.length > 0) {
          console.log('4. Atualizando estado com tarefas carregadas');
          set({ tasks });
          console.log('5. Estado atualizado com sucesso');
        } else {
          console.log('4. Nenhuma tarefa encontrada (array vazio)');
          set({ tasks: [] });
        }
      } else {
        console.error('3. ERRO: Resposta inválida do loadTasksFromFirebase:', tasks);
        set({ tasks: [] });
      }
    } catch (e) {
      console.error('ERRO crítico ao carregar tarefas:', e);
      set({ tasks: [] });
    }

    // Carregar mensagens de forma segura
    try {
      console.log('Tentando carregar mensagens do Firebase...');
      
      // Verificação de mensagens
      console.log('1. Iniciando carregamento de mensagens');
      const messages = await messageService.loadMessagesFromFirebase();
      console.log('2. Resposta recebida do loadMessagesFromFirebase');
      
      if (messages && Array.isArray(messages)) {
        console.log(`3. Array de mensagens válido com ${messages.length} mensagens`);
        
        if (messages.length > 0) {
          console.log('4. Atualizando estado com mensagens carregadas');
          set({ messages });
          console.log('5. Estado atualizado com sucesso');
        } else {
          console.log('4. Nenhuma mensagem encontrada (array vazio)');
          set({ messages: [] });
        }
      } else {
        console.error('3. ERRO: Resposta inválida do loadMessagesFromFirebase:', messages);
        // Mantenha mensagens vazias para segurança
        set({ messages: [] });
      }
    } catch (e) {
      console.error('ERRO crítico ao carregar mensagens:', e);
      // Em caso de erro, garantir que o estado tem pelo menos um array vazio
      set({ messages: [] });
    }
  },
  
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  
  setLanguage: (language) => set({ language }),
  
  // Apenas para compatibilidade - será removido depois que a autenticação do Firebase estiver completa
  login: (email, password) => {
    // Todo o processo de login agora é feito pelo Firebase
    return true;
  },
  
  // Apenas para compatibilidade - será removido depois que a autenticação do Firebase estiver completa
  register: (userData) => {
    // Todo o processo de registro agora é feito pelo Firebase
    return true;
  },
  
  logout: () => {
    set({ user: null });
  },
  
  setUser: (user: User | null) => {
    if (user) {
      // Converte o usuário do Firebase para o formato da aplicação
      const appUser: UserData = {
        id: user.id,
        email: user.email,
        name: user.name,
        password: '', // A senha não é armazenada no cliente
        country: user.country,
        age: user.age.toString(),
        relationshipStatus: user.relationshipStatus,
        phone: user.phone,
        arrivalDate: user.arrivalDate,
        departureDate: user.departureDate,
        gender: user.gender,
        isAuthenticated: true,
        role: user.role,
        points: user.points
      };
      
      set({ user: appUser });
      
      // Atualiza a lista de usuários se este usuário não existir
      const users = get().users;
      if (!users.some(u => u.id === user.id)) {
        set({ users: [...users, appUser] });
      } else {
        // Atualiza o usuário existente
        set({
          users: users.map(u => 
            u.id === user.id ? appUser : u
          )
        });
      }
    } else {
      set({ user: null });
    }
  },
  
  setUsers: (users) => {
    const { user } = get();
    
    console.log(`Atualizando lista de ${users.length} usuários no store`);
    
    if (user) {
      // Garante que o usuário atual esteja incluído na lista
      const userExists = users.some(u => u.id === user.id);
      
      if (!userExists) {
        // Adiciona o usuário atual à lista
        users.push(user);
        console.log('Usuário atual adicionado à lista de usuários');
      } else {
        // Substitui o usuário atual pelos dados da lista para garantir sincronização
        const updatedUsers = users.map(u => {
          if (u.id === user.id) {
            return {
              ...u,
              role: user.role // Mantém o papel atual do usuário
            };
          }
          return u;
        });
        
        set({ users: updatedUsers });
        return;
      }
    }
    
    // Se não há usuário atual ou se já foi tratado acima
    set({ users });
  },
  
  makeAdmin: (userId) => {
    const { user } = get();
    
    // Apenas administradores podem fazer outros usuários administradores
    if (user?.role !== 'admin') {
      // No caso do botão de auto-promoção, permitir para qualquer usuário
      if (userId === user?.id) {
        try {
          // Chamar a função do serviço de autenticação
          authService.makeAdmin(userId)
            .then(success => {
              if (success) {
                set({
                  users: get().users.map(u => {
                    if (u.id === userId) {
                      return { ...u, role: 'admin' };
                    }
                    return u;
                  }),
                  user: user ? { ...user, role: 'admin' } : null
                });
              }
            });
          return true;
        } catch (error) {
          console.error('Error making user admin:', error);
          return false;
        }
      }
      return false;
    }
    
    try {
      authService.makeAdmin(userId)
        .then(success => {
          if (success) {
            set({
              users: get().users.map(u => {
                if (u.id === userId) {
                  return { ...u, role: 'admin' };
                }
                return u;
              })
            });
          }
        });
      return true;
    } catch (error) {
      console.error('Error making user admin:', error);
      return false;
    }
  },
  
  removeAdmin: (userId) => {
    const { user, users } = get();
    if (!user || user.role !== 'admin') {
      return false;
    }
    // Prevent admin from removing their own admin role
    if (userId === user.id) {
      return false;
    }
    // Ensure we can't remove the last admin
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      return false;
    }

    set(state => ({
      users: state.users.map(u => 
        u.id === userId ? { ...u, role: 'user' } : u
      )
    }));
    return true;
  },
  
  updateUserPoints: (points) => {
    const { user, users } = get();
    if (user) {
      const updatedUser = { ...user, points: user.points + points };
      set({
        user: updatedUser,
        users: users.map(u => u.id === user.id ? updatedUser : u)
      });
    }
  },
  
  assignShift: (date, shift, volunteerId) => {
    set(state => {
      // Atualização local imediata para a UI
      const currentShift = Array.isArray(state.schedule[date]?.[shift]) 
        ? state.schedule[date][shift] 
        : [];
        
      if (currentShift.includes(volunteerId)) {
        return state; // Volunteer already assigned
      }
      
      const newSchedule = {
        ...state.schedule,
        [date]: {
          ...state.schedule[date],
          [shift]: [...currentShift, volunteerId]
        }
      };
      
      // Atualização local para efeito imediato na UI
      const result = { schedule: newSchedule };
      
      // Salva no Firebase usando o serviço dedicado
      (async () => {
        try {
          console.log(`Solicitando atribuição de turno via serviço: ${date}, ${shift}, ${volunteerId}`);
          const updatedSchedule = await scheduleService.assignShiftToFirebase(
            date,
            shift,
            volunteerId,
            state.schedule
          );
          
          if (!updatedSchedule) {
            console.error('Falha ao atribuir turno no Firebase - atualizando estado com valores originais');
            // Se falhar, tenta reverter ao estado original
            set(state => ({ schedule: state.schedule }));
          } else {
            console.log('Turno atribuído com sucesso no Firebase');
          }
        } catch (error) {
          console.error('Erro crítico ao atribuir turno no Firebase:', error);
        }
      })();
      
      return result;
    });
  },
  
  removeShift: (date, shift, volunteerId) => {
    set(state => {
      // Cria uma cópia local do schedule para atualização imediata da UI
      const newSchedule = { ...state.schedule };
      if (newSchedule[date]) {
        const currentShift = Array.isArray(newSchedule[date][shift]) 
          ? newSchedule[date][shift] 
          : [];
          
        if (volunteerId) {
          // Remove specific volunteer
          newSchedule[date][shift] = currentShift.filter(id => id !== volunteerId);
          if (newSchedule[date][shift].length === 0) {
            delete newSchedule[date][shift];
          }
        } else {
          // Remove entire shift
          delete newSchedule[date][shift];
        }
        if (Object.keys(newSchedule[date]).length === 0) {
          delete newSchedule[date];
        }
      }
      
      // Atualiza o estado local imediatamente
      const result = { schedule: newSchedule };
      
      // Usa o serviço dedicado para persistir no Firebase de forma assíncrona
      (async () => {
        try {
          console.log('Iniciando processo de remoção no Firebase:', { date, shift, volunteerId });
          const updatedSchedule = await scheduleService.removeShiftFromFirebase(
            date,
            shift,
            volunteerId,
            state.schedule
          );
          
          if (!updatedSchedule) {
            console.error('Falha ao remover turno no Firebase - atualizando estado com valores originais');
            // Se falhar, revertemos ao estado original no próximo ciclo
            set(state => ({ schedule: state.schedule }));
          } else {
            console.log('Turno removido com sucesso no Firebase');
          }
        } catch (error) {
          console.error('Erro crítico ao remover turno do Firebase:', error);
        }
      })();
      
      return result;
    });
  },
  
  addStaff: (staffData) => {
    const { user, users } = get();
    if (!user || user.role !== 'admin') {
      return false;
    }
    if (users.some(u => u.email === staffData.email)) {
      return false;
    }
    
    // Create ID for new staff
    const newUserId = crypto.randomUUID();
    
    const newStaff = {
      ...staffData,
      id: newUserId,
      isAuthenticated: true,
      role: 'user' as const,
      points: 0
    };
    
    // Update local state
    set(state => ({
      users: [...state.users, newStaff]
    }));
    
    // Save to Firebase
    try {
      console.log('Registrando novo colaborador no Firebase:', staffData.email);
      
      // Preparando os dados para registro
      const registrationData = {
        email: staffData.email,
        password: staffData.password,
        name: staffData.name,
        country: staffData.country || '',
        age: staffData.age || '0',
        relationshipStatus: (staffData.relationshipStatus as 'single' | 'dating' | 'married') || 'single',
        gender: (staffData.gender as 'male' | 'female' | 'other') || 'other',
        phone: staffData.phone || '',
        arrivalDate: staffData.arrivalDate || '',
        departureDate: staffData.departureDate || ''
      };
      
      // Register staff without affecting current auth state
      // Usando async/await com try/catch para tratamento de erros
      (async () => {
        try {
          const registeredUser = await authService.registerStaffOnly(registrationData);
          
          if (registeredUser) {
            console.log('Colaborador registrado com sucesso:', registeredUser.id);
            
            // Atualiza o estado com o ID correto do Firebase
            set(state => ({
              users: state.users.map(u => 
                u.email === staffData.email 
                  ? { ...u, id: registeredUser.id }
                  : u
              )
            }));
          } else {
            console.error('Falha ao registrar colaborador - removendo do estado local');
            
            // Remove do estado local se o registro falhou
            set(state => ({
              users: state.users.filter(u => u.email !== staffData.email)
            }));
          }
        } catch (error) {
          console.error('Erro ao registrar colaborador:', error);
          
          // Remove do estado local em caso de erro
          set(state => ({
            users: state.users.filter(u => u.email !== staffData.email)
          }));
        }
      })();
    } catch (error) {
      console.error('Erro grave ao salvar colaborador no Firebase:', error);
      return false;
    }
    
    return true;
  },
  
  updateStaff: (id, staffData) => {
    const { user, users } = get();
    if (!user || user.role !== 'admin') {
      return false;
    }
    const existingUser = users.find(u => u.email === staffData.email && u.id !== id);
    if (existingUser) {
      return false;
    }
    
    // Update in state
    set(state => ({
      users: state.users.map(u =>
        u.id === id
          ? { ...u, ...staffData }
          : u
      )
    }));
    
    // Update in Firebase - convert data types to match User type
    const firebaseData: Partial<User> = {
      name: staffData.name,
      email: staffData.email,
      country: staffData.country,
      age: staffData.age ? parseInt(staffData.age) : 0,
      phone: staffData.phone,
      arrivalDate: staffData.arrivalDate,
      departureDate: staffData.departureDate,
      gender: staffData.gender as 'male' | 'female' | 'other',
      relationshipStatus: staffData.relationshipStatus as 'single' | 'dating' | 'married'
    };
    
    // Use void operator to explicitly ignore the Promise return value
    authService.updateUserProfile(id, firebaseData)
      .catch(error => {
        console.error('Error updating user in Firebase:', error);
      });
    
    return true;
  },
  
  removeStaff: (id) => {
    const { user, users } = get();
    if (!user || user.role !== 'admin') {
      return false;
    }
    // Prevent admin from deleting themselves
    if (id === user.id) {
      return false;
    }
    // Prevent deleting the last admin
    const targetUser = users.find(u => u.id === id);
    if (targetUser?.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return false;
      }
    }
    
    // Update state
    set(state => ({
      users: state.users.filter(u => u.id !== id)
    }));
    
    // Delete from Firebase
    try {
      void authService.deleteUser(id)
        .catch(error => {
          console.error('Error deleting user from Firebase:', error);
        });
    } catch (error) {
      console.error('Error calling deleteUser:', error);
    }
    
    return true;
  },
  
  // Task management functions
  addTask: (taskData) => {
    const { user } = get();
    if (!user) return;

    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'todo',
      comments: [],
      checklist: [],
      createdBy: user.id,
      type: taskData.isPrivate ? 'personal' : 'hostel'
    };

    // Primeiro atualiza o estado local para feedback imediato
    set(state => ({
      tasks: [...state.tasks, newTask]
    }));
    
    // Depois salva no Firebase de forma assíncrona
    try {
      void taskService.saveTaskToFirebase(newTask)
        .catch(error => {
          console.error('Erro ao salvar tarefa no Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar saveTaskToFirebase:', error);
    }
  },
  
  updateTask: (taskId, updates) => {
    console.log('Updating task:', { taskId, updates });
    
    // Primeiro atualiza o estado local para feedback imediato
    set(state => {
      const updatedTasks = state.tasks.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              ...updates,
              assignedTo: updates.assignedTo || task.assignedTo || []
            }
          : task
      );
      
      console.log('Updated tasks:', updatedTasks);
      return { tasks: updatedTasks };
    });
    
    // Depois atualiza no Firebase de forma assíncrona
    try {
      void taskService.updateTaskInFirebase(taskId, updates)
        .catch(error => {
          console.error('Erro ao atualizar tarefa no Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar updateTaskInFirebase:', error);
    }
  },
  
  deleteTask: (taskId) => {
    const { tasks } = get();
    const taskToDelete = tasks.find(task => task.id === taskId);
    
    if (!taskToDelete) {
      console.log(`Tarefa ${taskId} não encontrada para exclusão`);
      return;
    }
    
    // Primeiro atualiza o estado local para feedback imediato
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== taskId)
    }));
    
    // Depois exclui do Firebase de forma assíncrona
    try {
      // Marca a tarefa como excluída antes de excluí-la definitivamente
      const markedTask = {
        ...taskToDelete,
        deleted: true,
        title: `[DELETED] ${taskToDelete.title}`
      };
      
      // Atualiza a tarefa como excluída e depois a exclui definitivamente
      void taskService.updateTaskInFirebase(taskId, markedTask)
        .then(() => {
          return taskService.deleteTaskFromFirebase(taskId);
        })
        .catch(error => {
          console.error('Erro ao excluir tarefa do Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar deleteTaskFromFirebase:', error);
    }
  },
  
  deleteAllTasks: async () => {
    const { user } = get();
    if (!user || user.role !== 'admin') {
      console.error('Apenas administradores podem excluir todas as tarefas');
      return false;
    }
    
    try {
      console.log('Iniciando exclusão de todas as tarefas...');
      
      // Primeiro atualiza o estado local para feedback imediato
      set({ tasks: [] });
      
      // Depois exclui todas as tarefas do Firebase
      const success = await taskService.deleteAllTasks();
      
      console.log(`Exclusão de todas as tarefas ${success ? 'concluída com sucesso' : 'falhou'}`);
      return success;
    } catch (error) {
      console.error('Erro ao excluir todas as tarefas:', error);
      
      // Recarrega as tarefas do Firebase para sincronizar o estado
      try {
        const tasks = await taskService.loadTasksFromFirebase();
        if (Array.isArray(tasks)) {
          set({ tasks });
        }
      } catch (loadError) {
        console.error('Erro ao recarregar tarefas após falha na exclusão:', loadError);
      }
      
      return false;
    }
  },
  
  // Adicionar função para excluir todos os eventos
  deleteAllEvents: async () => {
    const { user } = get();
    if (!user || user.role !== 'admin') {
      console.error('Apenas administradores podem excluir todos os eventos');
      return false;
    }
    
    try {
      console.log('Iniciando exclusão de todos os eventos...');
      
      // Primeiro atualiza o estado local para feedback imediato
      set({ events: [] });
      
      // Depois exclui todos os eventos do Firebase
      const success = await eventService.deleteAllEvents();
      
      console.log(`Exclusão de todos os eventos ${success ? 'concluída com sucesso' : 'falhou'}`);
      return success;
    } catch (error) {
      console.error('Erro ao excluir todos os eventos:', error);
      
      // Recarrega os eventos do Firebase para sincronizar o estado
      try {
        const events = await eventService.loadEventsFromFirebase();
        if (Array.isArray(events)) {
          set({ events });
        }
      } catch (loadError) {
        console.error('Erro ao recarregar eventos após falha na exclusão:', loadError);
      }
      
      return false;
    }
  },
  
  cleanupDeletedTasks: async () => {
    const { user } = get();
    if (!user || user.role !== 'admin') {
      console.error('Apenas administradores podem limpar tarefas excluídas');
      return false;
    }
    
    try {
      console.log('Iniciando limpeza de tarefas excluídas...');
      
      // Executa a limpeza no Firebase
      const success = await taskService.cleanupDeletedTasks();
      
      // Recarrega as tarefas para atualizar o estado
      if (success) {
        const tasks = await taskService.loadTasksFromFirebase();
        if (Array.isArray(tasks)) {
          set({ tasks });
          console.log('Estado atualizado após limpeza de tarefas excluídas');
        }
      }
      
      console.log(`Limpeza de tarefas excluídas ${success ? 'concluída com sucesso' : 'falhou'}`);
      return success;
    } catch (error) {
      console.error('Erro ao limpar tarefas excluídas:', error);
      return false;
    }
  },
  
  moveTask: (taskId, newStatus) => {
    const { tasks, user, updateUserPoints } = get();
    const task = tasks.find(t => t.id === taskId);
    
    if (task && newStatus === 'done' && task.status !== 'done' && task.type === 'hostel') {
      updateUserPoints(task.points);
    }
    
    // Primeiro atualiza o estado local para feedback imediato
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    }));
    
    // Depois atualiza no Firebase de forma assíncrona
    try {
      void taskService.updateTaskInFirebase(taskId, { status: newStatus })
        .catch(error => {
          console.error('Erro ao atualizar status da tarefa no Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar updateTaskInFirebase:', error);
    }
  },
  
  assignTask: (taskId, userIds) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, assignedTo: userIds }
          : task
      )
    }));
  },
  
  addTaskComment: (taskId, content) => {
    const { user } = get();
    if (!user) return;

    const newComment: TaskComment = {
      id: crypto.randomUUID(),
      userId: user.id,
      content,
      createdAt: new Date().toISOString()
    };

    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, comments: [...(task.comments || []), newComment] }
          : task
      )
    }));
  },
  
  deleteTaskComment: (taskId, commentId) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, comments: task.comments?.filter(c => c.id !== commentId) || [] }
          : task
      )
    }));
  },
  
  addTaskChecklistItem: (taskId, content) => {
    const newItem: TaskChecklistItem = {
      id: crypto.randomUUID(),
      content,
      completed: false
    };

    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, checklist: [...(task.checklist || []), newItem] }
          : task
      )
    }));
  },
  
  toggleTaskChecklistItem: (taskId, itemId) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              checklist: task.checklist?.map(item =>
                item.id === itemId
                  ? { ...item, completed: !item.completed }
                  : item
              ) || []
            }
          : task
      )
    }));
  },
  
  deleteTaskChecklistItem: (taskId, itemId) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, checklist: task.checklist?.filter(item => item.id !== itemId) || [] }
          : task
      )
    }));
  },
  
  addTaskTag: (taskId, tag) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, tags: [...new Set([...(task.tags || []), tag])] }
          : task
      )
    }));
  },
  
  removeTaskTag: (taskId, tag) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, tags: task.tags?.filter(t => t !== tag) || [] }
          : task
      )
    }));
  },
  
  // Event management functions
  addEvent: (eventData) => {
    const { user } = get();
    if (!user) return;

    const newEvent: Event = {
      ...eventData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'upcoming',
      attendees: [],
      organizer: user.id
    };

    // Atualizar o estado local
    set(state => ({
      events: [...state.events, newEvent]
    }));

    // Persistir no Firebase
    try {
      void eventService.saveEventToFirebase(newEvent)
        .catch(error => {
          console.error('Erro ao salvar evento no Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar saveEventToFirebase:', error);
    }
  },
  
  updateEvent: (eventId, updates) => {
    // Atualizar o estado local
    set(state => ({
      events: state.events.map(event =>
        event.id === eventId
          ? { ...event, ...updates }
          : event
      )
    }));

    // Persistir no Firebase
    try {
      void eventService.updateEventInFirebase(eventId, updates)
        .catch(error => {
          console.error('Erro ao atualizar evento no Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar updateEventInFirebase:', error);
    }
  },
  
  deleteEvent: async (eventId) => {
    try {
      console.log(`Iniciando exclusão do evento ${eventId}...`);
      
      // Primeiro atualiza o estado local para feedback imediato
      set(state => ({
        events: state.events.filter(event => event.id !== eventId)
      }));
      
      // Depois exclui o evento do Firebase
      const success = await eventService.deleteEventFromFirebase(eventId);
      
      console.log(`Exclusão do evento ${eventId} ${success ? 'concluída com sucesso' : 'falhou'}`);
      
      return success;
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      return false;
    }
  },
  
  joinEvent: (eventId, userId) => {
    // Atualizar o estado local
    set(state => ({
      events: state.events.map(event =>
        event.id === eventId && !event.attendees.includes(userId)
          ? { ...event, attendees: [...event.attendees, userId] }
          : event
      )
    }));

    // Persistir no Firebase
    try {
      void eventService.addAttendeeToEvent(eventId, userId)
        .catch(error => {
          console.error('Erro ao adicionar participante no Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar addAttendeeToEvent:', error);
    }
  },
  
  leaveEvent: (eventId, userId) => {
    // Atualizar o estado local
    set(state => ({
      events: state.events.map(event =>
        event.id === eventId
          ? { ...event, attendees: event.attendees.filter(id => id !== userId) }
          : event
      )
    }));

    // Persistir no Firebase
    try {
      void eventService.removeAttendeeFromEvent(eventId, userId)
        .catch(error => {
          console.error('Erro ao remover participante do Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar removeAttendeeFromEvent:', error);
    }
  },
  
  cancelEvent: (eventId) => {
    // Atualizar o estado local
    set(state => ({
      events: state.events.map(event =>
        event.id === eventId
          ? { ...event, status: 'cancelled' }
          : event
      )
    }));

    // Persistir no Firebase
    try {
      void eventService.cancelEventInFirebase(eventId)
        .catch(error => {
          console.error('Erro ao cancelar evento no Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar cancelEventInFirebase:', error);
    }
  },
  
  addMessage: (content: string, attachments?: string[]) => {
    const { user } = get();
    if (!user) return;

    // Cria um ID único para a mensagem
    const messageId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Cria o objeto da mensagem
    const newMessage = {
      id: messageId,
      userId: user.id,
      content,
      createdAt: timestamp,
      attachments,
      reactions: {},
      read: [user.id] // creator has read the message
    };

    console.log('Criando nova mensagem:', newMessage);

    // Primeiro atualiza o estado local para feedback imediato
    set(state => ({
      messages: [...state.messages, newMessage]
    }));

    // Então persiste no Firebase, garantindo que qualquer erro seja tratado
    (async () => {
      try {
        console.log('Salvando mensagem no Firebase...');
        const result = await messageService.addMessageToFirebase(newMessage);
        
        if (!result) {
          console.error('Firebase retornou falha ao salvar mensagem');
          // Se falhar no Firebase, considere remover do estado local
          // ou tente novamente, dependendo da estratégia de consistência
        } else {
          console.log('Mensagem salva com sucesso no Firebase');
          
          // Opcionalmente, atualize o estado com os dados do Firebase para maior consistência
          // Isso pode ser útil se o servidor aplicar alguma transformação
          const updatedMessages = await messageService.loadMessagesFromFirebase();
          if (updatedMessages.length > 0) {
            set({ messages: updatedMessages });
            console.log('Estado de mensagens atualizado após salvar.');
          }
        }
      } catch (error) {
        console.error('Erro ao salvar mensagem no Firebase:', error);
        // Considere mostrar uma notificação para o usuário
      }
    })();
  },
  
  deleteMessage: (messageId: string) => {
    const { user } = get();
    if (!user || user.role !== 'admin') return;

    // Atualiza o estado local
    set(state => ({
      messages: state.messages.filter(msg => msg.id !== messageId)
    }));

    // Exclui do Firebase
    try {
      void messageService.deleteMessageFromFirebase(messageId)
        .catch(error => {
          console.error('Erro ao excluir mensagem do Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar deleteMessageFromFirebase:', error);
    }
  },
  
  clearAllMessages: () => {
    const { user } = get();
    if (!user || user.role !== 'admin') return;

    // Atualiza o estado local
    set(state => ({
      messages: []
    }));

    // Exclui todas do Firebase
    try {
      void messageService.clearAllMessagesFromFirebase()
        .catch(error => {
          console.error('Erro ao limpar todas as mensagens do Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar clearAllMessagesFromFirebase:', error);
    }
  },
  
  addReaction: (messageId: string, emoji: string) => {
    const { user } = get();
    if (!user) return;

    // Atualiza o estado local
    set(state => ({
      messages: state.messages.map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || {};
          const users = reactions[emoji] || [];
          if (!users.includes(user.id)) {
            return {
              ...msg,
              reactions: {
                ...reactions,
                [emoji]: [...users, user.id]
              }
            };
          }
        }
        return msg;
      })
    }));

    // Persiste no Firebase
    try {
      void messageService.addReactionToMessage(messageId, emoji, user.id)
        .catch(error => {
          console.error('Erro ao adicionar reação no Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar addReactionToMessage:', error);
    }
  },
  
  removeReaction: (messageId: string, emoji: string) => {
    const { user } = get();
    if (!user) return;

    // Atualiza o estado local
    set(state => ({
      messages: state.messages.map(msg => {
        if (msg.id === messageId && msg.reactions?.[emoji]) {
          const reactions = { ...msg.reactions };
          reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
          return { ...msg, reactions };
        }
        return msg;
      })
    }));

    // Persiste no Firebase
    try {
      void messageService.removeReactionFromMessage(messageId, emoji, user.id)
        .catch(error => {
          console.error('Erro ao remover reação do Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar removeReactionFromMessage:', error);
    }
  },
  
  markMessageAsRead: (messageId: string) => {
    const { user } = get();
    if (!user) return;

    // Atualiza o estado local
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === messageId && !msg.read.includes(user.id)
          ? {
              ...msg,
              read: [...msg.read, user.id]
            }
          : msg
      )
    }));

    // Persiste no Firebase
    try {
      void messageService.markMessageAsRead(messageId, user.id)
        .catch(error => {
          console.error('Erro ao marcar mensagem como lida no Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar markMessageAsRead:', error);
    }
  },
  
  markAllMessagesAsRead: () => {
    const { user } = get();
    if (!user) return;

    // Atualiza o estado local
    set(state => ({
      messages: state.messages.map(msg =>
        !msg.read.includes(user.id)
          ? {
              ...msg,
              read: [...msg.read, user.id]
            }
          : msg
      )
    }));

    // Persiste no Firebase
    try {
      void messageService.markAllMessagesAsRead(user.id)
        .catch(error => {
          console.error('Erro ao marcar todas mensagens como lidas no Firebase:', error);
        });
    } catch (error) {
      console.error('Erro ao chamar markAllMessagesAsRead:', error);
    }
  },
  
  // Settings state
  settings: defaultSettings,
  setSettings: (settings) => set({ settings }),
  
  // System state
  systemSettings: defaultSystemSettings,
  setSystemSettings: (systemSettings) => set({ systemSettings }),
  
  // Funções para gerenciamento de fotos
  approveTaskPhoto: async (taskId: string, adminId: string) => {
    try {
      const success = await approveTaskPhoto(taskId, adminId);
      if (success) {
        // Atualizar a tarefa no estado com a foto aprovada
        const tasks = [...get().tasks];
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
          const task = tasks[taskIndex];
          if (task.photo) {
            tasks[taskIndex] = {
              ...task,
              photo: {
                ...task.photo,
                approved: true,
                approvedBy: adminId,
                approvedAt: new Date().toISOString()
              }
            };
            
            set({ tasks });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao aprovar foto:', error);
    }
  },
  
  rejectTaskPhoto: async (taskId: string) => {
    try {
      const success = await rejectTaskPhoto(taskId);
      if (success) {
        // Atualizar a tarefa no estado removendo a foto
        const tasks = [...get().tasks];
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
          tasks[taskIndex] = {
            ...tasks[taskIndex],
            photo: undefined
          };
          
          set({ tasks });
        }
      }
    } catch (error) {
      console.error('Erro ao rejeitar foto:', error);
    }
  }
}));