import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const socketUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) || 'http://localhost:5000';
    socket = io(socketUrl, {
      autoConnect: true,
    });
    console.log('Socket client initialized at', socketUrl);
  }
  return socket;
};

export const subscribeToRideUpdates = (rideId, onUpdate) => {
  const s = getSocket();
  s.emit('subscribeRide', rideId);
  
  const listener = (data) => {
    if (data.id === rideId || data._id === rideId) {
      onUpdate({ id: data._id || data.id, ...data });
    }
  };
  
  s.on('rideStatusUpdate', listener);
  
  return () => {
    s.off('rideStatusUpdate', listener);
  };
};

export const subscribeToChatUpdates = (chatId, onUpdate) => {
  const s = getSocket();
  s.emit('subscribeChat', chatId);
  
  const listener = (data) => {
    if (data.id === chatId || data._id === chatId) {
      onUpdate({ id: data._id || data.id, ...data });
    }
  };
  
  s.on('chatMessageUpdate', listener);
  
  return () => {
    s.off('chatMessageUpdate', listener);
  };
};
