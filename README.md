<div align="center">

  # ⚡ SmartRide AI
  ### *The Next-Generation AI-Powered Multi-Provider Cab & Parcel Mobility Platform*

  [![Android Build](https://img.shields.io/badge/Android-Pass-green?style=for-the-badge&logo=android&logoColor=white)](https://github.com/bhumanarasimha/AI-CAB-BOOKING)
  [![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

  [Features](#-key-features) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Android App](#-android-app)

</div>

---

## 🌟 Overview

**SmartRide AI** is an end-to-end, intelligent mobility and parcel transport ecosystem. Designed with a glassmorphic cyber aesthetic and driven by multi-agent AI algorithms, SmartRide AI aggregates real-time ride availability and live fares across top ride-hailing services (**Uber**, **Ola**, **Rapido**, **Namma Yatri**, and **SmartRide EV**), eliminating price surge traps and optimizing every trip for speed, safety, and price.

---

## ✨ Key Features

### 🚖 1. Real-Time Multi-Provider Fare Engine
* **Instant Comparison**: Compares live fares, ETAs, and availability across Uber, Ola, Rapido, Namma Yatri, and SmartRide EV simultaneously.
* **Deep App Linking**: 1-tap deep links directly launch installed native competitor apps (Uber, Ola, Rapido) pre-filled with pickup and drop-off coordinates.

### 🧠 2. EMMDE AI Decision Engine
* **Multi-Agent Scoring**: Runs internal micro-agents (**FareAgent**, **StabilityAgent**, **HumanEffortAgent**, **ContextAgent**, **ExplainabilityAgent**) to evaluate every ride option.
* **AI Top Pick**: Automatically highlights the `#1 AI Pick` balancing price, driver reliability, surge risk, and pickup effort.

### 🗺️ 3. Live Maps & GPS Radar
* **Google Maps Integration**: Custom Cyber Dark Mode and Daylight Light Mode vector styling.
* **Live Location Beacon**: Official high-visibility GPS Blue Dot with animated accuracy radar ring.
* **Live Fleet Radar**: Real-time cab fleet visualization around the user's location with 1-tap recenter.

### 📦 4. Multi-Tier Parcel & Logistics Transport
* **Courier Modes**: Express Bike (up to 5kg), Standard Car (up to 20kg), and Heavy Van (up to 100kg).
* **Smart Address Autocomplete**: Auto-suggests verified local landmarks and route destinations.

### 👥 5. Smart Commute & Carpooling
* **AI Matchmaking**: Matches daily commuters sharing similar routes, work shifts, and travel preferences.
* **Cost & Carbon Savings**: Built-in savings calculator showing monthly money saved and $CO_2$ emission reductions.

### 🔐 6. Frictionless Authentication
* **1-Tap Social Auth**: Instant Google and Facebook authentication with automatic profile setup.
* **Email Verification**: Clean 6-digit OTP verification flow.

---

## 🛠 Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Mobile Host** | Native Android Studio (Java), WebViewAssetLoader, ViewCompat Insets, WebChromeClient Geolocation |
| **Web Frontend** | React 19, React Native Web, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **State & API** | React Context, Custom Hooks (`useGPSLocation`, `useRideRefreshEngine`), REST API |
| **Backend API** | Node.js, Express, MongoDB Mongoose, Socket.io, Nodemailer SMTP |
| **Cloud & Auth** | Firebase Auth, Firestore Realtime DB, Google Maps JavaScript API & Geocoding |

---

## 🏗 Architecture

```
AI-CAB-BOOKING/
├── app/                            # Android Studio Native Application Module
│   ├── src/main/java/              # MainActivity.java & Native WebAppInterface Bridge
│   ├── src/main/assets/            # Production React bundle (index.html, JS, CSS)
│   ├── src/main/res/               # Android Resources, App Icons, Layouts & Themes
│   └── build.gradle.kts            # Android Module Build Configuration
├── Web_frontend/                   # React 19 Web Frontend Source Code
│   ├── src/components/             # InteractiveMap, AIChatBot, RouteMap, VehicleLoader
│   ├── src/pages/                  # Home, RideComparison, Search, Parcel, Commute, Auth
│   ├── src/services/agents/        # EMMDE Multi-Agent AI Pricing & Stability Engines
│   ├── src/lib/                    # AuthContext, API Client, Firebase & Firestore
│   ├── package.json                # Frontend Dependencies & Scripts
│   └── vite.config.js              # Vite Production Bundler Config
├── Backend/                        # Node.js Express REST Backend Server
│   ├── models/                     # User & Ride MongoDB Schemas
│   ├── middleware/                 # JWT Auth Middleware
│   ├── server.js                   # Express App, Socket.io & Email OTP Dispatcher
│   └── package.json                # Backend Dependencies
├── build.gradle.kts                # Project-Level Gradle Config
└── settings.gradle.kts             # Gradle Settings (Includes :app)
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm** or **pnpm**: Installed globally
* **Android Studio**: Ladybug / 2024.2+ (for building native APK)
* **JDK**: Version 17+

---

### 1. Web Frontend Setup
```bash
# Navigate to Web_frontend directory
cd Web_frontend

# Install dependencies
npm install

# Start local development server
npm run dev
```
*App will run at `http://localhost:5173`.*

---

### 2. Backend Server Setup
```bash
# Navigate to Backend directory
cd Backend

# Install dependencies
npm install

# Start backend REST API server
npm start
```
*Backend server will run at `http://localhost:5000`.*

---

### 3. Build Web Bundle & Sync to Android Assets
```bash
# In Web_frontend
npm run build

# Copy built bundle to Android assets directory (Windows PowerShell)
Copy-Item -Path "Web_frontend\dist\*" -Destination "app\src\main\assets\" -Recurse -Force
```

---

## 📱 Android App (APK) Build

### From Android Studio
1. Launch **Android Studio**.
2. Open the project root directory `AI-CAB-BOOKING`.
3. Let Gradle sync dependencies.
4. Connect an Android device or launch an Emulator (AVD).
5. Click **Run App** (`Shift + F10`).

### From Command Line
```bash
# Assemble Debug APK
./gradlew app:assembleDebug
```
*Compiled APK location: `app/build/outputs/apk/debug/app-debug.apk`*

---

## 👤 Author & Maintainer

* **Developer**: Bhumana Narasimha
* **GitHub**: [@bhumanarasimha](https://github.com/bhumanarasimha)
* **Repository**: [https://github.com/bhumanarasimha/AI-CAB-BOOKING](https://github.com/bhumanarasimha/AI-CAB-BOOKING)

---

<div align="center">
  <sub>Built with ❤️ by Bhumana Narasimha · SmartRide AI</sub>
</div>
