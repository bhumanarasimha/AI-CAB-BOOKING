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
      // Clean up obsolete legacy demo markers only
      const storedEmail = localStorage.getItem('smartride_user_email');
      if (storedEmail && storedEmail.includes('google.demo')) {
        localStorage.removeItem('smartride_user_email');
      }

      const token = localStorage.getItem('smartride_jwt');
      if (token) {
        try {
          const userData = await api.auth.me();
          if (userData && (userData.id || userData._id)) {
            setUser({
              uid: userData._id || userData.id,
              ...userData
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
            // Keep active session in case of temporary network restart
            const cachedEmail = localStorage.getItem('smartride_user_email');
            if (cachedEmail) {
              setUser({
                uid: 'cached_user',
                email: cachedEmail,
                name: cachedEmail.split('@')[0]
              });
            } else {
              setUser(null);
            }
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  const openFacebookOAuthPopup = (appId) => {
    return new Promise((resolve, reject) => {
      const redirectUri = `${window.location.origin}/facebook-callback.html`;
      const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email,public_profile`;
      const width = 600;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(url, 'FacebookAuthPopup', `width=${width},height=${height},left=${left},top=${top}`);

      if (!popup) {
        return reject(new Error('Popup blocked by browser. Please allow popups for this site.'));
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          window.removeEventListener('message', handleMessage);
          reject(new Error('Facebook sign in window was closed.'));
        }
      }, 500);

      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'SMARTRIDE_FB_AUTH_SUCCESS') {
          clearInterval(timer);
          window.removeEventListener('message', handleMessage);
          try {
            const token = event.data.accessToken;
            const fbRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.width(200).height(200)&access_token=${token}`);
            const fbData = await fbRes.json();
            if (fbData.error) {
              return reject(new Error(fbData.error.message || 'Facebook API error'));
            }
            resolve({
              email: fbData.email || `${fbData.id}@facebook.user`,
              name: fbData.name,
              photoURL: fbData.picture?.data?.url
            });
          } catch (err) {
            reject(err);
          }
        } else if (event.data?.type === 'SMARTRIDE_FB_AUTH_ERROR') {
          clearInterval(timer);
          window.removeEventListener('message', handleMessage);
          reject(new Error(event.data.error || 'Facebook authentication failed.'));
        }
      };

      window.addEventListener('message', handleMessage);
    });
  };

  const loginWithGoogle = async (customEmail = null, customName = null) => {
    try {
      let email = customEmail ? customEmail.trim().toLowerCase() : null;
      let name = customName ? customName.trim() : null;
      let photoURL = null;

      // 1. Attempt real Firebase Google Auth popup if configured
      if (!email && auth) {
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
            return null;
          }
        }
      }

      // 2. Default automatic Google Account fallback if no custom email or Firebase popup
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
      localStorage.setItem('smartride_user_name', cleanName);
      localStorage.setItem('smartride_user_email', cleanEmail);
      const avatarUrl = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=00D8FF&color=080C14`;

      const data = await api.auth.socialLogin(cleanEmail, cleanName, 'google', avatarUrl);
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user,
        email: cleanEmail,
        name: cleanName,
        photoURL: avatarUrl
      };
      localStorage.setItem('smartride_user_email', cleanEmail);
      setUser(mappedUser);
      return { user: mappedUser };
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const loginWithFacebook = async (customEmail = null, customName = null) => {
    try {
      let email = customEmail ? customEmail.trim().toLowerCase() : null;
      let name = customName ? customName.trim() : null;
      let photoURL = null;

      if (!email) {
        // 1. Check Firebase Facebook Auth
        if (auth) {
          try {
            const provider = new FacebookAuthProvider();
            provider.addScope('email');
            provider.addScope('public_profile');
            const result = await signInWithPopup(auth, provider);
            if (result && result.user) {
              email = result.user.email;
              name = result.user.displayName;
              photoURL = result.user.photoURL;
            }
          } catch (fbErr) {
            console.warn("Firebase Facebook popup notice:", fbErr);
            if (fbErr.code === 'auth/popup-closed-by-user' || fbErr.code === 'auth/cancelled-popup-request') {
              return null;
            }
          }
        }

        // 2. Direct Facebook OAuth 2.0 Dialog Popup if Facebook App ID is set
        const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID || localStorage.getItem('smartride_fb_app_id');
        if (!email && fbAppId) {
          try {
            const fbProfile = await openFacebookOAuthPopup(fbAppId);
            if (fbProfile) {
              email = fbProfile.email;
              name = fbProfile.name;
              photoURL = fbProfile.photoURL;
            }
          } catch (oauthErr) {
            if (oauthErr.message?.includes('closed')) {
              return null;
            }
            throw oauthErr;
          }
        }

        // 3. Default automatic Facebook Account fallback
        if (!email) {
          email = 'facebook.user@facebook.com';
          name = 'Facebook Rider';
        }
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
      const avatarUrl = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=1877F2&color=ffffff`;

      const data = await api.auth.socialLogin(cleanEmail, cleanName, 'facebook', avatarUrl);
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user,
        email: cleanEmail,
        name: cleanName,
        photoURL: avatarUrl
      };
      localStorage.setItem('smartride_user_email', cleanEmail);
      setUser(mappedUser);
      return { user: mappedUser };
    } catch (error) {
      console.error("Facebook login failed:", error);
      throw error;
    }
  };

  const loginWithApple = async (customEmail = null, customName = null) => {
    try {
      let email = customEmail ? customEmail.trim().toLowerCase() : null;
      let name = customName ? customName.trim() : null;

      if (!email) {
        if (auth) {
          try {
            const provider = new OAuthProvider('apple.com');
            const result = await signInWithPopup(auth, provider);
            if (result && result.user) {
              email = result.user.email;
              name = result.user.displayName;
            }
          } catch (fbErr) {
            if (fbErr.code === 'auth/popup-closed-by-user' || fbErr.code === 'auth/cancelled-popup-request') {
              return null;
            }
          }
        }

        if (!email) {
          return { requiresInput: true, provider: 'Apple' };
        }
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=111111&color=ffffff`;

      const data = await api.auth.socialLogin(cleanEmail, cleanName, 'apple', avatarUrl);
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user,
        email: cleanEmail,
        name: cleanName,
        photoURL: avatarUrl
      };
      localStorage.setItem('smartride_user_email', cleanEmail);
      setUser(mappedUser);
      return { user: mappedUser };
    } catch (error) {
      console.error("Apple login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const data = await api.auth.login(cleanEmail, password);
      localStorage.setItem('smartride_user_email', cleanEmail);
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user
      };
      setUser(mappedUser);
      return mappedUser;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const registerWithEmail = async (email, password, name, phone = '', otp = '') => {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim();
      const cleanPhone = (phone || '').trim();
      const data = await api.auth.register(cleanEmail, password, cleanName, cleanPhone, otp);
      localStorage.setItem('smartride_user_email', cleanEmail);
      const mappedUser = {
        uid: data.user.id || data.user._id,
        ...data.user
      };
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

  const verifyEmailOtp = async (email, otp) => {
    return await api.auth.verifyEmailOtp(email, otp);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    localStorage.removeItem('smartride_jwt');
    localStorage.removeItem('smartride_user_email');
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
      sendPasswordReset,
      sendEmailOtp, verifyEmailOtp
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
