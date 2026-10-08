const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('smartride_jwt');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.msg || errorData.message || (response.status === 401 ? 'Invalid or expired session. Please sign in again.' : 'Network request failed');
    const err = new Error(message);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }
  return response.json();
};

export const api = {
  auth: {
    login: async (email, password) => {
      const cleanEmail = (email || '').trim().toLowerCase();
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        const data = await handleResponse(res);
        if (data.token) {
          localStorage.setItem('smartride_jwt', data.token);
        }
        return data;
      } catch (err) {
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          console.warn("Backend unavailable, using local login fallback:", err);
          const fallbackToken = 'smartride_token_' + Date.now();
          localStorage.setItem('smartride_jwt', fallbackToken);
          return {
            token: fallbackToken,
            user: {
              id: 'user_' + Date.now(),
              email: cleanEmail,
              name: cleanEmail.split('@')[0],
              role: 'rider'
            }
          };
        }
        throw err;
      }
    },
    register: async (email, password, name, phone, otp) => {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            email: cleanEmail,
            password,
            name: cleanName,
            phone: (phone || '').trim(),
            otp: otp ? String(otp).trim() : undefined
          }),
        });
        const data = await handleResponse(res);
        if (data.token) {
          localStorage.setItem('smartride_jwt', data.token);
        }
        return data;
      } catch (err) {
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          console.warn("Backend unavailable, using local register fallback:", err);
          const fallbackToken = 'smartride_token_' + Date.now();
          localStorage.setItem('smartride_jwt', fallbackToken);
          return {
            token: fallbackToken,
            user: {
              id: 'user_' + Date.now(),
              email: cleanEmail,
              name: cleanName,
              phone: (phone || '').trim(),
              role: 'rider'
            }
          };
        }
        throw err;
      }
    },
    sendEmailOtp: async (email, purpose = 'register') => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/send-email-otp`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email: (email || '').trim(), purpose }),
        });
        return await handleResponse(res);
      } catch (err) {
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          console.warn("Backend unavailable, mock OTP dispatched:", err);
          return { success: true, msg: `Verification code sent to ${(email || '').trim()}` };
        }
        throw err;
      }
    },
    verifyEmailOtp: async (email, otp) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email-otp`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email: (email || '').trim(), otp: String(otp).trim() }),
        });
        return await handleResponse(res);
      } catch (err) {
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          console.warn("Backend unavailable, mock OTP verified:", err);
          return { success: true, msg: 'Email verified successfully.' };
        }
        throw err;
      }
    },
    socialLogin: async (email, name, provider, photoURL) => {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
      const avatarUrl = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=00D8FF&color=080C14`;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/social-login`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            email: cleanEmail,
            name: cleanName,
            provider,
            photoURL: avatarUrl
          }),
        });
        const data = await handleResponse(res);
        if (data.token) {
          localStorage.setItem('smartride_jwt', data.token);
        }
        return data;
      } catch (err) {
        console.warn("Backend unavailable for socialLogin, using local session fallback:", err);
        const fallbackToken = 'smartride_token_' + Date.now();
        localStorage.setItem('smartride_jwt', fallbackToken);
        return {
          token: fallbackToken,
          user: {
            id: 'user_' + Date.now(),
            _id: 'user_' + Date.now(),
            email: cleanEmail,
            name: cleanName,
            role: 'rider',
            photoURL: avatarUrl,
            provider: provider || 'google'
          }
        };
      }
    },
    me: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: getHeaders(),
        });
        return await handleResponse(res);
      } catch (err) {
        const cachedEmail = localStorage.getItem('smartride_user_email') || 'rider@smartride.ai';
        return {
          id: 'user_me',
          _id: 'user_me',
          email: cachedEmail,
          name: cachedEmail.split('@')[0],
          role: 'rider'
        };
      }
    },
    logout: async () => {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: getHeaders(),
        });
      } catch (e) {
        // Ignore network errors on logout
      } finally {
        localStorage.removeItem('smartride_jwt');
        localStorage.removeItem('smartride_user_email');
      }
    },
    getActiveUsers: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/active-users`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
  users: {
    updateProfile: async (profileData) => {
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData),
      });
      return handleResponse(res);
    },
    updatePreferences: async (preferences) => {
      const res = await fetch(`${API_BASE_URL}/users/preferences`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ preferences }),
      });
      return handleResponse(res);
    },
    updateSavedPlaces: async (savedPlaces) => {
      const res = await fetch(`${API_BASE_URL}/users/saved-places`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ savedPlaces }),
      });
      return handleResponse(res);
    },
    updateEmergencyContacts: async (emergencyContacts) => {
      const res = await fetch(`${API_BASE_URL}/users/emergency-contacts`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ emergencyContacts }),
      });
      return handleResponse(res);
    },
    updateCommuteProfile: async (commuteProfile) => {
      const res = await fetch(`${API_BASE_URL}/users/commute-profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ commuteProfile }),
      });
      return handleResponse(res);
    },
  },
  rides: {
    create: async (rideData) => {
      const res = await fetch(`${API_BASE_URL}/rides`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(rideData),
      });
      return handleResponse(res);
    },
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/rides`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    get: async (id) => {
      const res = await fetch(`${API_BASE_URL}/rides/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    updateStatus: async (id, status) => {
      const res = await fetch(`${API_BASE_URL}/rides/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },
  },
  parcels: {
    create: async (parcelData) => {
      const res = await fetch(`${API_BASE_URL}/parcels`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(parcelData),
      });
      return handleResponse(res);
    },
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/parcels`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
  chats: {
    create: async (targetUserId) => {
      const res = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ targetUserId }),
      });
      return handleResponse(res);
    },
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/chats`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    get: async (id) => {
      const res = await fetch(`${API_BASE_URL}/chats/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    sendMessage: async (id, text) => {
      const res = await fetch(`${API_BASE_URL}/chats/${id}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text }),
      });
      return handleResponse(res);
    },
  },
  telemetry: {
    logPerformance: async (logData) => {
      const res = await fetch(`${API_BASE_URL}/performance-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });
      return res.json().catch(() => ({}));
    }
  },
  ai: {
    decide: async (data = {}) => {
      const res = await fetch(`${API_BASE_URL}/ai/decide`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    }
  }
};

