import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { Task } from '../types';

// Função para carregar tarefas do Firebase
export async function loadTasksFromFirebase(): Promise<Task[]> {
  try {
    console.log("Carregando tarefas do Firebase...");
    
    // Primeiro verifica se a coleção existe e tem documentos
    const tasksCol = collection(firestore, 'tasks');
    const countSnapshot = await getDocs(tasksCol);
    
    console.log(`Coleção de tarefas tem ${countSnapshot.size} documentos`);
    
    if (countSnapshot.empty) {
      console.log('Coleção de tarefas está vazia');
      return [];
    }
    
    const tasks: Task[] = [];
    const deletedIds = new Set<string>(); // Para rastrear IDs que foram marcados como excluídos
    
    // Primeiro passe: identifica tarefas excluídas
    countSnapshot.forEach(doc => {
      const docData = doc.data();
      // Marcar como excluído se tiver a flag deleted ou se o título começar com [DELETED]
      if (docData.deleted === true || 
          (docData.title && docData.title.startsWith('[DELETED]'))) {
        deletedIds.add(doc.id);
        // Para IDs adicionais/numéricos, também marcar como excluído
        if (docData.id) {
          deletedIds.add(docData.id);
        }
        // Armazenar títulos de tarefas excluídas para evitar recriar tarefas com o mesmo título
        if (docData.title) {
          // Armazenar tanto o título normal quanto o título com prefixo [DELETED]
          const cleanTitle = docData.title.replace('[DELETED] ', '');
          deletedIds.add(`title:${cleanTitle}`);
        }
        console.log(`Tarefa ${doc.id} identificada como excluída e será ignorada`);
      }
    });
    
    // Segundo passe: processar tarefas não excluídas
    countSnapshot.forEach(doc => {
      try {
        // Pular documentos excluídos identificados no primeiro passe
        if (deletedIds.has(doc.id)) {
          return;
        }
        
        const docData = doc.data();
        
        // Verificações adicionais para determinar se é excluído
        if (docData.deleted === true || 
            (docData.title && docData.title.startsWith('[DELETED]')) ||
            (docData.id && deletedIds.has(docData.id))) {
          console.log(`Tarefa ${doc.id} está marcada como excluída, ignorando`);
          return;
        }
        
        console.log(`Processando tarefa ${doc.id}: ${docData.title || 'sem título'}`);
        
        // Verifica e formata os dados da tarefa
        const taskData: Task = {
          id: doc.id,
          title: docData.title || 'Tarefa sem título',
          description: docData.description || '',
          points: typeof docData.points === 'number' ? docData.points : 0,
          status: ['todo', 'inProgress', 'done'].includes(docData.status) 
            ? docData.status as Task['status']
            : 'todo',
          priority: ['low', 'medium', 'high'].includes(docData.priority)
            ? docData.priority as Task['priority']
            : 'medium',
          createdAt: docData.createdAt || new Date().toISOString(),
          dueDate: docData.dueDate,
          assignedTo: Array.isArray(docData.assignedTo) ? docData.assignedTo : [],
          comments: Array.isArray(docData.comments) ? docData.comments : [],
          tags: Array.isArray(docData.tags) ? docData.tags : [],
          checklist: Array.isArray(docData.checklist) ? docData.checklist : [],
          isPrivate: docData.isPrivate === true,
          createdBy: docData.createdBy || '',
          type: ['hostel', 'personal'].includes(docData.type)
            ? docData.type as Task['type']
            : 'hostel',
          reminder: docData.reminder
        };
        
        // Verificação final: não adicionar tarefas com títulos padrão que foram excluídos anteriormente
        // ou com IDs que foram excluídos
        if (taskData.id === '1' || 
            taskData.id === '2' || 
            taskData.id === '3' ||
            taskData.title === 'Clean the kitchen' || 
            taskData.title === 'Check-in new guests' ||
            taskData.title === 'Buy groceries') {
          // Verifica se já existe uma versão excluída desta tarefa
          if (deletedIds.has(taskData.id) || deletedIds.has(`title:${taskData.title}`)) {
            console.log(`Tarefa padrão ${taskData.id} (${taskData.title}) já foi excluída anteriormente, ignorando`);
            return;
          }
        }
        
        tasks.push(taskData);
      } catch (err) {
        console.error(`Erro ao processar documento ${doc.id}:`, err);
      }
    });
    
    // Ordena tarefas por data de criação (mais recentes primeiro)
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`${tasks.length} tarefas carregadas com sucesso`);
    return tasks;
  } catch (error) {
    console.error("Erro ao carregar tarefas:", error);
    return [];
  }
}

// Função para salvar uma tarefa no Firebase
export async function saveTaskToFirebase(task: Task): Promise<boolean> {
  try {
    console.log(`Salvando tarefa ${task.id}: ${task.title}`);
    
    // Validação dos dados da tarefa
    if (!task.id || !task.title) {
      console.error('Dados da tarefa incompletos:', task);
      return false;
    }
    
    // Referência ao documento
    const taskRef = doc(firestore, 'tasks', task.id);
    
    // Usa set com merge: false para sobrescrever completamente
    await setDoc(taskRef, task, { merge: false });
    
    // Verifica se a tarefa foi salva corretamente
    const savedTask = await getDoc(taskRef);
    if (!savedTask.exists()) {
      console.error(`Tarefa ${task.id} não foi encontrada após salvar`);
      return false;
    }
    
    console.log(`Tarefa ${task.id} salva com sucesso e verificada`);
    return true;
  } catch (error) {
    console.error("Erro ao salvar tarefa:", error);
    return false;
  }
}

