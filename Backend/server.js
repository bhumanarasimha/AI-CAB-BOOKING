require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB, getIsConnected } = require('./config/db');
const inMemoryStore = require('./config/inMemoryStore');
const User = require('./models/User');
const Ride = require('./models/Ride');
const Parcel = require('./models/Parcel');
const Chat = require('./models/Chat');
const authMiddleware = require('./middleware/auth');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'smartride_jwt_secret_key';

// Health Check & Root Endpoints
app.get('/', (req, res) => {
  res.json({
    name: 'SmartRide AI Backend API',
    status: 'online',
    version: '1.0.0',
    mode: getIsConnected() ? 'MongoDB' : 'InMemoryStore',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: getIsConnected() ? 'MongoDB Connected' : 'In-Memory DB Active',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Connect Database and setup demo users
const setupDemoUsers = async () => {
  try {
    const usersToCreate = [
      { email: 'demo@smartride.com', name: 'Demo User', password: 'demo' },
      { email: 'bhumanarasimha25@gmail.com', name: 'Bhumana Narasimha', password: 'demo' },
      { email: 'nameisvenkat2005@gmail.com', name: 'Venkat', password: '123456' }
    ];

    for (const item of usersToCreate) {
      if (getIsConnected()) {
        let user = await User.findOne({ email: item.email });
        if (!user) {
          user = new User({
            email: item.email,
            name: item.name,
            password: item.password || 'demo',
            preferences: { theme: 'dark', language: 'en' },
            savedPlaces: [
              { name: 'Home', address: '123 Tech Park, Phase 1' },
              { name: 'Office', address: '456 Innovations Way, Block B' }
            ],
            emergencyContacts: [
              { name: 'Safety Dispatch', phone: '+1-800-555-0199' }
            ]
          });
          await user.save();
          console.log(`[MongoDB] User ${item.email} created successfully`);
        }
      } else {
        let user = await inMemoryStore.findUserByEmail(item.email);
        if (!user) {
          await inMemoryStore.createUser({
            email: item.email,
            name: item.name,
            password: item.password || 'demo'
          });
          console.log(`[InMemoryDB] User ${item.email} created successfully`);
        }
      }
    }
  } catch (err) {
    console.error('Error setting up demo users:', err.message);
  }
};

connectDB().then(() => setupDemoUsers());

// Middleware
app.use(cors());
app.use(express.json());

// Helper to sign JWT
const signToken = (userId) => {
  const payload = {
    user: {
      id: userId
    }
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// --- AUTHENTICATION ROUTES ---

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (password && password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    if (getIsConnected()) {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      user = new User({ email, password, name });
      await user.save();

      const token = signToken(user.id);
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } else {
      let user = await inMemoryStore.findUserByEmail(email);
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      user = await inMemoryStore.createUser({ email, password, name });
      const token = signToken(user.id);
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (getIsConnected()) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const token = signToken(user.id);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL || '',
          preferences: user.preferences,
          savedPlaces: user.savedPlaces,
          emergencyContacts: user.emergencyContacts,
          commuteProfile: user.commuteProfile
        }
      });
    } else {
      const user = await inMemoryStore.findUserByEmail(email);
      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const token = signToken(user.id);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL || '',
          preferences: user.preferences,
          savedPlaces: user.savedPlaces,
          emergencyContacts: user.emergencyContacts,
          commuteProfile: user.commuteProfile
        }
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Social Login (Real & OAuth compatible)
app.post('/api/auth/social-login', async (req, res) => {
  const { email, name, provider, photoURL } = req.body;
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return res.status(400).json({ msg: 'Email is required for social login' });
    }
    const cleanName = (name && !name.toLowerCase().startsWith('demo')) ? name : cleanEmail.split('@')[0];

    if (getIsConnected()) {
      let user = await User.findOne({ email: cleanEmail });
      if (!user) {
        user = new User({
          email: cleanEmail,
          name: cleanName,
          photoURL: photoURL || '',
          password: Math.random().toString(36).substring(7),
          preferences: { theme: 'dark-ai', language: 'en' }
        });
        await user.save();
      } else if (cleanName && (!user.name || user.name.toLowerCase().startsWith('demo'))) {
        user.name = cleanName;
        if (photoURL) user.photoURL = photoURL;
        await user.save();
      }
      const token = signToken(user.id);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL || photoURL || '',
          preferences: user.preferences,
          savedPlaces: user.savedPlaces,
          emergencyContacts: user.emergencyContacts,
          commuteProfile: user.commuteProfile
        }
      });
    } else {
      let user = await inMemoryStore.findUserByEmail(cleanEmail);
      if (!user) {
        user = await inMemoryStore.createUser({
          email: cleanEmail,
          name: cleanName,
          photoURL: photoURL || '',
          password: Math.random().toString(36).substring(7),
          preferences: { theme: 'dark-ai', language: 'en' }
        });
      } else if (cleanName && (!user.name || user.name.toLowerCase().startsWith('demo'))) {
        user.name = cleanName;
        if (photoURL) user.photoURL = photoURL;
        inMemoryStore.saveUsers();
      }
      const token = signToken(user.id || user._id);
      return res.json({
        token,
        user: {
          id: user.id || user._id,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL || photoURL || '',
          preferences: user.preferences,
          savedPlaces: user.savedPlaces,
          emergencyContacts: user.emergencyContacts,
          commuteProfile: user.commuteProfile
        }
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get Current User (authenticated)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      let user;
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        user = await User.findById(req.user.id).select('-password');
      }
      if (!user) {
        // Fallback to in-memory store in case user was registered in memory
        user = await inMemoryStore.findUserById(req.user.id);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        }
        return res.status(404).json({ msg: 'User not found' });
      }
      return res.json(user);
    } else {
      const user = await inMemoryStore.findUserById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Generic Profile Update
app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        user = await User.findById(req.user.id);
      }
      if (!user) {
        user = await inMemoryStore.updateUser(req.user.id, req.body);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        return res.json({
          id: user.id,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL || '',
          preferences: user.preferences,
          savedPlaces: user.savedPlaces,
          emergencyContacts: user.emergencyContacts,
          commuteProfile: user.commuteProfile
        });
      }

      const fieldsToUpdate = ['name', 'photoURL', 'preferences', 'savedPlaces', 'emergencyContacts', 'commuteProfile'];
      fieldsToUpdate.forEach(field => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });

      user.updatedAt = Date.now();
      await user.save();
      return res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        photoURL: user.photoURL || '',
        preferences: user.preferences,
        savedPlaces: user.savedPlaces,
        emergencyContacts: user.emergencyContacts,
        commuteProfile: user.commuteProfile
      });
    } else {
      const user = await inMemoryStore.updateUser(req.user.id, req.body);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      return res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        photoURL: user.photoURL || '',
        preferences: user.preferences,
        savedPlaces: user.savedPlaces,
        emergencyContacts: user.emergencyContacts,
        commuteProfile: user.commuteProfile
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Update Preferences
app.put('/api/users/preferences', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        user = await User.findById(req.user.id);
      }
      if (user) {
        user.preferences = req.body.preferences;
        user.updatedAt = Date.now();
        await user.save();
        return res.json(user.preferences);
      } else {
        const inMemUser = await inMemoryStore.updateUser(req.user.id, { preferences: req.body.preferences });
        return res.json(inMemUser ? inMemUser.preferences : req.body.preferences);
      }
    } else {
      const user = await inMemoryStore.updateUser(req.user.id, { preferences: req.body.preferences });
      return res.json(user ? user.preferences : req.body.preferences);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Update Saved Places
app.put('/api/users/saved-places', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        user = await User.findById(req.user.id);
      }
      if (user) {
        user.savedPlaces = req.body.savedPlaces;
        user.updatedAt = Date.now();
        await user.save();
        return res.json(user.savedPlaces);
      } else {
        const inMemUser = await inMemoryStore.updateUser(req.user.id, { savedPlaces: req.body.savedPlaces });
        return res.json(inMemUser ? inMemUser.savedPlaces : req.body.savedPlaces);
      }
    } else {
      const user = await inMemoryStore.updateUser(req.user.id, { savedPlaces: req.body.savedPlaces });
      return res.json(user ? user.savedPlaces : req.body.savedPlaces);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Update Emergency Contacts
app.put('/api/users/emergency-contacts', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        user = await User.findById(req.user.id);
      }
      if (user) {
        user.emergencyContacts = req.body.emergencyContacts;
        user.updatedAt = Date.now();
        await user.save();
        return res.json(user.emergencyContacts);
      } else {
        const inMemUser = await inMemoryStore.updateUser(req.user.id, { emergencyContacts: req.body.emergencyContacts });
        return res.json(inMemUser ? inMemUser.emergencyContacts : req.body.emergencyContacts);
      }
    } else {
      const user = await inMemoryStore.updateUser(req.user.id, { emergencyContacts: req.body.emergencyContacts });
      return res.json(user ? user.emergencyContacts : req.body.emergencyContacts);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Update Commute Profile
app.put('/api/users/commute-profile', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        user = await User.findById(req.user.id);
      }
      if (user) {
        user.commuteProfile = req.body.commuteProfile;
        user.updatedAt = Date.now();
        await user.save();
        return res.json(user.commuteProfile);
      } else {
        const inMemUser = await inMemoryStore.updateUser(req.user.id, { commuteProfile: req.body.commuteProfile });
        return res.json(inMemUser ? inMemUser.commuteProfile : req.body.commuteProfile);
      }
    } else {
      const user = await inMemoryStore.updateUser(req.user.id, { commuteProfile: req.body.commuteProfile });
      return res.json(user ? user.commuteProfile : req.body.commuteProfile);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// --- RIDES ROUTES ---

// Create Ride Request
app.post('/api/rides', authMiddleware, async (req, res) => {
  try {
    const pickup = req.body.pickup || req.body.pickupLocation;
    const dropoff = req.body.dropoff || req.body.dropoffLocation;

    if (!pickup || !dropoff) {
      return res.status(400).json({ msg: 'Pickup and dropoff locations are required' });
    }

    const rideData = {
      userId: String(req.user.id),
      pickup,
      dropoff,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      pickupCoords: req.body.pickupCoords || null,
      dropoffCoords: req.body.dropoffCoords || null,
      vehicleType: req.body.vehicleType || req.body.rideType || 'Standard',
      price: req.body.price !== undefined ? String(req.body.price) : '0',
      duration: req.body.duration || req.body.eta || '',
      distance: req.body.distance || '',
      status: req.body.status || 'searching',
      aiInsights: req.body.aiInsights || {
        latency: Math.floor(Math.random() * 20) + 10,
        confidence: 0.95 + (Math.random() * 0.04),
        agents: 14,
        hewro: { walkingReduced: 240, effortSaved: 34 },
        stability: { road: 92, vehicle: 98, route: 87 }
      }
    };

    let ride;
    if (getIsConnected()) {
      const newRide = new Ride(rideData);
      ride = await newRide.save();
    } else {
      ride = await inMemoryStore.createRide(rideData);
    }

    io.emit('rideCreated', ride);
    return res.json(ride);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get User's Rides
app.get('/api/rides', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const rides = await Ride.find({ userId: String(req.user.id) }).sort({ createdAt: -1 });
      return res.json(rides);
    } else {
      const rides = await inMemoryStore.getRidesByUserId(req.user.id);
      return res.json(rides);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get Specific Ride
app.get('/api/rides/:id', authMiddleware, async (req, res) => {
  try {
    let ride = null;
    if (getIsConnected()) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        ride = await Ride.findById(req.params.id);
      }
      if (!ride) {
        ride = await inMemoryStore.getRideById(req.params.id);
      }
    } else {
      ride = await inMemoryStore.getRideById(req.params.id);
    }

    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    return res.json(ride);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Update Ride Status
app.put('/api/rides/:id/status', authMiddleware, async (req, res) => {
  try {
    let ride = null;
    const newStatus = req.body.status || 'confirmed';

    if (getIsConnected()) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        ride = await Ride.findById(req.params.id);
      }
      if (ride) {
        ride.status = newStatus;
        ride.updatedAt = Date.now();
        await ride.save();
      } else {
        ride = await inMemoryStore.updateRideStatus(req.params.id, newStatus);
      }
    } else {
      ride = await inMemoryStore.updateRideStatus(req.params.id, newStatus);
    }

    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    const rideId = ride.id || ride._id;
    io.to(`ride_${rideId}`).emit('rideStatusUpdate', ride);
    if (ride._id && String(ride._id) !== String(rideId)) {
      io.to(`ride_${ride._id}`).emit('rideStatusUpdate', ride);
    }
    io.emit('rideUpdated', ride);
    io.emit('ride-status-changed', ride);

    return res.json(ride);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// --- PARCEL ROUTES ---

// Create Parcel Order
app.post('/api/parcels', authMiddleware, async (req, res) => {
  try {
    let parcel;
    if (getIsConnected()) {
      const newParcel = new Parcel({
        userId: String(req.user.id),
        ...req.body
      });
      parcel = await newParcel.save();
    } else {
      parcel = await inMemoryStore.createParcel({
        userId: String(req.user.id),
        ...req.body
      });
    }
    return res.json(parcel);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get User's Parcels
app.get('/api/parcels', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const parcels = await Parcel.find({ userId: String(req.user.id) }).sort({ createdAt: -1 });
      return res.json(parcels);
    } else {
      const parcels = await inMemoryStore.getParcelsByUserId(req.user.id);
      return res.json(parcels);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// --- CHATS ROUTES ---

// Create Chat Session
app.post('/api/chats', authMiddleware, async (req, res) => {
  const { targetUserId } = req.body;
  try {
    let chat;
    if (getIsConnected()) {
      chat = await Chat.findOne({
        participants: { $all: [String(req.user.id), String(targetUserId)] }
      });

      if (!chat) {
        chat = new Chat({
          participants: [String(req.user.id), String(targetUserId)],
          lastMessage: "Interested in sharing tomorrow's commute?",
          messages: [
            { text: "Hey! Saw we have a 94% route overlap. Interested in sharing tomorrow's commute?", senderId: String(targetUserId), timestamp: new Date() }
          ]
        });
        await chat.save();
      }
    } else {
      chat = await inMemoryStore.createChat(req.user.id, targetUserId);
    }
    return res.json(chat);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get User's Chats
app.get('/api/chats', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const chats = await Chat.find({
        participants: String(req.user.id)
      }).sort({ updatedAt: -1 });
      return res.json(chats);
    } else {
      const chats = await inMemoryStore.getChatsByUserId(req.user.id);
      return res.json(chats);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get Specific Chat Room
app.get('/api/chats/:id', authMiddleware, async (req, res) => {
  try {
    let chat = null;
    if (getIsConnected()) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        chat = await Chat.findById(req.params.id);
      }
      if (!chat) {
        chat = await inMemoryStore.getChatById(req.params.id);
      }
    } else {
      chat = await inMemoryStore.getChatById(req.params.id);
    }

    if (!chat) return res.status(404).json({ msg: 'Chat session not found' });
    return res.json(chat);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Send Message inside Chat Session
app.post('/api/chats/:id/messages', authMiddleware, async (req, res) => {
  const { text } = req.body;
  try {
    let chat = null;
    if (getIsConnected()) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        chat = await Chat.findById(req.params.id);
      }
      if (chat) {
        const message = {
          text,
          senderId: String(req.user.id),
          timestamp: new Date()
        };

        chat.messages.push(message);
        chat.lastMessage = text;
        chat.updatedAt = Date.now();
        await chat.save();
      } else {
        chat = await inMemoryStore.addChatMessage(req.params.id, text, req.user.id);
      }
    } else {
      chat = await inMemoryStore.addChatMessage(req.params.id, text, req.user.id);
    }

    if (!chat) return res.status(404).json({ msg: 'Chat not found' });

    const chatId = chat.id || chat._id;
    io.to(`chat_${chatId}`).emit('chatMessageUpdate', chat);
    if (chat._id && String(chat._id) !== String(chatId)) {
      io.to(`chat_${chat._id}`).emit('chatMessageUpdate', chat);
    }
    return res.json(chat);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// --- RIDE ESTIMATE / COMPARISON BENCHMARK ENDPOINT ---
app.all('/api/ride-estimate', (req, res) => {
  const estimates = [
    { provider: 'Uber', type: 'Uber Go', fare: 180, duration: '18 min', distance: '6.5 km', surge: '1.0x' },
    { provider: 'Ola', type: 'Ola Mini', fare: 175, duration: '20 min', distance: '6.5 km', surge: '1.0x' },
    { provider: 'Rapido', type: 'Rapido Cab', fare: 160, duration: '19 min', distance: '6.5 km', surge: '1.0x' },
    { provider: 'SmartRide', type: 'AI Multimodal', fare: 65, duration: '15 min', distance: '7.0 km', surge: '1.0x' }
  ];
  return res.json({
    status: 'success',
    estimates,
    timestamp: Date.now()
  });
});

// --- TELEMETRY / PERFORMANCE BENCHMARKING ENDPOINT ---
app.post('/api/performance-logs', async (req, res) => {
  try {
    res.json({ success: true, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ msg: 'Telemetry error' });
  }
});

// --- EXPLAINABLE AI DECISION ENGINE ENDPOINT ---
let emmdeEngine = null;
const getEmmdeEngine = async () => {
  if (!emmdeEngine) {
    emmdeEngine = await import('./src/ai/emmde.js');
  }
  return emmdeEngine;
};

app.post('/api/ai/decide', async (req, res) => {
  try {
    const { origin = 'Central Station', destination = 'Tech City', userWeights = {}, context = {} } = req.body;
    const defaultContext = {
      trafficIndex: 5,
      precipitation: 0,
      demandIndex: 5,
      isPeakHour: false,
      ...context
    };
    const defaultWeights = {
      wFare: 0.35,
      wTime: 0.25,
      wEffort: 0.20,
      wStability: 0.20,
      ...userWeights
    };
    const engine = await getEmmdeEngine();
    const result = engine.executeEMMDE(origin, destination, defaultWeights, defaultContext);
    return res.json(result);
  } catch (err) {
    console.error('AI decision engine error:', err.message);
    res.status(500).json({ error: 'AI decision engine error', details: err.message });
  }
});

// --- SOCKET.IO CONNECTIONS ---
io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  socket.on('subscribeRide', (rideId) => {
    socket.join(`ride_${rideId}`);
    console.log(`Socket ${socket.id} joined room: ride_${rideId}`);
  });

  socket.on('subscribeChat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`Socket ${socket.id} joined room: chat_${chatId}`);
  });

  socket.on('driver-location-update', (data) => {
    if (data && data.rideId) {
      io.to(`ride_${data.rideId}`).emit('driverLocationUpdate', data);
      io.emit('driverLocationUpdate', data);
    }
  });

  socket.on('send-message', (data) => {
    if (data && data.chatId) {
      io.to(`chat_${data.chatId}`).emit('receive-message', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

// Server Listen
server.listen(PORT, () => {
  console.log(`SmartRide Express server running on port ${PORT}`);
});
