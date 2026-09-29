const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, 'users_store.json');

class InMemoryStore {
  constructor() {
    this.users = [];
    this.rides = [];
    this.parcels = [];
    this.chats = [];
    this.idCounter = 1;
    this.loadUsers();
  }

  loadUsers() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
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
  }

  saveUsers() {
    try {
      const serializableUsers = this.users.map(({ comparePassword, ...rest }) => rest);
      fs.writeFileSync(DATA_FILE, JSON.stringify(serializableUsers, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to save local users store:", e.message);
    }
  }

  generateId() {
    return (this.idCounter++).toString().padStart(24, '0');
  }

  async findUserByEmail(email) {
    if (!email) return null;
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findUserById(id) {
    const user = this.users.find(u => (u._id || u.id) === id);
    if (!user) return null;
    return user;
  }

  async createUser({ email, password, name, preferences, savedPlaces, emergencyContacts, commuteProfile }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'demo', salt);
    const id = this.generateId();
    const newUser = {
      _id: id,
      id: id,
      email: email.toLowerCase(),
      name: name || '',
      password: hashedPassword,
      preferences: preferences || { theme: 'dark', language: 'en' },
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
    
    // Replace existing if matching email exists
    const existingIdx = this.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingIdx >= 0) {
      this.users[existingIdx] = newUser;
    } else {
      this.users.push(newUser);
    }
    
    this.saveUsers();
    return newUser;
  }

  async updateUser(id, updateData) {
    const user = await this.findUserById(id);
    if (!user) return null;
    const fieldsToUpdate = ['name', 'preferences', 'savedPlaces', 'emergencyContacts', 'commuteProfile'];
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
      status: rideData.status || 'searching',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rides.push(ride);
    return ride;
  }

  async getRidesByUserId(userId) {
    return this.rides.filter(r => r.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  }

  async getRideById(id) {
    return this.rides.find(r => (r._id || r.id) === id) || null;
  }

  async updateRideStatus(id, status) {
    const ride = await this.getRideById(id);
    if (!ride) return null;
    ride.status = status;
    ride.updatedAt = new Date();
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
    return parcel;
  }

  async getParcelsByUserId(userId) {
    return this.parcels.filter(p => p.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
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
    }
    return chat;
  }

  async getChatsByUserId(userId) {
    return this.chats.filter(c => c.participants.includes(userId)).sort((a, b) => b.updatedAt - a.updatedAt);
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
    return chat;
  }
}

const store = new InMemoryStore();
module.exports = store;
