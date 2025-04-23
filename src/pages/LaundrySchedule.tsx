import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { PlusCircle, X, AlertCircle, Trash2, Loader2, Check, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, parse, addDays } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { 
  loadLaundrySchedule,
  addLaundryReservation,
  removeLaundryReservation,
  LaundryScheduleData,
  LaundrySlot
} from '../services/laundry.service';

export default function LaundrySchedule() {
  const { t, language } = useTranslation();
  const { user } = useStore();
  
  const [schedule, setSchedule] = useState<LaundryScheduleData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState<{
    date: string;
    slot: 'morning' | 'afternoon' | 'evening';
    name: string;
    isStaff: boolean;
  }>({
    date: '',
    slot: 'morning',
    name: '',
    isStaff: false
  });

  const dateLocale = language === 'pt' ? ptBR : enUS;

  // Função para carregar a escala
  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const scheduleData = await loadLaundrySchedule();
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Erro ao carregar escala de lavagem:', error);
      toast.error(t('errors.loadingFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Carregar a escala ao montar o componente
  useEffect(() => {
    fetchSchedule();
  }, []);

  // Adicionar reserva de lavagem
  const handleAddReservation = async () => {
    if (!modalState.name.trim()) {
      toast.error(t('laundry.nameRequired'));
      return;
    }

    setSaving(true);
    const toastId = toast.loading(
      t('laundry.addingReservation')
        .replace('{name}', modalState.name)
        .replace('{slot}', t(`laundry.slots.${modalState.slot}`))
    );

    try {
      await addLaundryReservation(
        modalState.date,
        modalState.slot,
        modalState.name,
        modalState.isStaff
      );
      
      // Atualizar o estado local
      const updatedSchedule = { ...schedule };
      if (!updatedSchedule[modalState.date]) {
        updatedSchedule[modalState.date] = {};
      }
      updatedSchedule[modalState.date][modalState.slot] = {
        name: modalState.name,
        isStaff: modalState.isStaff,
        timestamp: Date.now()
      };
      
      setSchedule(updatedSchedule);
      toast.success(
        t('laundry.reservationAdded')
          .replace('{name}', modalState.name)
          .replace('{slot}', t(`laundry.slots.${modalState.slot}`)),
        { id: toastId }
      );
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao adicionar reserva:', error);
      toast.error(t('errors.savingFailed'), { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Remover reserva de lavagem
  const handleRemoveReservation = async (date: string, slot: string, name: string) => {
    const toastId = toast.loading(
      t('laundry.removingReservation')
        .replace('{name}', name)
        .replace('{slot}', t(`laundry.slots.${slot}`))
    );

    try {
      await removeLaundryReservation(
        date,
        slot as 'morning' | 'afternoon' | 'evening'
      );
      
      // Atualizar o estado local
      const updatedSchedule = { ...schedule };
      if (updatedSchedule[date] && updatedSchedule[date][slot as keyof typeof updatedSchedule[string]]) {
        delete updatedSchedule[date][slot as keyof typeof updatedSchedule[string]];
        
        // Se não houver mais reservas para esta data, remover a data
        if (Object.keys(updatedSchedule[date]).length === 0) {
          delete updatedSchedule[date];
        }
      }
      
      setSchedule(updatedSchedule);
      toast.success(
        t('laundry.reservationRemoved')
          .replace('{name}', name)
          .replace('{slot}', t(`laundry.slots.${slot}`)),
        { id: toastId }
      );
    } catch (error) {
      console.error('Erro ao remover reserva:', error);
      toast.error(t('errors.savingFailed'), { id: toastId });
    }
  };

  // Abrir modal para adicionar reserva
  const openAddModal = (date: string, slot: 'morning' | 'afternoon' | 'evening') => {
    setModalState({
      date,
      slot,
      name: '',
      isStaff: false
    });
    setShowModal(true);
  };

  // Gerar datas para exibir (atual + próximos 6 dias)
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(selectedDate, i));
    }
    return dates;
  };

  // Renderiza a escala para uma semana
  return (
    <div className="w-full h-full relative overflow-auto">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-orange-500" size={32} />
          <span className="ml-2 text-orange-600">{t('common.loading')}</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controlador de data */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h2 className="text-lg font-medium text-orange-700">
              {t('laundry.title')}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1.5 bg-white rounded-lg text-sm shadow-sm hover:bg-orange-50 text-orange-600 hover:text-orange-700 border border-orange-100 transition-colors"
              >
                {t('common.today')}
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                className="px-3 py-1.5 bg-white rounded-lg text-sm shadow-sm hover:bg-orange-50 text-orange-600 hover:text-orange-700 border border-orange-100 transition-colors"
              >
                {t('common.previousWeek')}
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                className="px-3 py-1.5 bg-white rounded-lg text-sm shadow-sm hover:bg-orange-50 text-orange-600 hover:text-orange-700 border border-orange-100 transition-colors"
              >
                {t('common.nextWeek')}
              </button>
            </div>
          </div>

          {/* Tabela de escala */}
          <div className="overflow-x-auto border border-orange-100 rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-orange-100">
              <thead className="bg-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-600 uppercase tracking-wider">
                    {t('laundry.slots.header')}
                  </th>
                  {generateDates().map((date) => (
                    <th key={date.toString()} className="px-4 py-3 text-left text-xs font-medium text-orange-600 uppercase tracking-wider">
                      <div className="flex flex-col">
                        <span>{format(date, 'EEEE', { locale: dateLocale })}</span>
                        <span className="font-semibold">{format(date, 'dd/MM', { locale: dateLocale })}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white/90 divide-y divide-orange-100">
                {['morning', 'afternoon', 'evening'].map((slot) => (
                  <tr key={slot} className="divide-x divide-orange-100">
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-orange-700">
                      {t(`laundry.slots.${slot}`)}
                    </td>
                    {generateDates().map((date) => {
                      const dateKey = format(date, 'yyyy-MM-dd');
                      const slotData = schedule[dateKey]?.[slot as keyof typeof schedule[string]];
                      
                      return (
                        <td key={`${dateKey}-${slot}`} className="px-4 py-4 text-sm">
                          {slotData ? (
                            <div className={`rounded-lg p-2 ${slotData.isStaff ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-orange-100'}`}>
                              <div className="flex justify-between items-center">
                                <span className="font-medium truncate max-w-[120px] text-orange-700" title={slotData.name}>
                                  {slotData.name}
                                </span>
                                <button
                                  onClick={() => handleRemoveReservation(dateKey, slot, slotData.name)}
                                  className="text-red-500 hover:text-red-600"
                                  title={t('common.remove')}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="text-xs text-orange-500 mt-1">
                                {slotData.isStaff ? t('laundry.staff') : t('laundry.guest')}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAddModal(dateKey, slot as 'morning' | 'afternoon' | 'evening')}
                              className="w-full h-16 flex items-center justify-center text-orange-500 hover:text-orange-600 rounded-lg border border-dashed border-orange-200 hover:border-orange-300 bg-transparent hover:bg-orange-50/50 transition-colors"
                            >
                              <PlusCircle size={20} />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 mr-2"></div>
              <span className="text-gray-600 dark:text-gray-300">{t('laundry.guest')}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 mr-2"></div>
              <span className="text-gray-600 dark:text-gray-300">{t('laundry.staff')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal para adicionar reserva */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md mx-auto p-6 border border-orange-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-orange-700">
                  {t('laundry.addReservation')}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-orange-500 hover:text-orange-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-orange-600 mb-1">
                    {t('laundry.date')}
                  </label>
                  <div className="text-orange-700 font-medium">
                    {format(parse(modalState.date, 'yyyy-MM-dd', new Date()), 'PPPP', { locale: dateLocale })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-orange-600 mb-1">
                    {t('laundry.slot')}
                  </label>
                  <div className="text-orange-700 font-medium">
                    {t(`laundry.slots.${modalState.slot}`)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-orange-600 mb-1">
                    {t('laundry.name')}
                  </label>
                  <input 
                    type="text"
                    value={modalState.name}
                    onChange={(e) => setModalState({ ...modalState, name: e.target.value })}
                    className="w-full p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-orange-700"
                    placeholder={t('laundry.namePlaceholder')}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isStaff"
                    checked={modalState.isStaff}
                    onChange={(e) => setModalState({ ...modalState, isStaff: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isStaff" className="ml-2 text-sm text-orange-600">
                    {t('laundry.isStaff')}
                  </label>
                </div>
                
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm rounded-lg mr-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleAddReservation}
                    disabled={saving}
                    className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center min-w-[80px]"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      t('common.save')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 