# SmartRide AI - Consolidated Backend Server

Unified backend services for SmartRide AI: Node.js / Express REST API, Socket.IO live tracking, and Firebase / Firestore configuration.

---

## 🏗️ Architecture

```
Backend/
├── server.js              # Express API Server & Socket.IO initialization
├── package.json           # Backend dependencies (express, mongoose, bcryptjs, socket.io, cors)
├── package-lock.json
├── .env                   # Environment variables (PORT=5000, MONGO_URI, JWT_SECRET)
├── config/
│   ├── db.js              # MongoDB connector with auto in-memory fallback
│   ├── inMemoryStore.js   # Fast in-memory data store when local MongoDB is inactive
│   └── users_store.json   # Persistent local JSON store fallback
├── middleware/
│   └── auth.js            # JWT token validation middleware
├── models/
│   ├── User.js            # User profile, ratings, saved places & emergency contacts
│   ├── Ride.js            # Ride booking, telemetry, pricing & status schema
│   ├── Parcel.js          # On-demand courier package schema
│   └── Chat.js            # Real-time commute & driver messaging schema
└── firebase/              # Firebase deployment & security rules
    ├── .firebaserc        # Firebase project configuration
    ├── firebase.json      # Firestore & hosting rewrite rules
    ├── firestore.indexes.json
    └── firestore.rules    # Database security rules
```

---

## ⚡ Key Features

- **Hybrid Database Architecture**:
  - Automatically connects to MongoDB (`mongodb://127.0.0.1:27017/smartride`).
  - If MongoDB is not running locally, it smoothly switches to **High-Performance In-Memory DB Mode** with zero crashes.
- **REST API Endpoints**:
  - `/api/auth` — Sign Up, Login, Social Login, Session Check (`/api/auth/me`).
  - `/api/users` — Profile updates, saved places, preferences, emergency contacts, commute profiles.
  - `/api/rides` — Ride booking dispatch, active rides list, ride status lifecycle.
  - `/api/parcels` — Package delivery creation, tracking status updates.
  - `/api/chats` — Commute chat creation, message history, live sending.
  - `/api/performance-logs` — Telemetry & load latency aggregations.
- **Socket.IO Real-Time Stream**:
  - Live vehicle location updates (`driver-location-update`).
  - Instant chat messaging (`send-message`, `receive-message`).
  - Ride status broadcast (`ride-status-changed`).

---

## 🚀 Running the Server

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Start the Server
```bash
npm start
```
* The server will launch on `http://localhost:5000`.
* Both `frontend` (Web) and `frontend_android_app` (Mobile) connect to `http://localhost:5000/api`.
