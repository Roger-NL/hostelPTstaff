import { create } from 'zustand';
import type { Schedule, ShiftTime, UserData, Task, TaskComment, TaskChecklistItem, Event, Message, UserSettings, SystemSettings, User } from '../types';
import * as authService from '../services/auth.service';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import * as scheduleService from '../services/schedule.service';
import * as messageService from '../services/message.service';
import * as eventService from '../services/event.service';
import { collection, getDocs } from 'firebase/firestore';

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
}

// Create some default users for testing
const defaultUsers: UserData[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'admin',
    country: 'Portugal',
    age: '30',
    relationshipStatus: 'single',
    phone: '+351123456789',
    arrivalDate: '2024-03-01',
    departureDate: '2024-09-01',
    gender: 'other',
    isAuthenticated: true,
    role: 'admin',
    points: 100
  },
  {
    id: '2',
    email: 'john@example.com',
    name: 'John Doe',
    password: 'password',
    country: 'USA',
    age: '25',
    relationshipStatus: 'single',
    phone: '+1234567890',
    arrivalDate: '2024-03-01',
    departureDate: '2024-08-31',
    gender: 'male',
    isAuthenticated: true,
    role: 'user',
    points: 50
  },
  {
    id: '3',
    email: 'jane@example.com',
    name: 'Jane Smith',
    password: 'password',
    country: 'UK',
    age: '28',
    relationshipStatus: 'married',
    phone: '+4412345678',
    arrivalDate: '2024-03-15',
    departureDate: '2024-09-15',
    gender: 'female',
    isAuthenticated: true,
    role: 'user',
    points: 75
  },
  {
    id: '4',
    email: 'maria@example.com',
    name: 'Maria Silva',
    password: 'maria123',
    country: 'Brasil',
    age: '23',
    relationshipStatus: 'single',
    phone: '+5511987654321',
    arrivalDate: '2024-03-20',
    departureDate: '2024-06-20',
    gender: 'female',
    isAuthenticated: true,
    role: 'user',
    points: 0
  }
];

// Create some default tasks for testing
const defaultTasks: Task[] = [
  {
    id: '1',
    title: 'Clean the kitchen',
    description: 'Sweep and mop the floor, clean counters',
    points: 10,
    status: 'todo',
    createdAt: new Date().toISOString(),
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    assignedTo: ['2'],
    comments: [],
    checklist: [
      { id: '1', content: 'Sweep floor', completed: false },
      { id: '2', content: 'Mop floor', completed: false },
      { id: '3', content: 'Clean counters', completed: true }
    ],
    tags: ['cleaning', 'kitchen'],
    type: 'hostel',
    createdBy: '1'
  },
  {
    id: '2',
    title: 'Check-in new guests',
    description: 'Welcome new guests and show them around',
    points: 15,
    status: 'inProgress',
    createdAt: new Date().toISOString(),
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    assignedTo: ['2', '3'],
    comments: [
      {
        id: '1',
        userId: '1',
        content: 'Make sure to show them the beach access',
        createdAt: new Date().toISOString()
      }
    ],
    checklist: [],
    tags: ['guests', 'reception'],
    type: 'hostel',
    createdBy: '1'
  },
  {
    id: '3',
    title: 'Buy groceries',
    description: 'Personal shopping list for the week',
    points: 0,
    status: 'todo',
    createdAt: new Date().toISOString(),
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    checklist: [
      { id: '1', content: 'Milk', completed: false },
      { id: '2', content: 'Bread', completed: false },
      { id: '3', content: 'Eggs', completed: false }
    ],
    tags: ['shopping', 'personal'],
    type: 'personal',
    createdBy: '1',
    isPrivate: true
  }
];

