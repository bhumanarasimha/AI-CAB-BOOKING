import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

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
    const cleanEmail = (email || 'bhumanarasimha25@gmail.com').trim().toLowerCase();
    try {
      const serverRes = await api.auth.login(cleanEmail, password);
      if (serverRes?.user) {
        const userData = {
          id: serverRes.user.id || serverRes.user._id,
          email: serverRes.user.email,
          name: serverRes.user.name || (cleanEmail === 'bhumanarasimha25@gmail.com' ? 'Bhumana Narasimha' : cleanEmail.split('@')[0]),
          phone: serverRes.user.phone || '+91 98765 43210',
          rating: 4.95,
          ridesCount: 42,
          savedMoney: 1840,
        };
        await AsyncStorage.setItem('smartride_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
    } catch (err) {
      console.warn('Backend login fallback to local session:', err.message);
    }

    const userData = {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      name: (cleanEmail === 'bhumanarasimha25@gmail.com' ? 'Bhumana Narasimha' : cleanEmail.split('@')[0]),
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
    try {
      const serverRes = await api.auth.register(email, password || 'demo123', name);
      if (serverRes?.user) {
        const userData = {
          id: serverRes.user.id,
          email: serverRes.user.email,
          name: serverRes.user.name || name || 'SmartRider',
          phone: phone || '+91 98765 43210',
          rating: 5.0,
          ridesCount: 0,
          savedMoney: 0,
        };
        await AsyncStorage.setItem('smartride_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
    } catch (err) {
      console.warn('Backend register fallback to local session:', err.message);
    }

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
      await AsyncStorage.multiRemove(['smartride_user', 'smartride_jwt']);
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
