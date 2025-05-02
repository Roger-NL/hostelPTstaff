import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import type { WorkLog, WorkHoursSummary, UserData } from '../types';
import { format, parseISO } from 'date-fns';
import { Clock, User, Calendar, ChevronDown, ChevronUp, Search, Download, ArrowDownUp } from 'lucide-react';

export default function WorkHours() {
  const { users = [], getAllWorkSummaries, getUserWorkLogs } = useStore();
  const { t } = useTranslation();
  const [summaries, setSummaries] = useState<WorkHoursSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userLogs, setUserLogs] = useState<WorkLog[]>([]);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'weekTotal' | 'monthTotal'>('weekTotal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Carregar sumários de horas de todos os usuários
  useEffect(() => {
    const loadSummaries = async () => {
      setIsLoading(true);
      try {
        const data = await getAllWorkSummaries();
        setSummaries(data);
      } catch (error) {
        console.error('Erro ao carregar sumários de horas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSummaries();
  }, [getAllWorkSummaries]);
  
  // Carregar logs de trabalho do usuário selecionado
  useEffect(() => {
    if (!selectedUserId) {
      setUserLogs([]);
      return;
    }
    
    const loadUserLogs = async () => {
      try {
        const logs = await getUserWorkLogs(selectedUserId);
        setUserLogs(logs);
      } catch (error) {
        console.error('Erro ao carregar logs de trabalho:', error);
      }
    };
    
    loadUserLogs();
  }, [selectedUserId, getUserWorkLogs]);
  
  // Encontrar o nome do usuário pelo ID
  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Usuário Desconhecido';
  };
  
  // Formattar minutos para horas e minutos
  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    }
    
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };
  
  // Formatar data
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Formatar hora
  const formatTime = (timeString: string): string => {
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch (error) {
      return timeString;
    }
  };
  
  // Manipulador de clique no usuário
  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserDetails(true);
  };
  
  // Filtrar usuários por termo de busca
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Ordenar sumários
  const sortedSummaries = [...summaries].sort((a, b) => {
    // Primeiro, garantir que temos os dados de usuário correspondentes
    const userA = users.find(u => u.id === a.userId);
    const userB = users.find(u => u.id === b.userId);
    
    if (sortBy === 'name') {
      const nameA = (userA?.name || '').toLowerCase();
      const nameB = (userB?.name || '').toLowerCase();
      return sortDirection === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }
    
    if (sortBy === 'weekTotal') {
      return sortDirection === 'asc'
        ? a.weekTotal - b.weekTotal
        : b.weekTotal - a.weekTotal;
    }
    
    // monthTotal
    return sortDirection === 'asc'
      ? a.monthTotal - b.monthTotal
      : b.monthTotal - a.monthTotal;
  });
  
  // Toggle direção de ordenação
  const toggleSort = (field: 'name' | 'weekTotal' | 'monthTotal') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };
  
  // Exportar dados para CSV
  const exportToCsv = () => {
    if (userLogs.length === 0) return;
    
    const userName = getUserName(selectedUserId!);
    const headers = ['Data', 'Turno', 'Início', 'Término', 'Duração (min)', 'Notas'];
    
    const rows = userLogs.map(log => [
      formatDate(log.shiftDate),
      log.shiftTime,
      formatTime(log.startTime),
      log.endTime ? formatTime(log.endTime) : '-',
      log.totalMinutes?.toString() || '-',
      log.notes || '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `horas_trabalhadas_${userName.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
        <h2 className="text-xl font-medium text-blue-300 mb-4 flex items-center">
          <Clock size={20} className="mr-2" />
          {t('workHours.title')}
        </h2>
        
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('workHours.searchUsers')}
              className="w-full py-2 pl-10 pr-4 bg-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">
                    <button 
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 focus:outline-none"
                    >
                      {t('workHours.name')}
                      {sortBy === 'name' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">
                    <button 
                      onClick={() => toggleSort('weekTotal')}
                      className="flex items-center gap-1 focus:outline-none"
                    >
                      {t('workHours.weekTotal')}
                      {sortBy === 'weekTotal' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">
                    <button 
                      onClick={() => toggleSort('monthTotal')}
                      className="flex items-center gap-1 focus:outline-none"
                    >
                      {t('workHours.monthTotal')}
                      {sortBy === 'monthTotal' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">{t('workHours.totalShifts')}</th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">{t('workHours.lastShift')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedSummaries.map(summary => {
                  const user = users.find(u => u.id === summary.userId);
                  if (!user || !user.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return null;
                  }
                  
                  return (
                    <tr 
                      key={summary.userId} 
                      className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => handleUserClick(summary.userId)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-100">{user?.name || 'Usuário Desconhecido'}</div>
                            <div className="text-xs text-gray-400">{user?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {formatMinutes(summary.weekTotal)}
                      </td>
                      <td className="py-3 px-4">
                        {formatMinutes(summary.monthTotal)}
                      </td>
                      <td className="py-3 px-4">
                        {summary.totalLogs}
                      </td>
                      <td className="py-3 px-4">
                        {summary.lastShift ? (
                          <div className="text-sm">
                            <div>{formatDate(summary.lastShift.shiftDate)}</div>
                            <div className="text-xs text-gray-400">{summary.lastShift.shiftTime}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                
                {sortedSummaries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      {t('workHours.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal de detalhes do usuário */}
      {showUserDetails && selectedUserId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-blue-300 flex items-center">
                <User size={18} className="mr-2" />
                {getUserName(selectedUserId)}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToCsv}
                  className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  title={t('workHours.export')}
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Calendar size={14} className="mr-1" />
                {t('workHours.shiftHistory')}
              </h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-2 px-3 text-xs text-gray-400 font-medium">{t('workHours.date')}</th>
                      <th className="py-2 px-3 text-xs text-gray-400 font-medium">{t('workHours.shift')}</th>
                      <th className="py-2 px-3 text-xs text-gray-400 font-medium">{t('workHours.startTime')}</th>
                      <th className="py-2 px-3 text-xs text-gray-400 font-medium">{t('workHours.endTime')}</th>
                      <th className="py-2 px-3 text-xs text-gray-400 font-medium">{t('workHours.duration')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLogs.map(log => (
                      <tr key={log.id} className="border-b border-gray-700">
                        <td className="py-2 px-3 text-sm">{formatDate(log.shiftDate)}</td>
                        <td className="py-2 px-3 text-sm">{log.shiftTime}</td>
                        <td className="py-2 px-3 text-sm">{formatTime(log.startTime)}</td>
                        <td className="py-2 px-3 text-sm">
                          {log.endTime ? formatTime(log.endTime) : '-'}
                        </td>
                        <td className="py-2 px-3 text-sm">
                          {log.totalMinutes ? formatMinutes(log.totalMinutes) : '-'}
                        </td>
                      </tr>
                    ))}
                    
                    {userLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-400 text-sm">
                          {t('workHours.noShifts')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => setShowUserDetails(false)}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                {t('workHours.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 