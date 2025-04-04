import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Schedule, ShiftTime } from '../types';

type SaveResult = boolean;
type LoadResult = Schedule | null;
type ModifyResult = Schedule | null;
type ForceRemoveResult = boolean;

// Salvar a agenda no Firebase
export const saveScheduleToFirebase = async (schedule: Schedule): Promise<SaveResult> => {
  try {
    console.log('Salvando agenda no Firebase (estrutura completa):', JSON.stringify(schedule));
    
    // Verificar se temos um objeto de agenda válido
    if (!schedule || typeof schedule !== 'object') {
      console.error('Objeto de agenda inválido:', schedule);
      return false;
    }
    
    const scheduleRef = doc(firestore, 'schedules', 'main');
    
    // Importante: Firestore espera um objeto com o campo 'data' contendo a agenda
    await setDoc(scheduleRef, { data: schedule }, { merge: false });
    
    console.log('Agenda salva com sucesso no Firebase, objeto completo sobrescrito');
    
    // Verificação adicional para confirmar que os dados foram salvos corretamente
    const verification = await getDoc(scheduleRef);
    if (verification.exists()) {
      console.log('Verificação: dados salvos no Firestore:', verification.data());
      return true;
    } else {
      console.error('Verificação falhou: documento não encontrado após salvar');
      return false;
    }
  } catch (error) {
    console.error('Erro ao salvar agenda no Firebase (detalhes completos):', error);
    return false;
  }
};

// Carregar a agenda do Firebase
export const loadScheduleFromFirebase = async (): Promise<LoadResult> => {
  try {
    console.log('Carregando agenda do Firebase...');
    const scheduleRef = doc(firestore, 'schedules', 'main');
    const scheduleSnapshot = await getDoc(scheduleRef);
    
    if (scheduleSnapshot.exists() && scheduleSnapshot.data().data) {
      console.log('Agenda carregada do Firebase:', scheduleSnapshot.data().data);
      return scheduleSnapshot.data().data as Schedule;
    }
    
    console.log('Nenhuma agenda encontrada no Firebase');
    return {};
  } catch (error) {
    console.error('Erro ao carregar agenda do Firebase:', error);
    return null;
  }
};

// Atribuir turno
export const assignShiftToFirebase = async (
  date: string,
  shift: ShiftTime,
  volunteerId: string,
  currentSchedule: Schedule
): Promise<ModifyResult> => {
  try {
    console.log(`Iniciando processo de atribuição de turno: ${date}, ${shift}, voluntário: ${volunteerId}`);
    
    // Cria nova agenda baseada na atual
    const newSchedule = { ...currentSchedule };
    
    // Inicializa a data e turno se não existirem
    if (!newSchedule[date]) {
      newSchedule[date] = {};
      console.log(`Data ${date} não existia, criando nova entrada`);
    }
    
    // Inicializa o turno se não existir
    if (!newSchedule[date][shift]) {
      newSchedule[date][shift] = [];
      console.log(`Turno ${shift} não existia para ${date}, criando novo array`);
    }
    
    const currentShift = Array.isArray(newSchedule[date][shift]) 
      ? [...newSchedule[date][shift]] 
      : [];
    
    console.log(`Turno atual: ${JSON.stringify(currentShift)}`);
    
    // Verifica se o voluntário já está nesse turno
    if (currentShift && currentShift.includes(volunteerId)) {
      console.log(`Voluntário ${volunteerId} já está atribuído a este turno, não fará mudanças`);
      return currentSchedule; // Não há mudança
    }
    
    // Adiciona o voluntário ao turno
    newSchedule[date][shift] = [...(currentShift || []), volunteerId];
    console.log(`Voluntário ${volunteerId} adicionado ao turno ${shift}`);
    
    // Salva no Firebase com retry
    console.log(`Salvando nova agenda no Firebase: ${JSON.stringify(newSchedule)}`);
    const success = await saveScheduleToFirebase(newSchedule);
    
    if (!success) {
      console.log('Primeira tentativa falhou, tentando novamente...');
      const retrySuccess = await saveScheduleToFirebase(newSchedule);
      
      if (!retrySuccess) {
        console.error('Falha persistente ao salvar agenda');
        return null;
      }
    }
    
    console.log('Turno atribuído com sucesso:', { date, shift, volunteerId });
    return newSchedule;
  } catch (error) {
    console.error('Erro ao atribuir turno:', error);
    return null;
  }
};

