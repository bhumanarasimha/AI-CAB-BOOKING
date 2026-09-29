import React, { createContext, useContext, useState } from 'react';
import { theme } from '../theme/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentThemeKey, setCurrentThemeKey] = useState('dark-ai');

  return (
    <ThemeContext.Provider value={{ theme, currentThemeKey, setCurrentThemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
