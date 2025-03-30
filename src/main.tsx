import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Configurar o tema escuro como padrão
const savedTheme = localStorage.getItem('theme');
if (!savedTheme) {
  document.documentElement.classList.add('dark');
  localStorage.setItem('theme', 'dark');
} else if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
