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
const nodemailer = require('nodemailer');

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
      { 
        email: 'bhumanarasimha25@gmail.com', 
        name: 'Bhumana Narasimha', 
        password: 'demo',
        photoURL: 'https://ui-avatars.com/api/?name=Bhumana+Narasimha&background=00D8FF&color=080C14',
        role: 'Developer & VIP'
      },
      { 
        email: 'demo@smartride.com', 
        name: 'Demo Rider', 
        password: 'demo',
        photoURL: 'https://ui-avatars.com/api/?name=Demo+Rider&background=6366F1&color=ffffff',
        role: 'Standard Rider'
      },
      { 
        email: 'nameisvenkat2005@gmail.com', 
        name: 'Venkat', 
        password: '123456',
        photoURL: 'https://ui-avatars.com/api/?name=Venkat&background=10B981&color=080C14',
        role: 'Daily Tech Commuter'
      },
      { 
        email: 'anita.patel@smartride.com', 
        name: 'Anita Patel', 
        password: 'demo123',
        photoURL: 'https://ui-avatars.com/api/?name=Anita+Patel&background=F59E0B&color=080C14',
        role: 'Corporate Executive'
      },
      { 
        email: 'rahul.verma@smartride.com', 
        name: 'Rahul Verma', 
        password: 'demo123',
        photoURL: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=EC4899&color=ffffff',
        role: 'Student & Green Rider'
      }
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

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Helper to sign JWT
// Helper to sign JWT (supports user object or direct id)
const signToken = (userOrId) => {
  let userId = userOrId;
  let email = '';
  let name = '';
  if (typeof userOrId === 'object' && userOrId !== null) {
    userId = userOrId.id || userOrId._id;
    email = userOrId.email || '';
    name = userOrId.name || '';
  }
  const payload = {
    user: {
      id: userId,
      email,
      name
    }
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Helper to track active sessions across multiple concurrent users in the database
const recordSessionInDB = async (user, token, userAgent = '') => {
  try {
    const userId = String(user.id || user._id);
    if (getIsConnected()) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        await User.findByIdAndUpdate(userId, {
          $set: { isOnline: true, lastLogin: new Date() },
          $push: {
            activeSessions: {
              sessionId: new mongoose.Types.ObjectId().toString(),
              token,
              loginTime: new Date(),
              userAgent: userAgent || 'Client'
            }
          }
        });
      }
    }
    inMemoryStore.createSession({
      userId,
      email: user.email,
      token,
      userAgent
    });
  } catch (err) {
    console.warn('Failed to record session in DB:', err.message);
  }
};

const removeSessionFromDB = async (userId, token) => {
  try {
    if (getIsConnected() && userId && mongoose.Types.ObjectId.isValid(userId)) {
      await User.findByIdAndUpdate(userId, {
        $pull: { activeSessions: { token } }
      });
      const checkUser = await User.findById(userId);
      if (checkUser && (!checkUser.activeSessions || checkUser.activeSessions.length === 0)) {
        checkUser.isOnline = false;
        await checkUser.save();
      }
    }
    inMemoryStore.removeSession(token);
  } catch (err) {
    console.warn('Failed to remove session from DB:', err.message);
  }
};

