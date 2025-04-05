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
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span className="ml-2 text-gray-600 dark:text-gray-300">{t('common.loading')}</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controlador de data */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">
              {t('laundry.title')}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1.5 bg-white/90 dark:bg-gray-700/90 rounded-lg text-sm shadow hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.today')}
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                className="px-3 py-1.5 bg-white/90 dark:bg-gray-700/90 rounded-lg text-sm shadow hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.previousWeek')}
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                className="px-3 py-1.5 bg-white/90 dark:bg-gray-700/90 rounded-lg text-sm shadow hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.nextWeek')}
              </button>
            </div>
          </div>

          {/* Tabela de escala */}
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('laundry.slots.header')}
                  </th>
                  {generateDates().map((date) => (
                    <th key={date.toString()} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex flex-col">
                        <span>{format(date, 'EEEE', { locale: dateLocale })}</span>
                        <span className="font-semibold">{format(date, 'dd/MM', { locale: dateLocale })}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800/50 dark:divide-gray-700">
                {['morning', 'afternoon', 'evening'].map((slot) => (
                  <tr key={slot} className="divide-x divide-gray-200 dark:divide-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">
                      {t(`laundry.slots.${slot}`)}
                    </td>
                    {generateDates().map((date) => {
                      const dateKey = format(date, 'yyyy-MM-dd');
                      const slotData = schedule[dateKey]?.[slot as keyof typeof schedule[string]];
                      
                      return (
                        <td key={`${dateKey}-${slot}`} className="px-4 py-4 text-sm">
                          {slotData ? (
                            <div className={`rounded-lg p-2 ${slotData.isStaff ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                              <div className="flex justify-between items-center">
                                <span className="font-medium truncate max-w-[120px]" title={slotData.name}>
                                  {slotData.name}
                                </span>
                                <button
                                  onClick={() => handleRemoveReservation(dateKey, slot, slotData.name)}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  title={t('common.remove')}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {slotData.isStaff ? t('laundry.staff') : t('laundry.guest')}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAddModal(dateKey, slot as 'morning' | 'afternoon' | 'evening')}
                              className="w-full h-full flex items-center justify-center p-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                            >
                              <PlusCircle size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                              <span className="ml-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                                {t('laundry.add')}
                              </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md relative border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
              {t('laundry.addReservation')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('laundry.guestName')}
                </label>
                <input
                  type="text"
                  id="name"
                  value={modalState.name}
                  onChange={(e) => setModalState({...modalState, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('laundry.guestNamePlaceholder')}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isStaff"
                  checked={modalState.isStaff}
                  onChange={(e) => setModalState({...modalState, isStaff: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="isStaff" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('laundry.isStaff')}
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('laundry.slot')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['morning', 'afternoon', 'evening'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setModalState({...modalState, slot: slot as 'morning' | 'afternoon' | 'evening'})}
                      className={`p-2 text-sm rounded-lg transition-colors
                        ${modalState.slot === slot 
                          ? 'bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300 border-2 border-blue-500' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent'}`}
                    >
                      {t(`laundry.slots.${slot}`)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  {t('laundry.reservationSummary')}
                  <br />
                  <span className="font-medium">
                    {format(parse(modalState.date, 'yyyy-MM-dd', new Date()), 'EEEE, dd/MM', { locale: dateLocale })} - {t(`laundry.slots.${modalState.slot}`)}
                  </span>
                </span>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddReservation}
                  disabled={saving || !modalState.name.trim()}
                  className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center
                    ${saving 
                      ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed' 
                      : !modalState.name.trim()
                        ? 'bg-blue-300 dark:bg-blue-600 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'}`}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      {t('common.saving')}
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {t('common.save')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 