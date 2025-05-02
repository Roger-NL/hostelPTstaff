import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  deleteUser as firebaseDeleteUser,
  updateEmail,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, firestore } from '../config/firebase';
import { 
  doc, 
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { User, UserData } from '../types';

// Tipo estendido para incluir o papel de superadmin
type ExtendedUserRole = User['role'] | 'superadmin';

// Define o tipo para dados de registro de usuário
interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
  country?: string;
  age: string;
  relationshipStatus?: 'single' | 'dating' | 'married';
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  arrivalDate?: string;
  departureDate?: string;
}

// Coleta Firebase User
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Verifica se o usuário é o master (super admin)
export const isMasterUser = async (userId: string): Promise<boolean> => {
  try {
    const masterDoc = await getDoc(doc(firestore, 'system', 'master'));
    if (masterDoc.exists() && masterDoc.data().userId === userId) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking master user:', error);
    return false;
  }
};

// Criar perfil de usuário no Firestore para um usuário já existente no Auth
export const createUserProfile = async (userId: string, userData: Omit<User, 'id'>): Promise<User> => {
  try {
    console.log('Criando perfil para usuário existente:', userId);
    
    // Verificar se o perfil já existe
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
      console.log('Perfil já existe, retornando dados existentes');
      return userDoc.data() as User;
    }
    
    // Criar documento do usuário no Firestore
    const userProfile: User = {
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      points: userData.points || 0,
      country: userData.country || '',
      age: userData.age || 0,
      relationshipStatus: userData.relationshipStatus || 'single',
      gender: userData.gender || 'other',
      phone: userData.phone || '',
      arrivalDate: userData.arrivalDate || '',
      departureDate: userData.departureDate || '',
    };
    
    // Adiciona o campo createdAt apenas aos dados do Firestore
    const firestoreData = {
      ...userProfile,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(firestore, 'users', userId), firestoreData);
    
    console.log('Perfil criado com sucesso para:', userId);
    return userProfile;
  } catch (error) {
    console.error('Erro ao criar perfil de usuário:', error);
    throw error;
  }
};

// Registro de novo usuário
export const register = async (userData: UserRegistrationData): Promise<User | null> => {
  try {
    console.log(`Iniciando registro para o email: ${userData.email}`);
    
    // Guarda o usuário atual
    const currentUser = auth.currentUser;
    
    // 1. Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const authUser = userCredential.user;
    
    console.log(`Usuário criado com sucesso no Firebase Auth, ID: ${authUser.uid}`);
    
    // 2. Atualizar o displayName se fornecido
    if (userData.name) {
      await updateProfile(authUser, { displayName: userData.name });
      console.log(`Nome do usuário atualizado: ${userData.name}`);
    }
    
    // 3. Criar objeto com dados do usuário para salvar no Firestore
    const userDoc: User = {
      id: authUser.uid,
      email: userData.email,
      name: userData.name || '',
      role: 'user',
      points: 0,
      country: userData.country || '',
      age: parseInt(userData.age) || 0,
      relationshipStatus: (userData.relationshipStatus as 'single' | 'dating' | 'married') || 'single',
      gender: (userData.gender as 'male' | 'female' | 'other') || 'other',
      phone: userData.phone || '',
      arrivalDate: userData.arrivalDate || '',
      departureDate: userData.departureDate || ''
    };
    
    // 4. Adicionar timestamp de criação para o Firestore
    const firestoreData = {
      ...userDoc,
      createdAt: serverTimestamp()
    };
    
    console.log('Salvando dados do usuário no Firestore:', userDoc);
    
    // 5. Salvar no Firestore
    await setDoc(doc(firestore, 'users', authUser.uid), firestoreData);
    console.log('Dados do usuário salvos com sucesso no Firestore');
    
    // 6. Se havia um usuário logado antes, fazer logout do novo e voltar para o original
    if (currentUser && currentUser.uid !== authUser.uid) {
      try {
        // Fazer logout do usuário recém-criado
        await signOut(auth);
        
        // Não precisamos fazer login novamente, o onAuthStateChanged vai cuidar disso
        console.log('Voltando ao usuário original após criar novo usuário');
      } catch (signOutError) {
        console.error('Erro ao fazer logout após criar usuário:', signOutError);
      }
    }
    
    return userDoc;
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return null;
  }
};

