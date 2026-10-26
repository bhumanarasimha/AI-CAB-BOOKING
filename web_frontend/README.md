# ⚡ SmartRide AI - Web Application (`web_frontend`)

A pure **HTML5, CSS3 (Vanilla), and JavaScript (ES6+ Modules)** web application mirroring all features and sections from the native Android application, sharing the exact same **PHP & MySQL REST Backend** (`http://localhost:5000/api`).

---

## 🌟 Key Sections & Features

1. **🚖 Real-Time Multi-Provider Fare Engine (`#section-rides`)**:
   - Compares live fares, ETAs, and availability across **Uber**, **Ola**, **Rapido**, **Namma Yatri**, and **SmartRide EV**.
   - Categories: All, Bike, Auto, Cab (4-Seater), SUV (7-Seater), Transit.
   - Dynamic sorting strategies: AI Best Overall, Cheapest, Fastest, Most Reliable, Lowest Effort.
   - Deep app link support to launch installed competitor apps with pre-filled coordinates.
   - 1-click booking calling `POST /rides` on the shared backend.

2. **🗺️ Interactive GPS Fleet Radar Canvas (`#section-radar`)**:
   - Custom 60fps HTML5 Canvas rendering real-time animated cab movements.
   - User live location GPS Blue Dot with expanding radar pulse wave.
   - Dynamic Bezier route polyline connecting pickup and drop-off.
   - Interactive click-to-pick drop-off locations, zoom controls (+ / -), and recenter button.

3. **📦 Multi-Tier Parcel & Courier Transport (`#section-parcel`)**:
   - Courier tiers: Express Bike (≤5kg), Standard Car (≤20kg), and Heavy Van (≤100kg).
   - Dynamic distance and fare estimation.
   - Calls `POST /parcels` and `GET /parcels` on the shared backend.

4. **👥 Smart Commute & Carpooling (`#section-commute`)**:
   - Matches daily commuters heading to the same tech park or corporate hub.
   - Monthly cost savings (₹4,200+) and carbon reduction ($CO_2$) calculator.
   - Real-time carpool chat modal powered by `POST /chats/:id/messages` and `GET /chats/:id`.

5. **📊 My Rides & Activity (`#section-activity`)**:
   - Fetches trip history from `GET /rides` on the shared backend.
   - Displays digital receipts, trip status (CONFIRMED, COMPLETED), and fare breakdowns.

6. **🧠 Explainable AI (XAI) Inspector (`#section-xai`)**:
   - Live breakdown of the EMMDE Multi-Agent system:
     - `FareAgent`: Price-per-km and surge resistance.
     - `StabilityAgent`: Historical reliability and cancellation risk.
     - `HumanEffortAgent`: Walking friction and curbside convenience.
     - `ContextAgent`: Traffic congestion index and weather.
   - Hits `POST /ai/decide` on the shared backend.

7. **🛡️ Profile, Safety SOS & Settings (`#section-profile`)**:
   - User Profile synced with `PUT /users/profile`.
   - Emergency SOS dispatch modal alerting police (112) and primary contacts with live GPS coordinates (`PUT /users/emergency-contacts`).
   - Saved Places (Home, Work, Airport) synced with `PUT /users/saved-places`.
   - 6-Theme Switcher: **Dark AI**, **Midnight**, **Aurora**, **Ocean**, **Sunset**, and **Light**.

8. **🤖 Floating AI Copilot Chatbot Widget**:
   - Floating interactive assistant answering queries on fares, AI recommendations, parcel delivery, and safety.

---

## 🔗 Shared Backend Architecture

Both the **Android application** and this **Web application** communicate with the exact same PHP/MySQL backend located in `Backend/php`:

- **API Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT Bearer token via `Authorization: Bearer <token>`
- **Endpoints**:
  - `POST /auth/login` & `POST /auth/register`
  - `POST /auth/social-login`
  - `GET /auth/me`
  - `POST /rides` & `GET /rides` & `PUT /rides/:id/status`
  - `POST /parcels` & `GET /parcels`
  - `POST /chats` & `GET /chats/:id` & `POST /chats/:id/messages`
  - `PUT /users/profile`, `PUT /users/saved-places`, `PUT /users/emergency-contacts`
  - `POST /ai/decide`

> **Resilient Offline Fallback**: If the PHP backend is temporarily offline, the web app automatically engages seamless local storage synchronization with realistic state persistence so you can test all features end-to-end without interruption.

---

## 🚀 Running the Web Application

1. Double-click **`start-web.bat`** inside this folder (or run `python -m http.server 8080` / `php -S 0.0.0.0:8080`).
2. Open your browser to **`http://localhost:8080`**.
3. (Optional) Run `..\start-backend.bat` to launch the PHP REST API server on port 5000.
