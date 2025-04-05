import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { Event } from '../types';

// Função para carregar eventos do Firebase
export async function loadEventsFromFirebase(): Promise<Event[]> {
  try {
    console.log("Carregando eventos do Firebase...");
    
    // Primeiro verifica se a coleção existe e tem documentos
    const eventsCol = collection(firestore, 'events');
    const countSnapshot = await getDocs(eventsCol);
    
    console.log(`Coleção de eventos tem ${countSnapshot.size} documentos`);
    
    if (countSnapshot.empty) {
      console.log('Coleção de eventos está vazia');
      return [];
    }
    
    const events: Event[] = [];
    
    // Processa cada documento
    countSnapshot.forEach((doc) => {
      try {
        const docData = doc.data();
        console.log(`Processando evento ${doc.id}: ${docData.title || 'sem título'}`);
        
        // Verifica e formata os dados do evento
        const eventData: Event = {
          id: doc.id,
          title: docData.title || 'Evento sem título',
          description: docData.description || '',
          startDate: docData.startDate || new Date().toISOString(),
          endDate: docData.endDate || new Date().toISOString(),
          location: docData.location || '',
          type: (docData.type === 'activity' || docData.type === 'invitation') 
            ? docData.type 
            : 'activity',
          status: docData.status || 'upcoming',
          capacity: typeof docData.capacity === 'number' ? docData.capacity : 0,
          attendees: Array.isArray(docData.attendees) ? docData.attendees : [],
          organizer: docData.organizer || '',
          createdAt: docData.createdAt || new Date().toISOString(),
          tags: Array.isArray(docData.tags) ? docData.tags : []
        };
        
        events.push(eventData);
      } catch (err) {
        console.error(`Erro ao processar documento ${doc.id}:`, err);
      }
    });
    
    // Ordena eventos por data de início
    events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    console.log(`${events.length} eventos carregados com sucesso`);
    return events;
  } catch (error) {
    console.error("Erro ao carregar eventos:", error);
    return [];
  }
}

// Função para salvar um evento no Firebase
export async function saveEventToFirebase(event: Event): Promise<boolean> {
  try {
    console.log(`Salvando evento ${event.id}: ${event.title}`);
    
    // Validação dos dados do evento
    if (!event.id || !event.title || !event.startDate || !event.endDate) {
      console.error('Dados do evento incompletos:', event);
      return false;
    }
    
    // Garante que todos os campos necessários existam
    const eventData = {
      id: event.id,
      title: event.title,
      description: event.description || '',
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location || '',
      type: event.type || 'activity',
      status: event.status || 'upcoming',
      capacity: event.capacity || 0,
      attendees: Array.isArray(event.attendees) ? event.attendees : [],
      organizer: event.organizer || '',
      createdAt: event.createdAt || new Date().toISOString(),
      tags: Array.isArray(event.tags) ? event.tags : []
    };
    
    // Referência ao documento
    const eventRef = doc(firestore, 'events', event.id);
    
    // Usa set com merge: false para sobrescrever completamente
    await setDoc(eventRef, eventData, { merge: false });
    
    // Verifica se o evento foi salvo corretamente
    const savedEvent = await getDoc(eventRef);
    if (!savedEvent.exists()) {
      console.error(`Evento ${event.id} não foi encontrado após salvar`);
      return false;
    }
    
    console.log(`Evento ${event.id} salvo com sucesso e verificado`);
    return true;
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    return false;
  }
}

// Função para excluir um evento do Firebase
export async function deleteEventFromFirebase(eventId: string): Promise<boolean> {
  try {
    console.log(`Excluindo evento ${eventId}...`);
    
    // Verifica se o evento existe antes de excluir
    const eventRef = doc(firestore, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      console.log(`Evento ${eventId} não encontrado, nada a excluir`);
      return true; // Considera sucesso, já que o resultado final é o esperado
    }
    
    // Registra os detalhes do evento que será excluído para debug
    console.log(`Excluindo evento: ${eventDoc.data().title}`);
    
    // Exclui o evento
    await deleteDoc(eventRef);
    
    // Verifica se o evento foi realmente excluído
    const checkDoc = await getDoc(eventRef);
    if (checkDoc.exists()) {
      console.error(`Falha na exclusão: evento ${eventId} ainda existe`);
      return false;
    }
    
    console.log(`Evento ${eventId} excluído com sucesso`);
    return true;
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return false;
  }
}

// Função para atualizar um evento no Firebase
export async function updateEventInFirebase(eventId: string, updates: Partial<Event>): Promise<void> {
  try {
    console.log(`Atualizando evento ${eventId}...`);
    
    // Primeiro, obtém o evento atual
    const eventRef = doc(firestore, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      throw new Error(`Evento ${eventId} não encontrado`);
    }
    
    // Mescla as atualizações com o evento atual
    const currentEvent = eventSnap.data() as Event;
    const updatedEvent = { ...currentEvent, ...updates };
    
    // Salva o evento atualizado
    await setDoc(eventRef, updatedEvent, { merge: false });
    console.log(`Evento ${eventId} atualizado com sucesso`);
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    throw error;
  }
}

// Função para adicionar um participante a um evento
export async function addAttendeeToEvent(eventId: string, userId: string): Promise<void> {
  try {
    const eventRef = doc(firestore, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      throw new Error(`Evento ${eventId} não encontrado`);
    }
    
    const event = eventSnap.data() as Event;
    
    // Verifica se o usuário já está participando
    if (!event.attendees.includes(userId)) {
      const updatedEvent = {
        ...event,
        attendees: [...event.attendees, userId]
      };
      
      await setDoc(eventRef, updatedEvent, { merge: false });
      console.log(`Usuário ${userId} adicionado ao evento ${eventId}`);
    }
  } catch (error) {
    console.error("Erro ao adicionar participante:", error);
    throw error;
  }
}

// Função para remover um participante de um evento
export async function removeAttendeeFromEvent(eventId: string, userId: string): Promise<void> {
  try {
    const eventRef = doc(firestore, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      throw new Error(`Evento ${eventId} não encontrado`);
    }
    
    const event = eventSnap.data() as Event;
    
    const updatedEvent = {
      ...event,
      attendees: event.attendees.filter(id => id !== userId)
    };
    
    await setDoc(eventRef, updatedEvent, { merge: false });
    console.log(`Usuário ${userId} removido do evento ${eventId}`);
  } catch (error) {
    console.error("Erro ao remover participante:", error);
    throw error;
  }
}

// Função para cancelar um evento
export async function cancelEventInFirebase(eventId: string): Promise<void> {
  try {
    const eventRef = doc(firestore, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      throw new Error(`Evento ${eventId} não encontrado`);
    }
    
    const event = eventSnap.data() as Event;
    
    const updatedEvent = {
      ...event,
      status: 'cancelled' as Event['status']
    };
    
    await setDoc(eventRef, updatedEvent, { merge: false });
    console.log(`Evento ${eventId} cancelado com sucesso`);
  } catch (error) {
    console.error("Erro ao cancelar evento:", error);
    throw error;
  }
} 