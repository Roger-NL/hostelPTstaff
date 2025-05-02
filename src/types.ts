export interface User {
  id: string;
  name: string;
  country: string;
  age: number;
  relationshipStatus: 'single' | 'dating' | 'married';
  email: string;
  phone: string;
  arrivalDate: string;
  departureDate: string;
  gender: 'male' | 'female' | 'other';
  points: number;
  role: 'user' | 'admin';
}

export interface WorkLog {
  id: string;
  userId: string;
  shiftDate: string;
  shiftTime: ShiftTime;
  startTime: string; // ISO string
  endTime?: string; // ISO string, opcional pois pode estar ainda em andamento
  totalMinutes?: number; // Calculado quando o shift termina
  notes?: string;
}

export interface WorkHoursSummary {
  userId: string;
  weekTotal: number; // total de minutos na semana
  monthTotal: number; // total de minutos no mês
  totalLogs: number; // número de logs de trabalho
  lastShift?: WorkLog; // último turno registrado
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  password: string;
  country: string;
  age: string;
  relationshipStatus: string;
  phone: string;
  arrivalDate: string;
  departureDate: string;
  gender: string;
  isAuthenticated: boolean;
  role: 'user' | 'admin';
  points: number;
  shifts?: string[];
  settings?: UserSettings;
  workHours?: WorkHoursSummary;
  activeShift?: WorkLog; // Informações do shift atual em andamento, se houver
}

export interface UserSettings {
  notifications: {
    email: boolean;
    browser: boolean;
    tasks: boolean;
    events: boolean;
    schedule: boolean;
  };
  preferences: {
    language: 'en' | 'pt';
    theme: 'light' | 'dark';
    timezone: string;
    dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
    timeFormat: '12h' | '24h';
  };
  privacy: {
    showProfile: boolean;
    showPoints: boolean;
    showActivity: boolean;
  };
}

export interface SystemSettings {
  maintenance: {
    enabled: boolean;
    message: string;
    scheduledStart?: string;
    scheduledEnd?: string;
  };
  registration: {
    enabled: boolean;
    requireApproval: boolean;
    allowedDomains: string[];
  };
  tasks: {
    maxPointsPerTask: number;
    requireApproval: boolean;
    allowSelfAssign: boolean;
  };
  events: {
    maxCapacity: number;
    requireApproval: boolean;
    allowSelfOrganize: boolean;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'todo' | 'inProgress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  dueDate?: string;
  assignedTo?: string[];
  comments?: TaskComment[];
  tags?: string[];
  checklist?: TaskChecklistItem[];
  isPrivate?: boolean;
  createdBy: string;
  type: 'hostel' | 'personal';
  reminder?: string;
  requirePhoto?: boolean;
  photo?: TaskPhoto;
}

export interface TaskComment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface TaskChecklistItem {
  id: string;
  content: string;
  completed: boolean;
}

export interface TaskPhoto {
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: 'activity' | 'invitation';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  capacity?: number;
  attendees: string[];
  organizer: string;
  createdAt: string;
  tags?: string[];
  deleted?: boolean;
}

export type ShiftTime = '09:00-12:00' | '14:00-17:00' | '19:00-22:00';

export interface Schedule {
  [date: string]: {
    [shift in ShiftTime]?: string[]; // Array of volunteerIds
  };
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  attachments?: string[];
  reactions?: {
    [key: string]: string[]; // emoji -> userId[]
  };
  read: string[]; // array of userIds who have read the message
}

export interface AppState {
  messages: Message[];
  addMessage: (content: string, attachments?: string[]) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  markMessageAsRead: (messageId: string) => void;
  markAllMessagesAsRead: () => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
  approvePhoto: (taskId: string, adminId: string) => void;
  rejectPhoto: (taskId: string, adminId: string) => void;
  uploadTaskPhoto: (taskId: string, photoData: string, userId: string) => Promise<boolean>;
}

// Definição para usuários do Firebase
export interface FirebaseUser extends User {
  createdAt: string;
}