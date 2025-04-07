import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { 
  Award, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Filter, 
  ChevronDown,
  Calendar,
  Clock,
  Search,
  AlignJustify
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { firestore as db } from '../config/firebase';
import PageHeader from '../components/PageHeader';

interface PointsHistory {
  id: string;
  userId: string;
  points: number;
  reason: string;
  source: 'task' | 'event' | 'reward' | 'purchase';
  sourceId?: string;
  sourceName?: string;
  createdAt: Timestamp;
  status: 'earned' | 'spent';
}

export default function Points() {
  const { user } = useStore();
  const { t, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PointsHistory[]>([]);
  const [filter, setFilter] = useState<'all' | 'earned' | 'spent'>('all');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  
  const locales = {
    'pt-BR': ptBR,
    'en-US': enUS
  };
  
  // Carregar histórico de pontos do Firebase
  useEffect(() => {
    const loadPointsHistory = async () => {
      setIsLoading(true);
      
      try {
        if (!user?.id) return;
        
        const pointsRef = collection(db, 'pointsHistory');
        const q = query(
          pointsRef,
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        
        const snapshot = await getDocs(q);
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PointsHistory[];
        
        // Se não houver dados, criar dados de exemplo
        if (history.length === 0) {
          const mockData = generateMockData();
          setPointsHistory(mockData);
          setFilteredHistory(mockData);
        } else {
          setPointsHistory(history);
          setFilteredHistory(history);
        }
      } catch (error) {
        console.error('Error loading points history:', error);
        // Criar dados de exemplo em caso de erro
        const mockData = generateMockData();
        setPointsHistory(mockData);
        setFilteredHistory(mockData);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPointsHistory();
  }, [user?.id]);
  
  // Filtrar histórico ao mudar filtro
  useEffect(() => {
    if (filter === 'all') {
      setFilteredHistory([...pointsHistory].sort((a, b) => {
        const dateA = a.createdAt.toMillis();
        const dateB = b.createdAt.toMillis();
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      }));
    } else {
      setFilteredHistory(
        pointsHistory
          .filter(item => item.status === filter)
          .sort((a, b) => {
            const dateA = a.createdAt.toMillis();
            const dateB = b.createdAt.toMillis();
            return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
          })
      );
    }
  }, [filter, pointsHistory, sortDirection]);
  
  // Função para formatar data
  const formatDate = (timestamp: Timestamp) => {
    return format(timestamp.toDate(), 'PPP', { 
      locale: locales[language as keyof typeof locales] 
    });
  };
  
  // Calcular totais
  const totalPoints = user?.points || 0;
  const totalEarned = pointsHistory
    .filter(item => item.status === 'earned')
    .reduce((sum, item) => sum + item.points, 0);
  const totalSpent = pointsHistory
    .filter(item => item.status === 'spent')
    .reduce((sum, item) => sum + item.points, 0);
  
  // Função para gerar dados de exemplo
  const generateMockData = (): PointsHistory[] => {
    const now = new Date();
    const mockData: PointsHistory[] = [];
    
    // Tarefas concluídas
    for (let i = 0; i < 5; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const points = Math.floor(Math.random() * 15) + 5;
      
      mockData.push({
        id: `task-${i}`,
        userId: user?.id || '',
        points,
        reason: 'Task completed',
        source: 'task',
        sourceId: `task-${i}`,
        sourceName: `Example Task ${i + 1}`,
        createdAt: Timestamp.fromDate(date),
        status: 'earned'
      });
    }
    
    // Pontos gastos
    for (let i = 0; i < 3; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const points = Math.floor(Math.random() * 10) + 5;
      
      mockData.push({
        id: `purchase-${i}`,
        userId: user?.id || '',
        points,
        reason: 'Points redeemed',
        source: 'purchase',
        sourceId: `purchase-${i}`,
        sourceName: `Example Reward ${i + 1}`,
        createdAt: Timestamp.fromDate(date),
        status: 'spent'
      });
    }
    
    return mockData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  };
  
  return (
    <div className="page-container flex flex-col">
      <PageHeader title="Points History" />
      
      <div className="page-content bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 xs:p-4 sm:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="text-blue-400" size={20} />
                <h3 className="text-sm font-medium text-white">Total Points</h3>
              </div>
              <span className="text-xl font-semibold text-white">{totalPoints}</span>
            </div>
          </div>
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-green-400" size={20} />
                <h3 className="text-sm font-medium text-white">Points Earned</h3>
              </div>
              <span className="text-xl font-semibold text-green-400">+{totalEarned}</span>
            </div>
          </div>
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="text-red-400" size={20} />
                <h3 className="text-sm font-medium text-white">Points Spent</h3>
              </div>
              <span className="text-xl font-semibold text-red-400">-{totalSpent}</span>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <span className="text-sm text-white">Filter:</span>
            <div className="relative">
              <button
                className="flex items-center gap-1 bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg"
                onClick={() => setFilter(filter === 'all' ? 'earned' : filter === 'earned' ? 'spent' : 'all')}
              >
                {filter === 'all' ? 'All' : filter === 'earned' ? 'Earned' : 'Spent'}
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
          
          <button
            className="flex items-center gap-1 bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg"
            onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
          >
            <Calendar size={16} />
            <span>{sortDirection === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
        
        {/* Points History List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Award size={40} className="text-gray-500 mb-4" />
            <h3 className="text-lg font-light text-white mb-1">No Points History</h3>
            <p className="text-sm text-gray-400 max-w-md">
              Complete tasks and participate in events to earn points. Your points history will be shown here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map(item => (
              <div 
                key={item.id} 
                className={`bg-gray-900/60 backdrop-blur-sm rounded-lg p-3 border border-white/5 flex items-center justify-between ${
                  item.status === 'earned' ? 'hover:border-green-500/20' : 'hover:border-red-500/20'
                } transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.status === 'earned' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.status === 'earned' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{item.sourceName || item.reason}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <Calendar size={12} />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-semibold ${
                  item.status === 'earned' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {item.status === 'earned' ? '+' : '-'}{item.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 