// Registro de novo usuário (sem afetar o usuário logado atualmente)
export const registerStaffOnly = async (userData: UserRegistrationData): Promise<User | null> => {
  try {
    console.log(`Iniciando registro de staff para o email: ${userData.email}`);
    
    // Verificar se tem um usuário autenticado e salvar referência
    const currentUser = auth.currentUser;
    
    // Guardar as credenciais para reautenticar depois se necessário
    let currentCredential = null;
    if (currentUser) {
      console.log(`Usuário atual: ${currentUser.email}, preservando autenticação`);
    }
    
    // 1. Criar usuário no Firebase Admin SDK ou alternativa
    // Nota: Aqui vamos adotar uma abordagem diferente, salvando diretamente no Firestore
    // sem criar no Auth e sem afetar a autenticação atual
    
    // Gerar um ID único para o usuário
    const newUserId = crypto.randomUUID();
    
    // 3. Criar objeto com dados do usuário para salvar no Firestore
    const userDoc: UserData = {
      id: newUserId,
      email: userData.email,
      name: userData.name || '',
      password: userData.password, // UserData pode ter password
      country: userData.country || '',
      age: userData.age || '0',
      relationshipStatus: userData.relationshipStatus || 'single',
      gender: userData.gender || 'other',
      phone: userData.phone || '',
      arrivalDate: userData.arrivalDate || '',
      departureDate: userData.departureDate || '',
      isAuthenticated: true, // Necessário para UserData
      role: 'user', // Sempre criar como usuário normal
      points: 0
    };
    
    // 4. Adicionar timestamp de criação para o Firestore
    const firestoreData = {
      ...userDoc,
      createdAt: serverTimestamp()
    };
    
    console.log('Salvando dados do usuário staff no Firestore:', userDoc);
    
    // 5. Salvar no Firestore sem afetar autenticação
    try {
      await setDoc(doc(firestore, 'users', newUserId), firestoreData);
      console.log('Dados do usuário staff salvos com sucesso no Firestore');
    } catch (firestoreError) {
      console.error('Erro ao salvar dados no Firestore:', firestoreError);
      // Tenta novamente com um atraso
      await new Promise(resolve => setTimeout(resolve, 1000));
      await setDoc(doc(firestore, 'users', newUserId), firestoreData);
      console.log('Dados do usuário salvos na segunda tentativa');
    }
    
    // Não precisamos mais fazer logout ou reautenticar, pois não alteramos o estado de autenticação
    
    // Verifica se os dados foram realmente salvos
    try {
      const userDocCheck = await getDoc(doc(firestore, 'users', newUserId));
      if (userDocCheck.exists()) {
        console.log('Verificação: dados do usuário confirmados no Firestore');
      } else {
        console.error('Verificação falhou: documento do usuário não encontrado após salvar');
      }
    } catch (checkError) {
      console.error('Erro ao verificar dados do usuário:', checkError);
    }
    
    return userDoc;
  } catch (error) {
    console.error('Erro ao registrar usuário staff:', error);
    // Não precisamos mais tentar fazer logout em caso de erro
    return null;
  }
};

