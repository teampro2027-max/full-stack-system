import React from 'react';
import { Globe } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../context/I18nContext';

const langs = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'so', name: 'Somali', native: 'Af-Soomaali', flag: '🇸🇴' },
];

const LanguageSettings = () => {
  const { language, setLanguage } = useStore();
  const { t } = useI18n();
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('languageSettings')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Select the system language for the admin panel</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {langs.map(lang => (
          <button key={lang.code} onClick={() => setLanguage(lang.code)} className={`card text-left flex items-center gap-4 transition-all hover:shadow-md border-2 ${language === lang.code ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent'}`}>
            <div className="text-4xl">{lang.flag}</div>
            <div className="flex-1">
              <p className="font-semibold">{lang.name}</p>
              <p className="text-xs text-slate-400">{lang.native}</p>
            </div>
            {language === lang.code && <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
          </button>
        ))}
      </div>
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Globe size={16} className="text-indigo-600"/>Translation Preview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">English</p>
            <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
              <p>Dashboard</p><p>User Management</p><p>Bills Management</p><p>Reports & Analytics</p><p>System Settings</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
            <p className="text-xs font-semibold text-indigo-400 mb-2 uppercase">Af-Soomaali</p>
            <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
              <p>Shabakada</p><p>Maaraynta Isticmaalayaasha</p><p>Maaraynta Biilasha</p><p>Warbixinnada & Falanqaynta</p><p>Goobaha Nidaamka</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;
