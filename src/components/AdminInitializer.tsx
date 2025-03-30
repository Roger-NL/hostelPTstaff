import React, { useEffect, useState } from 'react';
import { setupMasterUser } from '../scripts/setupMasterUser';
import { auth, firestore } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AdminInitializerProps {
  masterEmail: string;
}

/**
 * Componente que verifica se o usuário master existe e o cria se necessário.
 * Este componente não renderiza nada visualmente.
 */
const AdminInitializer: React.FC<AdminInitializerProps> = ({ masterEmail }) => {
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const checkMasterUser = async () => {
      try {
        // Verifica se o usuário master já está configurado
        const masterRef = doc(firestore, 'system', 'master');
        const masterDoc = await getDoc(masterRef);
        
        if (!masterDoc.exists()) {
          console.log('Configurando usuário master...');
          await setupMasterUser(masterEmail);
          console.log('Usuário master configurado com sucesso!');
        } else {
          console.log('Usuário master já está configurado');
        }
      } catch (error) {
        console.error('Erro ao verificar/configurar usuário master:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    // Verifica se o Firebase Auth está inicializado
    const unsubscribe = auth.onAuthStateChanged(() => {
      checkMasterUser();
    });
    
    return () => unsubscribe();
  }, [masterEmail]);
  
  // Este componente não renderiza nada
  return null;
};

export default AdminInitializer; 