// --- EMAIL OTP VERIFICATION SYSTEM ---
const emailOtpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmailOTP = async (email, otp) => {
  const cleanEmail = email.toLowerCase().trim();
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const fromAddress = process.env.SMTP_FROM || `"SmartRide AI Security" <noreply@smartride.ai>`;

  console.log(`[SmartRide AI Security] Dispatching verification code to: ${cleanEmail}`);

  let emailSent = false;
  let emailError = null;

  if (smtpUser && smtpPass) {
    try {
      const transporter = smtpHost.includes('gmail')
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: smtpPass
            }
          })
        : nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass
            }
          });

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #080C14; color: #F1F5F9; padding: 36px; border-radius: 16px; max-width: 500px; margin: auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #00D8FF; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">SmartRide AI</h1>
            <p style="color: #9CA3AF; margin-top: 6px; font-size: 13px;">Security & Account Verification</p>
          </div>
          <div style="background-color: #0F1623; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 26px; text-align: center;">
            <p style="font-size: 14px; color: #E2E8F0; margin-bottom: 12px;">Your one-time email verification code is:</p>
            <div style="display: inline-block; background: rgba(0, 216, 255, 0.1); border: 2px solid #00D8FF; border-radius: 12px; padding: 14px 28px; margin: 8px 0;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #00D8FF;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #94A3B8; margin-top: 14px;">This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          </div>
          <p style="text-align: center; font-size: 11px; color: #64748B; margin-top: 24px;">SmartRide AI Verification Dispatch · If you didn't request this code, you can ignore this email.</p>
        </div>
      `;

      await transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject: `${otp} is your SmartRide AI verification code`,
        text: `Your SmartRide AI verification code is: ${otp}. It expires in 10 minutes.`,
        html: htmlContent
      });
      emailSent = true;
      console.log(`[SMTP] Successfully delivered verification email to ${cleanEmail}`);
    } catch (err) {
      console.warn(`[SMTP Warning] Failed to send email via SMTP to ${cleanEmail}:`, err.message);
      emailError = err.message;
    }
  }

  return { emailSent, emailError };
};

// Send Email OTP endpoint
app.post('/api/auth/send-email-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ msg: 'Please enter a valid email address' });
    }
    const cleanEmail = email.toLowerCase().trim();

    // If registering, check if user already exists
    if (purpose === 'register') {
      let existingUser = null;
      if (getIsConnected()) {
        existingUser = await User.findOne({ email: cleanEmail });
      } else {
        existingUser = await inMemoryStore.findUserByEmail(cleanEmail);
      }
      if (existingUser) {
        return res.status(400).json({ msg: 'An account with this email already exists. Please sign in instead.' });
      }
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    emailOtpStore.set(cleanEmail, {
      otp,
      expiresAt,
      attempts: 0,
      verified: false
    });

    const { emailSent } = await sendEmailOTP(cleanEmail, otp);

    return res.json({
      success: true,
      msg: `Verification code sent to ${cleanEmail}. Check your inbox.`,
      email: cleanEmail,
      emailSent
    });
  } catch (err) {
    console.error('send-email-otp error:', err.message);
    res.status(500).json({ msg: 'Failed to send verification code', details: err.message });
  }
});

// Verify Email OTP endpoint
app.post('/api/auth/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ msg: 'Email and OTP code are required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const record = emailOtpStore.get(cleanEmail);
    if (!record) {
      return res.status(400).json({ msg: 'No verification code requested for this email. Please click Resend.' });
    }

    if (Date.now() > record.expiresAt) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({ msg: 'Verification code has expired. Please request a new code.' });
    }

    if (record.attempts >= 5) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({ msg: 'Too many incorrect attempts. Please request a new code.' });
    }

    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      return res.status(400).json({ msg: 'Invalid verification code. Please check your email and try again.' });
    }

    record.verified = true;
    return res.json({ success: true, msg: 'Email verified successfully!' });
  } catch (err) {
    console.error('verify-email-otp error:', err.message);
    res.status(500).json({ msg: 'Server error verifying OTP', details: err.message });
  }
});

// --- AUTHENTICATION ROUTES ---

// Register User (with OTP Verification & Phone support)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, phone, otp } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide both email and password' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
    const cleanPhone = (phone || '').trim();

    // Verify OTP if OTP session exists for this email
    const record = emailOtpStore.get(cleanEmail);
    if (record) {
      if (!otp && !record.verified) {
        return res.status(400).json({ 
          msg: 'Please enter the 6-digit verification code sent to your email', 
          requiresOtp: true 
        });
      }
      if (otp) {
        const cleanOtp = String(otp).trim();
        if (Date.now() > record.expiresAt) {
          emailOtpStore.delete(cleanEmail);
          return res.status(400).json({ msg: 'Verification code has expired. Please request a new one.' });
        }
        if (record.otp !== cleanOtp && !record.verified) {
          record.attempts += 1;
          return res.status(400).json({ msg: 'Invalid verification code. Please check your email and try again.' });
        }
      }
      // OTP verified successfully!
      emailOtpStore.delete(cleanEmail);
    }

    if (getIsConnected()) {
      let user = await User.findOne({ email: cleanEmail });
      if (user) {
        return res.status(400).json({ msg: 'An account with this email already exists' });
      }

      user = new User({ email: cleanEmail, password, name: cleanName, phone: cleanPhone });
      await user.save();

      const token = signToken(user);
      await recordSessionInDB(user, token, req.headers['user-agent']);
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone } });
    } else {
      let user = await inMemoryStore.findUserByEmail(cleanEmail);
      if (user) {
        return res.status(400).json({ msg: 'An account with this email already exists' });
      }

      user = await inMemoryStore.createUser({ email: cleanEmail, password, name: cleanName, phone: cleanPhone });
      const token = signToken(user);
      await recordSessionInDB(user, token, req.headers['user-agent']);
      return res.json({ token, user: { id: user.id || user._id, email: user.email, name: user.name, phone: user.phone } });
    }
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide both email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (getIsConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      let isMatch = false;
      try {
        isMatch = await user.comparePassword(password);
      } catch (cmpErr) {
        console.warn('Password comparison error:', cmpErr.message);
      }

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const token = signToken(user);
      await recordSessionInDB(user, token, req.headers['user-agent']);
      return res.json({
        token,
        user: {
          id: user.id || user._id,
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
      const user = await inMemoryStore.findUserByEmail(cleanEmail);
      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      let isMatch = false;
      try {
        isMatch = await user.comparePassword(password);
      } catch (cmpErr) {
        console.warn('Password comparison error in-memory:', cmpErr.message);
      }

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const token = signToken(user);
      await recordSessionInDB(user, token, req.headers['user-agent']);
      return res.json({
        token,
        user: {
          id: user.id || user._id,
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
    console.error('Login error:', err.message);
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
    if (cleanEmail.includes('demo') || cleanEmail.includes('smartride.ai') || cleanEmail.includes('facebook.rider') || cleanEmail.includes('apple.rider')) {
      return res.status(400).json({ msg: 'Please provide a valid personal or business email address for authentication.' });
    }
    const cleanName = (name && !name.toLowerCase().startsWith('demo') && !name.toLowerCase().includes('rider')) ? name : (cleanEmail.split('@')[0].replace(/[._-]/g, ' '));

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
      const token = signToken(user);
      await recordSessionInDB(user, token, req.headers['user-agent']);
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
      const token = signToken(user);
      await recordSessionInDB(user, token, req.headers['user-agent']);
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
    console.error('Social login error:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Logout User (terminates session from database)
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    await removeSessionFromDB(req.user.id, req.token);
    res.json({ msg: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Active Logged-in Users in Database
app.get('/api/auth/active-users', async (req, res) => {
  try {
    let users = [];
    if (getIsConnected()) {
      users = await User.find({ isOnline: true }).select('id email name role lastLogin photoURL activeSessions');
    }
    if (!users || users.length === 0) {
      users = inMemoryStore.getActiveUsers();
    }
    const sanitized = (users || []).map(u => ({
      id: u._id || u.id,
      email: u.email,
      name: u.name,
      role: u.role || 'Rider',
      lastLogin: u.lastLogin,
      activeSessions: (u.activeSessions || []).length
    }));
    res.json({ count: sanitized.length, users: sanitized });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get Current User (authenticated)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : null;

    let user = null;
    if (getIsConnected()) {
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).select('-password');
      }
      if (!user && userEmail) {
        user = await User.findOne({ email: userEmail }).select('-password');
      }
    }

    if (!user) {
      if (userId) {
        user = await inMemoryStore.findUserById(userId);
      }
      if (!user && userEmail) {
        user = await inMemoryStore.findUserByEmail(userEmail);
      }
    }

    if (user) {
      const sanitized = user.toObject ? user.toObject() : { ...user };
      delete sanitized.password;
      return res.json(sanitized);
    }

    return res.status(404).json({ msg: 'User not found' });
  } catch (err) {
    console.error('Auth me error:', err.message);
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
