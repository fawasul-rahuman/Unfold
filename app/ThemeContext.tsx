import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEMES = [
  { id: 'paper', label: 'Paper', bg: '#FFFFFF', text: '#000000', secondary: '#F4F4F6' },
  { id: 'sepia', label: 'Classic', bg: '#F5F2E9', text: '#433422', secondary: '#EBE7D9' },
  { id: 'midnight', label: 'OLED', bg: '#000000', text: '#FFFFFF', secondary: '#1A1A1A' },
];

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState(THEMES[0]);
  const [fontSize, setFontSize] = useState('Medium');

  // CENTRAL SCALING LOGIC - Edit these numbers to change the app globally
  const textStyles = {
    // Lowered these numbers slightly for a better balance
    headline: fontSize === 'Compact' ? 24 : fontSize === 'Large' ? 40 : 30, 
    body: fontSize === 'Compact' ? 14 : fontSize === 'Large' ? 22 : 18,
    lineHeight: fontSize === 'Compact' ? 21 : fontSize === 'Large' ? 34 : 26,
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedTheme = await AsyncStorage.getItem('@lab_theme');
    const savedSize = await AsyncStorage.getItem('@lab_fontsize');
    if (savedTheme) setTheme(JSON.parse(savedTheme));
    if (savedSize) setFontSize(savedSize);
  };

  const updateTheme = async (newTheme: any) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('@lab_theme', JSON.stringify(newTheme));
  };

  const updateFontSize = async (newSize: string) => {
    setFontSize(newSize);
    await AsyncStorage.setItem('@lab_fontsize', newSize);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, fontSize, updateFontSize, textStyles }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);