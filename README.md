# SmartRide AI - Next-Gen Multimodal Cab & Commute Platform

SmartRide AI is a premium, feature-rich, and high-performance cab booking, carpooling, and parcel delivery aggregator. It leverages AI-driven price comparisons, multi-modal routing, and real-time synchronization to offer a seamless urban transportation experience.

---

## 🚀 Tech Stack & Languages

### **Frontend & Frameworks**
* **Library**: React 19 (JavaScript)
* **Build Tool**: Vite (Ultra-fast HMR and bundling)
* **Styling**: Vanilla CSS combined with Tailwind CSS (utility-first styling)
* **Animations**: Framer Motion (for physics-based transitions, interactive bottom sheets, and gestures)
* **Charts/Analytics**: Recharts (for visualizing commute savings and compatibilities)
* **Icons**: Lucide React

### **Backend & Services**
* **Database**: Firebase Firestore (Real-time NoSQL database)
* **Authentication**: Firebase Authentication (Email/Password, Google, Facebook, Apple sign-in, Phone Verification)
* **Map & Location**: Google Maps JavaScript SDK & Google Places Autocomplete API
* **Geolocation Fallback**: OpenStreetMap (OSM) Nominatim API (for geocoding and address lookup when Google Maps API quotas or billing are unavailable)

---

## 📁 Codebase Directory Structure

```text
ai-cab-booking/
├── Web_frontend/            # React Vite Web Frontend Application
│   ├── src/                 # Web app source code (Components, Pages, Services, Theme)
│   ├── public/              # Static icons & brand assets
│   ├── index.html           # Web HTML entrypoint
│   └── package.json         # Web dependencies & scripts
│
├── frontend_android_app/    # Native React Native (Expo) Android App
│   ├── src/                 # Native components, screens, navigators, AI services
│   ├── App.js               # Root React Native entry
│   ├── app.json             # Expo project configuration
│   └── package.json         # React Native dependencies
│
├── Backend/                 # Consolidated Node.js / Express API & Firebase
│   ├── server.js            # Express API & Socket.IO server (Port 5000)
│   ├── config/              # Database connection & in-memory fallback
│   ├── models/              # User, Ride, Parcel & Chat schemas
│   ├── middleware/          # JWT auth middleware
│   └── firebase/            # Firebase / Firestore configs & security rules
│
├── android_native_app/      # Original Native Android Studio (Java/WebView) project
└── Explainable AI/          # Machine learning & XAI decision engine models
```

---

## ✨ Key Features & Functionality

### **1. Presentation & Demo Mode Bypass**
* To ensure the app can be fully reviewed immediately without setting up local Firebase configurations, developers and evaluators can log in using:
  * **Email**: `demo@smartride.com` or `bhumanarasimha25@gmail.com`
  * **Password**: `demo`
* The application intercepts Firebase exceptions (e.g., config failures) to automatically construct a local mock user profile.

### **2. Ride Comparison (Bike, Scooty, 4-Seater Cab, 7-Seater Cab)**
* Aggregates prices and ETAs across competitors: **Uber, Ola, Rapido, Yulu, Porter, Dunzo**, comparing them directly to **SmartRide AI**.
* Recharts visualize savings. An AI recommendation panel highlights the fastest and cheapest options.

### **3. Multi-modal Commute (Ride Sharing & Carpooling)**
* **Commute Profile**: Create profiles with vehicle details, driving license, and simulated OCR license plate matching verification.
* **Match & Chat**: Displays a compatibility percentage based on route overlaps. Connects users via a real-time Firestore-backed chat interface.
* **Live Sharing**: Generated shareable link copies to clipboard to track coordinates.

### **4. Geocoding OSM Nominatim Fallback**
* If Google Maps API returns quota or billing warnings, the app automatically switches to OpenStreetMap Nominatim for address geocoding, ensuring maps and marker positioning never freeze.

### **5. Parcel Delivery Flow**
* Form-controlled receiver validation, fragile parcel pricing addon (+₹20), standard/heavy/express courier aggregations, early secure payment gates (simulated UPI/Card), and driver tracking sheets.

---

## 🛠️ Installation & Getting Started

### **Prerequisites**
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### **1. Navigate to Web Frontend**
```bash
cd Web_frontend
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Set Up Environment Variables**
A `.env` file is located in `Web_frontend/` with the required Firebase and Google Maps configurations:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### **4. Start Local Development Server**
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### **5. Production Build**
To compile the production bundle:
```bash
npm run build
```
The compiled output is optimized and saved in the `Web_frontend/dist` directory.
