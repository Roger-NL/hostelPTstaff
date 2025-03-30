import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgpgAbn2g9kXsJR5KEyp_DSkcN-zL5NCA",
  authDomain: "hostel-538d2.firebaseapp.com",
  projectId: "hostel-538d2",
  storageBucket: "hostel-538d2.firebasestorage.app",
  messagingSenderId: "310020151775",
  appId: "1:310020151775:web:e98a71a36d7e7f10768c6a",
  measurementId: "G-QTZ62KYDZD"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços do Firebase
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Inicializa o Analytics apenas em ambiente de produção
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Configuração para ambiente de desenvolvimento
try {
  if (import.meta.env.DEV) {
    console.log('Ambiente de desenvolvimento detectado - usando configurações específicas para testes');
    
    // Usar emuladores locais
    // Para usar emuladores, primeiro inicie-os com: firebase emulators:start
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectFirestoreEmulator(firestore, 'localhost', 8080);
    // connectFunctionsEmulator(functions, 'localhost', 5001);
    // connectStorageEmulator(storage, 'localhost', 9199);
    
    // Imprimir mensagem com instruções para acesso às regras do Firebase
    console.log(
      'ATENÇÃO: É necessário configurar as regras do Firestore no Firebase Console.\n' +
      'Acesse: https://console.firebase.google.com/project/hostel-538d2/firestore/rules\n' +
      'E aplique as regras que estão em src/config/firestore.rules'
    );
  }
} catch (error) {
  console.error('Erro ao configurar ambiente de desenvolvimento:', error);
}

export { app }; 