// Remover turno
export const removeShiftFromFirebase = async (
  date: string,
  shift: ShiftTime,
  volunteerId: string | undefined,
  currentSchedule: Schedule
): Promise<ModifyResult> => {
  try {
    console.log('Iniciando processo de remoção no Firebase:', { 
      date, 
      shift, 
      volunteerId,
      currentScheduleKeys: Object.keys(currentSchedule || {})
    });
    
    // Clona a agenda atual para fazer alterações (clonagem profunda para evitar referências)
    const newSchedule = JSON.parse(JSON.stringify(currentSchedule)) as Schedule;
    
    // Verifica se a data existe
    if (!newSchedule[date]) {
      console.log(`Data ${date} não existe na agenda`, newSchedule);
      return currentSchedule; // Não há o que remover
    }
    
    console.log(`Estado antes da remoção - data ${date}:`, newSchedule[date]);
    
    // Obtém o turno atual
    const currentShift = Array.isArray(newSchedule[date][shift]) 
      ? [...newSchedule[date][shift]] 
      : [];
    
    console.log(`Turno ${shift} antes da remoção:`, currentShift);
    
    if (volunteerId) {
      // Remove o voluntário específico do turno
      newSchedule[date][shift] = currentShift.filter(id => id !== volunteerId);
      console.log(`Voluntário ${volunteerId} removido, novo estado do turno:`, newSchedule[date][shift]);
      
      // Se o turno ficou vazio, remove-o
      if (newSchedule[date][shift].length === 0) {
        console.log(`Turno ${shift} ficou vazio, removendo-o da data ${date}`);
        delete newSchedule[date][shift];
      }
    } else {
      // Remove todo o turno
      console.log(`Removendo todo o turno ${shift} da data ${date}`);
      delete newSchedule[date][shift];
    }
    
    // Se a data ficou sem turnos, remove-a
    if (Object.keys(newSchedule[date]).length === 0) {
      console.log(`Data ${date} ficou sem turnos, removendo-a da agenda`);
      delete newSchedule[date];
    }
    
    console.log('Estado final da agenda após remoções:', JSON.stringify(newSchedule));
    
    // Force sobrescrever todo o documento em vez de fazer merge
    const success = await saveScheduleToFirebase(newSchedule);
    
    // Tenta novamente com intervalo se falhar
    if (!success) {
      console.log('Primeira tentativa falhou, aguardando 500ms para nova tentativa...');
      
      // Espera um pouco antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const retrySuccess = await saveScheduleToFirebase(newSchedule);
      
      if (!retrySuccess) {
        console.error('Falha persistente ao salvar agenda após tentativas');
        return null;
      }
    }
    
    console.log('Remoção processada com sucesso, testando carregamento da agenda atualizada...');
    
    // Tenta carregar a agenda atualizada para verificar se as alterações foram persistidas
    const updatedSchedule = await loadScheduleFromFirebase();
    if (updatedSchedule) {
      // Verifica se a remoção foi persistida verificando se o voluntário ainda está no turno
      const isStillPresent = volunteerId && updatedSchedule[date]?.[shift]?.includes(volunteerId);
      console.log(`Verificação de persistência - voluntário ainda presente: ${isStillPresent}`);
      
      if (volunteerId && isStillPresent) {
        console.error('Falha de persistência: voluntário ainda presente após remoção!');
        // Tenta uma última vez com abordagem diferente
        const forceResult = await forceRemoveVolunteer(date, shift, volunteerId);
        console.log('Resultado da remoção forçada:', forceResult ? 'Sucesso' : 'Falha');
      }
    }
    
    return newSchedule;
  } catch (error) {
    console.error('Erro ao remover turno:', error);
    return null;
  }
};

// Função de força bruta para remover um voluntário quando outros métodos falham
export async function forceRemoveVolunteer(
  date: string, 
  shift: ShiftTime, 
  volunteerId: string
): Promise<ForceRemoveResult> {
  try {
    console.log('TENTATIVA DE FORÇA BRUTA: removendo voluntário diretamente via referência');
    const scheduleRef = doc(firestore, 'schedules', 'main');
    
    // Primeiro, carrega o documento atual
    const scheduleDoc = await getDoc(scheduleRef);
    if (!scheduleDoc.exists()) {
      console.error('Documento de agenda não existe');
      return false;
    }
    
    // Obtém os dados atuais
    const scheduleData = scheduleDoc.data().data || {};
    
    // Verifica se o caminho existe
    if (!scheduleData[date] || !scheduleData[date][shift]) {
      console.log('Caminho não existe para forceRemove');
      return false;
    }
    
    // Remove o voluntário do array
    const currentVolunteers = Array.isArray(scheduleData[date][shift]) 
      ? scheduleData[date][shift] 
      : [];
    
    const updatedVolunteers = currentVolunteers.filter(id => id !== volunteerId);
    
    // Atualiza o document com o novo array
    if (updatedVolunteers.length === 0) {
      // Se o array ficou vazio, remove o turno
      delete scheduleData[date][shift];
      
      // Se a data ficou sem turnos, remove a data
      if (Object.keys(scheduleData[date]).length === 0) {
        delete scheduleData[date];
      }
    } else {
      // Caso contrário, atualiza o array
      scheduleData[date][shift] = updatedVolunteers;
    }
    
    // Salva as alterações
    await setDoc(scheduleRef, { data: scheduleData }, { merge: false });
    console.log('ForceRemove concluído com sucesso');
    
    return true;
  } catch (error) {
    console.error('Erro ao forçar remoção:', error);
    return false;
  }
} 