// Create some default events for testing
const defaultEvents: Event[] = [
  {
    id: '1',
    title: 'Beach Volleyball Tournament',
    description: 'Join us for a fun beach volleyball tournament! All skill levels welcome.',
    startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000 + 3600000 * 4).toISOString(),
    location: 'Carcavelos Beach - Volleyball Courts',
    type: 'activity',
    status: 'upcoming',
    capacity: 24,
    attendees: ['2', '3'],
    organizer: '1',
    createdAt: new Date().toISOString(),
    tags: ['sports', 'volleyball', 'tournament']
  },
  {
    id: '2',
    title: 'Welcome Dinner',
    description: 'Welcome dinner for new volunteers. Come meet your fellow volunteers!',
    startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 2 * 86400000 + 3600000 * 3).toISOString(),
    location: 'Community Kitchen',
    type: 'invitation',
    status: 'upcoming',
    capacity: 30,
    attendees: ['2'],
    organizer: '1',
    createdAt: new Date().toISOString(),
    tags: ['social', 'dinner', 'welcome']
  }
];

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
    
    // Inicializar com valores padrão
    set({ 
      schedule: {},
      users: defaultUsers
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
      
      // Tenta carregar eventos existentes
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
          console.log('4. Nenhum evento encontrado, salvando eventos padrão no Firebase');
          
          // Verificar se já tem documentos na coleção
          const eventsCollection = collection(firestore, 'events');
          const eventsSnapshot = await getDocs(eventsCollection);
          
          if (eventsSnapshot.empty) {
            // Se não houver eventos no Firebase, salvar os eventos padrão
            const eventsToSave = JSON.parse(JSON.stringify(defaultEvents));
            
            // Primeiro atualiza o estado local
            set({ events: eventsToSave });
            
            // Depois salva cada evento no Firebase de forma confiável
            console.log('5. Salvando eventos padrão no Firebase...');
            let successCount = 0;
            
            for (const event of eventsToSave) {
              try {
                const saved = await eventService.saveEventToFirebase(event);
                if (saved) {
                  successCount++;
                  console.log(`Evento padrão ${event.id} salvo com sucesso (${successCount}/${eventsToSave.length})`);
                } else {
                  console.error(`Falha ao salvar evento padrão ${event.id}`);
                }
              } catch (error) {
                console.error(`Erro ao salvar evento padrão ${event.id}:`, error);
              }
            }
            
            console.log(`6. ${successCount}/${eventsToSave.length} eventos padrão salvos no Firebase`);
            
            // Recarrega os eventos para garantir sincronização
            if (successCount > 0) {
              console.log('7. Recarregando eventos para garantir sincronização');
              const refreshedEvents = await eventService.loadEventsFromFirebase();
              if (refreshedEvents && refreshedEvents.length > 0) {
                set({ events: refreshedEvents });
                console.log(`8. Estado atualizado com ${refreshedEvents.length} eventos recarregados`);
              }
            }
          } else {
            console.log('A coleção de eventos existe, mas não retornou dados. Mantendo estado vazio.');
            set({ events: [] });
          }
        }
      } else {
        console.error('3. ERRO: Resposta inválida do loadEventsFromFirebase:', events);
        // Mantenha eventos padrão para segurança
        set({ events: defaultEvents });
      }
    } catch (e) {
      console.error('ERRO crítico ao carregar eventos:', e);
      // Em caso de erro, garantir que o estado tem pelo menos os eventos padrão
      set({ events: defaultEvents });
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

    set(state => ({
      tasks: [...state.tasks, newTask]
    }));
  },
  
  updateTask: (taskId, updates) => {
    console.log('Updating task:', { taskId, updates });
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
  },
  
  deleteTask: (taskId) => {
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== taskId)
    }));
  },
  
  moveTask: (taskId, newStatus) => {
    const { tasks, user, updateUserPoints } = get();
    const task = tasks.find(t => t.id === taskId);
    
    if (task && newStatus === 'done' && task.status !== 'done' && task.type === 'hostel') {
      updateUserPoints(task.points);
    }
    
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    }));
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
  
  deleteEvent: (eventId) => {
    console.log(`Iniciando exclusão do evento ${eventId}`);
    
    // Guarda uma cópia do estado atual para possível restauração
    const currentEvents = [...get().events];
    
    // Primeiro atualiza o estado local para feedback imediato ao usuário
    set(state => ({
      events: state.events.filter(event => event.id !== eventId)
    }));
    
    // Tenta excluir do Firebase
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          console.log(`Solicitando exclusão do evento ${eventId} no Firebase`);
          
          // Primeiro marca o evento como excluído
          const eventToDelete = currentEvents.find(e => e.id === eventId);
          if (eventToDelete) {
            // Marcar o evento como excluído antes de excluí-lo completamente
            await eventService.updateEventInFirebase(eventId, { 
              status: 'cancelled', 
              deleted: true 
            });
            console.log(`Evento ${eventId} marcado como excluído`);
          }
          
          // Então tenta excluí-lo completamente
          const success = await eventService.deleteEventFromFirebase(eventId);
          
          if (success) {
            console.log(`Evento ${eventId} excluído com sucesso do Firebase`);
            resolve(true);
          } else {
            console.error(`Falha ao excluir evento ${eventId} do Firebase`);
            
            // Restaura o estado anterior caso a operação falhe
            set({ events: currentEvents });
            
            reject(new Error(`Falha ao excluir evento ${eventId}`));
          }
        } catch (error) {
          console.error(`Erro crítico ao excluir evento ${eventId}:`, error);
          
          // Restaura o estado anterior caso a operação falhe
          set({ events: currentEvents });
          
          reject(error);
        }
      })();
    });
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
  setSystemSettings: (systemSettings) => set({ systemSettings })
}));