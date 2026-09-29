# SmartRide AI - React Native Android Mobile Application

Autonomous Multi-Provider Cab Booking, Fare Aggregation & Real-Time Telemetry Application built with **React Native** and **Expo**.

---

## 📱 Features

- **Multi-App Rate Engine**: Real-time rate calculation across **Uber, Ola, Rapido, Namma Yatri, and SmartRide AI**.
- **EMMDE Multi-Agent Consensus**: Coordinate 5 independent pricing and stability agents (`FareAgent`, `StabilityAgent`, `HumanEffortAgent`, `ContextAgent`) to eliminate surge gouging.
- **Native Android Stack**: Clean native mobile primitives (`View`, `Text`, `Pressable`, `StyleSheet`) and `@react-navigation/native` Bottom Tabs + Stack.
- **Chubby AI Mobile Assistant**: Context-aware floating conversational assistant with instant route insights and surge explanations.
- **Express Same-Day Parcel**: Doorstep courier dispatch with weight selection and fragile item security.
- **Multilingual Support**: Live toggle across English, Tamil, and Hindi.
- **Safety First**: 4-digit ride start PIN verification and instant Emergency SOS Police/Contact trigger.

---

## 📁 Project Structure

```
frontend_android_app/
├── App.js                   # Root application entry with Providers & NavigationContainer
├── index.js                 # Expo root component registration
├── app.json                 # Expo native Android package & permissions configuration
├── package.json             # Native dependencies & run scripts
├── metro.config.js          # Metro bundler settings
├── babel.config.js          # Babel preset config
├── assets/                  # App icon, splash, and adaptive launcher icons
└── src/
    ├── theme/
    │   └── theme.js         # Ultra-premium Dark AI theme & design tokens
    ├── context/
    │   ├── AuthContext.js   # User authentication & demo bypass session state
    │   ├── LanguageContext.js # Dynamic multilingual translation hook
    │   └── ThemeContext.js  # Theme switching context
    ├── navigation/
    │   ├── RootNavigator.js # Auth and main screen stack
    │   └── TabNavigator.js  # Bottom tab bar with 5 primary app hubs
    ├── screens/
    │   ├── auth/
    │   │   ├── SplashScreen.js
    │   │   ├── WelcomeScreen.js
    │   │   ├── LoginScreen.js
    │   │   └── SignUpScreen.js
    │   └── user/
    │       ├── HomeScreen.js           # Live map, route search & rate cards
    │       ├── RideComparisonScreen.js # Detailed comparative pricing matrix
    │       ├── ExplainableAIScreen.js  # Multi-agent transparency inspector
    │       ├── ActivityScreen.js       # Trip history & parcel courier tracking
    │       ├── ParcelScreen.js         # Package courier checkout & dispatch
    │       └── ProfileScreen.js        # Account settings, SOS & preferences
    ├── components/
    │   ├── common/Header.js            # Universal mobile header
    │   ├── map/NativeMapPlaceholder.js # Visual route polyline & live driver simulation
    │   ├── ride/CategorySelector.js    # Horizontal category tab bar (Bike, Auto, Cab, XL, Transit)
    │   ├── ride/RideCard.js            # Comparative fare & booking card
    │   └── ai/ChubbyAIChatModal.js     # Floating Chubby AI chat dialog
    ├── services/
    │   ├── pricing/realtimeFareEngine.js # Multi-provider route math & rates
    │   ├── providers/                  # Uber, Ola, Rapido, Namma Yatri, SmartRide connectors
    │   ├── agents/                     # EMMDE multi-agent decision models
    │   └── normalization/              # Unified rate data normalization
    └── utils/
        └── translations.js             # Localization strings (EN, TA, HI)
```

---

## 🚀 Running the App

### Prerequisites
- Node.js (v18+)
- Android Studio with Android Virtual Device (AVD) or physical device with Expo Go.

### 1. Install Dependencies
```bash
cd frontend_android_app
npm install
```

### 2. Start the Metro Development Server
```bash
npx expo start
```

### 3. Launch on Android Emulator or Device
- Press `a` in the terminal to launch directly on an active Android Emulator.
- Or scan the displayed QR code with the **Expo Go** app on your Android phone.
