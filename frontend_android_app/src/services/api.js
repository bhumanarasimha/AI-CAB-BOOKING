import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamic host resolution: Web uses localhost:5000, Android uses EXPO_PUBLIC_API_URL or 10.0.2.2 / 192.168.1.8
const getBaseHost = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
};

export const API_BASE_URL = `${getBaseHost()}/api`;

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('smartride_jwt').catch(() => null);
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
    throw new Error(errorData.msg || 'Network request failed');
  }
  return response.json();
};

export const api = {
  auth: {
    login: async (email, password) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse(res);
      if (data.token) {
        await AsyncStorage.setItem('smartride_jwt', data.token);
      }
      return data;
    },
    register: async (email, password, name) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, name }),
      });
      const data = await handleResponse(res);
      if (data.token) {
        await AsyncStorage.setItem('smartride_jwt', data.token);
      }
      return data;
    },
    me: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers,
      });
      return handleResponse(res);
    },
  },
  rides: {
    createRide: async (rideData) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/rides`, {
        method: 'POST',
        headers,
        body: JSON.stringify(rideData),
      });
      return handleResponse(res);
    },
    getRides: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/rides`, {
        method: 'GET',
        headers,
      });
      return handleResponse(res);
    },
  },
  parcels: {
    createParcel: async (parcelData) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/parcels`, {
        method: 'POST',
        headers,
        body: JSON.stringify(parcelData),
      });
      return handleResponse(res);
    },
    getParcels: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/parcels`, {
        method: 'GET',
        headers,
      });
      return handleResponse(res);
    },
  },
  ai: {
    decide: async (data = {}) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/ai/decide`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
  },
};
