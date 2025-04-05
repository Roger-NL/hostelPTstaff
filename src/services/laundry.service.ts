import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { toast } from 'react-hot-toast';

// Interface para o objeto de slot de lavanderia
export interface LaundrySlot {
  name: string;
  isStaff: boolean;
  timestamp: number;
}

// Interface para o objeto de cronograma de lavanderia
export interface LaundryScheduleData {
  [date: string]: {
    morning?: LaundrySlot;
    afternoon?: LaundrySlot;
    evening?: LaundrySlot;
  }
}

// Função para carregar o cronograma da lavanderia do Firebase
export async function loadLaundrySchedule(): Promise<LaundryScheduleData> {
  try {
    const scheduleRef = doc(firestore, 'laundrySchedule', 'current');
    const scheduleSnap = await getDoc(scheduleRef);
    
    if (scheduleSnap.exists()) {
      console.log("Laundry schedule loaded successfully");
      return scheduleSnap.data() as LaundryScheduleData;
    } else {
      console.log("No laundry schedule found, creating empty one");
      const emptySchedule = {};
      await setDoc(scheduleRef, emptySchedule);
      return emptySchedule as LaundryScheduleData;
    }
  } catch (error) {
    console.error("Error loading laundry schedule:", error);
    throw error;
  }
}

// Função para salvar o cronograma da lavanderia no Firebase
export async function saveLaundrySchedule(schedule: LaundryScheduleData): Promise<void> {
  try {
    console.log("Saving laundry schedule:", schedule);
    const scheduleRef = doc(firestore, 'laundrySchedule', 'current');
    await setDoc(scheduleRef, schedule, { merge: false });
    console.log("Laundry schedule saved successfully");
  } catch (error) {
    console.error("Error saving laundry schedule:", error);
    throw error;
  }
}

// Função para adicionar uma reserva
export async function addLaundryReservation(
  date: string,
  slot: 'morning' | 'afternoon' | 'evening',
  name: string,
  isStaff: boolean
): Promise<void> {
  try {
    console.log(`Adding reservation for ${name} on ${date} at ${slot}`);
    
    // Carregar o cronograma atual
    const currentSchedule = await loadLaundrySchedule();
    
    // Clonar para evitar referências
    const updatedSchedule = JSON.parse(JSON.stringify(currentSchedule));
    
    // Garantir que a data existe no cronograma
    if (!updatedSchedule[date]) {
      updatedSchedule[date] = {};
    }
    
    // Adicionar a reserva
    updatedSchedule[date][slot] = {
      name,
      isStaff,
      timestamp: Date.now()
    };
    
    // Salvar no Firebase
    await saveLaundrySchedule(updatedSchedule);
    console.log(`Reservation added successfully for ${name}`);
  } catch (error) {
    console.error("Error adding reservation:", error);
    throw error;
  }
}

// Função para remover uma reserva
export async function removeLaundryReservation(
  date: string,
  slot: 'morning' | 'afternoon' | 'evening'
): Promise<void> {
  try {
    console.log(`Removing reservation on ${date} at ${slot}`);
    
    // Carregar o cronograma atual
    const currentSchedule = await loadLaundrySchedule();
    
    // Verificar se existe reserva para remover
    if (!currentSchedule[date] || !currentSchedule[date][slot]) {
      console.log("No reservation found to remove");
      return;
    }
    
    // Clonar para evitar referências
    const updatedSchedule = JSON.parse(JSON.stringify(currentSchedule));
    
    // Remover a reserva
    delete updatedSchedule[date][slot];
    
    // Se não houver mais reservas para esta data, remover a data
    if (Object.keys(updatedSchedule[date]).length === 0) {
      delete updatedSchedule[date];
    }
    
    // Salvar no Firebase
    await saveLaundrySchedule(updatedSchedule);
    console.log(`Reservation removed successfully`);
  } catch (error) {
    console.error("Error removing reservation:", error);
    throw error;
  }
}

// Função para verificar se um horário está disponível
export async function isSlotAvailable(
  date: string,
  slot: 'morning' | 'afternoon' | 'evening'
): Promise<boolean> {
  try {
    const schedule = await loadLaundrySchedule();
    return !schedule[date] || !schedule[date][slot];
  } catch (error) {
    console.error("Error checking slot availability:", error);
    throw error;
  }
} 