// Função para excluir uma tarefa do Firebase
export async function deleteTaskFromFirebase(taskId: string): Promise<boolean> {
  try {
    console.log(`Excluindo tarefa ${taskId}...`);
    
    // Verifica se a tarefa existe antes de excluir
    const taskRef = doc(firestore, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      console.log(`Tarefa ${taskId} não encontrada, nada a excluir`);
      return true; // Considera sucesso, já que o resultado final é o esperado
    }
    
    // Registra os detalhes da tarefa que será excluída para debug
    console.log(`Excluindo tarefa: ${taskDoc.data().title}`);
    
    // Exclui a tarefa
    await deleteDoc(taskRef);
    
    // Verifica se a tarefa foi realmente excluída com várias tentativas
    let checkAttempts = 0;
    const maxAttempts = 3;
    
    while (checkAttempts < maxAttempts) {
      checkAttempts++;
      const checkDoc = await getDoc(taskRef);
      
      if (!checkDoc.exists()) {
        console.log(`Tarefa ${taskId} excluída com sucesso (verificado na tentativa ${checkAttempts})`);
        return true;
      }
      
      console.warn(`Tarefa ${taskId} ainda existe após tentativa ${checkAttempts} de exclusão. Tentando novamente...`);
      
      // Pequena pausa antes de nova tentativa
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Tenta excluir novamente
      await deleteDoc(taskRef);
    }
    
    // Se chegou aqui, todas as tentativas falharam
    console.error(`Falha na exclusão: tarefa ${taskId} ainda existe após ${maxAttempts} tentativas`);
    return false;
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
    return false;
  }
}

// Função para atualizar uma tarefa no Firebase
export async function updateTaskInFirebase(taskId: string, updates: Partial<Task>): Promise<void> {
  try {
    console.log(`Atualizando tarefa ${taskId}...`);
    
    // Primeiro, obtém a tarefa atual
    const taskRef = doc(firestore, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    
    if (!taskSnap.exists()) {
      throw new Error(`Tarefa ${taskId} não encontrada`);
    }
    
    // Mescla as atualizações com a tarefa atual
    const currentTask = taskSnap.data() as Task;
    const updatedTask = { ...currentTask, ...updates };
    
    // Salva a tarefa atualizada
    await setDoc(taskRef, updatedTask, { merge: false });
    console.log(`Tarefa ${taskId} atualizada com sucesso`);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    throw error;
  }
}

// Função para excluir completamente todas as tarefas do Firebase
export async function deleteAllTasks(): Promise<boolean> {
  try {
    console.log("Iniciando exclusão de todas as tarefas...");
    
    const tasksCol = collection(firestore, 'tasks');
    const snapshot = await getDocs(tasksCol);
    
    if (snapshot.empty) {
      console.log("Nenhuma tarefa encontrada para excluir");
      return true;
    }
    
    const tasks: string[] = [];
    
    // Coletar todos os IDs de tarefas
    snapshot.forEach(doc => {
      tasks.push(doc.id);
    });
    
    console.log(`Encontradas ${tasks.length} tarefas para excluir`);
    
    if (tasks.length === 0) {
      return true;
    }
    
    // Excluir todas as tarefas
    const deletePromises = tasks.map(async (id) => {
      const docRef = doc(firestore, 'tasks', id);
      try {
        await deleteDoc(docRef);
        console.log(`Tarefa ${id} excluída permanentemente`);
        return true;
      } catch (error) {
        console.error(`Erro ao excluir tarefa ${id}:`, error);
        return false;
      }
    });
    
    const results = await Promise.all(deletePromises);
    const success = results.every(result => result === true);
    
    console.log(`Exclusão de todas as tarefas concluída. Sucesso: ${success}`);
    return success;
  } catch (error) {
    console.error("Erro durante exclusão de tarefas:", error);
    return false;
  }
}

// Função para limpar tarefas excluídas do Firebase
export async function cleanupDeletedTasks(): Promise<boolean> {
  try {
    console.log("Iniciando limpeza de tarefas excluídas...");
    
    const tasksCol = collection(firestore, 'tasks');
    const snapshot = await getDocs(tasksCol);
    
    if (snapshot.empty) {
      console.log("Nenhuma tarefa encontrada para limpar");
      return true;
    }
    
    const deletedTasks: string[] = [];
    
    // Identificar tarefas para excluir
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.deleted === true || 
          (data.title && data.title.startsWith('[DELETED]'))) {
        deletedTasks.push(doc.id);
      }
    });
    
    console.log(`Encontradas ${deletedTasks.length} tarefas excluídas para limpar`);
    
    if (deletedTasks.length === 0) {
      return true;
    }
    
    // Excluir tarefas marcadas
    const deletePromises = deletedTasks.map(async (id) => {
      const docRef = doc(firestore, 'tasks', id);
      try {
        await deleteDoc(docRef);
        console.log(`Tarefa ${id} limpa permanentemente`);
        return true;
      } catch (error) {
        console.error(`Erro ao limpar tarefa ${id}:`, error);
        return false;
      }
    });
    
    const results = await Promise.all(deletePromises);
    const success = results.every(result => result === true);
    
    console.log(`Limpeza de tarefas concluída. Sucesso: ${success}`);
    return success;
  } catch (error) {
    console.error("Erro durante limpeza de tarefas:", error);
    return false;
  }
} 