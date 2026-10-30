import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext();

const getUserDatabase = () => {
  try {
    return JSON.parse(localStorage.getItem('smartride_user_db')) || {};
  } catch {
    return {};
  }
};

const saveUserToDatabase = (email, userObj) => {
  const db = getUserDatabase();
  const cleanEmail = email.trim().toLowerCase();
  db[cleanEmail] = {
    ...db[cleanEmail],
    ...userObj,
    email: cleanEmail
  };
  localStorage.setItem('smartride_user_db', JSON.stringify(db));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('smartride_jwt');
      const cachedEmail = localStorage.getItem('smartride_user_email');
      
      if (!token || !cachedEmail) {
        setUser(null);
        setLoading(false);
        return;
      }

      const cleanEmailKey = cachedEmail.trim().toLowerCase();
      const db = getUserDatabase();
      const savedUserRecord = db[cleanEmailKey];
      const savedAccountName = savedUserRecord?.name
        || localStorage.getItem(`smartride_user_name_${cleanEmailKey}`);

      try {
        const userData = await api.auth.me();
        if (userData && (userData.id || userData._id)) {
          // Authoritative fields from MySQL backend
          const cleanName = (userData.name && userData.name.trim().length > 0)
            ? userData.name.trim()
            : (savedAccountName || cleanEmailKey.split('@')[0]);
          const phoneVal = userData.phone || savedUserRecord?.phone || '7995665477';
          const genderVal = userData.gender || savedUserRecord?.gender || 'Male';
          const dobVal = userData.dob || savedUserRecord?.dob || '1998-05-24';

          setUser({
            uid: userData._id || userData.id,
            ...userData,
            name: cleanName,
            phone: phoneVal,
            gender: genderVal,
            dob: dobVal
          });

          if (userData.email) {
            const eKey = userData.email.trim().toLowerCase();
            localStorage.setItem('smartride_user_email', eKey);
            localStorage.setItem('smartride_user_name', cleanName);
            localStorage.setItem(`smartride_user_name_${eKey}`, cleanName);
            saveUserToDatabase(eKey, {
              id: userData._id || userData.id,
              name: cleanName,
              email: eKey,
              phone: phoneVal,
              gender: genderVal,
              dob: dobVal
            });
          }
        }
      } catch (error) {
        console.warn("Token verification notice:", error);
        if (error.status === 401 || error.status === 404) {
          localStorage.removeItem('smartride_jwt');
          localStorage.removeItem('smartride_user_email');
          localStorage.removeItem('smartride_user_name');
          localStorage.removeItem('smartride_user_password');
          setUser(null);
        } else {
          setUser({
            uid: 'cached_user',
            email: cachedEmail,
            name: savedAccountName || cleanEmailKey.split('@')[0]
          });
        }
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
        email = localStorage.getItem('smartride_user_email') || 'rider@smartride.ai';
      }

      const cleanEmailKey = email.trim().toLowerCase();
      const db = getUserDatabase();
      const savedUserRecord = db[cleanEmailKey];
      const savedAccountName = savedUserRecord?.name
        || localStorage.getItem(`smartride_user_name_${cleanEmailKey}`);

      if (!name) {
        name = savedAccountName || email.split('@')[0];
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (name || 'Rider').trim();
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=00D8FF&color=080C14`;

      const data = await api.auth.socialLogin(cleanEmail, cleanName, 'google', avatarUrl);
      const mappedUser = {
        uid: data.user?.id || data.user?._id || data.id || 'user_' + Date.now(),
        ...(data.user || {}),
        email: cleanEmail,
        name: data.user?.name || cleanName,
        photoURL: avatarUrl
      };

      saveUserToDatabase(cleanEmail, { name: mappedUser.name, email: cleanEmail });
      localStorage.setItem('smartride_user_email', cleanEmail);
      localStorage.setItem('smartride_user_name', mappedUser.name);
      localStorage.setItem(`smartride_user_name_${cleanEmail}`, mappedUser.name);
      setUser(mappedUser);
      return { user: mappedUser };
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const db = getUserDatabase();
    const savedUserRecord = db[cleanEmail];

    try {
      const data = await api.auth.login(cleanEmail, password);
      const userPayload = data.user || data;

      // 1. Authoritative: Use actual fields from MySQL database response
      const dbUserName = userPayload.name || data.name;
      const registeredName = (dbUserName && dbUserName.trim().length > 0)
        ? dbUserName.trim()
        : (savedUserRecord?.name
          || localStorage.getItem(`smartride_user_name_${cleanEmail}`)
          || cleanEmail.split('@')[0]);

      const phoneVal = userPayload.phone || savedUserRecord?.phone || data.phone || '7995665477';
      const genderVal = userPayload.gender || savedUserRecord?.gender || 'Male';
      const dobVal = userPayload.dob || savedUserRecord?.dob || '1998-05-24';

      const mappedUser = {
        uid: userPayload.id || userPayload._id || data.id || 'user_' + Date.now(),
        ...userPayload,
        email: cleanEmail,
        name: registeredName,
        phone: phoneVal,
        gender: genderVal,
        dob: dobVal
      };

      // 2. Persist fresh session data for THIS specific authenticated user
      saveUserToDatabase(cleanEmail, {
        id: mappedUser.uid,
        name: registeredName,
        email: cleanEmail,
        password: password,
        phone: phoneVal,
        gender: genderVal,
        dob: dobVal
      });

      localStorage.setItem('smartride_user_email', cleanEmail);
      localStorage.setItem('smartride_user_name', registeredName);
      localStorage.setItem(`smartride_user_name_${cleanEmail}`, registeredName);
      setUser(mappedUser);
      return mappedUser;
    } catch (error) {
      console.warn("Server login fallback notice:", error);
      if (savedUserRecord) {
        if (savedUserRecord.password && password !== savedUserRecord.password) {
          throw new Error("Invalid password. Please check your credentials.");
        }
        const mappedUser = {
          uid: savedUserRecord.id || 'user_' + Date.now(),
          email: cleanEmail,
          name: savedUserRecord.name || cleanEmail.split('@')[0],
          phone: savedUserRecord.phone || '7995665477',
          gender: savedUserRecord.gender || 'Male',
          dob: savedUserRecord.dob || '1998-05-24',
          role: 'rider'
        };

        localStorage.setItem('smartride_user_email', cleanEmail);
        localStorage.setItem('smartride_user_name', mappedUser.name);
        localStorage.setItem(`smartride_user_name_${cleanEmail}`, mappedUser.name);
        setUser(mappedUser);
        return mappedUser;
      }
      throw error;
    }
  };

  const registerWithEmail = async (email, password, name, phone, otp) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
    const cleanPhone = (phone || '').trim();

    // 1. Check if email already exists in local user database
    const db = getUserDatabase();
    if (db[cleanEmail]) {
      throw new Error("Email is already registered");
    }

    try {
      const data = await api.auth.register(cleanEmail, password, cleanName, cleanPhone, otp);

      const dbName = (data.user && data.user.name) || data.name || cleanName;
      const mappedUser = {
        uid: data.user?.id || data.user?._id || data.id || 'user_' + Date.now(),
        ...(data.user || {}),
        email: cleanEmail,
        name: dbName,
        phone: cleanPhone
      };

      // Save user details persistently into user database
      saveUserToDatabase(cleanEmail, {
        id: mappedUser.uid,
        name: dbName,
        email: cleanEmail,
        password: password,
        phone: cleanPhone,
        createdAt: new Date().toISOString()
      });

      localStorage.setItem('smartride_user_email', cleanEmail);
      localStorage.setItem('smartride_user_name', dbName);
      localStorage.setItem(`smartride_user_name_${cleanEmail}`, dbName);
      setUser(mappedUser);
      return mappedUser;
    } catch (error) {
      // If server explicitly returned an error (duplicate email, validation error, etc.)
      if (error.status || error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('valid email')) {
        throw error;
      }
      // If server unreachable and offline fallback allowed:
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        saveUserToDatabase(cleanEmail, {
          id: 'user_' + Date.now(),
          name: cleanName,
          email: cleanEmail,
          password: password,
          phone: cleanPhone,
          createdAt: new Date().toISOString()
        });

        const fallbackUser = {
          uid: 'user_' + Date.now(),
          email: cleanEmail,
          name: cleanName,
          phone: cleanPhone,
          role: 'rider'
        };

        localStorage.setItem('smartride_user_email', cleanEmail);
        localStorage.setItem('smartride_user_name', cleanName);
        localStorage.setItem(`smartride_user_name_${cleanEmail}`, cleanName);
        setUser(fallbackUser);
        return fallbackUser;
      }
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
      // Clear all user session data on logout so no stale information persists
      localStorage.removeItem('smartride_jwt');
      localStorage.removeItem('smartride_user_email');
      localStorage.removeItem('smartride_user_name');
      localStorage.removeItem('smartride_user_password');
      setUser(null);
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const response = await api.users.updateProfile(profileData);
      const updatedUser = response.user || response || {};
      const newName = (profileData.name || updatedUser.name || user?.name || '').trim();
      const newEmail = (profileData.email || updatedUser.email || user?.email || '').trim().toLowerCase();
      const newPhone = profileData.phone || updatedUser.phone || user?.phone || '7995665477';
      const newGender = profileData.gender || updatedUser.gender || user?.gender || 'Male';
      const newDob = profileData.dob || updatedUser.dob || user?.dob || '1998-05-24';

      const mergedUser = {
        ...user,
        ...updatedUser,
        name: newName,
        email: newEmail,
        phone: newPhone,
        gender: newGender,
        dob: newDob
      };

      setUser(mergedUser);
      if (newEmail) {
        localStorage.setItem('smartride_user_email', newEmail);
        localStorage.setItem('smartride_user_name', newName);
        localStorage.setItem(`smartride_user_name_${newEmail}`, newName);
        saveUserToDatabase(newEmail, {
          name: newName,
          email: newEmail,
          phone: newPhone,
          gender: newGender,
          dob: newDob
        });
      }
      return mergedUser;
    } catch (error) {
      console.warn("Backend profile update fallback:", error);
      const newName = (profileData.name || user?.name || '').trim();
      const newEmail = (profileData.email || user?.email || '').trim().toLowerCase();
      const newPhone = profileData.phone || user?.phone || '7995665477';
      const newGender = profileData.gender || user?.gender || 'Male';
      const newDob = profileData.dob || user?.dob || '1998-05-24';

      const mergedUser = {
        ...user,
        ...profileData,
        name: newName,
        email: newEmail,
        phone: newPhone,
        gender: newGender,
        dob: newDob
      };

      setUser(mergedUser);
      if (newEmail) {
        localStorage.setItem('smartride_user_email', newEmail);
        localStorage.setItem('smartride_user_name', newName);
        localStorage.setItem(`smartride_user_name_${newEmail}`, newName);
        saveUserToDatabase(newEmail, {
          name: newName,
          email: newEmail,
          phone: newPhone,
          gender: newGender,
          dob: newDob
        });
      }
      return mergedUser;
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);