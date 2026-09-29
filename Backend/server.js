require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
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
    res.status(500).send('Server error');
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
          preferences: user.preferences,
          savedPlaces: user.savedPlaces,
          emergencyContacts: user.emergencyContacts,
          commuteProfile: user.commuteProfile
        }
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Social Login (Simulated / Mocked)
app.post('/api/auth/social-login', async (req, res) => {
  const { email, name, provider, photoURL } = req.body;
  try {
    if (getIsConnected()) {
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          email,
          name: name || `Demo ${provider} User`,
          password: Math.random().toString(36).substring(7),
          preferences: { theme: 'dark-ai', language: 'en' }
        });
        await user.save();
      }
      const token = signToken(user.id);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          photoURL,
          preferences: user.preferences,
          savedPlaces: user.savedPlaces,
          emergencyContacts: user.emergencyContacts,
          commuteProfile: user.commuteProfile
        }
      });
    } else {
      let user = await inMemoryStore.findUserByEmail(email);
      if (!user) {
        user = await inMemoryStore.createUser({
          email,
          name: name || `Demo ${provider} User`,
          password: Math.random().toString(36).substring(7),
          preferences: { theme: 'dark-ai', language: 'en' }
        });
      }
      const token = signToken(user.id);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          photoURL,
          preferences: user.preferences,
          savedPlaces: user.savedPlaces,
          emergencyContacts: user.emergencyContacts,
          commuteProfile: user.commuteProfile
        }
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get Current User (authenticated)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const user = await User.findById(req.user.id).select('-password');
      return res.json(user);
    } else {
      const user = await inMemoryStore.findUserById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Generic Profile Update
app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });

      const fieldsToUpdate = ['name', 'preferences', 'savedPlaces', 'emergencyContacts', 'commuteProfile'];
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
        preferences: user.preferences,
        savedPlaces: user.savedPlaces,
        emergencyContacts: user.emergencyContacts,
        commuteProfile: user.commuteProfile
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update Preferences
app.put('/api/users/preferences', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const user = await User.findById(req.user.id);
      user.preferences = req.body.preferences;
      user.updatedAt = Date.now();
      await user.save();
      return res.json(user.preferences);
    } else {
      const user = await inMemoryStore.updateUser(req.user.id, { preferences: req.body.preferences });
      return res.json(user.preferences);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update Saved Places
app.put('/api/users/saved-places', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const user = await User.findById(req.user.id);
      user.savedPlaces = req.body.savedPlaces;
      user.updatedAt = Date.now();
      await user.save();
      return res.json(user.savedPlaces);
    } else {
      const user = await inMemoryStore.updateUser(req.user.id, { savedPlaces: req.body.savedPlaces });
      return res.json(user.savedPlaces);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update Emergency Contacts
app.put('/api/users/emergency-contacts', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const user = await User.findById(req.user.id);
      user.emergencyContacts = req.body.emergencyContacts;
      user.updatedAt = Date.now();
      await user.save();
      return res.json(user.emergencyContacts);
    } else {
      const user = await inMemoryStore.updateUser(req.user.id, { emergencyContacts: req.body.emergencyContacts });
      return res.json(user.emergencyContacts);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update Commute Profile
app.put('/api/users/commute-profile', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const user = await User.findById(req.user.id);
      user.commuteProfile = req.body.commuteProfile;
      user.updatedAt = Date.now();
      await user.save();
      return res.json(user.commuteProfile);
    } else {
      const user = await inMemoryStore.updateUser(req.user.id, { commuteProfile: req.body.commuteProfile });
      return res.json(user.commuteProfile);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- RIDES ROUTES ---

// Create Ride Request
app.post('/api/rides', authMiddleware, async (req, res) => {
  try {
    const rideData = {
      userId: req.user.id,
      pickup: req.body.pickup,
      dropoff: req.body.dropoff,
      pickupCoords: req.body.pickupCoords,
      dropoffCoords: req.body.dropoffCoords,
      vehicleType: req.body.vehicleType,
      price: req.body.price,
      duration: req.body.duration,
      distance: req.body.distance,
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
    res.status(500).send('Server error');
  }
});

// Get User's Rides
app.get('/api/rides', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const rides = await Ride.find({ userId: req.user.id }).sort({ createdAt: -1 });
      return res.json(rides);
    } else {
      const rides = await inMemoryStore.getRidesByUserId(req.user.id);
      return res.json(rides);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get Specific Ride
app.get('/api/rides/:id', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const ride = await Ride.findById(req.params.id);
      if (!ride) return res.status(404).json({ msg: 'Ride not found' });
      return res.json(ride);
    } else {
      const ride = await inMemoryStore.getRideById(req.params.id);
      if (!ride) return res.status(404).json({ msg: 'Ride not found' });
      return res.json(ride);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update Ride Status
app.put('/api/rides/:id/status', authMiddleware, async (req, res) => {
  try {
    let ride;
    if (getIsConnected()) {
      ride = await Ride.findById(req.params.id);
      if (!ride) return res.status(404).json({ msg: 'Ride not found' });

      ride.status = req.body.status;
      ride.updatedAt = Date.now();
      await ride.save();
    } else {
      ride = await inMemoryStore.updateRideStatus(req.params.id, req.body.status);
      if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    }

    io.to(`ride_${ride.id}`).emit('rideStatusUpdate', ride);
    io.emit('rideUpdated', ride);

    return res.json(ride);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- PARCEL ROUTES ---

// Create Parcel Order
app.post('/api/parcels', authMiddleware, async (req, res) => {
  try {
    let parcel;
    if (getIsConnected()) {
      const newParcel = new Parcel({
        userId: req.user.id,
        ...req.body
      });
      parcel = await newParcel.save();
    } else {
      parcel = await inMemoryStore.createParcel({
        userId: req.user.id,
        ...req.body
      });
    }
    return res.json(parcel);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get User's Parcels
app.get('/api/parcels', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const parcels = await Parcel.find({ userId: req.user.id }).sort({ createdAt: -1 });
      return res.json(parcels);
    } else {
      const parcels = await inMemoryStore.getParcelsByUserId(req.user.id);
      return res.json(parcels);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
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
        participants: { $all: [req.user.id, targetUserId] }
      });

      if (!chat) {
        chat = new Chat({
          participants: [req.user.id, targetUserId],
          lastMessage: "Interested in sharing tomorrow's commute?",
          messages: [
            { text: "Hey! Saw we have a 94% route overlap. Interested in sharing tomorrow's commute?", senderId: targetUserId, timestamp: new Date() }
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
    res.status(500).send('Server error');
  }
});

// Get User's Chats
app.get('/api/chats', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const chats = await Chat.find({
        participants: req.user.id
      }).sort({ updatedAt: -1 });
      return res.json(chats);
    } else {
      const chats = await inMemoryStore.getChatsByUserId(req.user.id);
      return res.json(chats);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get Specific Chat Room
app.get('/api/chats/:id', authMiddleware, async (req, res) => {
  try {
    if (getIsConnected()) {
      const chat = await Chat.findById(req.params.id);
      if (!chat) return res.status(404).json({ msg: 'Chat session not found' });
      return res.json(chat);
    } else {
      const chat = await inMemoryStore.getChatById(req.params.id);
      if (!chat) return res.status(404).json({ msg: 'Chat session not found' });
      return res.json(chat);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Send Message inside Chat Session
app.post('/api/chats/:id/messages', authMiddleware, async (req, res) => {
  const { text } = req.body;
  try {
    let chat;
    if (getIsConnected()) {
      chat = await Chat.findById(req.params.id);
      if (!chat) return res.status(404).json({ msg: 'Chat not found' });

      const message = {
        text,
        senderId: req.user.id,
        timestamp: new Date()
      };

      chat.messages.push(message);
      chat.lastMessage = text;
      chat.updatedAt = Date.now();
      await chat.save();
    } else {
      chat = await inMemoryStore.addChatMessage(req.params.id, text, req.user.id);
      if (!chat) return res.status(404).json({ msg: 'Chat not found' });
    }

    io.to(`chat_${chat.id}`).emit('chatMessageUpdate', chat);
    return res.json(chat);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- TELEMETRY / PERFORMANCE BENCHMARKING ENDPOINT ---
app.post('/api/performance-logs', async (req, res) => {
  try {
    res.json({ success: true, timestamp: Date.now() });
  } catch (err) {
    res.status(500).send('Telemetry error');
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

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

// Server Listen
server.listen(PORT, () => {
  console.log(`SmartRide Express server running on port ${PORT}`);
});