// Login
export const login = async (email: string, password: string): Promise<User> => {
  try {
    console.log(`Tentando fazer login com email: ${email}`);
    
    // Tenta autenticar o usuário no Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const authUser = userCredential.user;
    
    console.log(`Usuário autenticado com sucesso: ${authUser.uid}`);
    
    // Verifica se o perfil do usuário existe no Firestore
    const userDoc = await getDoc(doc(firestore, 'users', authUser.uid));
    
    if (!userDoc.exists()) {
      console.warn(`Perfil do usuário não encontrado no Firestore: ${authUser.uid}, criando perfil básico...`);
      
      // Se não existir, cria um perfil básico no Firestore
      const basicProfile: User = {
        id: authUser.uid,
        email: authUser.email || email,
        name: authUser.displayName || email.split('@')[0],
        role: 'user',
        points: 0,
        country: '',
        age: 0,
        relationshipStatus: 'single',
        gender: 'other',
        phone: '',
        arrivalDate: '',
        departureDate: ''
      };
      
      // Adiciona o campo createdAt
      const firestoreData = {
        ...basicProfile,
        createdAt: serverTimestamp()
      };
      
      // Salva o perfil básico
      await setDoc(doc(firestore, 'users', authUser.uid), firestoreData);
      console.log(`Perfil básico criado para o usuário: ${authUser.uid}`);
      
      return basicProfile;
    } else {
      console.log(`Perfil do usuário encontrado no Firestore: ${authUser.uid}`);
      // Retorna o perfil completo do usuário, não apenas o objeto de autenticação
      return { id: authUser.uid, ...userDoc.data() } as User;
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Obter perfil de usuário
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Atualizar perfil de usuário
export const updateUserProfile = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    // Verificar se é o master user (superadmin)
    const isMaster = await isMasterUser(userId);
    
    // Se for o superadmin, não permitir alterar o papel
    if (isMaster && userData.role && userData.role !== 'admin') {
      throw new Error('Cannot change role of the master user');
    }
    
    await updateDoc(doc(firestore, 'users', userId), userData);
    
    // Se o e-mail for atualizado, também atualiza no Auth
    if (userData.email && auth.currentUser) {
      await updateEmail(auth.currentUser, userData.email);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Excluir usuário
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // Verificar se é o master user (superadmin)
    const isMaster = await isMasterUser(userId);
    if (isMaster) {
      throw new Error('Cannot delete the master user');
    }

    // Excluir do Firestore
    await deleteDoc(doc(firestore, 'users', userId));
    
    // Se for o usuário atual, também excluir do Auth
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await firebaseDeleteUser(auth.currentUser);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Reset de senha
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Gerar senha diária para administradores
export const getDailyAdminPassword = (): string => {
  // Obter a data atual no formato yyyy-mm-dd
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // Format: yyyy-mm-dd
  
  // Combinar uma string secreta com a data para gerar uma senha previsível mas que muda diariamente
  const secretKey = 'CarcavelosHostel'; // Seed para a geração da senha
  const combinedString = secretKey + dateString;
  
  // Gerar um valor hash baseado na combinação (versão simplificada)
  let hash = 0;
  for (let i = 0; i < combinedString.length; i++) {
    const char = combinedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converter para um inteiro de 32 bits
  }
  
  // Converter o hash para uma string alfanumérica de 6 caracteres
  const hashString = Math.abs(hash).toString(36).substring(0, 6);
  
  // Formatar a senha final: primeiro caractere maiúsculo + resto + número fixo para consistência
  const formattedPassword = hashString.charAt(0).toUpperCase() + 
                            hashString.substring(1, 5) + 
                            '1';
  
  return formattedPassword;
};

// Listar todos os usuários
export const getAllUsers = async (): Promise<User[]> => {
  try {
    console.log('Buscando todos os usuários do Firestore');
    
    // Cria uma consulta que busca TODOS os documentos da coleção 'users'
    // Limitada a 50 usuários para evitar sobrecarga
    const usersQuery = query(collection(firestore, 'users'));
    const querySnapshot = await getDocs(usersQuery);
    
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      console.log('Usuário encontrado no Firestore:', doc.id);
      const userData = doc.data() as Record<string, any>;
      
      // Filtra para garantir que apenas os campos do tipo User sejam incluídos
      // e garante valores padrão para campos obrigatórios que podem estar ausentes
      const user: User = {
        id: doc.id, // Usar o ID do documento
        name: userData.name || 'Sem nome',
        email: userData.email || '',
        role: (userData.role === 'superadmin' ? 'admin' : userData.role) || 'user',
        points: typeof userData.points === 'number' ? userData.points : 0,
        country: userData.country || '',
        age: typeof userData.age === 'number' ? userData.age : 
             userData.age ? parseInt(userData.age) : 0,
        relationshipStatus: userData.relationshipStatus || 'single',
        gender: userData.gender || 'other',
        phone: userData.phone || '',
        arrivalDate: userData.arrivalDate || '',
        departureDate: userData.departureDate || ''
      };
      
      users.push(user);
    });
    
    console.log(`Total de ${users.length} usuários carregados do Firestore`);
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    // Ao invés de lançar exceção, retornamos um array vazio
    return [];
  }
};

// Atualizar papel do usuário
export const updateUserRole = async (userId: string, role: 'user' | 'admin'): Promise<void> => {
  try {
    // Verificar se é o master user (superadmin)
    const isMaster = await isMasterUser(userId);
    if (isMaster && role !== 'admin') {
      throw new Error('Cannot change role of the master user');
    }
    
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    // Atualizar o papel no Firestore
    await updateDoc(userDocRef, { role });
    
    console.log(`User ${userId} role updated to ${role}`);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Tornar usuário administrador
export const makeAdmin = async (userId: string): Promise<boolean> => {
  try {
    await updateUserRole(userId, 'admin');
    console.log(`Usuário ${userId} promovido a administrador com sucesso`);
    return true;
  } catch (error) {
    console.error('Erro ao tornar usuário administrador:', error);
    return false;
  }
};

// Remover privilégios de administrador
export const removeAdmin = async (userId: string): Promise<boolean> => {
  try {
    await updateUserRole(userId, 'user');
    console.log(`Privilégios de administrador removidos do usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('Erro ao remover privilégios de administrador:', error);
    return false;
  }
}; 