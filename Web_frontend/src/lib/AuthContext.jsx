import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { auth } from './firebase';
import { GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    const checkUserSession = async () => {
      // Clear legacy mock demo accounts if stored
      const storedEmail = localStorage.getItem('smartride_user_email');
      if (storedEmail && (storedEmail.includes('google.demo') || storedEmail === 'demo@smartride.com')) {
        localStorage.removeItem('smartride_user_email');
        localStorage.removeItem('smartride_jwt');
      }

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
      let email = null;
      let name = null;
      let photoURL = null;

      // 1. Attempt real Firebase Google Auth popup if configured
      if (auth) {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const result = await signInWithPopup(auth, provider);
          if (result && result.user) {
            email = result.user.email;
            name = result.user.displayName;
            photoURL = result.user.photoURL;
          }
        } catch (fbErr) {
          console.warn("Firebase Google popup notice:", fbErr);
          if (fbErr.code === 'auth/popup-closed-by-user' || fbErr.code === 'auth/cancelled-popup-request') {
            throw new Error('Google sign-in was cancelled.');
          }
        }
      }

      // 2. If Firebase popup was not completed (missing keys, WebView, or domain whitelist), sign in with original email
      if (!email) {
        let defaultEmail = localStorage.getItem('smartride_user_email') || 'bhumanarasimha25@gmail.com';
        if (defaultEmail.includes('demo')) {
          defaultEmail = 'bhumanarasimha25@gmail.com';
        }

        const enteredEmail = window.prompt(
          'Sign in with Google Account:\nEnter your Google Email address:',
          defaultEmail
        );
        if (!enteredEmail) {
          return null; // User cancelled prompt
        }
        email = enteredEmail.trim();
        name = email.toLowerCase() === 'bhumanarasimha25@gmail.com' ? 'Bhumana Narasimha' : email.split('@')[0];
      }

      localStorage.setItem('smartride_user_email', email);

      // 3. Connect to backend with real user email
      const data = await api.auth.socialLogin(
        email,
        name || (email.toLowerCase() === 'bhumanarasimha25@gmail.com' ? 'Bhumana Narasimha' : email.split('@')[0]),
        'google',
        photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=00D8FF&color=080C14`
      );

      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user,
        email: email,
        name: name || data.user.name,
        photoURL: photoURL || data.user.photoURL
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
      let email = null;
      let name = null;
      let photoURL = null;

      if (auth) {
        try {
          const provider = new FacebookAuthProvider();
          const result = await signInWithPopup(auth, provider);
          if (result && result.user) {
            email = result.user.email;
            name = result.user.displayName;
            photoURL = result.user.photoURL;
          }
        } catch (fbErr) {
          console.warn("Firebase Facebook popup notice:", fbErr);
        }
      }

      if (!email) {
        const enteredEmail = window.prompt('Sign in with Facebook: Enter your email:');
        if (!enteredEmail) return null;
        email = enteredEmail.trim();
        name = email.split('@')[0];
      }

      const data = await api.auth.socialLogin(
        email,
        name || 'Facebook User',
        'facebook',
        photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=6366F1&color=ffffff`
      );
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user,
        email,
        name: name || data.user.name
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
      let email = null;
      let name = null;

      if (auth) {
        try {
          const provider = new OAuthProvider('apple.com');
          const result = await signInWithPopup(auth, provider);
          if (result && result.user) {
            email = result.user.email;
            name = result.user.displayName;
          }
        } catch (fbErr) {
          console.warn("Firebase Apple popup notice:", fbErr);
        }
      }

      if (!email) {
        const enteredEmail = window.prompt('Sign in with Apple: Enter your Apple ID email:');
        if (!enteredEmail) return null;
        email = enteredEmail.trim();
        name = email.split('@')[0];
      }

      const data = await api.auth.socialLogin(
        email,
        name || 'Apple User',
        'apple',
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=111111&color=ffffff`
      );
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user,
        email,
        name: name || data.user.name
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
