# SmartRide AI Test Suite

This directory contains automated test suites and verification scripts for the **SmartRide AI Cab Booking Platform**, covering the PHP backend, React Native/Vite mobile app, Web frontend, AI pricing/matching engines, and Playwright UI tests.

---

## Test Suites Overview

### 1. Backend & API Tests
- **`test_all_endpoints.php`**
  - **Purpose**: Verifies that all PHP backend REST endpoints respond with HTTP 200 and valid JSON schemas.
  - **Scope**: User authentication, booking creation, ride status polling, driver matching, ride comparison, commute pool matching, and real-time AI endpoints.
  - **How to Run**:
    ```bash
    php tests/test_all_endpoints.php
    ```

- **`test_ai_module.php`**
  - **Purpose**: Deep verification of the backend Chubby AI engine (`Backend/php/ai.php` and `Backend/php/realtime_ai.php`).
  - **Scope**: Verifies traffic condition parsing, multi-model pricing multiplier computation, explainable AI reasoning generations, and fallback mechanisms when external LLMs are unreachable.
  - **How to Run**:
    ```bash
    php tests/test_ai_module.php
    ```

---

### 2. AI Engine & Algorithm Tests
- **`test_ai_engine.mjs`** & **`test_dynamic_ai_engine.mjs`**
  - **Purpose**: Unit tests for client-side and server-side pricing algorithms, driver acceptance scoring, and dynamic traffic adjustments.
  - **Scope**: Surge pricing boundaries, driver acceptance probability curves, multi-agent ride cost comparisons across Uber, Ola, and SmartRide.
  - **How to Run**:
    ```bash
    node tests/test_dynamic_ai_engine.mjs
    node tests/test_ai_engine.mjs
    ```

- **`test_places.mjs`** & **`test_safe_coords.mjs`**
  - **Purpose**: Validates geographical coordinate bounds, landmark lookup functions, and zero-crash coordinate safety checks.
  - **Scope**: Ensures coordinates passed into Leaflet/Google Maps have valid numbers, prevents `NaN` or `undefined` crashes, and checks geocoding resolution logic.
  - **How to Run**:
    ```bash
    node tests/test_places.mjs
    node tests/test_safe_coords.mjs
    ```

---

### 3. Frontend & Mobile UI Verification (Playwright)
- **`test_map_picker.js`**
  - **Purpose**: Validates the interactive map pin-drop picker, confirming that coordinates are properly parsed and passed without `l.lat.toFixed is not a function` errors.
  - **Scope**: Tests opening `/user/map-picker` with pickup mode, verifying coordinates update upon dragging/clicking the map, and confirming the selected address sets into user state and navigates back to Home.
  - **How to Run**:
    ```bash
    node tests/test_map_picker.js
    ```

- **`verify_unified_chubby.js`**
  - **Purpose**: Verifies that Chubby AI is consolidated into a single floating action pill that provides both Voice Assistant and AI Chat Modal tabs.
  - **Scope**: Tests modal open/close, tab switching between Voice Mode and Chat Mode, text prompt submissions, and voice synthesis hooks.
  - **How to Run**:
    ```bash
    node tests/verify_unified_chubby.js
    ```

- **`verify_profile_options.js`**
  - **Purpose**: Verifies that the 9 secondary navigation options (My Rides, Explainable AI, Saved Places, Famous Places, Emergency & SOS, Refer & Earn, Ratings & Reviews, Settings, Help Center) are neatly organized in the Profile screen hub.
  - **Scope**: Tests navigation links, modal sheet launches, and responsiveness.
  - **How to Run**:
    ```bash
    node tests/verify_profile_options.js
    ```

- **`check_header.js`**
  - **Purpose**: Verifies the clean top navbar across desktop and mobile screens, ensuring clutter badges are removed and only essential status indicators remain.
  - **How to Run**:
    ```bash
    node tests/check_header.js
    ```

- **`test_human_web.js`**
  - **Purpose**: Full human-like walkthrough of the entire web application.
  - **Scope**: Tests splash screen, user registration, login, home screen location detection, booking flow, ride comparison, driver tracking, and profile features.
  - **How to Run**:
    ```bash
    node tests/test_human_web.js
    ```

---

## Prerequisites
- **Node.js**: v18+ with `playwright` installed.
- **PHP**: v8.0+ running the local backend server on port 5000 (`php -S localhost:5000 -t Backend/php`).
- **Vite / Web Server**: Frontend dev server running on port 5173 / port 8080.
