import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('smartride_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load user session', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const userData = {
      id: 'usr_' + Date.now(),
      email: email || 'rider@smartride.ai',
      name: (email ? email.split('@')[0] : 'SmartRider'),
      phone: '+91 98765 43210',
      rating: 4.95,
      ridesCount: 42,
      savedMoney: 1840,
    };
    await AsyncStorage.setItem('smartride_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const signup = async (name, email, phone, password) => {
    const userData = {
      id: 'usr_' + Date.now(),
      email,
      name: name || 'SmartRider',
      phone: phone || '+91 98765 43210',
      rating: 5.0,
      ridesCount: 0,
      savedMoney: 0,
    };
    await AsyncStorage.setItem('smartride_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('smartride_user');
    } catch (e) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
