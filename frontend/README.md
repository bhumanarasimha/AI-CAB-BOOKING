# SmartRide AI - Web Frontend

The web application for SmartRide AI: an intelligent urban mobility platform built with React, Vite, and TailwindCSS.

---

## 🏗️ Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS & Custom Glassmorphic Dark UI
- **Routing**: React Router v7
- **Maps**: React Google Maps API (`@react-google-maps/api`)
- **Real-Time Tracking & Chat**: Socket.IO Client (`socket.io-client`)
- **Backend & Auth**: Firebase Auth + REST API & WebSocket server on `http://localhost:5000`
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React

---

## 📁 Directory Structure

```
Web_frontend/
├── index.html              # HTML entrypoint
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Custom theme & color palette
├── package.json            # Web frontend dependencies & scripts
├── public/                 # Static assets, favicon, brand icons
├── src/
│   ├── main.jsx            # React root mount
│   ├── App.jsx             # Main router & theme provider
│   ├── index.css           # Global CSS variables & animations
│   ├── components/         # Reusable UI widgets, layout & modals
│   │   ├── layout/         # Header, BottomNavigation, MobileContainer
│   │   └── ui/             # AIChatBot, InteractiveMap, RouteMap, VehicleLoader
│   ├── pages/              # Application pages
│   │   ├── auth/           # Login, SignUp, Onboarding, Splash, Terms
│   │   └── user/           # Home, RideComparison, ExplainableAI, Activity, etc.
│   │       └── commute/    # Daily carpool & commute matching modules
│   ├── context/            # React context (Language, Theme)
│   ├── lib/                # AuthContext, API client, Firebase, Socket
│   ├── services/           # EMMDE Decision Engine, pricing & aggregator providers
│   └── utils/              # Translations & helper utilities
└── dist/                   # Production build distribution
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd Web_frontend
npm install
```

### 2. Configure Environment (.env)
The `.env` file should configure Firebase and Google Maps API keys:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=smartride-ai-cab.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smartride-ai-cab
VITE_FIREBASE_STORAGE_BUCKET=smartride-ai-cab.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Optimized assets will be output to `Web_frontend/dist/`.
