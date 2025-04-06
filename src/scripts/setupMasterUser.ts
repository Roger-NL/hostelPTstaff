import { auth, firestore } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Função vazia que não configura mais o usuário master
 * Esta funcionalidade foi removida propositalmente
 */
export const setupMasterUser = async (masterEmail: string = '') => {
  console.log('Funcionalidade de configuração de usuário master foi desativada');
  return null;
}; 