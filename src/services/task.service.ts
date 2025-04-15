import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { Task, TaskPhoto } from '../types';

// Função para carregar tarefas do Firebase
export const fetchTasks = async (): Promise<Task[]> => {
  try {
    console.log('Carregando tarefas do Firebase...');
    
    const tasksCollection = collection(firestore, 'tasks');
    
    // Primeiro verifica se a coleção existe e tem documentos
    const countSnapshot = await getDocs(tasksCollection);
    console.log(`Coleção de tarefas tem ${countSnapshot.size} documentos`);
    
    if (countSnapshot.empty) {
      console.log('Coleção de tarefas está vazia');
      return [];
    }
    
    // Busca ordenada por data de criação
    const tasksQuery = query(tasksCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(tasksQuery);
    
    console.log(`Query retornou ${querySnapshot.size} documentos`);
    
    const tasks: Task[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const docData = doc.data();
        console.log(`Processando tarefa ${doc.id}:`, docData);
        
        const taskData: Task = {
          id: doc.id,
          title: docData.title || '',
          description: docData.description || '',
          status: docData.status || 'todo',
          type: docData.type || 'hostel',
          points: typeof docData.points === 'number' ? docData.points : 0,
          priority: docData.priority || 'medium',
          createdAt: docData.createdAt || new Date().toISOString(),
          dueDate: docData.dueDate,
          assignedTo: Array.isArray(docData.assignedTo) ? docData.assignedTo : undefined,
          comments: Array.isArray(docData.comments) ? docData.comments : undefined,
          tags: Array.isArray(docData.tags) ? docData.tags : undefined,
          checklist: Array.isArray(docData.checklist) ? docData.checklist : undefined,
          isPrivate: typeof docData.isPrivate === 'boolean' ? docData.isPrivate : false,
          createdBy: docData.createdBy || '',
          requirePhoto: typeof docData.requirePhoto === 'boolean' ? docData.requirePhoto : false,
          photo: docData.photo
        };
        
        tasks.push(taskData);
      } catch (err) {
        console.error(`Erro ao processar documento ${doc.id}:`, err);
      }
    });
    
    console.log(`${tasks.length} tarefas carregadas com sucesso`);
    return tasks;
  } catch (error) {
    console.error('Erro ao carregar tarefas:', error);
    return [];
  }
};

// Função para adicionar uma nova tarefa
export const addTask = async (taskData: Partial<Task>): Promise<{ id: string }> => {
  try {
    console.log('Adicionando nova tarefa:', taskData);
    
    // Gera um novo ID para a tarefa
    const taskRef = doc(collection(firestore, 'tasks'));
    const taskId = taskRef.id;
    
    // Prepara os dados da tarefa com valores padrão
    const newTask: Task = {
      id: taskId,
      title: taskData.title || '',
      description: taskData.description || '',
      status: 'todo',
      type: taskData.type || 'hostel',
      points: typeof taskData.points === 'number' ? taskData.points : 0,
      priority: taskData.priority || 'medium',
      createdAt: new Date().toISOString(),
      dueDate: taskData.dueDate,
      assignedTo: taskData.assignedTo,
      comments: taskData.comments,
      tags: taskData.tags,
      checklist: taskData.checklist,
      isPrivate: taskData.isPrivate,
      createdBy: taskData.createdBy || '',
      requirePhoto: taskData.requirePhoto,
      photo: taskData.photo
    };
    
    // Salva a tarefa no Firestore
    await setDoc(taskRef, {
      ...newTask,
      serverCreatedAt: serverTimestamp()
    });
    
    console.log('Nova tarefa criada com sucesso:', taskId);
    return { id: taskId };
  } catch (error) {
    console.error('Erro ao adicionar tarefa:', error);
    throw error;
  }
};

// Função para atualizar uma tarefa existente
export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
  try {
    console.log(`Atualizando tarefa ${taskId}:`, updates);
    
    const taskRef = doc(firestore, 'tasks', taskId);
    
    // Verifica se a tarefa existe
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) {
      console.error('Tarefa não encontrada:', taskId);
      return false;
    }
    
    // Remove campos undefined/null para não sobrescrever dados existentes
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    await setDoc(taskRef, cleanUpdates, { merge: true });
    
    console.log('Tarefa atualizada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    return false;
  }
};

