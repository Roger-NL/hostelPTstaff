import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { format } from 'date-fns';
import { 
  User, 
  Shield, 
  ShieldOff, 
  Eye, 
  EyeOff, 
  Search, 
  Download, 
  ArrowDownUp,
  Copy
} from 'lucide-react';

export default function UserManagement() {
  const { users = [], user: currentUser } = useStore();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'arrivalDate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Verificar se o usuário atual é administrador
  const isAdmin = currentUser?.role === 'admin';
  
  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);
  
  // Função para exportar dados para CSV
  const exportToCsv = () => {
    const headers = ['Nome', 'Email', 'Senha', 'Função', 'País', 'Idade', 'Estado Civil', 'Gênero', 'Telefone', 'Data de Chegada', 'Data de Saída', 'Pontos'];
    
    // Mapear usuários para rows do CSV
    const rows = filteredUsers.map(user => [
      user.name,
      user.email,
      user.password,
      user.role,
      user.country,
      user.age,
      user.relationshipStatus,
      user.gender,
      user.phone,
      user.arrivalDate,
      user.departureDate,
      user.points
    ]);
    
    // Combinar cabeçalhos e linhas
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Função para copiar texto para o clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Poderia mostrar um toast aqui
      console.log('Texto copiado para a área de transferência');
    });
  };
  
  // Filtrar e ordenar usuários
  const filteredUsers = users
    .filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.country?.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'email':
          valueA = a.email.toLowerCase();
          valueB = b.email.toLowerCase();
          break;
        case 'role':
          valueA = a.role;
          valueB = b.role;
          break;
        case 'arrivalDate':
          valueA = a.arrivalDate || '';
          valueB = b.arrivalDate || '';
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  
  // Alternar ordem de classificação
  const toggleSort = (field: 'name' | 'email' | 'role' | 'arrivalDate') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  // Formatador de data
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-red-400 mb-2">{t('common.accessDenied')}</h2>
        <p className="text-gray-400">{t('common.adminOnly')}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex flex-col h-full">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-blue-300">{t('userManagement.title')}</h2>
            <p className="text-sm text-gray-400">{t('userManagement.description')}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('userManagement.searchUsers')}
                className="pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
              />
            </div>
            
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              title={showPasswords ? t('userManagement.hidePasswords') : t('userManagement.showPasswords')}
            >
              {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            
            <button
              onClick={exportToCsv}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              title={t('userManagement.export')}
            >
              <Download size={18} />
            </button>
          </div>
        </div>
        
        {/* Tabela de usuários */}
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden flex-1 min-h-0">
          <div className="overflow-x-auto h-full">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="py-3 px-4 text-left">
                    <button 
                      onClick={() => toggleSort('name')} 
                      className="text-xs text-gray-400 font-medium flex items-center gap-1"
                    >
                      {t('userManagement.name')}
                      {sortBy === 'name' && (
                        <ArrowDownUp size={14} className={`ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <button 
                      onClick={() => toggleSort('email')} 
                      className="text-xs text-gray-400 font-medium flex items-center gap-1"
                    >
                      {t('userManagement.email')}
                      {sortBy === 'email' && (
                        <ArrowDownUp size={14} className={`ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs text-gray-400 font-medium">{t('userManagement.password')}</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <button 
                      onClick={() => toggleSort('role')} 
                      className="text-xs text-gray-400 font-medium flex items-center gap-1"
                    >
                      {t('userManagement.role')}
                      {sortBy === 'role' && (
                        <ArrowDownUp size={14} className={`ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs text-gray-400 font-medium">{t('userManagement.country')}</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs text-gray-400 font-medium">{t('userManagement.phone')}</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <button 
                      onClick={() => toggleSort('arrivalDate')} 
                      className="text-xs text-gray-400 font-medium flex items-center gap-1"
                    >
                      {t('userManagement.arrivalDate')}
                      {sortBy === 'arrivalDate' && (
                        <ArrowDownUp size={14} className={`ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs text-gray-400 font-medium">{t('userManagement.departureDate')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      <div className="flex justify-center">
                        <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="mt-2">{t('common.loading')}</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      {searchTerm ? t('userManagement.noSearchResults') : t('userManagement.noUsers')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white font-medium shadow-lg">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <p className="text-sm text-gray-300">{user.email}</p>
                          <button 
                            onClick={() => copyToClipboard(user.email)} 
                            className="text-gray-500 hover:text-gray-300"
                            title={t('userManagement.copy')}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <p className="text-sm text-gray-300">
                            {showPasswords ? user.password : '••••••••'}
                          </p>
                          <button 
                            onClick={() => copyToClipboard(user.password)} 
                            className="text-gray-500 hover:text-gray-300"
                            title={t('userManagement.copy')}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs gap-1 ${
                          user.role === 'admin' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-700/50 text-gray-300'
                        }`}>
                          {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                          {user.role === 'admin' ? t('roles.admin') : t('roles.user')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-300">{user.country || '-'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-300">{user.phone || '-'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-300">{formatDate(user.arrivalDate)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-300">{formatDate(user.departureDate)}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 