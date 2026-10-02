const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, 'users_store.json');
const RIDES_FILE = path.join(__dirname, 'rides_store.json');
const PARCELS_FILE = path.join(__dirname, 'parcels_store.json');
const CHATS_FILE = path.join(__dirname, 'chats_store.json');

class InMemoryStore {
  constructor() {
    this.users = [];
    this.rides = [];
    this.parcels = [];
    this.chats = [];
    this.loadData();
  }

  loadData() {
    // Load Users
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf8');
        const data = JSON.parse(raw);
        this.users = (data || []).map(u => ({
          ...u,
          comparePassword: async function(enteredPassword) {
            return await bcrypt.compare(enteredPassword, this.password);
          }
        }));
      }
    } catch (e) {
      console.error("Failed to load local users store:", e.message);
    }

    // Load Rides
    try {
      if (fs.existsSync(RIDES_FILE)) {
        const raw = fs.readFileSync(RIDES_FILE, 'utf8');
        this.rides = JSON.parse(raw) || [];
      } else {
        // Seed initial realistic rides for primary account (bhumanarasimha25@gmail.com)
        this.rides = [
          {
            _id: '000000000000000000000101',
            id: '000000000000000000000101',
            userId: '000000000000000000000002',
            pickupLocation: 'Marina Beach, Chennai',
            dropoffLocation: 'Guindy Tech Park, Phase 1',
            vehicleType: 'SmartRide AI (Cab+Metro)',
            price: '406',
            duration: '61 min',
            distance: '14.2 km',
            status: 'completed',
            createdAt: new Date(Date.now() - 3600000 * 24),
            updatedAt: new Date(Date.now() - 3600000 * 24)
          },
          {
            _id: '000000000000000000000102',
            id: '000000000000000000000102',
            userId: '000000000000000000000002',
            pickupLocation: 'Anna Nagar 2nd Avenue',
            dropoffLocation: 'T. Nagar Shopping Hub',
            vehicleType: 'Auto',
            price: '128',
            duration: '22 min',
            distance: '6.8 km',
            status: 'completed',
            createdAt: new Date(Date.now() - 3600000 * 48),
            updatedAt: new Date(Date.now() - 3600000 * 48)
          }
        ];
        this.saveRides();
      }
    } catch (e) {
      console.error("Failed to load local rides store:", e.message);
    }

    // Load Parcels
    try {
      if (fs.existsSync(PARCELS_FILE)) {
        const raw = fs.readFileSync(PARCELS_FILE, 'utf8');
        this.parcels = JSON.parse(raw) || [];
      } else {
        this.parcels = [];
      }
    } catch (e) {
      console.error("Failed to load local parcels store:", e.message);
    }

    // Load Chats
    try {
      if (fs.existsSync(CHATS_FILE)) {
        const raw = fs.readFileSync(CHATS_FILE, 'utf8');
        this.chats = JSON.parse(raw) || [];
      } else {
        this.chats = [];
      }
    } catch (e) {
      console.error("Failed to load local chats store:", e.message);
    }
  }

  saveUsers() {
    try {
      const serializableUsers = this.users.map(({ comparePassword, ...rest }) => rest);
      fs.writeFileSync(USERS_FILE, JSON.stringify(serializableUsers, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to save local users store:", e.message);
    }
  }

  saveRides() {
    try {
      fs.writeFileSync(RIDES_FILE, JSON.stringify(this.rides, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to save local rides store:", e.message);
    }
  }

  saveParcels() {
    try {
      fs.writeFileSync(PARCELS_FILE, JSON.stringify(this.parcels, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to save local parcels store:", e.message);
    }
  }

  saveChats() {
    try {
      fs.writeFileSync(CHATS_FILE, JSON.stringify(this.chats, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to save local chats store:", e.message);
    }
  }

  generateId() {
    return crypto.randomBytes(12).toString('hex');
  }

  async findUserByEmail(email) {
    if (!email) return null;
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  async findUserById(id) {
    if (!id) return null;
    const user = this.users.find(u => (u._id || u.id) === id);
    if (!user) return null;
    return user;
  }

  async createUser({ email, password, name, photoURL, preferences, savedPlaces, emergencyContacts, commuteProfile }) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    
    // If user already exists by email, update profile details and return existing user
    const existingIdx = this.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (existingIdx >= 0) {
      const existingUser = this.users[existingIdx];
      if (name && (!existingUser.name || existingUser.name.startsWith('Demo'))) {
        existingUser.name = name;
      }
      if (photoURL) existingUser.photoURL = photoURL;
      existingUser.updatedAt = new Date();
      this.saveUsers();
      return existingUser;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'demo', salt);
    const id = this.generateId();
    const newUser = {
      _id: id,
      id: id,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      photoURL: photoURL || '',
      password: hashedPassword,
      preferences: preferences || { theme: 'dark-ai', language: 'en' },
      savedPlaces: savedPlaces || [
        { name: 'Home', address: '123 Tech Park, Phase 1' },
        { name: 'Office', address: '456 Innovations Way, Block B' }
      ],
      emergencyContacts: emergencyContacts || [
        { name: 'Safety Dispatch', phone: '+1-800-555-0199' }
      ],
      commuteProfile: commuteProfile || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      comparePassword: async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      }
    };
    
    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  async updateUser(id, updateData) {
    const user = await this.findUserById(id);
    if (!user) return null;
    const fieldsToUpdate = ['name', 'photoURL', 'preferences', 'savedPlaces', 'emergencyContacts', 'commuteProfile'];
    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });
    user.updatedAt = new Date();
    this.saveUsers();
    return user;
  }

  async createRide(rideData) {
    const id = this.generateId();
    const ride = {
      _id: id,
      id: id,
      ...rideData,
      vehicleType: rideData.vehicleType || rideData.rideType || 'Standard',
      duration: rideData.duration || rideData.eta || '',
      price: rideData.price !== undefined ? String(rideData.price) : '0',
      status: rideData.status || 'searching',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rides.push(ride);
    this.saveRides();
    return ride;
  }

  async getRidesByUserId(userId) {
    return this.rides
      .filter(r => String(r.userId) === String(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getRideById(id) {
    return this.rides.find(r => String(r._id) === String(id) || String(r.id) === String(id)) || null;
  }

  async updateRideStatus(id, status) {
    const ride = await this.getRideById(id);
    if (!ride) return null;
    ride.status = status;
    ride.updatedAt = new Date();
    this.saveRides();
    return ride;
  }

  async createParcel(parcelData) {
    const id = this.generateId();
    const parcel = {
      _id: id,
      id: id,
      ...parcelData,
      status: parcelData.status || 'pending',
      createdAt: new Date()
    };
    this.parcels.push(parcel);
    this.saveParcels();
    return parcel;
  }

  async getParcelsByUserId(userId) {
    return this.parcels
      .filter(p => String(p.userId) === String(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async createChat(participant1, participant2) {
    let chat = this.chats.find(c => c.participants.includes(participant1) && c.participants.includes(participant2));
    if (!chat) {
      const id = this.generateId();
      chat = {
        _id: id,
        id: id,
        participants: [participant1, participant2],
        lastMessage: "Interested in sharing tomorrow's commute?",
        messages: [
          { text: "Hey! Saw we have a 94% route overlap. Interested in sharing tomorrow's commute?", senderId: participant2, timestamp: new Date() }
        ],
        updatedAt: new Date()
      };
      this.chats.push(chat);
      this.saveChats();
    }
    return chat;
  }

  async getChatsByUserId(userId) {
    return this.chats
      .filter(c => c.participants.includes(userId))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async getChatById(id) {
    return this.chats.find(c => (c._id || c.id) === id) || null;
  }

  async addChatMessage(id, text, senderId) {
    const chat = await this.getChatById(id);
    if (!chat) return null;
    const msg = { text, senderId, timestamp: new Date() };
    chat.messages.push(msg);
    chat.lastMessage = text;
    chat.updatedAt = new Date();
    this.saveChats();
    return chat;
  }
}

const store = new InMemoryStore();
module.exports = store;