// Função para excluir uma tarefa
export const deleteTask = async (taskId: string): Promise<boolean> => {
  try {
    console.log('Excluindo tarefa:', taskId);
    
    const taskRef = doc(firestore, 'tasks', taskId);
    await deleteDoc(taskRef);
    
    console.log('Tarefa excluída com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    return false;
  }
};

export const moveTask = async (taskId: string, newStatus: Task['status']) => {
  console.log('Task service disabled');
  return true;
};

export const addTaskComment = async (taskId: string, commentText: string, userId: string) => {
  console.log('Task service disabled');
  return { id: 'disabled' };
};

export const deleteTaskComment = async (taskId: string, commentId: string) => {
  console.log('Task service disabled');
  return true;
};

export const addTaskChecklistItem = async (taskId: string, text: string) => {
  console.log('Task service disabled');
  return { id: 'disabled' };
};

export const toggleTaskChecklistItem = async (taskId: string, itemId: string, checked: boolean) => {
  console.log('Task service disabled');
  return true;
};

export const deleteTaskChecklistItem = async (taskId: string, itemId: string) => {
  console.log('Task service disabled');
  return true;
};

export const assignTask = async (taskId: string, userId: string) => {
  console.log('Task service disabled');
  return true;
};

export const addTaskTag = async (taskId: string, tag: string) => {
  console.log('Task service disabled');
  return true;
};

export const removeTaskTag = async (taskId: string, tag: string) => {
  console.log('Task service disabled');
  return true;
};

// Função para fazer upload de foto de uma tarefa
export const uploadTaskPhoto = async (taskId: string, photoDataUrl: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Adicionando foto à tarefa ${taskId}`);
    
    const taskRef = doc(firestore, 'tasks', taskId);
    
    // Verifica se a tarefa existe
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) {
      console.error('Tarefa não encontrada:', taskId);
      return false;
    }
    
    const currentTask = taskDoc.data() as Task;
    
    // Adiciona a nova foto
    const newPhoto: TaskPhoto = {
      url: photoDataUrl,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      approved: false
    };
    
    await setDoc(taskRef, {
      photo: newPhoto
    }, { merge: true });
    
    console.log('Foto adicionada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao adicionar foto:', error);
    return false;
  }
};

// Função para aprovar foto de tarefa
export const approveTaskPhoto = async (taskId: string, adminId: string): Promise<void> => {
  try {
    const taskRef = doc(firestore, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      throw new Error('Tarefa não encontrada');
    }
    
    const task = taskDoc.data() as Task;
    
    if (!task.photo) {
      throw new Error('Tarefa não possui foto');
    }
    
    await setDoc(taskRef, {
      photo: {
        ...task.photo,
        approved: true,
        approvedBy: adminId,
        approvedAt: new Date().toISOString()
      }
    }, { merge: true });
  } catch (error) {
    console.error('Erro ao aprovar foto:', error);
    throw error;
  }
};

// Função para rejeitar foto de tarefa
export const rejectTaskPhoto = async (taskId: string, adminId: string): Promise<void> => {
  try {
    const taskRef = doc(firestore, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      throw new Error('Tarefa não encontrada');
    }
    
    const task = taskDoc.data() as Task;
    
    if (!task.photo) {
      throw new Error('Tarefa não possui foto');
    }
    
    await setDoc(taskRef, {
      photo: {
        ...task.photo,
        approved: false,
        approvedBy: adminId,
        approvedAt: new Date().toISOString()
      }
    }, { merge: true });
  } catch (error) {
    console.error('Erro ao rejeitar foto:', error);
    throw error;
  }
};

// Função para excluir todas as tarefas (uso administrativo)
export const deleteAllTasks = async (): Promise<boolean> => {
  try {
    console.log('Excluindo todas as tarefas...');
    
    const tasksCollection = collection(firestore, 'tasks');
    const tasksQuery = query(tasksCollection);
    const querySnapshot = await getDocs(tasksQuery);
    
    // Usa batch para operações em massa
    const batch = writeBatch(firestore);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`${querySnapshot.size} tarefas excluídas com sucesso`);
    return true;
  } catch (error) {
    console.error('Erro ao excluir todas as tarefas:', error);
    return false;
  }
};

export const cleanupDeletedTasks = async () => {
  console.log('Task service disabled');
  return true;
};

export const loadTasksFromFirebase = fetchTasks;
export const saveTaskToFirebase = addTask;
export const deleteTaskFromFirebase = deleteTask;
export const updateTaskInFirebase = updateTask; 