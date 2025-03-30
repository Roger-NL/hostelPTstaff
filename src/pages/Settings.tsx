import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Bell, Globe, Lock, Moon, Sun, Clock, Calendar, Shield, Users, ClipboardList, PartyPopper, PenTool as Tool, AlertTriangle, CheckCircle, Info, User } from 'lucide-react';
import type { UserSettings, SystemSettings } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { firestore } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const timezones = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Lisbon',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney'
];

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-gray-600'
        }`}>
          <div className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          } mt-1`} />
        </div>
      </div>
      <div>
        <div className="text-white group-hover:text-blue-400 transition-colors">
          {label}
        </div>
        {description && (
          <div className="text-sm text-gray-400">{description}</div>
        )}
      </div>
    </label>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { user, theme, setTheme, setLanguage } = useStore();
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      browser: true,
      tasks: true,
      events: true,
      schedule: true
    },
    preferences: {
      language: 'en',
      theme: 'dark',
      timezone: 'UTC',
      dateFormat: 'MM/dd/yyyy' as 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd',
      timeFormat: '24h'
    },
    privacy: {
      showProfile: true,
      showPoints: true,
      showActivity: true
    }
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenance: {
      enabled: false,
      message: 'System maintenance in progress. Please try again later.',
      scheduledStart: '',
      scheduledEnd: ''
    },
    registration: {
      enabled: true,
      requireApproval: true,
      allowedDomains: []
    },
    tasks: {
      maxPointsPerTask: 100,
      requireApproval: true,
      allowSelfAssign: true
    },
    events: {
      maxCapacity: 100,
      requireApproval: true,
      allowSelfOrganize: false
    }
  });

  const [newDomain, setNewDomain] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState({
    start: '',
    end: ''
  });

  const handleNotificationChange = (key: keyof UserSettings['notifications'], value: boolean) => {
    setUserSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handlePrivacyChange = (key: keyof UserSettings['privacy'], value: boolean) => {
    setUserSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as 'light' | 'dark');
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as 'en' | 'pt');
  };

  const handleAddDomain = () => {
    if (newDomain && !systemSettings.registration.allowedDomains.includes(newDomain)) {
      setSystemSettings(prev => ({
        ...prev,
        registration: {
          ...prev.registration,
          allowedDomains: [...prev.registration.allowedDomains, newDomain]
        }
      }));
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setSystemSettings(prev => ({
      ...prev,
      registration: {
        ...prev.registration,
        allowedDomains: prev.registration.allowedDomains.filter(d => d !== domain)
      }
    }));
  };

  const handleMaintenanceChange = (enabled: boolean) => {
    setSystemSettings(prev => ({
      ...prev,
      maintenance: {
        ...prev.maintenance,
        enabled,
        scheduledStart: enabled ? maintenanceDate.start : undefined,
        scheduledEnd: enabled ? maintenanceDate.end : undefined
      }
    }));
  };

  return (
    <div className="space-y-6">
      {user?.role === 'admin' && (
        <SettingsSection title={t('settings.title')} icon={<Shield className="text-purple-500" size={24} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sistema */}
            <div>
              <h3 className="text-lg text-white/90 mb-4">{t('settings.system')}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 mb-1">{t('settings.maintenance.title')}</label>
                  <Toggle 
                    checked={systemSettings.maintenance.enabled}
                    onChange={handleMaintenanceChange}
                    label={t('settings.maintenance.enable')}
                    description={t('settings.maintenance.description')}
                  />
                </div>
                
                {systemSettings.maintenance.enabled && (
                  <div className="ml-6 space-y-3 pt-2 border-l-2 border-gray-700 pl-4">
                    <div>
                      <label className="block text-white/70 mb-1">{t('settings.maintenance.message')}</label>
                      <textarea
                        className="w-full rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                        value={systemSettings.maintenance.message}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          maintenance: {
                            ...prev.maintenance,
                            message: e.target.value
                          }
                        }))}
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/70 mb-1">{t('settings.maintenance.start')}</label>
                        <input
                          type="datetime-local"
                          className="w-full rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                          value={maintenanceDate.start}
                          onChange={(e) => setMaintenanceDate(prev => ({
                            ...prev,
                            start: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">{t('settings.maintenance.end')}</label>
                        <input
                          type="datetime-local"
                          className="w-full rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                          value={maintenanceDate.end}
                          onChange={(e) => setMaintenanceDate(prev => ({
                            ...prev,
                            end: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <h4 className="text-white/70 mb-3">{t('settings.registration.title')}</h4>
                <div className="space-y-3">
                  <Toggle
                    checked={systemSettings.registration.enabled}
                    onChange={(enabled) => setSystemSettings(prev => ({
                      ...prev,
                      registration: { ...prev.registration, enabled }
                    }))}
                    label={t('settings.registration.enable')}
                  />
                  
                  <Toggle
                    checked={systemSettings.registration.requireApproval}
                    onChange={(requireApproval) => setSystemSettings(prev => ({
                      ...prev,
                      registration: { ...prev.registration, requireApproval }
                    }))}
                    label={t('settings.registration.requireApproval')}
                  />
                  
                  <div>
                    <label className="block text-white/70 mb-1">{t('settings.registration.allowedDomains')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="example.com"
                      />
                      <button
                        onClick={handleAddDomain}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        {t('settings.add')}
                      </button>
                    </div>
                    
                    {systemSettings.registration.allowedDomains.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {systemSettings.registration.allowedDomains.map(domain => (
                          <div key={domain} className="px-2 py-1 bg-gray-700 text-white rounded-lg flex items-center gap-2">
                            <span>{domain}</span>
                            <button
                              onClick={() => handleRemoveDomain(domain)}
                              className="text-white/60 hover:text-white"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Configurações de Tarefas e Eventos */}
            <div>
              <h3 className="text-lg text-white/90 mb-4">{t('taskManagement')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-white/70 mb-1">{t('settings.tasks.maxPoints')}</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    className="w-full rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                    value={systemSettings.tasks.maxPointsPerTask}
                    onChange={(e) => setSystemSettings(prev => ({
                      ...prev,
                      tasks: {
                        ...prev.tasks,
                        maxPointsPerTask: parseInt(e.target.value) || 0
                      }
                    }))}
                  />
                </div>
                
                <Toggle
                  checked={systemSettings.tasks.requireApproval}
                  onChange={(requireApproval) => setSystemSettings(prev => ({
                    ...prev,
                    tasks: { ...prev.tasks, requireApproval }
                  }))}
                  label={t('settings.tasks.requireApproval')}
                />
                
                <Toggle
                  checked={systemSettings.tasks.allowSelfAssign}
                  onChange={(allowSelfAssign) => setSystemSettings(prev => ({
                    ...prev,
                    tasks: { ...prev.tasks, allowSelfAssign }
                  }))}
                  label={t('settings.tasks.allowSelfAssign')}
                />
              </div>
              
              <h3 className="text-lg text-white/90 mt-6 mb-4">{t('events.title')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-white/70 mb-1">{t('settings.events.maxCapacity')}</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    className="w-full rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                    value={systemSettings.events.maxCapacity}
                    onChange={(e) => setSystemSettings(prev => ({
                      ...prev,
                      events: {
                        ...prev.events,
                        maxCapacity: parseInt(e.target.value) || 0
                      }
                    }))}
                  />
                </div>
                
                <Toggle
                  checked={systemSettings.events.requireApproval}
                  onChange={(requireApproval) => setSystemSettings(prev => ({
                    ...prev,
                    events: { ...prev.events, requireApproval }
                  }))}
                  label={t('settings.events.requireApproval')}
                />
                
                <Toggle
                  checked={systemSettings.events.allowSelfOrganize}
                  onChange={(allowSelfOrganize) => setSystemSettings(prev => ({
                    ...prev,
                    events: { ...prev.events, allowSelfOrganize }
                  }))}
                  label={t('settings.events.allowSelfOrganize')}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              {t('settings.saveChanges')}
            </button>
          </div>
        </SettingsSection>
      )}
      
      {/* Configurações do Usuário */}
      <SettingsSection title={t('settings.userSettings')} icon={<User className="text-blue-500" size={24} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preferências */}
          <div>
            <h3 className="text-lg text-white/90 mb-4">{t('settings.preferences.title')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 mb-1">{t('settings.preferences.theme')}</label>
                <select 
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                  value={theme}
                  onChange={handleThemeChange}
                >
                  <option value="light">{t('settings.preferences.lightTheme')}</option>
                  <option value="dark">{t('settings.preferences.darkTheme')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white/70 mb-1">{t('settings.preferences.language')}</label>
                <select 
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                  onChange={handleLanguageChange}
                >
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white/70 mb-1">{t('settings.preferences.timezone')}</label>
                <select 
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                  value={userSettings.preferences.timezone}
                  onChange={(e) => setUserSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, timezone: e.target.value }
                  }))}
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-white/70 mb-1">{t('settings.preferences.dateFormat')}</label>
                <select 
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                  value={userSettings.preferences.dateFormat}
                  onChange={(e) => setUserSettings(prev => ({
                    ...prev,
                    preferences: { 
                      ...prev.preferences, 
                      dateFormat: e.target.value as 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd'
                    }
                  }))}
                >
                  <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                  <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                  <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white/70 mb-1">{t('settings.preferences.timeFormat')}</label>
                <select 
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 px-3 py-2 text-white"
                  value={userSettings.preferences.timeFormat}
                  onChange={(e) => setUserSettings(prev => ({
                    ...prev,
                    preferences: { 
                      ...prev.preferences, 
                      timeFormat: e.target.value as '12h' | '24h'
                    }
                  }))}
                >
                  <option value="12h">12h (AM/PM)</option>
                  <option value="24h">24h</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Notificações e Privacidade */}
          <div>
            <h3 className="text-lg text-white/90 mb-4">{t('settings.notifications.title')}</h3>
            <div className="space-y-3">
              <Toggle
                checked={userSettings.notifications.email}
                onChange={(checked) => handleNotificationChange('email', checked)}
                label={t('settings.notifications.email')}
              />
              
              <Toggle
                checked={userSettings.notifications.browser}
                onChange={(checked) => handleNotificationChange('browser', checked)}
                label={t('settings.notifications.browser')}
              />
              
              <Toggle
                checked={userSettings.notifications.tasks}
                onChange={(checked) => handleNotificationChange('tasks', checked)}
                label={t('settings.notifications.tasks')}
              />
              
              <Toggle
                checked={userSettings.notifications.events}
                onChange={(checked) => handleNotificationChange('events', checked)}
                label={t('settings.notifications.events')}
              />
              
              <Toggle
                checked={userSettings.notifications.schedule}
                onChange={(checked) => handleNotificationChange('schedule', checked)}
                label={t('settings.notifications.schedule')}
              />
            </div>
            
            <h3 className="text-lg text-white/90 mt-6 mb-4">{t('settings.privacy.title')}</h3>
            <div className="space-y-3">
              <Toggle
                checked={userSettings.privacy.showProfile}
                onChange={(checked) => handlePrivacyChange('showProfile', checked)}
                label={t('settings.privacy.showProfile')}
              />
              
              <Toggle
                checked={userSettings.privacy.showPoints}
                onChange={(checked) => handlePrivacyChange('showPoints', checked)}
                label={t('settings.privacy.showPoints')}
              />
              
              <Toggle
                checked={userSettings.privacy.showActivity}
                onChange={(checked) => handlePrivacyChange('showActivity', checked)}
                label={t('settings.privacy.showActivity')}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            {t('settings.saveChanges')}
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}