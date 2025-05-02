import { firestore } from '../config/firebase';
import { collection, doc, getDoc, setDoc, getDocs, updateDoc, query, where, orderBy, limit, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
import type { WorkLog, WorkHoursSummary, ShiftTime } from '../types';
import { format, parseISO, differenceInMinutes, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';

const WORK_LOGS_COLLECTION = 'workLogs';
const WORK_SUMMARY_COLLECTION = 'workSummaries';

// Iniciar um turno
export const startShift = async (userId: string, shiftTime: ShiftTime): Promise<WorkLog> => {
  try {
    // Verificar se já existe um turno ativo para este usuário
    const activeShift = await getActiveShift(userId);
    if (activeShift) {
      throw new Error('Usuário já possui um turno ativo');
    }

    const now = new Date();
    const shiftDate = format(now, 'yyyy-MM-dd');
    
    const newWorkLog: WorkLog = {
      id: '', // Será preenchido após a criação no Firestore
      userId,
      shiftDate,
      shiftTime,
      startTime: now.toISOString(),
    };

    // Criar o documento no Firestore
    const docRef = await addDoc(collection(firestore, WORK_LOGS_COLLECTION), {
      ...newWorkLog,
      startTime: Timestamp.fromDate(now)
    });

    // Atualizar o ID do log
    newWorkLog.id = docRef.id;
    await updateDoc(docRef, { id: docRef.id });

    return newWorkLog;
  } catch (error) {
    console.error('Erro ao iniciar turno:', error);
    throw error;
  }
};

// Finalizar um turno
export const endShift = async (userId: string): Promise<WorkLog> => {
  try {
    // Obter o turno ativo do usuário
    const activeShift = await getActiveShift(userId);
    if (!activeShift) {
      throw new Error('Nenhum turno ativo encontrado para este usuário');
    }

    const now = new Date();
    const startTime = parseISO(activeShift.startTime);
    const totalMinutes = differenceInMinutes(now, startTime);

    // Atualizar o documento no Firestore
    const workLogRef = doc(firestore, WORK_LOGS_COLLECTION, activeShift.id);
    await updateDoc(workLogRef, {
      endTime: Timestamp.fromDate(now),
      totalMinutes
    });

    // Atualizar o sumário de horas do usuário
    await updateWorkSummary(userId);

    // Retornar o log atualizado
    const updatedLog: WorkLog = {
      ...activeShift,
      endTime: now.toISOString(),
      totalMinutes
    };

    return updatedLog;
  } catch (error) {
    console.error('Erro ao finalizar turno:', error);
    throw error;
  }
};

// Obter o turno ativo do usuário (se houver)
export const getActiveShift = async (userId: string): Promise<WorkLog | null> => {
  try {
    const q = query(
      collection(firestore, WORK_LOGS_COLLECTION),
      where('userId', '==', userId),
      where('endTime', '==', null)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    // Deve haver apenas um turno ativo por vez
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      userId: data.userId,
      shiftDate: data.shiftDate,
      shiftTime: data.shiftTime,
      startTime: data.startTime.toDate().toISOString(),
      endTime: data.endTime ? data.endTime.toDate().toISOString() : undefined,
      totalMinutes: data.totalMinutes,
      notes: data.notes
    };
  } catch (error) {
    console.error('Erro ao obter turno ativo:', error);
    throw error;
  }
};

// Atualizar o sumário de horas trabalhadas do usuário
export const updateWorkSummary = async (userId: string): Promise<WorkHoursSummary> => {
  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    // Obter todos os logs de trabalho do usuário
    const q = query(
      collection(firestore, WORK_LOGS_COLLECTION),
      where('userId', '==', userId),
      where('endTime', '!=', null)
    );

    const querySnapshot = await getDocs(q);
    
    let weekTotal = 0;
    let monthTotal = 0;
    let lastShift: WorkLog | undefined;
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const endTime = data.endTime.toDate();
      
      // Verificar se está na semana ou mês atual
      if (endTime >= weekStart) {
        weekTotal += data.totalMinutes || 0;
      }
      
      if (endTime >= monthStart) {
        monthTotal += data.totalMinutes || 0;
      }
      
      // Atualizar último turno
      if (!lastShift || endTime > parseISO(lastShift.endTime!)) {
        lastShift = {
          id: doc.id,
          userId: data.userId,
          shiftDate: data.shiftDate,
          shiftTime: data.shiftTime,
          startTime: data.startTime.toDate().toISOString(),
          endTime: data.endTime.toDate().toISOString(),
          totalMinutes: data.totalMinutes,
          notes: data.notes
        };
      }
    });
    
    // Criar ou atualizar o sumário
    const summary: WorkHoursSummary = {
      userId,
      weekTotal,
      monthTotal,
      totalLogs: querySnapshot.size,
      lastShift
    };
    
    // Salvar no Firestore
    await setDoc(doc(firestore, WORK_SUMMARY_COLLECTION, userId), summary);
    
    return summary;
  } catch (error) {
    console.error('Erro ao atualizar sumário de horas:', error);
    throw error;
  }
};

// Obter o sumário de horas do usuário
export const getWorkSummary = async (userId: string): Promise<WorkHoursSummary | null> => {
  try {
    const docRef = doc(firestore, WORK_SUMMARY_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return docSnap.data() as WorkHoursSummary;
  } catch (error) {
    console.error('Erro ao obter sumário de horas:', error);
    throw error;
  }
};

// Obter todos os logs de trabalho de um usuário
export const getUserWorkLogs = async (userId: string, limitCount = 100): Promise<WorkLog[]> => {
  try {
    const q = query(
      collection(firestore, WORK_LOGS_COLLECTION),
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const logs: WorkLog[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        userId: data.userId,
        shiftDate: data.shiftDate,
        shiftTime: data.shiftTime,
        startTime: data.startTime.toDate().toISOString(),
        endTime: data.endTime ? data.endTime.toDate().toISOString() : undefined,
        totalMinutes: data.totalMinutes,
        notes: data.notes
      });
    });
    
    return logs;
  } catch (error) {
    console.error('Erro ao obter logs de trabalho:', error);
    throw error;
  }
};

// Obter todos os sumários de horas (para administradores)
export const getAllWorkSummaries = async (): Promise<WorkHoursSummary[]> => {
  try {
    const querySnapshot = await getDocs(collection(firestore, WORK_SUMMARY_COLLECTION));
    const summaries: WorkHoursSummary[] = [];
    
    querySnapshot.forEach(doc => {
      summaries.push(doc.data() as WorkHoursSummary);
    });
    
    return summaries;
  } catch (error) {
    console.error('Erro ao obter todos os sumários de horas:', error);
    throw error;
  }
}; 