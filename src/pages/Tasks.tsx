import React from 'react';
import PageHeader from '../components/PageHeader';
import { useTranslation } from '../hooks/useTranslation';

export default function Tasks() {
  const { t } = useTranslation();
  
  return (
    <div className="page-container flex flex-col">
      <PageHeader 
        title={t('tasks.title') || "Tarefas"} 
        showBackButton={true}
      />
      
      <div className="page-content flex flex-col items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">Módulo de Tarefas Removido</h2>
          <p className="text-gray-400 mb-4">
            Este módulo foi temporariamente desativado durante a reestruturação do sistema.
          </p>
          <p className="text-gray-500 text-sm">
            Entre em contato com o administrador para mais informações.
          </p>
        </div>
      </div>
    </div>
  );
}