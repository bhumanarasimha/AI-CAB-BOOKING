import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('smartride_jwt');
      if (token) {
        try {
          const userData = await api.auth.me();
          if (userData && (userData.id || userData._id)) {
            const cleanName = userData.name || localStorage.getItem('smartride_user_name') || 'Bhumana Narasimha';
            setUser({
              uid: userData._id || userData.id,
              ...userData,
              name: cleanName
            });
            if (userData.email) {
              localStorage.setItem('smartride_user_email', userData.email);
            }
          }
        } catch (error) {
          console.warn("Token verification notice:", error);
          if (error.status === 401 || error.status === 404) {
            localStorage.removeItem('smartride_jwt');
            setUser(null);
          } else {
            const cachedEmail = localStorage.getItem('smartride_user_email') || 'bhumanarasimha25@gmail.com';
            const cachedName = localStorage.getItem('smartride_user_name') || 'Bhumana Narasimha';
            setUser({
              uid: 'cached_user',
              email: cachedEmail,
              name: cachedName
            });
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  const loginWithGoogle = async (customEmail = null, customName = null) => {
    try {
      let email = customEmail ? customEmail.trim().toLowerCase() : null;
      let name = customName ? customName.trim() : null;

      if (!email) {
        email = localStorage.getItem('smartride_user_email') || 'bhumanarasimha25@gmail.com';
      }

      if (!name) {
        const storedName = localStorage.getItem('smartride_user_name');
        if (storedName && storedName !== 'Google Rider' && storedName !== 'Google User') {
          name = storedName;
        } else {
          const handle = email.split('@')[0].replace(/[0-9]/g, '');
          if (email.toLowerCase().includes('bhumana') || handle.toLowerCase().includes('bhumana')) {
            name = 'Bhumana Narasimha';
          } else {
            name = handle.charAt(0).toUpperCase() + handle.slice(1);
          }
        }
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (name || 'Bhumana Narasimha').trim();
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=00D8FF&color=080C14`;

      const data = await api.auth.socialLogin(cleanEmail, cleanName, 'google', avatarUrl);
      const mappedUser = {
        uid: data.user?.id || data.user?._id || 'user_' + Date.now(),
        ...data.user,
        email: cleanEmail,
        name: cleanName,
        photoURL: avatarUrl
      };
      localStorage.setItem('smartride_user_email', cleanEmail);
      localStorage.setItem('smartride_user_name', cleanName);
      setUser(mappedUser);
      return { user: mappedUser };
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const data = await api.auth.login(email, password);
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = data.user?.name || localStorage.getItem('smartride_user_name') || cleanEmail.split('@')[0];
      const mappedUser = {
        uid: data.user?.id || data.user?._id || 'user_' + Date.now(),
        ...data.user,
        email: cleanEmail,
        name: cleanName
      };
      localStorage.setItem('smartride_user_email', cleanEmail);
      localStorage.setItem('smartride_user_name', cleanName);
      setUser(mappedUser);
      return mappedUser;
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const registerWithEmail = async (email, password, name, phone, otp) => {
    try {
      const data = await api.auth.register(email, password, name, phone, otp);
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
      const mappedUser = {
        uid: data.user?.id || data.user?._id || 'user_' + Date.now(),
        ...data.user,
        email: cleanEmail,
        name: cleanName
      };
      localStorage.setItem('smartride_user_email', cleanEmail);
      localStorage.setItem('smartride_user_name', cleanName);
      setUser(mappedUser);
      return mappedUser;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const sendEmailOtp = async (email, purpose = 'register') => {
    return await api.auth.sendEmailOtp(email, purpose);
  };

  const sendPasswordReset = async (email) => {
    return await api.auth.sendEmailOtp(email, 'reset');
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.warn("Logout notice:", e);
    } finally {
      localStorage.removeItem('smartride_jwt');
      localStorage.removeItem('smartride_user_email');
      localStorage.removeItem('smartride_user_name');
      setUser(null);
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const updated = await api.users.updateProfile(profileData);
      setUser(prev => ({ ...prev, ...updated }));
      if (profileData.name) {
        localStorage.setItem('smartride_user_name', profileData.name);
      }
      return updated;
    } catch (err) {
      setUser(prev => ({ ...prev, ...profileData }));
      if (profileData.name) {
        localStorage.setItem('smartride_user_name', profileData.name);
      }
      return profileData;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        currentLocation,
        setCurrentLocation,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        sendEmailOtp,
        sendPasswordReset,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
