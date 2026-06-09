import React, { createContext, useContext } from 'react';
import { translations } from '../i18n/translations';
import { useStore } from '../store/useStore';

const I18nContext = createContext({ t: (k) => k, language: 'en' });

export const I18nProvider = ({ children }) => {
  const language = useStore((s) => s.language);
  const t = (key) => translations[language]?.[key] ?? key;
  return (
    <I18nContext.Provider value={{ t, language }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
