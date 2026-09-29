const API_BASE_URL = 'http://localhost:5000/api';

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
    throw new Error(errorData.msg || 'Something went wrong');
  }
  return response.json();
};

export const api = {
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('smartride_jwt', data.token);
      }
      return data;
    },
    register: async (email, password, name) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password, name }),
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('smartride_jwt', data.token);
      }
      return data;
    },
    socialLogin: async (email, name, provider, photoURL) => {
      const res = await fetch(`${API_BASE_URL}/auth/social-login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, name, provider, photoURL }),
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('smartride_jwt', data.token);
      }
      return data;
    },
    me: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
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
  }
};
