export type UserRole = 'admin' | 'volunteer' | 'superadmin';

export interface UserData {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  points: number;
  shifts: string[];
}

export interface AppState {
  user: UserData | null;
  users: UserData[];
  tasks: Task[];
  events: Event[];
  messages: Message[];
  schedule: Schedule;
  language: 'en' | 'pt';
  addUser: (user: UserData) => void;
  updateUser: (userId: string, updates: Partial<UserData>) => void;
  deleteUser: (userId: string) => void;
  setLanguage: (language: 'en' | 'pt') => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  updateSchedule: (date: string, shift: ShiftTime, volunteerIds: string[]) => void;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inProgress' | 'done';
  type: 'hostel' | 'personal';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  read: string[];
  createdAt: string;
  updatedAt: string;
}

export type ShiftTime = '09:00-12:00' | '14:00-17:00' | '19:00-22:00';

export interface Schedule {
  [date: string]: {
    [shift in ShiftTime]?: string[];
  };
}

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  isAuthenticated: boolean;
  role: 'user' | 'admin' | 'superadmin';
  points: number;
}; 