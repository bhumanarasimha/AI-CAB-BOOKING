/* eslint-disable no-unused-vars */
import { api } from './api';
import { subscribeToRideUpdates, subscribeToChatUpdates } from './socket';

// RIDES
export const createRideRequest = async (userId, rideData) => {
  try {
    const data = await api.rides.create(rideData);
    return data._id || data.id;
  } catch (error) {
    console.error("Error creating ride:", error);
    throw error;
  }
};

// USER PROFILE & PREFERENCES
export const updateUserPreferences = async (userId, preferences) => {
  await api.users.updateProfile({ preferences });
};

export const updateSavedPlaces = async (userId, savedPlaces) => {
  await api.users.updateProfile({ savedPlaces });
};

export const updateEmergencyContacts = async (userId, emergencyContacts) => {
  await api.users.updateProfile({ emergencyContacts });
};

export const updateCommuteProfile = async (userId, commuteProfile) => {
  await api.users.updateProfile({ commuteProfile });
};

export const getUserRides = async (userId) => {
  try {
    const data = await api.rides.list();
    return data.map(item => ({ id: item._id || item.id, ...item }));
  } catch (error) {
    console.error("Error fetching rides:", error);
    throw error;
  }
};

export const updateRideStatus = async (rideId, status) => {
  await api.rides.updateStatus(rideId, status);
};

// PARCELS
export const createParcelOrder = async (userId, parcelData) => {
  try {
    const data = await api.parcels.create(parcelData);
    return data._id || data.id;
  } catch (error) {
    console.error("Error creating parcel:", error);
    throw error;
  }
};

// REAL-TIME UPDATES
export const subscribeToRide = (rideId, callback) => {
  return subscribeToRideUpdates(rideId, callback);
};

// CHATS
export const createChatSession = async (userId, targetUserId) => {
  try {
    const data = await api.chats.create(targetUserId);
    return data._id || data.id;
  } catch (error) {
    console.error("Error creating chat session:", error);
    throw error;
  }
};

export const subscribeToChat = (chatId, callback) => {
  return subscribeToChatUpdates(chatId, callback);
};

export const sendChatMessage = async (chatId, senderId, text) => {
  await api.chats.sendMessage(chatId, text);
};
