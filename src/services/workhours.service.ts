import { firestore } from '../config/firebase';
import { collection, doc, getDoc, setDoc, getDocs, updateDoc, query, where, orderBy, limit, Timestamp, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { WorkLog, WorkHoursSummary, ShiftTime } from '../types';
import { format, parseISO, differenceInMinutes, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';

const WORK_LOGS_COLLECTION = 'workLogs';
const WORK_SUMMARY_COLLECTION = 'workSummaries';

// Forçar finalização de um turno ativo anterior
export const forceEndPreviousShift = async (userId: string): Promise<void> => {
  try {
    console.log(`Verificando e finalizando turnos ativos anteriores para o usuário ${userId}`);
    
    // Obter o turno ativo do usuário
    const activeShift = await getActiveShift(userId);
    if (!activeShift) {
      console.log('Nenhum turno ativo anterior encontrado');
      return;
    }
    
    console.log(`Finalizando turno ativo anterior: ${activeShift.id}`);
    
    const now = new Date();
    const startTime = parseISO(activeShift.startTime);
    const totalMinutes = differenceInMinutes(now, startTime);
    
    console.log(`Horário de início do turno anterior: ${startTime.toISOString()}`);
    console.log(`Horário de término forçado: ${now.toISOString()}`);
    console.log(`Total de minutos: ${totalMinutes}`);

    // Atualizar o documento no Firestore
    const workLogRef = doc(firestore, WORK_LOGS_COLLECTION, activeShift.id);
    
    await updateDoc(workLogRef, {
      endTime: Timestamp.fromDate(now),
      totalMinutes,
      forceClosed: true // Marcando que este turno foi fechado automaticamente
    });
    
    console.log(`Turno anterior ${activeShift.id} finalizado automaticamente`);

    // Atualizar o sumário de horas do usuário
    await updateWorkSummary(userId);
    
    console.log('Sumário de horas atualizado após finalização forçada');
  } catch (error) {
    console.error('Erro ao finalizar turno anterior:', error);
    throw error;
  }
};

// Iniciar um turno
export const startShift = async (userId: string, shiftTime: ShiftTime): Promise<WorkLog> => {
  try {
    // Verificar se já existe um turno ativo para este usuário
    const activeShift = await getActiveShift(userId);
    if (activeShift) {
      console.log('Usuário já possui um turno ativo. Finalizando o turno anterior automaticamente.');
      await forceEndPreviousShift(userId);
    }

    const now = new Date();
    const shiftDate = format(now, 'yyyy-MM-dd');
    
    // Base do objeto WorkLog
    const newWorkLog: WorkLog = {
      id: '', // Será preenchido após a criação no Firestore
      userId,
      shiftDate,
      shiftTime,
      startTime: now.toISOString(),
    };
    
    // Adiciona forceClosed apenas se houver um turno ativo anterior
    if (activeShift) {
      (newWorkLog as any).forceClosed = true;
    }

    // Criar o documento no Firestore - usando objeto simplificado para evitar campos undefined
    const firestoreData = {
      userId,
      shiftDate,
      shiftTime,
      startTime: Timestamp.fromDate(now),
    };
    
    // Adicionar forceClosed apenas se houve um turno ativo anterior
    if (activeShift) {
      (firestoreData as any).forceClosed = true;
    }
    
    const docRef = await addDoc(collection(firestore, WORK_LOGS_COLLECTION), firestoreData);

    // Atualizar o ID do log
    newWorkLog.id = docRef.id;
    await updateDoc(docRef, { id: docRef.id });
    
    console.log(`Novo turno iniciado: ${docRef.id}`);

    return newWorkLog;
  } catch (error) {
    console.error('Erro ao iniciar turno:', error);
    throw error;
  }
};

// Finalizar um turno
export const endShift = async (userId: string): Promise<WorkLog> => {
  try {
    console.log(`Finalizando turno para o usuário ${userId}`);
    
    // Obter o turno ativo do usuário
    const activeShift = await getActiveShift(userId);
    if (!activeShift) {
      console.error('Nenhum turno ativo encontrado para este usuário');
      throw new Error('Nenhum turno ativo encontrado para este usuário');
    }

    console.log(`Turno ativo encontrado: ${activeShift.id}`);
    
    const now = new Date();
    const startTime = parseISO(activeShift.startTime);
    const totalMinutes = differenceInMinutes(now, startTime);
    
    console.log(`Horário de início: ${startTime.toISOString()}`);
    console.log(`Horário de término: ${now.toISOString()}`);
    console.log(`Total de minutos: ${totalMinutes}`);

    // Atualizar o documento no Firestore
    const workLogRef = doc(firestore, WORK_LOGS_COLLECTION, activeShift.id);
    
    await updateDoc(workLogRef, {
      endTime: Timestamp.fromDate(now),
      totalMinutes
    });
    
    console.log(`Documento ${activeShift.id} atualizado no Firestore`);

    // Atualizar o sumário de horas do usuário
    console.log('Atualizando sumário de horas do usuário');
    const summary = await updateWorkSummary(userId);
    console.log('Sumário atualizado:', summary);

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
    console.log(`Buscando turno ativo para o usuário ${userId}`);
    
    // A consulta estava buscando documentos onde endTime é null, mas no Firestore,
    // quando um campo não existe, ele não é igual a null, ele simplesmente não existe.
    // Vamos ajustar a consulta para verificar isso corretamente.
    const q = query(
      collection(firestore, WORK_LOGS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    console.log(`Encontrados ${querySnapshot.size} logs para o usuário`);
    
    if (querySnapshot.empty) {
      console.log("Nenhum log encontrado para o usuário");
      return null;
    }

    // Filtrar manualmente para encontrar o log sem endTime
    let activeShiftDoc: any = null;
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (!data.endTime) {
        console.log(`Turno ativo encontrado: ${doc.id}`);
        activeShiftDoc = { id: doc.id, ...data };
      }
    });
    
    if (!activeShiftDoc) {
      console.log("Nenhum turno ativo encontrado");
      return null;
    }
    
    // Converter o documento para o formato WorkLog
    return {
      id: activeShiftDoc.id,
      userId: activeShiftDoc.userId,
      shiftDate: activeShiftDoc.shiftDate,
      shiftTime: activeShiftDoc.shiftTime,
      startTime: activeShiftDoc.startTime.toDate().toISOString(),
      endTime: activeShiftDoc.endTime ? activeShiftDoc.endTime.toDate().toISOString() : undefined,
      totalMinutes: activeShiftDoc.totalMinutes,
      notes: activeShiftDoc.notes,
      forceClosed: activeShiftDoc.forceClosed
    };
  } catch (error) {
    console.error('Erro ao obter turno ativo:', error);
    throw error;
  }
};

// Atualizar o sumário de horas trabalhadas do usuário
export const updateWorkSummary = async (userId: string): Promise<WorkHoursSummary> => {
  try {
    console.log(`Atualizando sumário de horas para o usuário ${userId}`);
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    
    console.log(`Data atual: ${now.toISOString()}`);
    console.log(`Início da semana: ${weekStart.toISOString()}`);
    console.log(`Início do mês: ${monthStart.toISOString()}`);

    // Obter todos os logs de trabalho do usuário
    const q = query(
      collection(firestore, WORK_LOGS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    console.log(`Encontrados ${querySnapshot.size} logs totais para o usuário`);
    
    let weekTotal = 0;
    let monthTotal = 0;
    let totalLogCount = 0;
    let lastShift: WorkLog | undefined;
    
    // Processar cada log
    querySnapshot.forEach(doc => {
      const data = doc.data();
      
      // Contar apenas logs completados (que têm endTime)
      if (data.endTime) {
        totalLogCount++;
        
        const endTime = data.endTime.toDate();
        console.log(`Log #${doc.id} - Data de término: ${endTime.toISOString()} - Minutos: ${data.totalMinutes || 0}`);
        
        // Verificar se está na semana ou mês atual
        if (endTime >= weekStart) {
          weekTotal += data.totalMinutes || 0;
        }
        
        if (endTime >= monthStart) {
          monthTotal += data.totalMinutes || 0;
        }
        
        // Atualizar último turno
        if (!lastShift || !lastShift.endTime || (data.endTime && endTime > parseISO(lastShift.endTime))) {
          lastShift = {
            id: doc.id,
            userId: data.userId,
            shiftDate: data.shiftDate,
            shiftTime: data.shiftTime,
            startTime: data.startTime.toDate().toISOString(),
            endTime: data.endTime.toDate().toISOString(),
            totalMinutes: data.totalMinutes,
            // Verifica se notes existe antes de atribuir, para evitar valores undefined no Firestore
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
            // Também passa o forceClosed apenas se estiver definido
            ...(data.forceClosed !== undefined ? { forceClosed: data.forceClosed } : {})
          };
        }
      }
    });
    
    console.log(`Total de minutos na semana: ${weekTotal}`);
    console.log(`Total de minutos no mês: ${monthTotal}`);
    console.log(`Total de logs completados: ${totalLogCount}`);
    console.log(`Último turno:`, lastShift ? `ID: ${lastShift.id}, Data: ${lastShift.shiftDate}` : 'Nenhum');
    
    // Criar ou atualizar o sumário
    const summary: WorkHoursSummary = {
      userId,
      weekTotal,
      monthTotal,
      totalLogs: totalLogCount,
      lastShift
    };
    
    // Salvar no Firestore
    await setDoc(doc(firestore, WORK_SUMMARY_COLLECTION, userId), summary);
    console.log(`Sumário salvo no Firestore para o usuário ${userId}`);
    
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
    // Consulta: obter todos os logs do usuário, ordenados do mais recente para o mais antigo
    const q = query(
      collection(firestore, WORK_LOGS_COLLECTION),
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Encontrados ${querySnapshot.size} logs para o usuário ${userId}`);
    
    const logs: WorkLog[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      // Converter timestamps para strings ISO
      const startTimeISO = data.startTime.toDate().toISOString();
      const endTimeISO = data.endTime ? data.endTime.toDate().toISOString() : undefined;
      
      console.log(`Log ${doc.id}: Início=${startTimeISO}, Fim=${endTimeISO || 'não finalizado'}, Minutos=${data.totalMinutes || 0}`);
      
      logs.push({
        id: doc.id,
        userId: data.userId,
        shiftDate: data.shiftDate,
        shiftTime: data.shiftTime,
        startTime: startTimeISO,
        endTime: endTimeISO,
        totalMinutes: data.totalMinutes,
        // Use spread operator para incluir campos opcionais apenas se existirem
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.forceClosed !== undefined ? { forceClosed: data.forceClosed } : {})
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

// Excluir um registro de turno específico (apenas administradores)
export const deleteWorkLog = async (logId: string): Promise<boolean> => {
  try {
    console.log(`Excluindo registro de turno: ${logId}`);
    
    // Obter o documento para identificar o userId antes de excluí-lo
    const logRef = doc(firestore, WORK_LOGS_COLLECTION, logId);
    const logSnap = await getDoc(logRef);
    
    if (!logSnap.exists()) {
      console.error('Registro de turno não encontrado');
      return false;
    }
    
    const logData = logSnap.data();
    const userId = logData.userId;
    
    // Excluir o registro
    await deleteDoc(logRef);
    console.log(`Registro de turno ${logId} excluído com sucesso`);
    
    // Atualizar o sumário do usuário após a exclusão
    await updateWorkSummary(userId);
    console.log(`Sumário atualizado para o usuário ${userId} após exclusão`);
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir registro de turno:', error);
    throw error;
  }
};

// Excluir todos os registros de turno de um usuário (apenas administradores)
export const deleteAllUserWorkLogs = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Excluindo todos os registros de turno para o usuário ${userId}`);
    
    // Obter todos os logs do usuário
    const q = query(
      collection(firestore, WORK_LOGS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Encontrados ${querySnapshot.size} registros para excluir`);
    
    if (querySnapshot.empty) {
      console.log('Nenhum registro encontrado para excluir');
      return true;
    }
    
    // Excluir cada documento usando WriteBatch
    const batch = writeBatch(firestore);
    querySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`${querySnapshot.size} registros excluídos com sucesso`);
    
    // Atualizar ou excluir o sumário do usuário
    const summaryRef = doc(firestore, WORK_SUMMARY_COLLECTION, userId);
    await setDoc(summaryRef, {
      userId,
      weekTotal: 0,
      monthTotal: 0,
      totalLogs: 0
    });
    console.log(`Sumário zerado para o usuário ${userId}`);
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir registros de turno:', error);
    throw error;
  }
}; 