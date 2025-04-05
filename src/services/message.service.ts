import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

// Interface da mensagem para o serviço
interface Message {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  attachments?: string[];
  reactions?: Record<string, string[]>;
  read: string[];
}

/**
 * Carrega todas as mensagens do Firebase
 */
export const loadMessagesFromFirebase = async (): Promise<Message[]> => {
  try {
    console.log('Carregando mensagens do Firebase...');
    
    const messagesCollection = collection(firestore, 'messages');
    const messagesQuery = query(messagesCollection, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(messagesQuery);
    
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      const messageData = doc.data() as Message;
      messages.push({
        ...messageData,
        id: doc.id
      });
    });
    
    console.log(`${messages.length} mensagens carregadas com sucesso`);
    return messages;
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
    return [];
  }
};

/**
 * Adiciona uma nova mensagem ao Firebase
 */
export const addMessageToFirebase = async (message: Message): Promise<boolean> => {
  try {
    console.log('Adicionando mensagem ao Firebase:', message.id);
    
    const messageRef = doc(firestore, 'messages', message.id);
    
    // Inclui timestamp do servidor para ordenação
    const messageData = {
      ...message,
      serverCreatedAt: serverTimestamp()
    };
    
    await setDoc(messageRef, messageData);
    console.log('Mensagem adicionada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao adicionar mensagem:', error);
    return false;
  }
};

/**
 * Exclui uma mensagem do Firebase
 */
export const deleteMessageFromFirebase = async (messageId: string): Promise<boolean> => {
  try {
    console.log('Excluindo mensagem do Firebase:', messageId);
    
    const messageRef = doc(firestore, 'messages', messageId);
    await deleteDoc(messageRef);
    
    console.log('Mensagem excluída com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    return false;
  }
};

/**
 * Exclui todas as mensagens do Firebase
 */
export const clearAllMessagesFromFirebase = async (): Promise<boolean> => {
  try {
    console.log('Excluindo todas as mensagens do Firebase...');
    
    const messagesCollection = collection(firestore, 'messages');
    const messagesQuery = query(messagesCollection);
    const querySnapshot = await getDocs(messagesQuery);
    
    // Usa batch para operações em massa
    const batch = writeBatch(firestore);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`${querySnapshot.size} mensagens excluídas com sucesso`);
    return true;
  } catch (error) {
    console.error('Erro ao excluir todas as mensagens:', error);
    return false;
  }
};

/**
 * Adiciona uma reação a uma mensagem
 */
export const addReactionToMessage = async (
  messageId: string, 
  emoji: string, 
  userId: string
): Promise<boolean> => {
  try {
    console.log(`Adicionando reação ${emoji} à mensagem ${messageId} pelo usuário ${userId}`);
    
    const messageRef = doc(firestore, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      console.error('Mensagem não encontrada');
      return false;
    }
    
    const messageData = messageDoc.data() as Message;
    const reactions = messageData.reactions || {};
    const users = reactions[emoji] || [];
    
    // Adiciona o usuário apenas se ele ainda não reagiu com este emoji
    if (!users.includes(userId)) {
      reactions[emoji] = [...users, userId];
      
      await updateDoc(messageRef, {
        reactions: reactions
      });
      
      console.log('Reação adicionada com sucesso');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao adicionar reação:', error);
    return false;
  }
};

/**
 * Remove uma reação de uma mensagem
 */
export const removeReactionFromMessage = async (
  messageId: string, 
  emoji: string, 
  userId: string
): Promise<boolean> => {
  try {
    console.log(`Removendo reação ${emoji} da mensagem ${messageId} pelo usuário ${userId}`);
    
    const messageRef = doc(firestore, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      console.error('Mensagem não encontrada');
      return false;
    }
    
    const messageData = messageDoc.data() as Message;
    const reactions = messageData.reactions || {};
    
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter(id => id !== userId);
      
      // Se não houver mais usuários com esta reação, remove o emoji
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
      
      await updateDoc(messageRef, {
        reactions: reactions
      });
      
      console.log('Reação removida com sucesso');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao remover reação:', error);
    return false;
  }
};

/**
 * Marca uma mensagem como lida por um usuário
 */
export const markMessageAsRead = async (
  messageId: string, 
  userId: string
): Promise<boolean> => {
  try {
    console.log(`Marcando mensagem ${messageId} como lida pelo usuário ${userId}`);
    
    const messageRef = doc(firestore, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      console.error('Mensagem não encontrada');
      return false;
    }
    
    const messageData = messageDoc.data() as Message;
    
    // Adiciona o usuário à lista de leitores se ele ainda não leu
    if (!messageData.read.includes(userId)) {
      const updatedRead = [...messageData.read, userId];
      
      await updateDoc(messageRef, {
        read: updatedRead
      });
      
      console.log('Mensagem marcada como lida');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    return false;
  }
};

/**
 * Marca todas as mensagens como lidas por um usuário
 */
export const markAllMessagesAsRead = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Marcando todas as mensagens como lidas pelo usuário ${userId}`);
    
    const messagesCollection = collection(firestore, 'messages');
    const messagesQuery = query(messagesCollection);
    const querySnapshot = await getDocs(messagesQuery);
    
    const batch = writeBatch(firestore);
    let updateCount = 0;
    
    querySnapshot.forEach((doc) => {
      const messageData = doc.data() as Message;
      
      if (!messageData.read.includes(userId)) {
        const updatedRead = [...messageData.read, userId];
        batch.update(doc.ref, { read: updatedRead });
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`${updateCount} mensagens marcadas como lidas`);
    } else {
      console.log('Nenhuma mensagem nova para marcar como lida');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao marcar todas mensagens como lidas:', error);
    return false;
  }
}; 