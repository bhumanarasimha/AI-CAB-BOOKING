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
          setUser({
            uid: userData._id || userData.id,
            ...userData
          });
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem('smartride_jwt');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const data = await api.auth.socialLogin(
        'google.demo@smartride.com',
        'Demo Google User',
        'google',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
      );
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user
      };
      setUser(mappedUser);
      return { user: mappedUser };
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const loginWithFacebook = async () => {
    try {
      const data = await api.auth.socialLogin(
        'facebook.demo@smartride.com',
        'Demo Facebook User',
        'facebook',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
      );
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user
      };
      setUser(mappedUser);
      return { user: mappedUser };
    } catch (error) {
      console.error("Facebook login failed:", error);
      throw error;
    }
  };

  const loginWithApple = async () => {
    try {
      const data = await api.auth.socialLogin(
        'apple.demo@smartride.com',
        'Demo Apple User',
        'apple',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
      );
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user
      };
      setUser(mappedUser);
      return { user: mappedUser };
    } catch (error) {
      console.error("Apple login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const data = await api.auth.login(email, password);
      setUser({
        uid: data.user.id || data.user._id,
        ...data.user
      });
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const registerWithEmail = async (email, password, name) => {
    try {
      const data = await api.auth.register(email, password, name);
      setUser({
        uid: data.user.id || data.user._id,
        ...data.user
      });
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('smartride_jwt');
    setUser(null);
  };

  const updateUserProfile = async (newData) => {
    try {
      const updatedUser = await api.users.updateProfile(newData);
      setUser(prev => ({
        ...prev,
        ...updatedUser,
        uid: updatedUser.id || updatedUser._id
      }));
    } catch (error) {
      console.error("Update profile failed:", error);
      throw error;
    }
  };

  const sendOtp = async (phoneNumber) => {
    // Simulated OTP verification for MongoDB flow
    console.log("Simulating OTP sending to:", phoneNumber);
    return {
      confirm: async (otpCode) => {
        if (otpCode === '123456' || otpCode === '1234') {
          // Log in as demo user or retrieve active user
          const data = await api.auth.login('demo@smartride.com', 'demo');
          const mappedUser = {
            uid: data.user.id || data.user._id,
            ...data.user
          };
          setUser(mappedUser);
          return mappedUser;
        } else {
          throw new Error("Invalid OTP code.");
        }
      }
    };
  };

  const confirmOtp = async (otpCode) => {
    if (otpCode === '123456' || otpCode === '1234') {
      const data = await api.auth.login('bhumanarasimha25@gmail.com', 'demo');
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user
      };
      setUser(mappedUser);
      return mappedUser;
    }
    throw new Error("Invalid OTP code. Please enter 123456.");
  };

  const sendPasswordReset = async (email) => {
    // Simulated password reset success
    console.log("Simulating password reset email sent to:", email);
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, 
      loginWithGoogle, loginWithFacebook, loginWithApple, 
      loginWithEmail, registerWithEmail, 
      logout, updateUserProfile,
      sendOtp, confirmOtp,
      currentLocation, setCurrentLocation,
      sendPasswordReset
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
