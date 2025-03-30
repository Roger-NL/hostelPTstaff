import { auth, firestore } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Script para configurar o usuário master (super admin) no Firebase
 * Este usuário terá poderes máximos e não poderá ser excluído
 * @param masterEmail Email do usuário master a ser criado
 */
export const setupMasterUser = async (masterEmail: string = 'raugerac@gmail.com') => {
  const masterPassword = 'Senha123!'; // Substitua por uma senha forte real
  
  try {
    console.log('Iniciando setup do usuário master...');
    console.log('Email do master:', masterEmail);
    
    // Primeiro verifica se o documento master já existe
    try {
      const userRef = doc(firestore, 'system', 'master');
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        console.log('Usuário master já está configurado no sistema:', userDoc.data().userId);
        return userDoc.data().userId;
      }
    } catch (error) {
      console.log('Erro ao verificar existência do usuário master no Firestore:', error);
      console.log('Tentando continuar mesmo assim...');
    }
    
    let userId = '';
    
    // Tenta fazer login com o usuário master se ele já existir
    try {
      console.log('Tentando fazer login com o usuário master (pode já existir)...');
      const userCredential = await signInWithEmailAndPassword(auth, masterEmail, masterPassword);
      userId = userCredential.user.uid;
      console.log('Login bem-sucedido com usuário master existente:', userId);
    } catch (loginError: any) {
      console.log('Login falhou, verificando o motivo:', loginError.code);
      
      // Se o erro for apenas de senha incorreta, o usuário existe
      if (loginError.code === 'auth/wrong-password') {
        console.log('Usuário existe mas a senha está incorreta. Configure a senha correta para o master.');
        throw new Error('A senha do usuário master está incorreta. Verifique a senha no arquivo de configuração.');
      }
      
      // Se for outro tipo de erro, tenta criar o usuário
      try {
        console.log('Tentando criar novo usuário master...');
        const userCredential = await createUserWithEmailAndPassword(auth, masterEmail, masterPassword);
        userId = userCredential.user.uid;
        console.log('Usuário master criado com sucesso:', userId);
      } catch (createError: any) {
        // Se o email já está em uso, mas não conseguimos fazer login, há um problema com as credenciais
        if (createError.code === 'auth/email-already-in-use') {
          console.error('O email já está em uso, mas não foi possível fazer login. Verifique a senha.');
          throw new Error('O email do usuário master já está em uso, mas não foi possível autenticar. Verifique a senha.');
        }
        
        // Outros erros na criação do usuário
        console.error('Erro ao criar usuário master:', createError);
        throw createError;
      }
    }
    
    // Se chegamos aqui, temos um ID de usuário válido
    if (!userId) {
      throw new Error('Não foi possível obter um ID de usuário válido');
    }
    
    // Cria o documento do usuário no Firestore com papel de superadmin
    console.log('Criando ou atualizando perfil do usuário master no Firestore...');
    await setDoc(doc(firestore, 'users', userId), {
      id: userId,
      email: masterEmail,
      name: 'Super Admin',
      role: 'superadmin', // Papel especial que não pode ser alterado
      points: 0,
      country: 'Brasil',
      age: 30,
      relationshipStatus: 'single',
      gender: 'other',
      phone: '',
      arrivalDate: new Date().toISOString(),
      departureDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    // Cria um documento no Firestore para registrar a configuração do master
    console.log('Criando documento de controle do usuário master...');
    await setDoc(doc(firestore, 'system', 'master'), {
      userId: userId,
      email: masterEmail,
      createdAt: new Date().toISOString(),
      isMaster: true
    });
    
    console.log('Usuário master configurado com sucesso! ID:', userId);
    return userId;
  } catch (error) {
    console.error('Erro ao configurar usuário master:', error);
    throw error;
  }
}; 