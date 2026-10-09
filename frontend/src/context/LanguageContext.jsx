import { createContext, useContext, useState } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem('app_language') || 'English');

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key) => {
    // Default to English if language or key doesn't exist
    const langDict = translations[language] || translations['English'];
    return langDict[key] || translations['English'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    console.error("useLanguage must be used within a LanguageProvider");
    return { 
      language: 'English', 
      setLanguage: () => {}, 
      t: (k) => k 
    };
  }
  return context;
};
