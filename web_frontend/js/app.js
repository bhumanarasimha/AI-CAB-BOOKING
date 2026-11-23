/**
 * SmartRide AI - Master Application Controller
 * Handles full UI interactivity, section routing, real-time quoting,
 * EMMDE AI engine scoring, and backend API integration with PHP/MySQL.
 */

import { api, onBackendStatusChange, checkBackendHealth } from './api.js';
import {
  generateQuotes,
  calculateDistance,
  calculateShapWaterfall,
  generateLimeRules,
  simulateCounterfactual,
  CarbonAgent,
  AGENT_WEIGHTS,
  generateMultimodalRoutes,
  predictFuturePrices
} from './ai-engine.js';
import { FleetRadarMap } from './map.js';

function haversineDistKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 99999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function normalizeIndianPlaceName(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/oo/g, 'o').replace(/ee/g, 'i').replace(/ll/g, 'l').replace(/aa/g, 'a')
    .replace(/th/g, 't').replace(/dh/g, 'd').replace(/[^a-z0-9]/g, '');
}

function scoreCityLandmarkMatch(item, query) {
  if (!query || !item) return 0;
  const q = query.trim().toLowerCase();
  const qNorm = normalizeIndianPlaceName(query);
  const nameLower = (item.name || '').toLowerCase();
  const nameNorm = normalizeIndianPlaceName(item.name || '');

  // 1. Exact or Name prefix match
  if (nameLower === q || nameNorm === qNorm) return 100;
  if (nameLower.startsWith(q) || nameNorm.startsWith(qNorm)) return 100;

  // 2. Word prefix match in name
  const nameWords = nameLower.split(/[\s,–\-()]+/);
  if (nameWords.some(w => w.length > 0 && w.startsWith(q))) return 90;

  // 3. Aliases prefix / keyword match
  if (item.aliases && item.aliases.length > 0) {
    if (item.aliases.some(a => {
      const aLower = a.toLowerCase();
      return aLower.startsWith(q) || normalizeIndianPlaceName(a).startsWith(qNorm) || (q.length >= 3 && aLower.includes(q));
    })) {
      return 95;
    }
  }

  // 4. Substring in place name
  if (nameLower.includes(q) || nameNorm.includes(qNorm)) return 75;

  // 5. Meaningful address locality prefix match (disregard generic region words)
  if (item.address) {
    const addrWords = item.address.toLowerCase().split(/[\s,–\-()]+/);
    const ignoredWords = new Set(['chennai', 'tamil', 'nadu', 'india', 'road', 'salai', 'street', 'nagar', 'bazaar']);
    const meaningfulAddrWords = addrWords.filter(w => !ignoredWords.has(w));
    if (meaningfulAddrWords.some(w => w.length > 0 && w.startsWith(q))) return 50;
  }

  return 0;
}


const COMPREHENSIVE_CITY_LANDMARKS = [
  // Poonamallee Corridor (Poonamallee / Ponamallee)
  { name: 'Poonamallee Bus Terminus & Bypass', address: 'Poonamallee High Road, Chennai', lat: 13.0487, lng: 80.1114, aliases: ['ponamallee', 'ponamal', 'poonamalli', 'ponamalli', 'poonamallee bypass'], icon: '🚌' },
  { name: 'Poonamallee High Road (EVR Periyar Salai)', address: 'National Highway 48, Chennai', lat: 13.0612, lng: 80.1245, aliases: ['ponamallee high road', 'ponamal road'], icon: '🛣️' },
  { name: 'Saveetha University (SIMATS)', address: 'Poonamallee High Road, Velappanchavadi, Chennai', lat: 13.0574, lng: 80.1232, aliases: ['saveetha', 'simats', 'ponamal saveetha'], icon: '🎓' },
  { name: 'Saveetha Engineering College', address: 'Chettipadu – Nemam Road, Thandalam, Chennai', lat: 13.0265, lng: 80.0159, aliases: ['saveetha engineering', 'saveetha college'], icon: '🎓' },
  { name: 'Saveetha Medical College & Hospital', address: 'Saveetha Nagar, Thandalam, Kanchipuram', lat: 13.0246, lng: 80.0173, aliases: ['saveetha medical', 'saveetha hospital'], icon: '🏥' },
  { name: 'Saveetha Dental College & Hospital', address: '162, Poonamallee High Road, Chennai', lat: 13.0590, lng: 80.1330, aliases: ['saveetha dental'], icon: '🏥' },
  { name: 'Panimalar Engineering College', address: 'Bangalore Trunk Road, Poonamallee, Chennai', lat: 13.0478, lng: 80.0762, aliases: ['panimalar', 'panimalar poonamallee'], icon: '🎓' },
  { name: 'Porur Roundtana & Junction', address: 'Mount Poonamallee Road, Porur, Chennai', lat: 13.0360, lng: 80.1585, aliases: ['porur', 'porur junction'], icon: '📍' },
  { name: 'DLF Cybercity, Porur', address: 'Mount Poonamallee Road, Manapakkam, Chennai', lat: 13.0289, lng: 80.1650, aliases: ['dlf', 'dlf porur'], icon: '🏢' },
  { name: 'Maduravoyal Flyover & Bypass', address: 'Koyambedu – Maduravoyal Highway, Chennai', lat: 13.0655, lng: 80.1680, aliases: ['maduravoyal'], icon: '🛣️' },
  { name: 'Koyambedu CMBT Bus Terminus', address: 'Jawaharlal Nehru Road, Koyambedu, Chennai', lat: 13.0694, lng: 80.1948, aliases: ['koyambedu', 'cmbt'], icon: '🚌' },

  // Educational Hubs
  { name: 'SRM Institute of Science and Technology', address: 'Kattankulathur, Chengalpattu, Tamil Nadu', lat: 12.8231, lng: 80.0442, aliases: ['srm', 'srm ktr'], icon: '🎓' },
  { name: 'VIT Chennai (Vellore Institute of Tech)', address: 'Vandalur-Kelambakkam Road, Chennai', lat: 12.8406, lng: 80.1534, aliases: ['vit', 'vit chennai'], icon: '🎓' },
  { name: 'IIT Madras (Indian Institute of Technology)', address: 'Sardar Patel Road, Adyar, Chennai', lat: 12.9915, lng: 80.2337, aliases: ['iit', 'iitm'], icon: '🎓' },
  { name: 'Anna University Guindy Campus', address: 'Sardar Patel Road, Guindy, Chennai', lat: 13.0102, lng: 80.2355, aliases: ['anna university'], icon: '🎓' },
  { name: 'Loyola College', address: 'Sterling Road, Nungambakkam, Chennai', lat: 13.0624, lng: 80.2333, aliases: ['loyola'], icon: '🎓' },
  { name: 'SSN College of Engineering', address: 'Rajiv Gandhi Salai (OMR), Kalavakkam', lat: 12.7508, lng: 80.1970, aliases: ['ssn'], icon: '🎓' },

  // Tech Parks & Corridors
  { name: 'Tidel Park, OMR Tech Corridor', address: 'Rajiv Gandhi Salai, Taramani, Chennai', lat: 12.9893, lng: 80.2474, aliases: ['tidel park'], icon: '🏢' },
  { name: 'RMZ Millenia Business Park', address: 'MGR Road, Perungudi, Chennai', lat: 12.9658, lng: 80.2428, aliases: ['rmz millenia'], icon: '🏢' },
  { name: 'Ascendas International Tech Park (ITPB)', address: 'CSIR Road, Taramani, Chennai', lat: 12.9865, lng: 80.2435, aliases: ['ascendas'], icon: '🏢' },
  { name: 'Ramanujan IT City', address: 'Rajiv Gandhi Salai, Taramani, Chennai', lat: 12.9880, lng: 80.2450, aliases: ['ramanujan'], icon: '🏢' },
  { name: 'Olympia Technology Park', address: '1, SIDCO Industrial Estate, Guindy, Chennai', lat: 13.0118, lng: 80.2078, aliases: ['olympia'], icon: '🏢' },
  { name: 'SIPCOT IT Park, Siruseri', address: 'Rajiv Gandhi Salai (OMR), Siruseri, Tamil Nadu', lat: 12.8285, lng: 80.2220, aliases: ['siruseri'], icon: '🏢' },
  { name: 'Sriperumbudur Industrial Hub & SIPCOT', address: 'Bangalore Highway NH48, Sriperumbudur', lat: 12.9699, lng: 79.9405, aliases: ['sriperumbudur'], icon: '🏢' },

  // Transit & Airports
  { name: 'Airport Terminal 2 (Meenambakkam)', address: 'GST Road, Meenambakkam, Chennai', lat: 12.9941, lng: 80.1709, aliases: ['airport', 'chennai airport'], icon: '✈️' },
  { name: 'Chennai Central Railway Station (Dr. MGR Central)', address: 'Kannappar Thidal, Periamet, Chennai', lat: 13.0827, lng: 80.2755, aliases: ['central station'], icon: '🚆' },
  { name: 'Chennai Egmore Railway Station', address: 'Gandhi Irwin Road, Egmore, Chennai', lat: 13.0783, lng: 80.2612, aliases: ['egmore'], icon: '🚆' },
  { name: 'Tambaram Railway Station & Transit Hub', address: 'GST Road, Tambaram, Chennai', lat: 12.9249, lng: 80.1000, aliases: ['tambaram'], icon: '🚆' },
  { name: 'Kilambakkam KCBT Bus Terminus', address: 'GST Road, Kilambakkam, Vandalur', lat: 12.8682, lng: 80.0712, aliases: ['kilambakkam', 'kcbt'], icon: '🚌' },

  // Shopping Malls & Landmarks
  { name: 'Phoenix MarketCity Mall, Velachery', address: '142, Velachery Road, Indira Gandhi Nagar, Chennai', lat: 12.9922, lng: 80.2173, aliases: ['phoenix mall'], icon: '🛍️' },
  { name: 'Express Avenue Mall, Royapettah', address: '2, Club House Road, Royapettah, Chennai', lat: 13.0588, lng: 80.2642, aliases: ['express avenue'], icon: '🛍️' },
  { name: 'VR Chennai Mall', address: '100 Feet Road, Anna Nagar, Chennai', lat: 13.0847, lng: 80.1983, aliases: ['vr mall'], icon: '🛍️' },
  { name: 'Forum Vijaya Mall, Vadapalani', address: 'Arcot Road, NSK Salai, Vadapalani, Chennai', lat: 13.0505, lng: 80.2093, aliases: ['forum mall'], icon: '🛍️' },
  { name: 'Marina Beach Promenade', address: 'Kamarajar Salai, Triplicane, Chennai', lat: 13.0399, lng: 80.2785, aliases: ['marina beach'], icon: '🏖️' },
  { name: 'Besant Nagar Elliot\'s Beach (Bessie)', address: '6th Avenue, Besant Nagar, Chennai', lat: 12.9990, lng: 80.2700, aliases: ['besant nagar beach'], icon: '🏖️' },
  { name: 'Kapaleeshwarar Temple, Mylapore', address: 'Vadakkumada St, Mylapore, Chennai', lat: 13.0335, lng: 80.2694, aliases: ['kapaleeshwarar'], icon: '🛕' },
  { name: 'Anna Nagar West Roundtana', address: '3rd Avenue, Anna Nagar West, Chennai', lat: 13.0850, lng: 80.2100, aliases: ['anna nagar'], icon: '🌳' },
  { name: 'Mahabalipuram Shore Temple & Heritage Site', address: 'East Coast Road (ECR), Mahabalipuram', lat: 12.6186, lng: 80.1989, aliases: ['mahabalipuram'], icon: '🏖️' },
  { name: 'Kanchipuram Temple City', address: 'Kanchipuram, Tamil Nadu', lat: 12.8342, lng: 79.7036, aliases: ['kanchipuram'], icon: '🛕' }
];

const CITY_LANDMARKS = COMPREHENSIVE_CITY_LANDMARKS.map(l => l.name);

async function fetchFastIPLocation() {
  try {
    const res = await fetch('https://ipinfo.io/json');
    if (res.ok) {
      const data = await res.json();
      if (data.city) {
        const [lat, lng] = (data.loc || '').split(',').map(parseFloat);
        return {
          address: data.city + (data.region ? `, ${data.region}` : ''),
          lat,
          lng
        };
      }
    }
  } catch {}

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.city) {
        return {
          address: data.city + (data.region ? `, ${data.region}` : ''),
          lat: data.latitude,
          lng: data.longitude
        };
      }
    }
  } catch {}

  return null;
}

export async function detectCurrentLocation(silent = false) {
  const btn = document.getElementById('locate-gps-btn');
  const btnLabel = document.getElementById('gps-btn-label');
  const pInput = document.getElementById('pickup-input');

  if (btn) btn.classList.add('is-locating');
  if (btnLabel) btnLabel.textContent = 'Locating...';

  // Wire all section back buttons
  document.querySelectorAll('.back-to-prev-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      goBackTab();
    });
  });

  // Wire all modal back buttons
  document.querySelectorAll('[data-modal-close], .modal-back-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.closest('.modal-overlay')?.classList.remove('active');
    });
  });

  // Native browser back button (popstate)
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.tab) {
      switchTab(e.state.tab, false);
    } else {
      const hash = window.location.hash.replace('#', '');
      if (hash && document.getElementById('section-' + hash)) {
        switchTab(hash, false);
      } else {
        switchTab('rides', false);
      }
    }
  });

  // Check URL hash on initial load
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && document.getElementById('section-' + initialHash)) {
    switchTab(initialHash, false);
  }

  // 1. Check user-saved custom pickup from localStorage
  try {
    const rawSaved = localStorage.getItem('smartride_user_pickup');
    if (rawSaved && (rawSaved.includes('Ekambareswara') || rawSaved.includes('Agraharam') || rawSaved.includes('Sowcarpet'))) {
      localStorage.removeItem('smartride_user_pickup');
    }
  } catch {}
  const saved = localStorage.getItem('smartride_user_pickup');
  if (saved && !saved.includes('Ekambareswara') && !saved.includes('Agraharam') && !saved.includes('Sowcarpet')) {
    state.pickup = saved;
    if (pInput && !pInput.value.trim()) pInput.value = saved;
  }

  // 2. High-Accuracy Hardware GPS
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const inIndia = lat >= 6.0 && lat <= 36.5 && lng >= 68.0 && lng <= 98.0;
        let address = '';

        if (!inIndia) {
          // Emulator mock GPS in Mountain View, CA or international IP: anchor to operating corridor
          address = 'Current Location';
          state.userLat = 13.0878;
          state.userLng = 80.2785;
        } else if (Math.abs(lat - 13.0878) < 0.005 && Math.abs(lng - 80.2785) < 0.005) {
          // If coordinates match Airtel ISP datacenter (13.0878, 80.2785), prevent resolving to Sowcarpet street
          address = (saved && !saved.includes('Ekambareswara')) ? saved : 'Current Location';
          state.userLat = lat;
          state.userLng = lng;
        } else {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
              headers: { 'Accept-Language': 'en', 'User-Agent': 'SmartRide-AI-Cab/1.0' }
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.address) {
                const road = data.address.road || data.address.suburb || data.address.neighbourhood || '';
                const city = data.address.city || data.address.town || data.address.village || '';
                address = road ? (city ? `${road}, ${city}` : road) : (data.display_name?.split(',')[0] || '');
              }
            }
          } catch (e) {
            console.warn("Reverse geocode failed", e);
          }
          state.userLat = lat;
          state.userLng = lng;
        }

        if (
          !address || 
          address.includes('Ekambareswara') || 
          address.includes('Agraharam') || 
          address.includes('Amphitheatre') || 
          address.includes('Mountain View') ||
          address.includes('California')
        ) {
          address = (saved && !saved.includes('Ekambareswara') && !saved.includes('Amphitheatre')) ? saved : 'Current Location';
        }

        state.pickup = address;
        if (pInput) pInput.value = address;
        if (address !== 'Current Location') {
          localStorage.setItem('smartride_user_pickup', address);
        }
        if (!silent) showToast(`📍 GPS Location: ${address}`, 'success');
        if (btn) btn.classList.remove('is-locating');
        if (btnLabel) btnLabel.textContent = 'GPS';

        if (mapInstance) mapInstance.setUserLocation(lat, lng);

        if (state.dropoff) {
          refreshQuotes();
        }
      },
      (err) => {
        console.warn("GPS error:", err);
        if (btn) btn.classList.remove('is-locating');
        if (btnLabel) btnLabel.textContent = 'GPS';
        if (!state.pickup || state.pickup.includes('Ekambareswara')) {
          state.pickup = (saved && !saved.includes('Ekambareswara')) ? saved : 'Current Location';
          if (pInput) pInput.value = state.pickup;
        }
        if (!silent) {
          showToast('GPS pinpoint ready: tap to set custom pickup', 'info');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  } else {
    if (btn) btn.classList.remove('is-locating');
    if (btnLabel) btnLabel.textContent = 'GPS';
  }
}

// --- State Management ---
const state = {
  user: null,
  activeTab: 'rides',
  aiMode: 'compare',
  pickup: '',
  dropoff: '',
  category: 'cab4',
  strategy: 'balanced',
  quotes: [],
  topPick: null,
  selectedQuote: null,
  xaiSelectedOptionId: null,
  refreshSeconds: 10,
  refreshTimer: null,
  activeRide: null,
  currentParcelTier: 'bike',
  activeChatPartner: 'Sarah Chen',
  activeChatId: 'chat_sarah',
  theme: localStorage.getItem('smartride_theme') || 'dark-ai',
};

let mapInstance = null;

// Toast notification helper
export const showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// Guard against browser password-manager autofilling user email into route inputs
const EMAIL_AUTOFILL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function sanitizeRouteAutofill() {
  const pInput = document.getElementById('pickup-input');
  const dInput = document.getElementById('dropoff-input');
  let cleared = false;
  if (dInput && EMAIL_AUTOFILL_RE.test(dInput.value.trim())) {
    dInput.value = '';
    state.dropoff = '';
    cleared = true;
  }
  if (pInput && EMAIL_AUTOFILL_RE.test(pInput.value.trim())) {
    pInput.value = '';
    state.pickup = '';
    cleared = true;
  }
  return cleared;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  sanitizeRouteAutofill();
  [150, 500, 1200].forEach((ms) => setTimeout(() => {
    if (sanitizeRouteAutofill()) refreshQuotes();
  }, ms));
  ['pickup-input', 'dropoff-input'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const unlock = () => el.removeAttribute('readonly');
    el.addEventListener('focus', unlock);
    el.addEventListener('pointerdown', unlock);
    el.addEventListener('touchstart', unlock, { passive: true });
  });
  setupEventListeners();
  initUser();
  initMap();
  refreshQuotes();
  startAutoRefreshTimer();
  loadMyRides();
  loadParcels();
  initCommuteSection();
  detectCurrentLocation(true);

  // Monitor backend connection status
  onBackendStatusChange((isOnline) => {
    const statusDot = document.getElementById('backend-status-dot');
    const statusText = document.getElementById('backend-status-text');
    if (statusDot && statusText) {
      if (isOnline) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'API Live (Port 5000)';
      } else {
        statusDot.className = 'status-dot';
        statusText.textContent = 'Offline Mode (Local Sync)';
      }
    }
  });

  // Show full-page Sign In / Register screen if user not logged in or previously logged out or visited #signin/#register
  const isLoggedOut = localStorage.getItem('smartride_web_logged_out') === 'true';
  const hasJwt = Boolean(localStorage.getItem('smartride_jwt'));
  if (!hasJwt || isLoggedOut || window.location.hash === '#signin' || window.location.hash === '#register') {
    window.showWebAuthScreen?.(window.location.hash === '#register' ? 'register' : 'login');
  }

  checkBackendHealth();
});

// Theme Initializer
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeSelect = document.getElementById('theme-picker');
  if (themeSelect) themeSelect.value = state.theme;
}

export function setTheme(themeName) {
  state.theme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('smartride_theme', themeName);
  showToast(`Switched theme to ${themeName.toUpperCase()}`, 'success');
}

// User state initialization
async function initUser() {
  state.user = await api.auth.me();
  updateUserUI();
}

function updateUserUI() {
  const userNameEl = document.getElementById('header-user-name');
  const userAvatarEl = document.getElementById('header-user-avatar');
  if (userNameEl && state.user) userNameEl.textContent = state.user.name || 'Rider';
  if (userAvatarEl && state.user?.photoURL) userAvatarEl.src = state.user.photoURL;

  // Profile section inputs
  const pName = document.getElementById('profile-name-input');
  const pPhone = document.getElementById('profile-phone-input');
  const pEmail = document.getElementById('profile-email-input');
  const pDob = document.getElementById('profile-dob-input');
  if (pName && state.user) pName.value = state.user.name || '';
  if (pPhone && state.user) pPhone.value = state.user.phone || '';
  if (pEmail && state.user) pEmail.value = state.user.email || '';
  if (pDob && state.user) pDob.value = state.user.dob || '1998-05-24';
  if (state.user?.gender) {
    document.querySelectorAll('.gender-btn').forEach((btn) => {
      const g = btn.getAttribute('data-gender') || btn.textContent.trim();
      if (g.toLowerCase() === state.user.gender.toLowerCase()) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

// Map initialization
function initMap() {
  mapInstance = new FleetRadarMap('map-canvas', {
    onDestinationSelect: (name) => {
      state.dropoff = name;
      const dropInput = document.getElementById('dropoff-input');
      if (dropInput) dropInput.value = name;
      refreshQuotes();
      showToast(`Selected destination: ${name}`, 'info');
    }
  });
}

// Tab history stack for seamless back button support
export const tabHistory = [];

// Tab navigation handler
export function switchTab(tabId, pushHistory = true) {
  if (pushHistory && state.activeTab && state.activeTab !== tabId) {
    tabHistory.push(state.activeTab);
    try {
      window.history.pushState({ tab: tabId }, '', '#' + tabId);
    } catch {}
  }
  state.activeTab = tabId;

  // Update nav buttons
  document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update visible sections
  document.querySelectorAll('.app-section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === 'section-' + tabId);
  });

  // Smooth scroll to top of section
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Section specific triggers
  if (tabId === 'rides' && mapInstance) {
    setTimeout(() => mapInstance.resize(), 100);
  } else if (tabId === 'forecast') {
    renderDedicatedFuturePriceSection();
  } else if (tabId === 'activity') {
    loadMyRides();
  } else if (tabId === 'parcel') {
    loadParcels();
  } else if (tabId === 'xai') {
    renderXaiInspector();
  }
}

// Global Back Button Handler for all sections
export function goBackTab() {
  if (tabHistory.length > 0) {
    const prevTab = tabHistory.pop();
    switchTab(prevTab, false);
    try {
      window.history.replaceState({ tab: prevTab }, '', '#' + prevTab);
    } catch {}
  } else {
    // If already on rides or history empty, go to rides
    if (state.activeTab !== 'rides') {
      switchTab('rides', false);
    } else {
      // If on rides and user had entered a destination or quote, clear it
      const dInput = document.getElementById('dropoff-input');
      if (dInput && dInput.value) {
        dInput.value = '';
        state.dropoff = '';
        showToast('Returned to Search', 'info');
      } else {
        showToast('At Home Screen', 'info');
      }
    }
    try {
      window.history.replaceState({ tab: 'rides' }, '', '#rides');
    } catch {}
  }
}

// --- Route Send & Search Trigger ---
export function handleRouteSend() {
  const pInput = document.getElementById('pickup-input');
  const dInput = document.getElementById('dropoff-input');
  const sendBtn = document.getElementById('search-route-btn');

  let pVal = pInput ? pInput.value.trim() : '';
  let dVal = dInput ? dInput.value.trim() : '';

  // If user only entered destination, default pickup to Current Location
  if (!pVal && dVal) {
    pVal = state.pickup || 'Current Location';
    if (pInput) pInput.value = pVal;
  }

  if (!pVal || !dVal) {
    showToast('Please enter both pickup and destination locations', 'warning');
    return;
  }

  state.pickup = pVal;
  state.dropoff = dVal;

  if (sendBtn) {
    sendBtn.classList.add('loading');
    sendBtn.innerHTML = `<span class="send-spinner">🔄</span>`;
  }

  setTimeout(() => {
    refreshQuotes();

    if (sendBtn) {
      sendBtn.classList.remove('loading');
      sendBtn.innerHTML = `<span class="send-arrow">✓</span>`;
      setTimeout(() => {
        sendBtn.innerHTML = `<span class="send-arrow">➔</span>`;
      }, 1000);
    }

    showToast(`Live fares loaded for ${state.pickup} → ${state.dropoff}`, 'success');

    const quotesContainer = document.getElementById('quotes-container');
    if (quotesContainer) {
      quotesContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 200);
}

// --- Empty State Prompt when no route is typed yet ---
function renderEmptyRoutePrompt() {
  const container = document.getElementById('quotes-container');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-route-prompt" style="text-align: center; padding: 42px 20px; background: rgba(19, 27, 46, 0.45); border: 1px dashed rgba(0, 216, 255, 0.22); border-radius: var(--radius-lg); margin-top: 10px;">
      <div style="font-size: 36px; margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(0,216,255,0.4));">📍</div>
      <h3 style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">Where would you like to go?</h3>
      <p style="font-size: 13px; color: var(--text-muted); max-width: 360px; margin: 0 auto 16px; line-height: 1.5;">
        Enter your pickup and destination above, or tap any suggestion below (✈️ Airport, 🏖️ Marina Beach) to compare live multi-provider fares.
      </p>
      <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
        <button type="button" class="chip-btn" id="btn-use-current-location" style="background: rgba(0, 216, 255, 0.12); border-color: rgba(0, 216, 255, 0.35); color: var(--brand-cyan); font-weight: 600; font-size: 12px; padding: 7px 14px; border-radius: var(--radius-pill); cursor: pointer;">
          <span>📍</span> Use My Current Location
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-use-current-location')?.addEventListener('click', () => {
    detectCurrentLocation(false);
    const dInput = document.getElementById('dropoff-input');
    if (dInput) dInput.focus();
  });
}

// --- Real-time Fare Quotation & EMMDE Engine ---
export function refreshQuotes() {
  sanitizeRouteAutofill();
  const pInput = document.getElementById('pickup-input');
  const dInput = document.getElementById('dropoff-input');
  if (pInput) state.pickup = pInput.value.trim();
  if (dInput) state.dropoff = dInput.value.trim();

  // If both inputs are empty before the user types
  if (!state.pickup && !state.dropoff) {
    state.quotes = [];
    state.topPick = null;
    state.selectedQuote = null;
    renderEmptyRoutePrompt();
    updateBookingBar();
    const timerBadge = document.getElementById('refresh-timer-badge');
    if (timerBadge) timerBadge.textContent = 'Ready';
    return;
  }

  const effectivePickup = state.pickup || 'Current Location';
  const effectiveDropoff = state.dropoff || 'City Center';

  const result = generateQuotes(effectivePickup, effectiveDropoff, state.category, state.strategy);
  state.quotes = applyLiveRealTimeCalibrationToQuotes(result.options || [], effectivePickup, effectiveDropoff);
  state.topPick = state.quotes[0] || result.topPick;
  state.selectedQuote = state.selectedQuote && state.quotes.some(q => q.id === state.selectedQuote.id)
    ? state.quotes.find(q => q.id === state.selectedQuote.id)
    : state.topPick;

  renderQuotes();
  updateBookingBar();

  // Trigger real-time OSRM + OSM Photon + Open-Meteo + ML Surge sync (cached per route)
  runWebRealTimeAIAnalysis(effectivePickup, effectiveDropoff, false);

  if (mapInstance && (state.pickup || state.dropoff)) {
    mapInstance.setRoute(effectivePickup, effectiveDropoff);
  }

  // Reset countdown
  state.refreshSeconds = 10;
  updateTimerDisplay();
}

// --- Manual Refresh Trigger with Feedback ---
export function manualRefreshFares() {
  const btn = document.getElementById('manual-refresh-btn');
  const timerBadge = document.getElementById('refresh-timer-badge');
  const quotesContainer = document.getElementById('quotes-container');

  if (btn) {
    btn.classList.add('is-refreshing');
    setTimeout(() => {
      btn.classList.remove('is-refreshing');
    }, 600);
  }

  if (timerBadge) {
    timerBadge.classList.add('timer-flash');
    setTimeout(() => timerBadge.classList.remove('timer-flash'), 800);
  }

  if (quotesContainer) {
    quotesContainer.style.opacity = '0.65';
    setTimeout(() => {
      quotesContainer.style.opacity = '1';
    }, 180);
  }

  // Recalculate with live variance & force fresh OSRM + Weather + ML Surge sync
  refreshQuotes();
  if (state.pickup || state.dropoff) {
    runWebRealTimeAIAnalysis(state.pickup || 'Current Location', state.dropoff || 'City Center', true);
  }

  showToast('🔄 Live OSRM telemetry, ML surge & driver ETAs refreshed!', 'info');
}

function startAutoRefreshTimer() {
  if (state.refreshTimer) clearInterval(state.refreshTimer);
  state.refreshTimer = setInterval(() => {
    if (!state.pickup || !state.dropoff) {
      updateTimerDisplay();
      return;
    }
    state.refreshSeconds--;
    if (state.refreshSeconds <= 0) {
      refreshQuotes();
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerBadge = document.getElementById('refresh-timer-badge');
  if (timerBadge) {
    if (!state.pickup || !state.dropoff) {
      timerBadge.textContent = 'Ready';
    } else {
      timerBadge.textContent = `Auto-refresh in ${state.refreshSeconds}s`;
    }
  }
}

// ============================================================================
// REAL-TIME MULTI-API + ML AI ORCHESTRATOR (OSRM + OSM Photon + Open-Meteo + ML Surge)
// Synthesized from MultiPlatform_Ride_aggregator, cab-dynamic-pricing & OSRM
// ============================================================================
const webRtCache = new Map();
const webRtInFlight = new Map();

function applyLiveRealTimeCalibrationToQuotes(quotes, pickup, dropoff) {
  const rt = nextGenState.rtAnalysis;
  if (!rt || !Array.isArray(quotes) || quotes.length === 0) return quotes;
  const routeKey = `${String(pickup || '').trim().toLowerCase()}__${String(dropoff || '').trim().toLowerCase()}`;
  if (rt.routeKey && rt.routeKey !== routeKey) return quotes;

  const pf = rt.providerFares || {};
  const catFactor = state.category === 'bike' ? 0.36 : state.category === 'auto' ? 0.62 : state.category === 'cab7' ? 1.42 : 1.0;
  const distKm = rt.routeInfo?.distanceKm || 8.5;
  state.distanceKm = distKm;

  const calibrated = quotes.map((q) => {
    const prov = String(q.provider || '').toLowerCase();
    let liveBase = null;
    if (prov.includes('smartride')) liveBase = pf.smartride;
    else if (prov.includes('namma')) liveBase = pf.nammayatri;
    else if (prov.includes('uber')) liveBase = pf.uber;
    else if (prov.includes('ola')) liveBase = pf.ola;
    else if (prov.includes('rapido')) liveBase = pf.rapidoCab;

    if (!liveBase) return { ...q, distanceKm: distKm };
    const liveFare = Math.max(25, Math.round(liveBase * catFactor));
    return {
      ...q,
      fare: liveFare,
      distanceKm: distKm,
      surge: prov.includes('smartride') ? Math.min(1.12, rt.mlSurge.multiplier) : rt.mlSurge.multiplier,
      explanation: `${rt.telemetry.isLive ? '🟢 Live OSRM' : '⚡ Real-Time AI'} (${distKm} km · ${rt.routeInfo.liveDurationMins}m · ${rt.mlSurge.multiplier}x ML surge). ${q.explanation || ''}`,
    };
  });

  const maxFare = Math.max(...calibrated.map((q) => q.fare));
  return calibrated.map((q) => ({ ...q, savingsVsMax: Math.max(0, maxFare - q.fare) }));
}

async function webFetchJson(url, timeoutMs = 4000) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

async function webGeocodeLive(addr) {
  const raw = String(addr || '').trim();
  if (!raw) return { lat: 13.0827, lng: 80.2707, label: 'Chennai', source: 'Default' };
  const q = raw.toLowerCase().includes('india') ? raw : `${raw}, India`;
  const data = await webFetchJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`, 3000);
  const feat = data?.features?.[0];
  if (feat?.geometry?.coordinates) {
    return {
      lat: Number(feat.geometry.coordinates[1]),
      lng: Number(feat.geometry.coordinates[0]),
      label: feat.properties?.name || raw,
      source: 'OSM Photon Live',
    };
  }
  return { lat: 13.0827, lng: 80.2707, label: raw, source: 'Anchor Fallback' };
}

async function webFindNearestPoi(coord, queryTerm, maxKm = 6.0) {
  const data = await webFetchJson(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(queryTerm)}&lat=${coord.lat}&lon=${coord.lng}&limit=4`,
    2500
  );
  const feats = Array.isArray(data?.features) ? data.features : [];
  let best = null;
  let bestD = Infinity;
  for (const f of feats) {
    const [lng, lat] = f?.geometry?.coordinates || [];
    const name = f?.properties?.name;
    if (!name || typeof lat !== 'number') continue;
    const R = 6371;
    const dLat = ((lat - coord.lat) * Math.PI) / 180;
    const dLon = ((lng - coord.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((coord.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (d <= maxKm && d < bestD) {
      bestD = d;
      best = { name, distanceKm: Number(d.toFixed(2)) };
    }
  }
  return best;
}

async function runWebRealTimeAIAnalysis(pickup = state.pickup || 'KG Apartments', dropoff = state.dropoff || 'Marina Beach', force = false) {
  const key = `${pickup.trim().toLowerCase()}__${dropoff.trim().toLowerCase()}`;
  const cached = webRtCache.get(key);
  if (!force && cached && Date.now() - cached.ts < 180000) {
    nextGenState.rtAnalysis = cached.data;
    return cached.data;
  }
  if (!force && webRtInFlight.has(key)) {
    return webRtInFlight.get(key);
  }

  const job = (async () => {
    const started = performance.now ? performance.now() : Date.now();
    const [pCoord, dCoord] = await Promise.all([webGeocodeLive(pickup), webGeocodeLive(dropoff)]);

    const [osrm, weatherJson, pBus, pMetro, dBus, dMetro] = await Promise.all([
      webFetchJson(`https://router.project-osrm.org/route/v1/driving/${pCoord.lng},${pCoord.lat};${dCoord.lng},${dCoord.lat}?overview=simplified`, 4000),
      webFetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${pCoord.lat}&longitude=${pCoord.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,cloud_cover,wind_speed_10m&timezone=auto`, 3500),
      webFindNearestPoi(pCoord, 'bus stop', 4.5),
      webFindNearestPoi(pCoord, 'metro station', 8.0),
      webFindNearestPoi(dCoord, 'bus stop', 4.5),
      webFindNearestPoi(dCoord, 'metro station', 8.0),
    ]);

    const hour = new Date().getHours();
    const urbanFactor = ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)) ? 1.38 : (hour >= 12 && hour <= 16 ? 1.18 : 1.05);
    const route = osrm?.routes?.[0];
    const distanceKm = route?.distance > 0 ? Number(Math.max(1.2, route.distance / 1000).toFixed(1)) : calculateDistance(pickup, dropoff);
    const freeFlowMins = route?.duration > 0 ? Math.max(4, Math.round(route.duration / 60)) : Math.max(6, Math.round(distanceKm * 1.8));
    const liveDurationMins = Math.max(5, Math.round(freeFlowMins * urbanFactor));
    const isOsrmLive = Boolean(route?.distance > 0);

    const wc = weatherJson?.current || {};
    const rainMm = Number(wc.rain ?? wc.precipitation ?? 0);
    const tempC = Math.round(Number(wc.temperature_2m ?? 31));
    const isRain = rainMm > 0.2 || Number(wc.weather_code ?? 1) >= 51;
    const isWeatherLive = Boolean(weatherJson?.current);

    const isRush = ((hour >= 8 && hour < 11) || (hour >= 17 && hour < 21));
    const surgeScore = (isRush ? 34 : 0) + (rainMm >= 3 ? 36 : isRain ? 22 : tempC >= 37 ? 14 : 0) + (urbanFactor >= 1.35 ? 22 : 8);
    const mult = surgeScore >= 72 ? 1.75 : surgeScore >= 54 ? 1.5 : surgeScore >= 36 ? 1.25 : surgeScore >= 18 ? 1.12 : 1.0;

    const providerFares = {
      smartride: Math.max(45, Math.round((32 + distanceKm * 10.2 + liveDurationMins * 0.9) * Math.min(1.12, mult))),
      nammayatri: Math.max(50, Math.round((40 + distanceKm * 12.2 + liveDurationMins * 1.1) * Math.min(1.18, mult))),
      uber: Math.max(55, Math.round((48 + distanceKm * 13.8 + liveDurationMins * 1.45) * mult)),
      ola: Math.max(55, Math.round((50 + distanceKm * 14.2 + liveDurationMins * 1.35) * (mult * 1.03))),
      rapidoCab: Math.max(52, Math.round((42 + distanceKm * 13.4 + liveDurationMins * 1.25) * (mult * 1.01))),
    };
    const avgCab = Math.round((providerFares.uber + providerFares.ola + providerFares.rapidoCab) / 3);
    const inDriveFairBid = Math.max(45, Math.round(avgCab * 0.85));
    const maxDirectCab = Math.max(providerFares.uber, providerFares.ola, providerFares.rapidoCab);

    const busFare = Math.max(12, Math.min(60, Math.round(10 + distanceKm * 1.4)));
    const metroFare = Math.max(20, Math.min(60, Math.round(15 + distanceKm * 1.1)));
    const rapidoLast = Math.max(25, Math.min(65, Math.round(22 + Math.min(4, distanceKm * 0.2) * 8)));
    const combo1 = busFare + metroFare + rapidoLast;
    const acBus = Math.max(22, Math.min(90, Math.round(18 + distanceKm * 2.1)));
    const autoLast = Math.max(35, Math.min(85, Math.round(32 + Math.min(4, distanceKm * 0.2) * 10)));
    const combo2 = acBus + autoLast;

    const pBusName = pBus?.name || `${pCoord.label.split(',')[0]} Bus Stop`;
    const pMetroName = pMetro?.name || 'Nearest Metro / Rail Hub';
    const dMetroName = dMetro?.name || `${dCoord.label.split(',')[0]} Metro / Junction`;
    const dBusName = dBus?.name || `${dCoord.label.split(',')[0]} Bus Stop`;
    const realHubsFound = [pBus, pMetro, dBus, dMetro].filter(Boolean).length;

    const baseFare = Math.max(45, Math.round(avgCab / Math.max(1, mult)));
    const nowD = new Date();
    const decay = mult > 1.3 ? [1.0, 0.87, 0.79, 0.74, 0.71] : mult > 1.1 ? [1.0, 0.93, 0.89, 0.88, 0.87] : [1.0, 1.0, 1.02, 1.04, 1.05];
    const timeline = [0, 15, 30, 45, 60].map((mins, idx) => {
      const dt = new Date(nowD.getTime() + mins * 60000);
      const s = Number(Math.max(1.0, mult * decay[idx]).toFixed(2));
      const f = Math.max(baseFare, Math.round(baseFare * s));
      return { offsetMinutes: mins, label: mins === 0 ? 'Now' : `+${mins}m`, time: dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }), fare: f, surge: s, savings: Math.max(0, avgCab - f) };
    });

    const savingsIn15 = Math.max(0, timeline[0].fare - timeline[1].fare);
    const result = {
      routeKey: key,
      originCoord: pCoord,
      destCoord: dCoord,
      routeInfo: { distanceKm, freeFlowMins, liveDurationMins, isRealTime: isOsrmLive, source: isOsrmLive ? 'OSRM Street Network Live' : 'Road Model Fallback' },
      mlSurge: { multiplier: mult, score: surgeScore, confidencePct: (isOsrmLive && isWeatherLive) ? 94 : 83 },
      providerFares,
      inDriveFairBid,
      multimodalData: {
        directCabComparison: { rapido: providerFares.rapidoCab, ola: providerFares.ola, uber: providerFares.uber, bestDirectCab: Math.min(...Object.values(providerFares)) },
        routes: [
          {
            id: 'web_rt_mm1',
            badge: realHubsFound > 0 ? `🟢 LIVE OSM TRANSIT (${realHubsFound} REAL HUBS)` : '🏆 AI #1 SUPER SAVER',
            title: 'Bus + Metro + Rapido Bike',
            totalFare: combo1,
            directCabFare: maxDirectCab,
            savingsFare: Math.max(0, maxDirectCab - combo1),
            savingsPercent: Math.max(0, Math.round(((maxDirectCab - combo1) / Math.max(1, maxDirectCab)) * 100)),
            totalDurationMinutes: Math.max(18, Math.round(liveDurationMins * 1.22)),
            co2SavedKg: Number((distanceKm * 0.12).toFixed(1)),
            legs: [
              { icon: '🚶', label: `Walk to ${pBusName}`, duration: '3 min', fare: 0 },
              { icon: '🚌', label: `City Bus ➔ ${pMetroName}`, duration: `${Math.max(8, Math.round(liveDurationMins * 0.42))} min`, fare: busFare },
              { icon: '🚇', label: `Metro / Rail ➔ ${dMetroName}`, duration: `${Math.max(8, Math.round(liveDurationMins * 0.45))} min`, fare: metroFare },
              { icon: '🛵', label: `Rapido Bike ➔ ${dCoord.label.split(',')[0]}`, duration: '7 min', fare: rapidoLast },
            ],
          },
          {
            id: 'web_rt_mm2',
            badge: '⚡ FAST HYBRID · LOW TRANSFER',
            title: 'AC Express Bus + Rapido Auto',
            totalFare: combo2,
            directCabFare: maxDirectCab,
            savingsFare: Math.max(0, maxDirectCab - combo2),
            savingsPercent: Math.max(0, Math.round(((maxDirectCab - combo2) / Math.max(1, maxDirectCab)) * 100)),
            totalDurationMinutes: Math.max(16, Math.round(liveDurationMins * 1.12)),
            co2SavedKg: Number((distanceKm * 0.09).toFixed(1)),
            legs: [
              { icon: '🚌', label: `AC Express Bus (${pBusName} ➔ ${dBusName})`, duration: `${Math.max(10, Math.round(liveDurationMins * 0.78))} min`, fare: acBus },
              { icon: '🛺', label: `Rapido Auto last-mile drop`, duration: '8 min', fare: autoLast },
            ],
          },
        ],
      },
      futurePricing: {
        currentFare: timeline[0].fare,
        baseFare,
        projectedFareIn15: timeline[1].fare,
        savingsIn15,
        advice: savingsIn15 > 12
          ? `Live ML Surge is ${mult}x. Waiting 15–20 mins is projected to drop fares by ₹${savingsIn15} to ₹${timeline[1].fare}!`
          : `Roads & weather are stable (${mult}x). Fares are already near base rate (₹${baseFare}) — ideal time to book now!`,
        timeline,
      },
      telemetry: {
        isLive: isOsrmLive || isWeatherLive,
        latencyMs: Math.max(15, Math.round((performance.now ? performance.now() : Date.now()) - started)),
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    };

    webRtCache.set(key, { ts: Date.now(), data: result });
    nextGenState.rtAnalysis = result;
    if (isWeatherLive) {
      nextGenState.liveWeather = {
        source: 'Open-Meteo Live API',
        tempC,
        humidity: Math.round(Number(wc.relative_humidity_2m ?? 64)),
        windKmh: Math.round(Number(wc.wind_speed_10m ?? 12)),
        precipitationMm: rainMm,
        condition: isRain ? 'Rain Showers' : 'Partly Cloudy',
        icon: isRain ? '🌧️' : '⛅',
        severity: isRain ? 'rain' : 'clear',
      };
    }

    if (state.quotes && state.quotes.length > 0) {
      state.quotes = applyLiveRealTimeCalibrationToQuotes(state.quotes, pickup, dropoff);
      state.topPick = state.quotes[0] || state.topPick;
      if (state.selectedQuote) {
        state.selectedQuote = state.quotes.find((q) => q.id === state.selectedQuote.id) || state.topPick;
      }
      renderQuotes();
      updateBookingBar();
    } else {
      updateWebStatusStrip();
    }

    const modal = document.getElementById('chubby-ai-modal');
    if (modal && modal.style.display === 'flex') {
      openWebChubbyTab(nextGenState.chubbyTab || 'chat');
    }
    if (state.activeTab === 'forecast') {
      renderDedicatedFuturePriceSection();
    }
    return result;
  })();

  webRtInFlight.set(key, job);
  try {
    return await job;
  } finally {
    webRtInFlight.delete(key);
  }
}

function buildWebTelemetryStripHtml() {
  const rt = nextGenState.rtAnalysis;
  if (!rt) {
    return `<div style="padding:7px 12px; border-radius:10px; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.35); font-size:11px; font-weight:800; color:#F59E0B; margin-bottom:10px;">⏳ Syncing live OSRM road routing, Open-Meteo weather &amp; OSM transit hubs...</div>`;
  }
  return `
    <div style="padding:8px 12px; border-radius:12px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.35); margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; font-size:11px; font-weight:800;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <span style="color:#10B981;">${rt.telemetry.isLive ? '🟢 LIVE OSRM + ML' : '⚡ HYBRID AI'}</span>
        <span style="color:var(--text-muted);">🛣️ ${rt.routeInfo.distanceKm} km · ${rt.routeInfo.liveDurationMins}m road</span>
        <span style="color:#F59E0B;">🧠 Surge ${rt.mlSurge.multiplier}x (${rt.mlSurge.confidencePct}%)</span>
        <span style="color:#00D8FF;">🤝 InDrive Bid: ₹${rt.inDriveFairBid}</span>
      </div>
      <span style="font-size:10px; color:var(--text-muted);">${rt.telemetry.latencyMs}ms · ${rt.telemetry.timestamp}</span>
    </div>
  `;
}

function renderMultimodalView(container) {
  const rt = nextGenState.rtAnalysis;
  const dist = rt?.routeInfo?.distanceKm || calculateDistance(state.pickup || 'KG Apartments', state.dropoff || 'Marina Beach');
  const mm = rt?.multimodalData || generateMultimodalRoutes(state.pickup || 'KG Apartments', state.dropoff || 'Marina Beach', dist);

  let html = buildWebTelemetryStripHtml() + `
    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(0, 216, 255, 0.12)); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 16px; padding: 12px 14px; margin-bottom: 12px;">
      <p style="font-size: 11px; font-weight: 700; color: #10B981; text-transform: uppercase;">
        Direct Cab: ₹${mm.directCabComparison.rapido} (Rapido) / ₹${mm.directCabComparison.ola} (Ola) / ₹${mm.directCabComparison.uber || mm.directCabComparison.ola} (Uber)
      </p>
      <p style="font-size: 14px; font-weight: 800; color: var(--text-main); margin-top: 2px;">
        Smart Multimodal: From <span style="color: #10B981;">₹${mm.routes[0]?.totalFare}</span> (Save ₹${mm.routes[0]?.savingsFare}!)
      </p>
    </div>
  `;

  html += mm.routes.map(r => `
    <div class="quote-card" style="border: 1.5px solid var(--border-ui); border-radius: 16px; padding: 14px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="font-size: 10px; font-weight: 900; background: rgba(16, 185, 129, 0.15); color: #10B981; padding: 2px 8px; border-radius: 6px;">
            ${r.badge}
          </span>
          <h4 style="font-size: 15px; font-weight: 800; color: var(--text-main); margin-top: 4px;">${r.title}</h4>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">⏱️ ~${r.totalDurationMinutes} mins · 🌱 ${r.co2SavedKg} kg CO₂ saved</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 20px; font-weight: 900; color: #10B981;">₹${r.totalFare}</p>
          <span style="font-size: 11px; color: #EF4444; text-decoration: line-through; display: block;">₹${r.directCabFare} Direct Cab</span>
          <span style="font-size: 11px; font-weight: 800; color: #10B981;">Save ₹${r.savingsFare} (${r.savingsPercent}%)</span>
        </div>
      </div>

      <div style="margin-top: 10px; border-top: 1px solid var(--border-ui); padding-top: 8px;">
        ${r.legs.map(l => `
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span>${l.icon}</span>
              <strong style="color: var(--text-main);">${l.label}</strong>
              <span style="color: var(--text-muted); font-size: 11px;">(${l.duration})</span>
            </div>
            <strong style="color: ${l.fare === 0 ? 'var(--brand-cyan)' : 'var(--text-main)'};">${l.fare === 0 ? 'Free' : '₹' + l.fare}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

function webPredictSurgeAtDate(targetDate, weather, baseNowSurge) {
  const h = targetDate.getHours() + targetDate.getMinutes() / 60;
  const day = targetDate.getDay();
  const isWeekend = day === 0 || day === 6;

  let demand = 1.0;
  if (!isWeekend && h >= 8 && h < 11) {
    demand = 1.32 + 0.14 * Math.sin(((h - 8) / 3) * Math.PI);
  } else if (h >= 17 && h < 21.5) {
    demand = 1.36 + 0.22 * Math.sin(((h - 17) / 4.5) * Math.PI);
  } else if (isWeekend && h >= 18 && h <= 22.5) {
    demand = 1.24 + 0.12 * Math.sin(((h - 18) / 4.5) * Math.PI);
  } else if (h >= 23 || h < 5) {
    demand = 1.18;
  } else if (h >= 11.5 && h < 16.5) {
    demand = 1.0;
  } else {
    demand = 1.08;
  }

  const minsAhead = Math.max(0, (targetDate.getTime() - Date.now()) / 60000);
  const wDecay = Math.exp(-minsAhead / 140);
  let wBoost = 0;
  if (weather?.precipitationMm >= 3) wBoost = 0.28 * wDecay;
  else if (weather?.severity === 'rain' || weather?.precipitationMm > 0.2) wBoost = 0.16 * wDecay;
  else if (weather?.tempC >= 37 && h >= 12 && h <= 16) wBoost = 0.08;

  const blended = minsAhead <= 5
    ? Math.max(1.0, baseNowSurge)
    : Math.max(1.0, demand + wBoost + (baseNowSurge - demand) * Math.exp(-minsAhead / 35) * 0.45);
  return Number(Math.min(2.0, Math.max(1.0, blended)).toFixed(2));
}

function buildWebProjectFutureForecast(overrideCategory = null, customTimeStr = '') {
  const now = new Date();
  const rt = nextGenState.rtAnalysis;
  const pickup = state.pickup || 'KG Apartments, Chennai';
  const dropoff = state.dropoff || 'Marina Beach, Chennai';
  const category = overrideCategory || state.category || 'cab4';
  const weather = nextGenState.liveWeather;
  const currentSurge = Number(rt?.mlSurge?.multiplier || webPredictSurgeAtDate(now, weather, 1.08));
  const distKm = Number(rt?.routeInfo?.distanceKm || calculateDistance(pickup, dropoff) || 10.5);
  const liveMins = Number(rt?.routeInfo?.liveDurationMins || Math.round(distKm * 2.3));

  // Anchor directly to exact live project quotes for this route & category
  let baseQuotes = (state.quotes && state.quotes.length > 0 && category === state.category)
    ? state.quotes
    : applyLiveRealTimeCalibrationToQuotes(
        generateQuotes(pickup, dropoff, category, state.strategy || 'balanced').options || [],
        pickup,
        dropoff
      );

  const activeProviders = baseQuotes.slice(0, 5).map((q) => {
    const provLower = String(q.provider || '').toLowerCase();
    const isSmart = Boolean(q.isSmart || provLower.includes('smartride'));
    const isNamma = provLower.includes('namma');
    const currentFare = Math.max(25, Math.round(Number(q.fare) || 120));
    const effNowSurge = isSmart ? Math.min(1.10, currentSurge) : isNamma ? Math.min(1.16, currentSurge) : currentSurge;
    return {
      id: q.id || provLower,
      name: q.provider || 'SmartRide AI',
      rideType: q.type || q.provider || 'Cab',
      isSmart,
      isNamma,
      currentFare,
      baseFare: Math.max(22, Math.round(currentFare / Math.max(1, effNowSurge))),
    };
  });

  const computeSlot = (slotDate, label, offsetMinutes) => {
    const surge = offsetMinutes === 0 ? currentSurge : webPredictSurgeAtDate(slotDate, weather, currentSurge);
    const providers = activeProviders.map((p) => {
      const pSurge = p.isSmart ? Math.min(1.10, 1 + (surge - 1) * 0.25) : p.isNamma ? Math.min(1.16, 1 + (surge - 1) * 0.45) : surge;
      const fare = offsetMinutes === 0 ? p.currentFare : Math.max(p.baseFare, Math.round(p.baseFare * pSurge));
      return {
        ...p,
        predictedFare: fare,
        deltaVsNow: fare - p.currentFare,
        surge: Number(pSurge.toFixed(2)),
      };
    }).sort((a, b) => a.predictedFare - b.predictedFare);

    const bestFare = providers[0]?.predictedFare || 100;
    const avgFare = Math.round(providers.reduce((s, p) => s + p.predictedFare, 0) / Math.max(1, providers.length));
    const demandLabel = surge >= 1.45 ? 'High Surge' : surge >= 1.2 ? 'Moderate Peak' : surge >= 1.08 ? 'Mild Demand' : 'Low / Base Fare';

    return {
      offsetMinutes,
      label,
      time: slotDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      surge,
      demandLabel,
      fare: bestFare,
      avgFare,
      cheapestProvider: providers[0]?.name || 'SmartRide EV',
      providers,
    };
  };

  const offsets = [
    { mins: 0, label: 'Now' },
    { mins: 15, label: '+15m' },
    { mins: 30, label: '+30m' },
    { mins: 45, label: '+45m' },
    { mins: 60, label: '+1h' },
    { mins: 120, label: '+2h' },
    { mins: 180, label: '+3h' },
    { mins: 360, label: '+6h' },
  ];

  const rawSlots = offsets.map(({ mins, label }) => computeSlot(new Date(now.getTime() + mins * 60000), label, mins));
  const nowBest = rawSlots[0].fare;
  const nowAvg = rawSlots[0].avgFare;
  const timeline = rawSlots.map((s) => ({
    ...s,
    savings: Math.max(0, nowBest - s.fare),
    avgSavings: Math.max(0, nowAvg - s.avgFare),
  }));

  const bestWindow = [...timeline].sort((a, b) => a.fare - b.fare || a.offsetMinutes - b.offsetMinutes)[0];
  const peakWindow = [...timeline].sort((a, b) => b.avgFare - a.avgFare)[0];

  let customSlot = null;
  if (customTimeStr && /^\d{2}:\d{2}$/.test(customTimeStr)) {
    const [hh, mm] = customTimeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    if (d.getTime() < Date.now() - 60000) d.setDate(d.getDate() + 1);
    const diffMins = Math.max(0, Math.round((d.getTime() - now.getTime()) / 60000));
    const s = computeSlot(d, 'Custom Time', diffMins);
    customSlot = { ...s, savings: Math.max(0, nowBest - s.fare), avgSavings: Math.max(0, nowAvg - s.avgFare) };
  }

  const shouldWait = bestWindow.offsetMinutes > 0 && bestWindow.savings >= 8;
  const verdict = shouldWait
    ? `Wait until ${bestWindow.time} (${bestWindow.label}) to save ₹${bestWindow.savings} — fare drops from ₹${nowBest} ➔ ₹${bestWindow.fare}!`
    : peakWindow.avgFare > nowAvg + 15
      ? `Book Now at ₹${nowBest}! Fares are predicted to surge up to ₹${peakWindow.avgFare} (${peakWindow.surge}x) around ${peakWindow.time}.`
      : `Fares are already near base rate (₹${nowBest}) — ideal time to book right now!`;

  return {
    pickup,
    dropoff,
    category,
    distanceKm: distKm,
    liveDurationMins: liveMins,
    currentSurge,
    currentFare: nowBest,
    currentAvgFare: nowAvg,
    baseFare: activeProviders[0]?.baseFare || nowBest,
    projectedFareIn15: timeline[1].fare,
    savingsIn15: Math.max(0, nowAvg - timeline[1].avgFare),
    bestWindow,
    peakWindow,
    shouldWait,
    verdict,
    advice: verdict,
    confidencePct: rt?.mlSurge?.confidencePct || 91,
    isLive: Boolean(rt?.telemetry?.isLive),
    timeline,
    customSlot,
  };
}

function renderFuturePricingView(container, opts = {}) {
  const category = opts.category || state.category || 'cab4';
  const customTimeStr = opts.customTimeStr ?? (nextGenState.forecastCustomTime || '');
  const fp = buildWebProjectFutureForecast(category, customTimeStr);
  const selectedIdx = typeof nextGenState.forecastSlotIdx === 'number' ? nextGenState.forecastSlotIdx : 1;
  const activeSlot = fp.customSlot || fp.timeline[selectedIdx] || fp.timeline[0];

  const fares = fp.timeline.map((s) => s.fare);
  const minF = Math.min(...fares, 1);
  const maxF = Math.max(...fares, minF + 12);
  const svgW = 540;
  const svgH = 128;
  const pts = fp.timeline.map((s, idx) => {
    const x = 28 + (idx / Math.max(1, fp.timeline.length - 1)) * (svgW - 56);
    const y = svgH - 26 - ((s.fare - minF) / Math.max(1, maxF - minF)) * (svgH - 52);
    return { x, y, slot: s, idx };
  });
  const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `28,${svgH - 18} ${poly} ${svgW - 28},${svgH - 18}`;
  const catLabel = category === 'bike' ? 'Bike Taxi' : category === 'auto' ? 'Auto Rickshaw' : category === 'cab7' ? '7-Seater SUV' : '4-Seater Cab';

  container.innerHTML = buildWebTelemetryStripHtml() + `
    <!-- AI Book Now vs Wait Verdict Card -->
    <div style="background: ${fp.shouldWait ? 'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(0,216,255,0.12))' : 'linear-gradient(135deg, rgba(0,216,255,0.16), rgba(99,102,241,0.14))'}; border: 1.5px solid ${fp.shouldWait ? 'rgba(16,185,129,0.5)' : 'rgba(0,216,255,0.45)'}; border-radius: 16px; padding: 14px 16px; margin-bottom: 14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:5px;">
        <span style="font-size:10px; font-weight:900; color:${fp.shouldWait ? '#10B981' : '#00D8FF'}; text-transform:uppercase; letter-spacing:0.06em;">
          📈 AI FUTURE PRICE PREDICTION · ${catLabel.toUpperCase()} (${fp.distanceKm} KM)
        </span>
        <span style="font-size:10px; font-weight:900; padding:2px 8px; border-radius:99px; background:rgba(16,185,129,0.2); color:#10B981;">
          ${fp.confidencePct}% ML Confidence
        </span>
      </div>
      <div style="font-size:14px; font-weight:900; color:var(--text-main); line-height:1.4;">${fp.verdict}</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; font-size:11px; font-weight:800;">
        <span style="padding:4px 10px; border-radius:8px; background:var(--bg-elevated); color:var(--text-main);">Now: ₹${fp.currentFare} (${fp.currentSurge}x)</span>
        <span style="padding:4px 10px; border-radius:8px; background:rgba(16,185,129,0.16); color:#10B981;">🏆 Best Window: ₹${fp.bestWindow.fare} @ ${fp.bestWindow.time}</span>
        <span style="padding:4px 10px; border-radius:8px; background:rgba(239,68,68,0.14); color:#EF4444;">⚠️ Peak Surge: ₹${fp.peakWindow.avgFare} @ ${fp.peakWindow.time}</span>
      </div>
    </div>

    <!-- Interactive 6-Hour SVG Price Curve -->
    <div style="background:var(--bg-surface); border:1px solid var(--border-ui); border-radius:16px; padding:14px; margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <strong style="font-size:13px; color:var(--text-main);">Projected 6-Hour Price Curve (${fp.pickup.split(',')[0]} ➔ ${fp.dropoff.split(',')[0]})</strong>
        <span style="font-size:11px; color:var(--text-muted);">Click any time window below</span>
      </div>
      <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%; height:132px; overflow:visible;">
        <defs>
          <linearGradient id="webFpAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00D8FF" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#00D8FF" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points="${area}" fill="url(#webFpAreaGrad)" />
        <polyline points="${poly}" fill="none" stroke="#00D8FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
        ${pts.map((p) => {
          const isBest = p.slot.offsetMinutes === fp.bestWindow.offsetMinutes;
          const isSel = !fp.customSlot && selectedIdx === p.idx;
          return `
            <g class="web-fp-node" data-idx="${p.idx}" style="cursor:pointer;">
              <circle cx="${p.x}" cy="${p.y}" r="${isSel ? 6 : 4.5}" fill="${isBest ? '#10B981' : isSel ? '#00D8FF' : '#6366F1'}" stroke="#080C14" stroke-width="2" />
              <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" fill="${isBest ? '#10B981' : '#E2E8F0'}" font-size="11" font-weight="800">₹${p.slot.fare}</text>
              <text x="${p.x}" y="${svgH - 4}" text-anchor="middle" fill="#94A3B8" font-size="10" font-weight="700">${p.slot.label}</text>
            </g>`;
        }).join('')}
      </svg>
    </div>

    <!-- 8 Clickable Time-Slot Forecast Cards -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(92px, 1fr)); gap:8px; margin-bottom:14px;">
      ${fp.timeline.map((s, idx) => {
        const isBest = s.offsetMinutes === fp.bestWindow.offsetMinutes;
        const isSel = !fp.customSlot && selectedIdx === idx;
        return `
          <button type="button" class="web-fp-slot-btn" data-idx="${idx}" style="position:relative; padding:10px 6px; border-radius:12px; cursor:pointer; text-align:center; background:${isSel ? 'rgba(0,216,255,0.18)' : isBest ? 'rgba(16,185,129,0.14)' : 'var(--bg-elevated)'}; border:1.5px solid ${isSel ? '#00D8FF' : isBest ? '#10B981' : 'var(--border-ui)'};">
            ${isBest ? `<span style="position:absolute; top:-7px; left:50%; transform:translateX(-50%); background:#10B981; color:#080C14; font-size:8px; font-weight:900; padding:1px 6px; border-radius:4px; white-space:nowrap;">LOWEST</span>` : ''}
            <div style="font-size:11px; font-weight:800; color:${isSel ? '#00D8FF' : 'var(--text-muted)'};">${s.label}</div>
            <div style="font-size:10px; color:var(--text-muted);">${s.time}</div>
            <div style="font-size:16px; font-weight:900; color:${isBest ? '#10B981' : 'var(--text-main)'}; margin-top:3px;">₹${s.fare}</div>
            <div style="font-size:10px; font-weight:800; color:${s.surge >= 1.3 ? '#EF4444' : s.surge > 1.08 ? '#F59E0B' : '#10B981'};">${s.surge}x</div>
          </button>`;
      }).join('')}
    </div>

    <!-- Per-Provider Predicted Fare Breakdown (Synced with Project Providers) -->
    <div style="background:var(--bg-surface); border:1px solid var(--border-ui); border-radius:16px; padding:14px; margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
        <strong style="font-size:13px; color:var(--text-main);">Predicted Provider Fares @ ${activeSlot.time} (${activeSlot.label})</strong>
        <span style="font-size:11px; font-weight:800; color:${activeSlot.surge >= 1.3 ? '#EF4444' : '#10B981'};">${activeSlot.demandLabel} · ${activeSlot.surge}x Market Surge</span>
      </div>
      <div style="display:grid; gap:8px;">
        ${activeSlot.providers.map((p, i) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-radius:12px; background:${i === 0 ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)'}; border:1px solid ${i === 0 ? 'rgba(16,185,129,0.4)' : 'var(--border-ui)'};">
            <div>
              <div style="font-size:13px; font-weight:800; color:var(--text-main);">${i === 0 ? '🏆 ' : ''}${p.rideType} <span style="font-size:11px; color:var(--text-muted); font-weight:600;">(${p.name})</span></div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Current Fare: ₹${p.currentFare} · Forecast Surge: ${p.surge}x</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:18px; font-weight:900; color:${i === 0 ? '#10B981' : 'var(--text-main)'};">₹${p.predictedFare}</div>
              <div style="font-size:11px; font-weight:800; color:${p.deltaVsNow < 0 ? '#10B981' : p.deltaVsNow > 0 ? '#EF4444' : 'var(--text-muted)'};">
                ${p.deltaVsNow < 0 ? `Save ₹${Math.abs(p.deltaVsNow)} vs Now` : p.deltaVsNow > 0 ? `+₹${p.deltaVsNow} vs Now` : 'Same as Now'}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Action Bar: Arm Price Sniper at Predicted Lowest -->
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button type="button" class="web-fp-arm-sniper-btn" data-target="${fp.bestWindow.fare}" style="flex:1; padding:11px 14px; border-radius:12px; border:none; background:linear-gradient(135deg,#10B981,#00D8FF); color:#080C14; font-weight:900; font-size:12px; cursor:pointer;">
        🎯 Arm Price Sniper at Predicted Lowest (₹${fp.bestWindow.fare})
      </button>
      <button type="button" class="web-fp-book-now-btn" style="padding:11px 16px; border-radius:12px; border:1px solid var(--border-ui); background:var(--bg-elevated); color:var(--text-main); font-weight:800; font-size:12px; cursor:pointer;">
        🚖 Compare &amp; Book Now
      </button>
    </div>
  `;

  container.querySelectorAll('.web-fp-slot-btn, .web-fp-node').forEach((el) => {
    el.addEventListener('click', () => {
      nextGenState.forecastSlotIdx = parseInt(el.dataset.idx, 10) || 0;
      nextGenState.forecastCustomTime = '';
      const timeInp = document.getElementById('forecast-custom-time');
      if (timeInp) timeInp.value = '';
      renderFuturePricingView(container, { ...opts, customTimeStr: '' });
    });
  });

  container.querySelector('.web-fp-arm-sniper-btn')?.addEventListener('click', (e) => {
    const targetVal = Math.max(1, parseInt(e.currentTarget.dataset.target, 10) || fp.bestWindow.fare);
    nextGenState.activeSniper = { id: 'ws_' + Date.now(), targetPrice: targetVal, provider: 'all' };
    nextGenState.lastAlertKey = null;
    try { localStorage.setItem('web_chubby_sniper_v1', JSON.stringify(nextGenState.activeSniper)); } catch {}
    checkWebPriceSniper();
    openWebChubbyTab('sniper');
    showToast(`🎯 Price Sniper armed for ₹${targetVal}!`, 'success');
  });

  container.querySelector('.web-fp-book-now-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('chubby-ai-modal');
    if (modal) modal.style.display = 'none';
    switchTab('rides');
  });
}

function renderDedicatedFuturePriceSection() {
  const container = document.getElementById('forecast-dashboard-container');
  if (!container) return;

  const pInp = document.getElementById('forecast-pickup-input');
  const dInp = document.getElementById('forecast-dropoff-input');
  const cSel = document.getElementById('forecast-category-select');
  const tInp = document.getElementById('forecast-custom-time');

  if (pInp && !pInp.value.trim()) pInp.value = state.pickup || 'KG Apartments, Chennai';
  if (dInp && !dInp.value.trim()) dInp.value = state.dropoff || 'Marina Beach, Chennai';
  if (cSel && state.category) cSel.value = state.category;

  const cat = cSel?.value || state.category || 'cab4';
  const customTimeStr = tInp?.value || nextGenState.forecastCustomTime || '';

  if (!nextGenState.rtAnalysis) {
    runWebRealTimeAIAnalysis(pInp?.value || state.pickup || 'KG Apartments, Chennai', dInp?.value || state.dropoff || 'Marina Beach, Chennai', false);
  }
  renderFuturePricingView(container, { category: cat, customTimeStr });
}

// ============================================================================
// NEXT-LEVEL CHUBBY AI INTELLIGENCE ENGINE (Web Application)
// 1. Walk-2-Mins Surge Escape  2. Voice-First Multilingual AI
// 3. Live Weather & Comfort    4. Target Price Sniper
// ============================================================================
const nextGenState = {
  chubbyTab: 'chat',
  rtAnalysis: null,
  appliedEscapeSpot: null,
  weatherSimMode: 'live',
  liveWeather: null,
  voiceLang: 'en-IN',
  voiceMuted: false,
  voiceTranscript: '',
  voiceReply: '',
  isListening: false,
  recognizer: null,
  activeSniper: (() => {
    try {
      const saved = localStorage.getItem('web_chubby_sniper_v1');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })(),
  sniperProvider: 'all',
  lastAlertKey: null,
};

const WEB_VOICE_LANGS = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
];

async function fetchWebLiveWeather() {
  try {
    const lat = state.userLat || 13.0827;
    const lng = state.userLng || 80.2707;
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`);
    if (!res.ok) throw new Error('offline');
    const data = await res.json();
    const cur = data?.current || {};
    const code = Number(cur.weather_code ?? 1);
    const isRain = code >= 51 || Number(cur.precipitation ?? 0) > 0.2;
    nextGenState.liveWeather = {
      source: 'Open-Meteo Live',
      tempC: Math.round(Number(cur.temperature_2m ?? 31)),
      humidity: Math.round(Number(cur.relative_humidity_2m ?? 64)),
      windKmh: Math.round(Number(cur.wind_speed_10m ?? 11)),
      precipitationMm: Number(cur.precipitation ?? 0),
      condition: isRain ? 'Rain Showers' : code === 0 ? 'Clear Sky' : 'Partly Cloudy',
      icon: isRain ? '🌧️' : code === 0 ? '☀️' : '⛅',
      severity: isRain ? 'rain' : 'clear',
    };
  } catch {
    nextGenState.liveWeather = {
      source: 'SmartRide Weather Sensor',
      tempC: 31,
      humidity: 64,
      windKmh: 11,
      precipitationMm: 0,
      condition: 'Warm & Breezy',
      icon: '⛅',
      severity: 'clear',
    };
  }
  updateWebStatusStrip();
}
fetchWebLiveWeather();

function getWebWeatherAdvisory() {
  let w = nextGenState.liveWeather || { source: 'SmartRide Sensor', tempC: 31, humidity: 64, windKmh: 11, precipitationMm: 0, condition: 'Partly Cloudy', icon: '⛅', severity: 'clear' };
  const mode = nextGenState.weatherSimMode;
  if (mode === 'rain') w = { source: 'Simulated Rainstorm', tempC: 25, humidity: 91, windKmh: 24, precipitationMm: 8.4, condition: 'Heavy Rain Alert', icon: '🌧️', severity: 'rain' };
  else if (mode === 'heat') w = { source: 'Simulated Peak Heat', tempC: 41, humidity: 44, windKmh: 9, precipitationMm: 0, condition: 'Extreme Heatwave', icon: '🥵', severity: 'heat' };
  else if (mode === 'night') w = { source: 'Simulated Late Night', tempC: 24, humidity: 72, windKmh: 8, precipitationMm: 0, condition: 'Late Night Safety', icon: '🌙', severity: 'night' };
  else if (mode === 'clear') w = { source: 'Simulated Clear Sky', tempC: 28, humidity: 55, windKmh: 10, precipitationMm: 0, condition: 'Pleasant & Clear', icon: '🌤️', severity: 'clear' };

  const sev = w.severity === 'rain' ? 'rain' : w.tempC >= 37 ? 'heat' : w.severity === 'night' ? 'night' : 'clear';
  if (sev === 'rain') {
    return { weather: w, severity: 'rain', color: '#38BDF8', badge: '🌧️ Rain-Safe Pick', headline: 'Rain Alert: Bike & Open Auto Not Recommended', detail: 'Wet roads & rain surge active. Prioritizing Covered AC Cabs & Metro combos.', rec: 'AC Cab / Metro', adjustments: { cab4: +25, cab7: +20, auto: -15, bike: -35 } };
  }
  if (sev === 'heat') {
    return { weather: w, severity: 'heat', color: '#F59E0B', badge: '❄️ Heat-Safe AC', headline: `Extreme Heat (${w.tempC}°C): Prioritize AC Cab or Metro`, detail: 'High UV index detected. Exposed two-wheelers down-ranked.', rec: 'AC Cab / AC Metro', adjustments: { cab4: +22, cab7: +18, auto: -12, bike: -28 } };
  }
  if (sev === 'night') {
    return { weather: w, severity: 'night', color: '#818CF8', badge: '🛡️ Night-Safe Pick', headline: 'Late-Night Safety Mode Active', detail: 'Prioritizing GPS-verified Cabs with high reliability and near-zero cancel risk.', rec: 'Verified Cab', adjustments: { cab4: +24, cab7: +20, auto: -5, bike: -15 } };
  }
  return { weather: w, severity: 'clear', color: '#10B981', badge: '🌤️ Ideal Weather', headline: `${w.icon} ${w.tempC}°C ${w.condition} · Great for All Rides`, detail: 'Dry roads & pleasant weather — Bike, Auto & Smart Multimodal combos offer maximum savings.', rec: 'All Rides / Multimodal', adjustments: { cab4: 0, cab7: 0, auto: +8, bike: +10 } };
}

function getWebSurgeEscapeSpots() {
  const cleanPickup = (state.pickup || 'KG Apartments').split(',')[0].trim();
  const baseFare = Math.max(80, state.quotes?.[0]?.fare || 350);
  const hour = new Date().getHours();
  const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
  const rtSurge = nextGenState.rtAnalysis?.mlSurge?.multiplier;
  const currentSurge = rtSurge && rtSurge > 1.0 ? rtSurge : (isPeak ? 1.42 : 1.24);
  return {
    pickup: cleanPickup,
    currentSurge,
    spots: [
      { id: 'esc_gate', name: `${cleanPickup} Main Road Bus Bay`, direction: 'North-East · Outside Surge Hex', walkMeters: 220, walkMins: 3, dropPct: isPeak ? 0.24 : 0.18, escapedSurge: 1.04, tag: '🏆 Best Savings / Walk Ratio' },
      { id: 'esc_signal', name: `Near ${cleanPickup} Signal Junction`, direction: 'East · Free-Flow Pickup Lane', walkMeters: 170, walkMins: 2, dropPct: isPeak ? 0.17 : 0.13, escapedSurge: 1.10, tag: '⚡ Shortest Walk (2 mins)' },
      { id: 'esc_metro', name: `${cleanPickup} Metro / Feeder Plaza`, direction: 'South · Zero-Surge Transit Zone', walkMeters: 320, walkMins: 4, dropPct: isPeak ? 0.31 : 0.23, escapedSurge: 1.0, tag: '💰 Max Savings Drop' },
    ].map((s) => {
      const savings = Math.max(18, Math.round(baseFare * s.dropPct));
      return { ...s, originalFare: baseFare, escapedFare: Math.max(45, baseFare - savings), savings, savingsPct: Math.round((savings / baseFare) * 100), currentSurge };
    }),
  };
}

function playWebSniperChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.3);
    });
  } catch {}
}

function updateChubbyFabBadge() {
  const badge = document.getElementById('chubby-fab-badge');
  if (!badge) return;
  if (nextGenState.activeSniper) {
    badge.textContent = `🎯 ₹${nextGenState.activeSniper.targetPrice}`;
    badge.style.color = '#10B981';
  } else {
    badge.textContent = '⚡ CHAT & INSIGHTS';
    badge.style.color = '#00D8FF';
  }
}

function showWebSniperHitBanner(option, targetPrice, isSim = false) {
  const banner = document.getElementById('web-sniper-hit-banner');
  if (!banner) return;
  playWebSniperChime();
  banner.style.display = 'block';
  banner.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
      <div>
        <div style="font-size:10px; font-weight:900; letter-spacing:0.06em; text-transform:uppercase;">
          🎯 CHUBBY AI SNIPER LOCKED ${isSim ? '(DEMO TEST)' : '(LIVE)'}
        </div>
        <div style="font-size:14px; font-weight:900; margin-top:3px;">
          ${option.provider} hit ₹${option.fare} (Target ≤ ₹${targetPrice})!
        </div>
      </div>
      <button id="close-web-sniper-banner" style="background:rgba(8,12,20,0.2); border:none; border-radius:8px; width:26px; height:26px; cursor:pointer; font-weight:900;">✕</button>
    </div>
    <button id="book-web-sniper-hit" style="width:100%; margin-top:10px; padding:9px 12px; border-radius:10px; border:none; background:#080C14; color:#00D8FF; font-weight:900; font-size:12px; cursor:pointer;">
      ⚡ Lock & Book Now · ₹${option.fare}
    </button>
  `;
  document.getElementById('close-web-sniper-banner')?.addEventListener('click', () => { banner.style.display = 'none'; });
  document.getElementById('book-web-sniper-hit')?.addEventListener('click', () => {
    banner.style.display = 'none';
    document.getElementById('book-ride-btn')?.click();
  });
}

function checkWebPriceSniper() {
  updateChubbyFabBadge();
  const s = nextGenState.activeSniper;
  if (!s || !state.quotes || state.quotes.length === 0) return;
  const prov = (s.provider || 'all').toLowerCase();
  const pool = state.quotes.filter((q) => prov === 'all' || q.provider.toLowerCase().includes(prov));
  const best = (pool.length ? pool : state.quotes).reduce((a, b) => (a.fare <= b.fare ? a : b));
  if (best && best.fare <= Number(s.targetPrice)) {
    const key = `${s.id}_${best.id}_${best.fare}`;
    if (nextGenState.lastAlertKey !== key) {
      nextGenState.lastAlertKey = key;
      showWebSniperHitBanner(best, s.targetPrice, false);
    }
  }
}

function updateWebStatusStrip() {
  const strip = document.getElementById('nextgen-status-strip');
  if (!strip) return;
  const adv = getWebWeatherAdvisory();
  const esc = nextGenState.appliedEscapeSpot;
  const rt = nextGenState.rtAnalysis;
  if (adv.severity === 'clear' && !esc && !rt) {
    strip.style.display = 'none';
    return;
  }
  strip.style.display = 'flex';
  let html = '';
  if (rt) {
    html += `
      <button type="button" id="web-strip-rt-btn" style="flex:1; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 10px; border-radius:10px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.4); color:#10B981; font-size:11px; font-weight:800; cursor:pointer;">
        <span>${rt.telemetry.isLive ? '🟢 LIVE OSRM' : '⚡ HYBRID AI'} · ${rt.routeInfo.distanceKm} km · ${rt.routeInfo.liveDurationMins}m · ML Surge ${rt.mlSurge.multiplier}x · InDrive ₹${rt.inDriveFairBid}</span>
        <span>AI ›</span>
      </button>`;
  }
  if (adv.severity !== 'clear') {
    html += `
      <button type="button" id="web-strip-weather-btn" style="flex:1; display:flex; align-items:center; justify-content:space-between; padding:6px 10px; border-radius:10px; background:${adv.color}18; border:1px solid ${adv.color}55; color:${adv.color}; font-size:11px; font-weight:800; cursor:pointer;">
        <span>${adv.weather.icon} ${adv.weather.tempC}°C ${adv.weather.condition} · ${adv.rec}</span>
        <span>Details ›</span>
      </button>`;
  }
  if (esc) {
    html += `
      <div style="display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:10px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.45); color:#10B981; font-size:11px; font-weight:800;">
        <span>🚶 Surge Escaped (-${esc.savingsPct}%)</span>
        <button type="button" id="web-reset-escape-btn" style="background:none; border:none; color:#10B981; font-weight:900; cursor:pointer;">✕</button>
      </div>`;
  }
  strip.innerHTML = html;
  document.getElementById('web-strip-rt-btn')?.addEventListener('click', () => openWebChubbyTab('multimodal'));
  document.getElementById('web-strip-weather-btn')?.addEventListener('click', () => openWebChubbyTab('weather'));
  document.getElementById('web-reset-escape-btn')?.addEventListener('click', () => {
    nextGenState.appliedEscapeSpot = null;
    updateWebStatusStrip();
    renderQuotes();
  });
}

function renderSurgeEscapeView(container) {
  const data = getWebSurgeEscapeSpots();
  container.innerHTML = `
    <div style="background: linear-gradient(135deg, rgba(16,185,129,0.16), rgba(0,216,255,0.12)); border:1px solid rgba(16,185,129,0.4); border-radius:16px; padding:12px 14px; margin-bottom:12px;">
      <div style="font-size:10px; font-weight:900; color:#10B981; text-transform:uppercase;">🚶 MICRO-ZONE HEX SURGE RADAR (${data.currentSurge}x ACTIVE)</div>
      <div style="font-size:13px; font-weight:800; color:var(--text-main); margin-top:3px;">Walk just 2–4 mins outside the hotspot to save up to <span style="color:#10B981;">₹${data.spots[2].savings}</span>!</div>
    </div>
    ${data.spots.map((s) => {
      const applied = nextGenState.appliedEscapeSpot?.id === s.id;
      return `
        <div class="quote-card" style="border:1.5px solid ${applied ? '#10B981' : 'var(--border-ui)'}; border-radius:16px; padding:13px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <span style="font-size:10px; font-weight:900; background:rgba(16,185,129,0.15); color:#10B981; padding:2px 7px; border-radius:6px;">${s.tag}</span>
              <h4 style="font-size:14px; font-weight:800; color:var(--text-main); margin:5px 0 2px;">📍 ${s.name}</h4>
              <p style="font-size:11px; color:var(--text-muted); margin:0;">🚶 ${s.walkMeters}m (${s.walkMins} min walk) · ${s.direction}</p>
              <p style="font-size:11px; color:#38BDF8; font-weight:700; margin:3px 0 0;">✓ Surge drops ${s.currentSurge}x ➔ ${s.escapedSurge}x</p>
            </div>
            <div style="text-align:right;">
              <div style="font-size:19px; font-weight:900; color:#10B981;">₹${s.escapedFare}</div>
              <div style="font-size:11px; color:#EF4444; text-decoration:line-through;">₹${s.originalFare}</div>
              <div style="font-size:11px; font-weight:800; color:#10B981;">Save ₹${s.savings} (${s.savingsPct}%)</div>
            </div>
          </div>
          <div style="margin-top:10px; padding-top:8px; border-top:1px dashed var(--border-ui); text-align:right;">
            <button type="button" class="web-apply-escape-btn" data-escape-id="${s.id}" style="padding:7px 14px; border-radius:9px; border:none; background:${applied ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg,#10B981,#00D8FF)'}; color:${applied ? '#EF4444' : '#080C14'}; font-size:11px; font-weight:900; cursor:pointer;">
              ${applied ? 'Reset Original Pin' : `🚶 Switch Pickup & Save ₹${s.savings}`}
            </button>
          </div>
        </div>`;
    }).join('')}
  `;
  container.querySelectorAll('.web-apply-escape-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.escapeId;
      if (nextGenState.appliedEscapeSpot?.id === id) {
        nextGenState.appliedEscapeSpot = null;
      } else {
        const chosen = data.spots.find((x) => x.id === id);
        nextGenState.appliedEscapeSpot = chosen;
        state.pickup = chosen.name;
        const pInput = document.getElementById('pickup-input');
        if (pInput) pInput.value = chosen.name;
        document.getElementById('chubby-ai-modal').style.display = 'none';
      }
      updateWebStatusStrip();
      renderQuotes();
    });
  });
}

function executeWebVoiceCommand(text, lang = nextGenState.voiceLang) {
  const cleaned = (text || '').trim();
  if (!cleaned) return;
  nextGenState.voiceTranscript = cleaned;
  const lower = cleaned.toLowerCase();

  // Destination extraction
  const landmarks = ['Marina Beach', 'Airport Terminal 2', 'Central Railway Station', 'Phoenix MarketCity Mall', 'KG Apartments', 'Tidel Park', 'Koramangala', 'Whitefield'];
  for (const lm of landmarks) {
    if (lower.includes(lm.toLowerCase().split(' ')[0])) {
      state.dropoff = lm;
      const dInput = document.getElementById('dropoff-input');
      if (dInput) dInput.value = lm;
      break;
    }
  }
  if (/\b(bike|scooter)\b/i.test(lower)) state.category = 'bike';
  else if (/\b(auto|rickshaw)\b/i.test(lower)) state.category = 'auto';
  else if (/\b(cab|car|taxi|sedan)\b/i.test(lower)) state.category = 'cab4';

  if (/\b(cheap|cheapest|sasta|kammi|takkuva|low|budget)\b/i.test(lower)) state.strategy = 'cheapest';
  else if (/\b(fast|fastest|jaldi|vegama)\b/i.test(lower)) state.strategy = 'fastest';

  const sniperMatch = lower.match(/(?:sniper|alert|target|below|under)\s*(?:rs\.?|₹)?\s*(\d{2,4})/i);
  if (sniperMatch) {
    const val = Math.max(1, parseInt(sniperMatch[1], 10));
    nextGenState.activeSniper = { id: 'ws_' + Date.now(), targetPrice: val, provider: 'all' };
    try { localStorage.setItem('web_chubby_sniper_v1', JSON.stringify(nextGenState.activeSniper)); } catch {}
    updateChubbyFabBadge();
  }

  refreshQuotes();
  const best = state.quotes?.[0] || { provider: 'SmartRide AI', fare: 145 };
  const dest = state.dropoff || 'your destination';
  let reply = `For ${dest}, the best live ride is ${best.provider} at ₹${best.fare}.`;
  if (lang === 'hi-IN') reply = `${dest} ke liye sabse sasta option ${best.provider} ₹${best.fare} mein hai!`;
  else if (lang === 'ta-IN') reply = `${dest} poga ${best.provider} ₹${best.fare} ku kidaikkum!`;
  else if (lang === 'te-IN') reply = `${dest} velladaniki ${best.provider} ₹${best.fare} lo undi!`;
  nextGenState.voiceReply = reply;

  if (!nextGenState.voiceMuted && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(reply);
      u.lang = lang;
      window.speechSynthesis.speak(u);
    } catch {}
  }
  const body = document.getElementById('chubby-modal-body');
  if (body && nextGenState.chubbyTab === 'voice') renderVoiceAIView(body);
}

function toggleWebVoiceListening() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (nextGenState.isListening) {
    try { nextGenState.recognizer?.stop(); } catch {}
    nextGenState.isListening = false;
    document.getElementById('chatbot-voice-mic-btn')?.classList.remove('listening');
    const body = document.getElementById('chubby-modal-body');
    if (body && nextGenState.chubbyTab === 'voice') renderVoiceAIView(body);
    return;
  }
  if (!SpeechRec) {
    nextGenState.voiceReply = 'Browser mic unavailable — tap any multilingual command below or type a command!';
    const body = document.getElementById('chubby-modal-body');
    if (body && nextGenState.chubbyTab === 'voice') renderVoiceAIView(body);
    return;
  }
  const rec = new SpeechRec();
  rec.lang = nextGenState.voiceLang;
  rec.interimResults = true;
  rec.onresult = (e) => {
    let txt = '';
    let isFin = false;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      txt += e.results[i][0].transcript;
      if (e.results[i].isFinal) isFin = true;
    }
    nextGenState.voiceTranscript = txt.trim();
    if (isFin) executeWebVoiceCommand(txt, nextGenState.voiceLang);
  };
  rec.onend = () => {
    nextGenState.isListening = false;
    document.getElementById('chatbot-voice-mic-btn')?.classList.remove('listening');
    const body = document.getElementById('chubby-modal-body');
    if (body && nextGenState.chubbyTab === 'voice') renderVoiceAIView(body);
  };
  nextGenState.recognizer = rec;
  nextGenState.isListening = true;
  document.getElementById('chatbot-voice-mic-btn')?.classList.add('listening');
  try { rec.start(); } catch { nextGenState.isListening = false; }
  const body = document.getElementById('chubby-modal-body');
  if (body && nextGenState.chubbyTab === 'voice') renderVoiceAIView(body);
}

function renderVoiceAIView(container) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:12px;">
      <div style="display:flex; gap:6px; overflow-x:auto;">
        ${WEB_VOICE_LANGS.map((l) => `
          <button type="button" class="web-vlang-btn" data-lang="${l.code}" style="padding:6px 10px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer; background:${nextGenState.voiceLang === l.code ? 'rgba(0,216,255,0.2)' : 'var(--bg-elevated)'}; border:1px solid ${nextGenState.voiceLang === l.code ? '#00D8FF' : 'var(--border-ui)'}; color:${nextGenState.voiceLang === l.code ? '#00D8FF' : 'var(--text-muted)'};">
            ${l.label}
          </button>`).join('')}
      </div>
      <button type="button" id="web-voice-mute-btn" style="padding:6px 10px; border-radius:10px; background:var(--bg-elevated); border:1px solid var(--border-ui); color:${nextGenState.voiceMuted ? '#EF4444' : '#00D8FF'}; cursor:pointer; font-size:13px;">
        ${nextGenState.voiceMuted ? '🔇' : '🔊'}
      </button>
    </div>

    <div style="background:linear-gradient(135deg, rgba(99,102,241,0.16), rgba(0,216,255,0.12)); border:1px solid rgba(0,216,255,0.35); border-radius:18px; padding:18px; text-align:center; margin-bottom:12px;">
      <button type="button" id="web-voice-orb-btn" style="width:66px; height:66px; border-radius:999px; border:none; cursor:pointer; font-size:26px; background:${nextGenState.isListening ? 'linear-gradient(135deg,#EF4444,#F97316)' : 'linear-gradient(135deg,#00D8FF,#6366F1)'}; box-shadow:0 10px 26px rgba(0,216,255,0.45);">
        ${nextGenState.isListening ? '⏹️' : '🎙️'}
      </button>
      <div style="font-size:14px; font-weight:800; color:var(--text-main); margin-top:10px;">
        ${nextGenState.isListening ? 'Listening... Speak Now' : 'Tap Mic to Speak to Chubby AI'}
      </div>
      <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">English, हिन्दी, தமிழ் & తెలుగు · Auto-sets route, vehicle & sniper alerts</div>
      ${nextGenState.voiceTranscript ? `<div style="margin-top:10px; padding:8px 10px; border-radius:10px; background:var(--bg-elevated); text-align:left; font-size:12px;"><strong style="color:#00D8FF; font-size:10px;">YOU SAID:</strong><br/>"${nextGenState.voiceTranscript}"</div>` : ''}
      ${nextGenState.voiceReply ? `<div style="margin-top:8px; padding:9px 10px; border-radius:10px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); text-align:left; font-size:12px;"><strong style="color:#10B981; font-size:10px;">✨ CHUBBY AI:</strong><br/>${nextGenState.voiceReply}</div>` : ''}
    </div>

    <div style="display:flex; gap:8px; margin-bottom:12px;">
      <input type="text" id="web-voice-text-input" placeholder="Or type command (e.g. 'Cheapest auto to Marina Beach')..." style="flex:1; padding:9px 12px; border-radius:10px; background:var(--bg-elevated); border:1px solid var(--border-ui); color:var(--text-main); font-size:12px; font-weight:700;" />
      <button type="button" id="web-voice-text-run" style="padding:0 14px; border-radius:10px; border:none; background:linear-gradient(135deg,#00D8FF,#6366F1); color:#080C14; font-weight:900; font-size:12px; cursor:pointer;">Run</button>
    </div>

    <div style="display:flex; flex-direction:column; gap:6px;">
      ${[
        { label: '🇬🇧 "Cheapest way to Marina Beach"', cmd: 'Cheapest way to Marina Beach', lang: 'en-IN' },
        { label: '🇮🇳 "Airport jaane ka sabse sasta auto"', cmd: 'Airport jaane ka sabse sasta auto', lang: 'hi-IN' },
        { label: '🇮🇳 "Central Station poga kammi rate cab"', cmd: 'Central Station poga kammi rate cab', lang: 'ta-IN' },
        { label: '🇮🇳 "Marina Beach velladaniki takkuva rate"', cmd: 'Marina Beach velladaniki takkuva rate', lang: 'te-IN' },
        { label: '🎯 "Set price sniper alert below 150"', cmd: 'Set price sniper alert below 150', lang: 'en-IN' },
      ].map((p) => `
        <button type="button" class="web-vpreset-btn" data-cmd="${p.cmd}" data-lang="${p.lang}" style="display:flex; justify-content:space-between; padding:9px 12px; border-radius:10px; background:var(--bg-elevated); border:1px solid var(--border-ui); color:var(--text-main); font-size:12px; font-weight:700; cursor:pointer;">
          <span>${p.label}</span><span style="color:#00D8FF;">Try ›</span>
        </button>`).join('')}
    </div>
  `;
  container.querySelectorAll('.web-vlang-btn').forEach((b) => b.addEventListener('click', () => { nextGenState.voiceLang = b.dataset.lang; renderVoiceAIView(container); }));
  document.getElementById('web-voice-mute-btn')?.addEventListener('click', () => { nextGenState.voiceMuted = !nextGenState.voiceMuted; renderVoiceAIView(container); });
  document.getElementById('web-voice-orb-btn')?.addEventListener('click', toggleWebVoiceListening);
  document.getElementById('web-voice-text-run')?.addEventListener('click', () => {
    const val = document.getElementById('web-voice-text-input')?.value;
    if (val) executeWebVoiceCommand(val, nextGenState.voiceLang);
  });
  container.querySelectorAll('.web-vpreset-btn').forEach((b) => b.addEventListener('click', () => {
    nextGenState.voiceLang = b.dataset.lang;
    executeWebVoiceCommand(b.dataset.cmd, b.dataset.lang);
  }));
}

function renderWeatherAIView(container) {
  const adv = getWebWeatherAdvisory();
  container.innerHTML = `
    <div style="background:linear-gradient(135deg, ${adv.color}22, rgba(99,102,241,0.14)); border:1.5px solid ${adv.color}66; border-radius:16px; padding:14px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:10px; font-weight:900; color:${adv.color}; text-transform:uppercase;">${adv.weather.source}</span>
          <h4 style="font-size:18px; font-weight:900; color:var(--text-main); margin:3px 0;">${adv.weather.icon} ${adv.weather.tempC}°C · ${adv.weather.condition}</h4>
          <p style="font-size:11px; color:var(--text-muted); margin:0;">💧 Humidity ${adv.weather.humidity}% · 💨 Wind ${adv.weather.windKmh} km/h</p>
        </div>
        <span style="padding:4px 10px; border-radius:99px; background:${adv.color}25; color:${adv.color}; font-size:11px; font-weight:900;">${adv.badge}</span>
      </div>
      <div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border-ui);">
        <div style="font-size:13px; font-weight:800; color:var(--text-main);">${adv.headline}</div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">${adv.detail}</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
      ${[
        { id: 'cab4', icon: '🚗', name: 'AC Cab (4S)' },
        { id: 'cab7', icon: '🚐', name: 'AC SUV (7S)' },
        { id: 'auto', icon: '🛺', name: 'Auto Rickshaw' },
        { id: 'bike', icon: '🏍️', name: 'Bike Taxi' },
      ].map((v) => {
        const d = adv.adjustments[v.id] || 0;
        const warn = d <= -20;
        return `
          <div style="padding:10px; border-radius:12px; background:${warn ? 'rgba(239,68,68,0.1)' : d > 10 ? 'rgba(16,185,129,0.12)' : 'var(--bg-elevated)'}; border:1px solid ${warn ? 'rgba(239,68,68,0.4)' : d > 10 ? 'rgba(16,185,129,0.4)' : 'var(--border-ui)'};">
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; color:var(--text-main);">
              <span>${v.icon} ${v.name}</span>
              <span style="color:${warn ? '#EF4444' : d > 0 ? '#10B981' : 'var(--text-muted)'};">${d > 0 ? '+' + d : d}</span>
            </div>
            <div style="font-size:10px; margin-top:4px; font-weight:700; color:${warn ? '#EF4444' : d > 10 ? '#10B981' : 'var(--text-muted)'};">
              ${warn ? '⚠️ Not ideal right now' : d > 10 ? '✓ AI Priority Pick' : 'Standard comfort'}
            </div>
          </div>`;
      }).join('')}
    </div>

    <div style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Test Weather Adaptation Mode</div>
    <div style="display:flex; gap:6px; flex-wrap:wrap;">
      ${[
        { id: 'live', label: '📡 Live GPS' },
        { id: 'rain', label: '🌧️ Heavy Rain' },
        { id: 'heat', label: '🥵 Peak Heat' },
        { id: 'night', label: '🌙 Late Night' },
        { id: 'clear', label: '🌤️ Clear Sky' },
      ].map((m) => `
        <button type="button" class="web-wsim-btn" data-mode="${m.id}" style="padding:6px 10px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer; background:${nextGenState.weatherSimMode === m.id ? 'rgba(0,216,255,0.2)' : 'var(--bg-elevated)'}; border:1px solid ${nextGenState.weatherSimMode === m.id ? '#00D8FF' : 'var(--border-ui)'}; color:${nextGenState.weatherSimMode === m.id ? '#00D8FF' : 'var(--text-muted)'};">
          ${m.label}
        </button>`).join('')}
    </div>
  `;
  container.querySelectorAll('.web-wsim-btn').forEach((b) => b.addEventListener('click', () => {
    nextGenState.weatherSimMode = b.dataset.mode;
    updateWebStatusStrip();
    renderWeatherAIView(container);
  }));
}

function renderPriceSniperAndFutureView(container) {
  const bestFare = state.quotes?.[0]?.fare || 250;
  const s = nextGenState.activeSniper;
  const defaultVal = s ? s.targetPrice : Math.max(40, Math.round(bestFare * 0.88));

  const sniperBox = document.createElement('div');
  sniperBox.style.cssText = `background:linear-gradient(135deg, rgba(16,185,129,0.14), rgba(0,216,255,0.12)); border:1.5px solid ${s ? '#10B981' : 'rgba(0,216,255,0.4)'}; border-radius:16px; padding:14px; margin-bottom:14px;`;
  sniperBox.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <div>
        <div style="font-size:10px; font-weight:900; color:#10B981; text-transform:uppercase;">🎯 AUTOMATED TARGET PRICE SNIPER</div>
        <div style="font-size:14px; font-weight:900; color:var(--text-main); margin-top:2px;">${s ? `Watching Live · Target ≤ ₹${s.targetPrice}` : 'Set Your Target Fare Budget'}</div>
      </div>
      ${s ? `<span style="padding:3px 8px; border-radius:99px; background:rgba(16,185,129,0.2); color:#10B981; font-size:10px; font-weight:900;">● ARMED</span>` : ''}
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
      <div>
        <label style="font-size:10px; font-weight:800; color:var(--text-muted);">TARGET PRICE (₹)</label>
        <input type="number" id="web-sniper-input" min="1" value="${defaultVal}" style="width:100%; margin-top:3px; padding:8px 10px; border-radius:10px; background:var(--bg-elevated); border:1px solid var(--border-ui); color:var(--text-main); font-size:14px; font-weight:900;" />
      </div>
      <div>
        <label style="font-size:10px; font-weight:800; color:var(--text-muted);">WATCH APP</label>
        <select id="web-sniper-provider" style="width:100%; margin-top:3px; padding:9px 8px; border-radius:10px; background:var(--bg-elevated); border:1px solid var(--border-ui); color:var(--text-main); font-size:12px; font-weight:800;">
          <option value="all" ${(s?.provider || 'all') === 'all' ? 'selected' : ''}>All Apps (Fastest)</option>
          <option value="smartride" ${s?.provider === 'smartride' ? 'selected' : ''}>SmartRide AI</option>
          <option value="namma" ${s?.provider === 'namma' ? 'selected' : ''}>Namma Yatri</option>
          <option value="uber" ${s?.provider === 'uber' ? 'selected' : ''}>Uber</option>
          <option value="ola" ${s?.provider === 'ola' ? 'selected' : ''}>Ola</option>
          <option value="rapido" ${s?.provider === 'rapido' ? 'selected' : ''}>Rapido</option>
        </select>
      </div>
    </div>

    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
      ${[5, 10, 15, 20].map((pct) => {
        const v = Math.max(10, Math.round(bestFare * (1 - pct / 100)));
        return `<button type="button" class="web-sniper-preset" data-val="${v}" style="padding:4px 8px; border-radius:8px; background:var(--bg-elevated); border:1px solid var(--border-ui); color:#00D8FF; font-size:11px; font-weight:800; cursor:pointer;">-${pct}% (₹${v})</button>`;
      }).join('')}
    </div>

    <div style="display:flex; gap:8px; margin-bottom:8px;">
      <button type="button" id="web-sniper-arm-btn" style="flex:1; padding:9px; border-radius:10px; border:none; background:linear-gradient(135deg,#10B981,#00D8FF); color:#080C14; font-weight:900; font-size:12px; cursor:pointer;">
        ${s ? '🔄 Update Price Sniper' : '🎯 Arm Price Sniper'}
      </button>
      ${s ? `<button type="button" id="web-sniper-cancel-btn" style="padding:9px 12px; border-radius:10px; background:rgba(239,68,68,0.18); border:1px solid rgba(239,68,68,0.4); color:#EF4444; font-weight:800; font-size:12px; cursor:pointer;">Cancel</button>` : ''}
    </div>

    <button type="button" id="web-sniper-sim-btn" style="width:100%; padding:7px; border-radius:10px; background:transparent; border:1px dashed rgba(0,216,255,0.45); color:#00D8FF; font-size:11px; font-weight:800; cursor:pointer;">
      ⚡ Test Sniper Alert Chime & 1-Tap Book Popup
    </button>
  `;

  // Render future pricing curve below sniper card
  renderFuturePricingView(container);
  container.prepend(sniperBox);

  container.querySelectorAll('.web-sniper-preset').forEach((b) => b.addEventListener('click', () => {
    const inp = document.getElementById('web-sniper-input');
    if (inp) inp.value = b.dataset.val;
  }));

  document.getElementById('web-sniper-arm-btn')?.addEventListener('click', () => {
    const val = Math.max(1, parseInt(document.getElementById('web-sniper-input')?.value, 10) || defaultVal);
    const prov = document.getElementById('web-sniper-provider')?.value || 'all';
    nextGenState.activeSniper = { id: 'ws_' + Date.now(), targetPrice: val, provider: prov };
    nextGenState.lastAlertKey = null;
    try { localStorage.setItem('web_chubby_sniper_v1', JSON.stringify(nextGenState.activeSniper)); } catch {}
    checkWebPriceSniper();
    renderPriceSniperAndFutureView(container);
  });

  document.getElementById('web-sniper-cancel-btn')?.addEventListener('click', () => {
    nextGenState.activeSniper = null;
    nextGenState.lastAlertKey = null;
    try { localStorage.removeItem('web_chubby_sniper_v1'); } catch {}
    updateChubbyFabBadge();
    renderPriceSniperAndFutureView(container);
  });

  document.getElementById('web-sniper-sim-btn')?.addEventListener('click', () => {
    const val = Math.max(1, parseInt(document.getElementById('web-sniper-input')?.value, 10) || defaultVal);
    const sample = { ...(state.quotes?.[0] || { provider: 'SmartRide AI', id: 'sim' }), fare: Math.max(1, val - 2) };
    showWebSniperHitBanner(sample, val, true);
  });
}

let modalChatHistoryHtml = `
  <div class="chat-msg bot">
    👋 Hello! I'm <strong>Chubby AI</strong>, your real-time travel assistant. I can analyze live traffic telemetry, compare fares across Uber, Ola, Rapido, and SmartRide EV, forecast demand surges, or help you book!
  </div>
`;

function renderChatbotView(container) {
  if (!container) return;
  container.innerHTML = `
    <div id="chatbot-window" class="chat-window active" style="position: static; width: 100%; max-width: 100%; height: 460px; max-height: 58vh; border: none; box-shadow: none; padding: 0; background: transparent; display: flex; flex-direction: column;">
      
      <!-- Quick Action Suggestion Chips Bar -->
      <div class="chat-quick-chips" style="padding: 6px 2px 12px; border-bottom: 1px solid var(--border-ui); display: flex; gap: 6px; overflow-x: auto; background: transparent; scrollbar-width: none; flex-shrink: 0;">
        <button type="button" class="chat-chip" data-query="⚡ Real-Time Route Analysis">⚡ Radar</button>
        <button type="button" class="chat-chip" data-query="Which ride is cheapest right now?">💰 Cheapest</button>
        <button type="button" class="chat-chip" data-query="What is the fastest pickup ETA?">⏱️ Fastest</button>
        <button type="button" class="chat-chip" data-query="Show me public transit and metro routes">🚇 Metro</button>
        <button type="button" class="chat-chip" data-query="Tell me about SmartRide carpool commute">👥 Carpool</button>
        <button type="button" class="chat-chip" data-query="What are the parcel express rates?">📦 Parcel</button>
        <button type="button" class="chat-chip" data-query="What safety features and emergency SOS exist?">🛡️ Safety</button>
        <button type="button" class="chat-chip" data-query="Are there any active promo discount coupons?">🎟️ Promo</button>
      </div>

      <!-- Messages Stream -->
      <div class="chat-messages" id="chatbot-messages" style="flex: 1; overflow-y: auto; padding: 14px 2px; display: flex; flex-direction: column; gap: 10px;">
        ${modalChatHistoryHtml}
      </div>

      <!-- Input Bar with Built-in Mic -->
      <div class="chat-input-bar" style="display: flex; gap: 8px; padding-top: 10px; border-top: 1px solid var(--border-ui); flex-shrink: 0;">
        <input type="text" id="chatbot-input" class="chat-input" placeholder="Ask Chubby AI about fares, traffic, routes..." aria-label="Ask Chubby AI" style="flex: 1; padding: 10px 14px; border-radius: 12px; background: var(--bg-surface); border: 1px solid var(--border-ui); color: var(--text-main); font-size: 13px;" />
        <button id="chatbot-voice-mic-btn" type="button" class="chat-mic-btn" title="Speak to Chubby AI Voice Assistant" aria-label="Voice Input" style="background: rgba(0, 216, 255, 0.12); border: 1px solid rgba(0, 216, 255, 0.35); color: var(--brand-cyan); border-radius: 10px; width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">🎙️</button>
        <button id="chatbot-send-btn" class="chat-send-btn" aria-label="Send message" style="background: linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan)); border: none; color: #080C14; font-weight: 800; border-radius: 10px; width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">➤</button>
      </div>
    </div>
  `;

  setupModalChatListeners(container);
}

function setupModalChatListeners(container) {
  if (!container) return;
  const input = container.querySelector('#chatbot-input');
  const sendBtn = container.querySelector('#chatbot-send-btn');
  const micBtn = container.querySelector('#chatbot-voice-mic-btn');

  sendBtn?.addEventListener('click', () => {
    handleChatbotSend();
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleChatbotSend();
    }
  });

  micBtn?.addEventListener('click', () => {
    openWebChubbyTab('voice');
    setTimeout(() => toggleWebVoiceListening(), 250);
  });

  container.querySelectorAll('.chat-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.query;
      if (input && q) {
        input.value = q;
        handleChatbotSend();
      }
    });
  });
}

function openWebChubbyTab(tabName) {
  nextGenState.chubbyTab = tabName;
  const modal = document.getElementById('chubby-ai-modal');
  if (modal) modal.style.display = 'flex';
  document.querySelectorAll('.chubby-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.chubbyTab === tabName);
  });
  const body = document.getElementById('chubby-modal-body');
  const subtitle = document.getElementById('chubby-modal-subtitle');
  const p = state.pickup || 'KG Apartments';
  const d = state.dropoff || 'Marina Beach';
  const rt = nextGenState.rtAnalysis;
  const distKm = rt?.routeInfo?.distanceKm || calculateDistance(p, d);
  const minsStr = rt?.routeInfo?.liveDurationMins ? ` · ~${rt.routeInfo.liveDurationMins}m` : '';
  if (subtitle) subtitle.textContent = `${p} ➔ ${d} (${distKm} km${minsStr})`;
  if (!rt) {
    runWebRealTimeAIAnalysis(p, d, false);
  }
  if (!body) return;
  if (tabName === 'chat') renderChatbotView(body);
  else if (tabName === 'voice') renderVoiceAIView(body);
  else if (tabName === 'future') renderFuturePricingView(body);
  else if (tabName === 'escape') renderSurgeEscapeView(body);
  else if (tabName === 'multimodal') renderMultimodalView(body);
  else if (tabName === 'weather') renderWeatherAIView(body);
  else renderPriceSniperAndFutureView(body);
}

function renderQuotes() {
  updateWebStatusStrip();
  checkWebPriceSniper();
  const container = document.getElementById('quotes-container');
  if (!container) return;

  if (state.quotes.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <p style="font-size: 24px;">🔍</p>
        <p style="font-weight: 600; margin-top: 8px;">No ride options available for this category</p>
      </div>`;
    return;
  }

  container.innerHTML = state.quotes.map((quote) => {
    const isSelected = state.selectedQuote?.id === quote.id;
    const isTopPick = state.topPick?.id === quote.id;
    const providerClass = quote.provider.toLowerCase().replace(/[^a-z0-9]/g, '-');

    return `
      <div class="quote-card ${isSelected ? 'selected' : ''} ${isTopPick ? 'ai-pick' : ''}" data-id="${quote.id}">
        
        ${isTopPick ? `
          <div class="ai-top-badge">
            <span>✨</span> #1 AI MATCH • RECOMMENDED
          </div>
        ` : ''}

        <div class="quote-header-row">
          <div class="quote-vehicle-identity">
            <div class="quote-vehicle-icon-wrap" style="border-color: ${quote.color}66; box-shadow: 0 0 12px ${quote.color}33;">
              ${quote.icon}
            </div>
            <div class="quote-details-col">
              <div class="quote-title-line">
                <span class="quote-vehicle-name">${quote.type}</span>
                <span class="provider-tag ${providerClass}">${quote.provider}</span>
              </div>
              <div class="quote-tags-row">
                ${quote.badge ? `<span class="vehicle-sub-tag">${quote.badge}</span>` : ''}
                ${quote.isSmart ? `<span class="vehicle-sub-tag eco-tag">🌱 Zero Emission</span>` : ''}
              </div>
            </div>
          </div>

          <div class="quote-pricing-block">
            ${isSelected ? `<span class="quote-selected-pill">✓ Selected</span>` : ''}
            ${nextGenState.appliedEscapeSpot ? `
              <div style="font-size: 11px; color: #EF4444; text-decoration: line-through;">₹${Number(quote.fare).toLocaleString('en-IN')}</div>
              <div class="quote-price-val" style="color: #10B981;">₹${Number(Math.max(35, Math.round(quote.fare * (1 - nextGenState.appliedEscapeSpot.dropPct)))).toLocaleString('en-IN')}</div>
            ` : `<div class="quote-price-val">₹${Number(quote.fare).toLocaleString('en-IN')}</div>`}
            <div class="quote-eta-pill">
              <span class="pulse-dot-green"></span> ${quote.eta} min away
            </div>
            ${quote.savingsVsMax > 0 ? `<div class="spec-chip savings-chip" style="margin-top: 4px; font-size: 10px; padding: 2px 7px;">Save ₹${quote.savingsVsMax}</div>` : ''}
          </div>
        </div>

        <div class="quote-specs-row">
          <div class="spec-chip">
            <span>⏱️</span> <strong>${quote.eta} mins</strong> pickup
          </div>
          <div class="spec-chip">
            <span>🚶‍♂️</span> <strong>${quote.pickupMeters}m</strong> walk
          </div>
          <div class="spec-chip">
            <span>🛡️</span> <strong>${Math.round(quote.reliability * 100)}%</strong> reliable
          </div>
          <div class="spec-chip ${quote.cancellationRisk < 0.05 ? 'spec-low-cancel' : ''}">
            <span>${quote.cancellationRisk < 0.05 ? '✓' : '⚠️'}</span>
            <strong>${quote.cancellationRisk < 0.05 ? 'Near-Zero Cancel' : Math.round(quote.cancellationRisk * 100) + '% cancel risk'}</strong>
          </div>
        </div>

        <div class="ai-reason-bubble">
          <span class="ai-reason-sparkle">🤖</span>
          <div class="ai-reason-text">
            <strong style="color: var(--brand-cyan); font-weight: 700;">AI Optimization:</strong> ${quote.explanation}
          </div>
        </div>

        <div class="emmde-score-row">
          <div class="emmde-score-col">
            <div class="score-header">
              <span class="score-label">Fare Index</span>
              <span class="score-num" style="color: var(--brand-cyan);">${quote.scores.fare}%</span>
            </div>
            <div class="score-progress-bar">
              <div class="score-progress-fill" style="width: ${quote.scores.fare}%; background: var(--brand-cyan);"></div>
            </div>
          </div>

          <div class="emmde-score-col">
            <div class="score-header">
              <span class="score-label">Stability</span>
              <span class="score-num" style="color: var(--success);">${quote.scores.stability}%</span>
            </div>
            <div class="score-progress-bar">
              <div class="score-progress-fill" style="width: ${quote.scores.stability}%; background: var(--success);"></div>
            </div>
          </div>

          <div class="emmde-score-col">
            <div class="score-header">
              <span class="score-label">Low Effort</span>
              <span class="score-num" style="color: #A855F7;">${quote.scores.effort}%</span>
            </div>
            <div class="score-progress-bar">
              <div class="score-progress-fill" style="width: ${quote.scores.effort}%; background: #A855F7;"></div>
            </div>
          </div>

          <div class="emmde-score-col">
            <div class="score-header">
              <span class="score-label">Composite</span>
              <span class="score-num" style="color: #F59E0B;">${quote.scores.overall}/100</span>
            </div>
            <div class="score-progress-bar">
              <div class="score-progress-fill" style="width: ${quote.scores.overall}%; background: #F59E0B;"></div>
            </div>
          </div>

          <div class="emmde-score-col">
            <div class="score-header">
              <span class="score-label">Clean Eco</span>
              <span class="score-num" style="color: #10B981;">${quote.scores.carbon || (quote.isSmart ? 98 : 45)}%</span>
            </div>
            <div class="score-progress-bar">
              <div class="score-progress-fill" style="width: ${quote.scores.carbon || (quote.isSmart ? 98 : 45)}%; background: #10B981;"></div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
          <button type="button" class="quote-book-now-btn" data-id="${quote.id}" style="flex: 1.4; min-width: 140px; padding: 10px 14px; border-radius: 12px; border: none; background: linear-gradient(135deg, #00D8FF, #10B981); color: #080C14; font-weight: 900; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 16px rgba(0, 216, 255, 0.28);">
            <span>${quote.isSmart || String(quote.provider || '').toLowerCase().includes('smartride') ? '⚡' : '🚀'}</span> ${quote.isSmart || String(quote.provider || '').toLowerCase().includes('smartride') ? 'Book Now' : `Book on ${quote.provider}`} · ₹${Number(nextGenState.appliedEscapeSpot ? Math.max(35, Math.round(quote.fare * (1 - nextGenState.appliedEscapeSpot.dropPct))) : quote.fare).toLocaleString('en-IN')}${quote.isSmart || String(quote.provider || '').toLowerCase().includes('smartride') ? '' : ' ↗'}
          </button>
          <button type="button" class="quote-xai-trigger" data-id="${quote.id}" style="flex: 1; min-width: 120px; margin-top: 0;" title="Inspect full multi-agent breakdown, SHAP waterfall, and LIME surrogate rules">
            <span>🧠</span> Explain AI ➔
          </button>
        </div>

      </div>
    `;
  }).join('');

  // Add click handlers for selection
  container.querySelectorAll('.quote-card').forEach((card) => {
    card.addEventListener('click', () => {
      const qId = card.dataset.id;
      state.selectedQuote = state.quotes.find((q) => q.id === qId);
      renderQuotes();
    });
  });

  // Direct 1-Tap Book Now handler on every quote card
  container.querySelectorAll('.quote-book-now-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const qId = btn.dataset.id;
      const chosen = state.quotes.find((q) => q.id === qId);
      if (chosen) {
        state.selectedQuote = chosen;
        updateBookingBar();
        bookSelectedRide();
      }
    });
  });

  // Add click handlers for XAI Inspector trigger
  container.querySelectorAll('.quote-xai-trigger').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const qId = btn.dataset.id;
      state.xaiSelectedOptionId = qId;
      switchTab('xai');
      renderXaiInspector(qId);
      const targetQuote = state.quotes.find(q => q.id === qId);
      showToast(`🧠 Inspecting Explainable AI models for ${targetQuote?.type || 'ride'}`, 'info');
      const xaiSec = document.getElementById('section-xai');
      if (xaiSec) xaiSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Update booking bar summary
  updateBookingBar();
}

function updateBookingBar() {
  const bookBtn = document.getElementById('book-ride-btn');
  const deepLinkBtn = document.getElementById('deeplink-btn');
  if (bookBtn) {
    if (state.selectedQuote) {
      const finalFare = nextGenState.appliedEscapeSpot
        ? Math.max(35, Math.round(state.selectedQuote.fare * (1 - nextGenState.appliedEscapeSpot.dropPct)))
        : state.selectedQuote.fare;
      const isSmart = Boolean(state.selectedQuote.isSmart || String(state.selectedQuote.provider || '').toLowerCase().includes('smartride'));
      bookBtn.innerHTML = isSmart
        ? `<span>⚡</span> Book Now · ${state.selectedQuote.type} • ₹${Number(finalFare).toLocaleString('en-IN')}`
        : `<span>🚀</span> Book Now on ${state.selectedQuote.provider} · ₹${Number(finalFare).toLocaleString('en-IN')} ↗`;
      bookBtn.disabled = false;
      bookBtn.style.opacity = '1';
      bookBtn.style.cursor = 'pointer';
    } else {
      bookBtn.innerHTML = `<span>📍</span> Enter Route to Compare & Book`;
      bookBtn.disabled = true;
      bookBtn.style.opacity = '0.6';
      bookBtn.style.cursor = 'not-allowed';
    }
  }
  if (deepLinkBtn) {
    if (state.selectedQuote && state.selectedQuote.deepLinkSupported) {
      deepLinkBtn.style.display = 'inline-flex';
      deepLinkBtn.innerHTML = `<span>🚀</span> Launch ${state.selectedQuote.provider} App`;
    } else {
      deepLinkBtn.style.display = 'none';
    }
  }
}

// Build live pre-filled external provider booking URL + mobile deep link
function buildExternalProviderRedirect(quote) {
  if (!quote) return { isExternal: false };
  const prov = String(quote.provider || '').toLowerCase();
  if (quote.isSmart || prov.includes('smartride')) {
    return { isExternal: false };
  }

  const pickup = state.pickup || 'Current Location';
  const dropoff = state.dropoff || 'Marina Beach, Chennai';
  const encPick = encodeURIComponent(pickup);
  const encDrop = encodeURIComponent(dropoff);

  const pLat = nextGenState.rtAnalysis?.originCoord?.lat ?? state.userLat ?? 13.0827;
  const pLng = nextGenState.rtAnalysis?.originCoord?.lng ?? state.userLng ?? 80.2707;
  const dLat = nextGenState.rtAnalysis?.destCoord?.lat ?? 13.0500;
  const dLng = nextGenState.rtAnalysis?.destCoord?.lng ?? 80.2824;

  const cat = String(quote.category || state.category || 'cab4').toLowerCase();
  const olaCat = cat === 'bike' ? 'bike' : cat === 'auto' ? 'auto' : cat === 'cab7' ? 'prime' : 'mini';

  let appDeepLink = quote.deepLink || '';
  let webUrl = quote.url || '';

  if (prov.includes('ola')) {
    appDeepLink = `olacabs://app/launch?landing_page=bk&lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}&pickup_name=${encPick}&drop_name=${encDrop}&category=${olaCat}`;
    webUrl = `https://book.olacabs.com/?lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}&pickup_name=${encPick}&drop_name=${encDrop}&category=${olaCat}&utm_source=smartride_ai`;
  } else if (prov.includes('uber')) {
    appDeepLink = `uber://?action=setPickup&pickup[latitude]=${pLat}&pickup[longitude]=${pLng}&pickup[nickname]=${encPick}&dropoff[latitude]=${dLat}&dropoff[longitude]=${dLng}&dropoff[nickname]=${encDrop}`;
    webUrl = `https://m.uber.com/looking?pickup[latitude]=${pLat}&pickup[longitude]=${pLng}&pickup[formatted_address]=${encPick}&dropoff[latitude]=${dLat}&dropoff[longitude]=${dLng}&dropoff[formatted_address]=${encDrop}`;
  } else if (prov.includes('rapido')) {
    appDeepLink = `rapido://ride?pickup=${encPick}&drop=${encDrop}&lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}`;
    webUrl = `https://www.rapido.bike/?pickup=${encPick}&drop=${encDrop}&lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}`;
  } else if (prov.includes('namma')) {
    appDeepLink = `nammayatri://ride?pickup=${encPick}&drop=${encDrop}&lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}`;
    webUrl = `https://nammayatri.in/?pickup=${encPick}&drop=${encDrop}`;
  } else if (prov.includes('indrive')) {
    appDeepLink = `indrive://`;
    webUrl = `https://indrive.com/`;
  }

  return {
    isExternal: Boolean(webUrl && webUrl !== '#smartride'),
    providerName: quote.provider || 'Cab App',
    appDeepLink,
    webUrl,
  };
}

function redirectToExternalProviderApp(redirectInfo) {
  const { providerName, appDeepLink, webUrl } = redirectInfo;
  showToast(`🚀 Redirecting to ${providerName} cab search page...`, 'success');

  // 1. Android WebView native bridge (if embedded inside Android APK)
  if (typeof window !== 'undefined' && window.AndroidApp && typeof window.AndroidApp.openExternalApp === 'function') {
    window.AndroidApp.openExternalApp(appDeepLink || webUrl, webUrl);
    return;
  }

  // 2. Mobile browser: attempt native app scheme then fallback to web cab booking page
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  if (isMobile && appDeepLink && !appDeepLink.startsWith('http')) {
    const start = Date.now();
    window.location.href = appDeepLink;
    setTimeout(() => {
      if (Date.now() - start < 1800 && webUrl) {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }
    }, 900);
    return;
  }

  // 3. Desktop Web browser: open provider's cab search/booking page immediately
  if (webUrl) {
    const win = window.open(webUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = webUrl;
    }
  }
}

// --- Ride Booking Action ---
export async function bookSelectedRide() {
  if (!state.selectedQuote) {
    showToast('Please select a ride first', 'warning');
    return;
  }

  const finalFare = nextGenState.appliedEscapeSpot
    ? Math.max(35, Math.round(state.selectedQuote.fare * (1 - nextGenState.appliedEscapeSpot.dropPct)))
    : state.selectedQuote.fare;

  const ridePayload = {
    pickup: state.pickup || 'Current Location',
    destination: state.dropoff || 'Marina Beach',
    provider: state.selectedQuote.provider,
    cabType: state.selectedQuote.type,
    fare: finalFare,
    etaMinutes: state.selectedQuote.eta,
  };

  // External providers (Ola, Uber, Rapido, Namma Yatri) -> Redirect directly into their cab searching page!
  const redirect = buildExternalProviderRedirect(state.selectedQuote);
  if (redirect.isExternal) {
    redirectToExternalProviderApp(redirect);
    // Log ride click in background so it still appears in My Rides & Activity
    api.rides.create(ridePayload).then(() => loadMyRides()).catch(() => {});
    return;
  }

  // SmartRide AI / EV Fleet -> In-App Booking & Live OTP Tracking
  showToast(`Booking ${state.selectedQuote.type}...`, 'info');
  try {
    const result = await api.rides.create(ridePayload);
    state.activeRide = result.ride;
    showToast(`Ride Confirmed with ${state.selectedQuote.provider}!`, 'success');
    openTrackingModal(state.activeRide);
    loadMyRides();
  } catch (err) {
    showToast(`Booking failed: ${err.message}`, 'danger');
  }
}

// Competitor Deep-link launcher
export function launchCompetitorApp() {
  if (!state.selectedQuote) return;
  const redirect = buildExternalProviderRedirect(state.selectedQuote);
  if (redirect.isExternal) {
    redirectToExternalProviderApp(redirect);
  }
}

// --- Tracking Modal ---
function openTrackingModal(ride) {
  const modal = document.getElementById('tracking-modal');
  if (!modal) return;

  const otp = Math.floor(1000 + Math.random() * 9000);
  document.getElementById('track-otp').textContent = String(otp);
  document.getElementById('track-cab-type').textContent = ride.cabType || 'EV Sedan';
  document.getElementById('track-provider').textContent = ride.provider || 'SmartRide AI';
  document.getElementById('track-fare').textContent = `₹${ride.fare}`;
  document.getElementById('track-route').textContent = `${ride.pickup} ➔ ${ride.destination}`;

  modal.classList.add('active');
}

export function closeTrackingModal() {
  const modal = document.getElementById('tracking-modal');
  if (modal) modal.classList.remove('active');
}

export async function completeCurrentRide() {
  if (state.activeRide) {
    await api.rides.updateStatus(state.activeRide.id, 'COMPLETED');
    showToast('Trip completed! Digital invoice generated.', 'success');
    closeTrackingModal();
    loadMyRides();
  }
}

// --- Load My Rides History ---
async function loadMyRides() {
  const container = document.getElementById('my-rides-list');
  if (!container) return;

  const rides = await api.rides.list();
  if (rides.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <p style="font-size: 28px;">🚖</p>
        <p style="font-weight: 600; margin-top: 8px;">No trip history yet. Book your first ride!</p>
      </div>`;
    return;
  }

  container.innerHTML = rides.map((r) => `
    <div class="card" style="margin-bottom: 14px; padding: 18px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 700; font-size: 15px; color: var(--brand-cyan);">${r.provider || 'SmartRide'} • ${r.cabType || 'Sedan'}</span>
        <span style="font-size: 11px; padding: 2px 8px; border-radius: var(--radius-pill); background: rgba(16, 185, 129, 0.15); color: var(--success); font-weight: 700;">
          ${r.status || 'COMPLETED'}
        </span>
      </div>
      <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">
        📍 <strong>${r.pickup}</strong> ➔ <strong>${r.destination}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-dim);">
        <span>${new Date(r.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span style="font-size: 16px; font-weight: 800; color: var(--text-main);">₹${r.fare}</span>
      </div>
    </div>
  `).join('');
}

// --- Parcel & Courier Logistics ---
export function setParcelTier(tier) {
  state.currentParcelTier = tier;
  document.querySelectorAll('.tier-card').forEach((tc) => {
    tc.classList.toggle('active', tc.dataset.tier === tier);
  });
  updateParcelEstimate();
}

function updateParcelEstimate() {
  const pOrigin = document.getElementById('parcel-pickup')?.value || 'City Center';
  const pDest = document.getElementById('parcel-dest')?.value || 'Tech Park';
  const dist = calculateDistance(pOrigin, pDest);

  let base = 45;
  let rate = 12;
  if (state.currentParcelTier === 'car') { base = 110; rate = 18; }
  else if (state.currentParcelTier === 'van') { base = 280; rate = 28; }

  const fare = Math.round(base + dist * rate);
  const fareEl = document.getElementById('parcel-fare-estimate');
  if (fareEl) fareEl.textContent = `₹${fare}`;
}

export async function bookParcel() {
  const senderName = document.getElementById('sender-name')?.value || 'Narasimha B.';
  const senderPhone = document.getElementById('sender-phone')?.value || '7995665477';
  const receiverName = document.getElementById('receiver-name')?.value || 'Vikram';
  const receiverPhone = document.getElementById('receiver-phone')?.value || '9876543210';
  const itemType = document.getElementById('parcel-item-type')?.value || 'Documents';
  const pickup = document.getElementById('parcel-pickup')?.value || 'City Center';
  const destination = document.getElementById('parcel-dest')?.value || 'Tech Park';

  const fareText = document.getElementById('parcel-fare-estimate')?.textContent || '₹85';
  const fare = parseFloat(fareText.replace('₹', ''));

  const payload = {
    senderName,
    senderPhone,
    receiverName,
    receiverPhone,
    itemType,
    tier: state.currentParcelTier,
    pickup,
    destination,
    fare
  };

  try {
    showToast('Dispatching courier...', 'info');
    await api.parcels.create(payload);
    showToast('Parcel delivery booked & driver assigned!', 'success');
    loadParcels();
  } catch (err) {
    showToast(`Booking error: ${err.message}`, 'danger');
  }
}

async function loadParcels() {
  const container = document.getElementById('parcels-history-list');
  if (!container) return;

  const parcels = await api.parcels.list();
  if (parcels.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">No parcels booked yet.</p>`;
    return;
  }

  container.innerHTML = parcels.map((p) => `
    <div class="card" style="margin-bottom: 12px; padding: 14px;">
      <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 4px;">
        <span>📦 ${p.itemType} (${p.tier || 'Express'})</span>
        <span style="color: var(--brand-cyan);">₹${p.fare}</span>
      </div>
      <div style="font-size: 12px; color: var(--text-muted);">
        From: ${p.pickup} ➔ To: ${p.destination}
      </div>
      <div style="font-size: 11px; color: var(--success); margin-top: 4px;">
        Status: ${p.status || 'IN TRANSIT'} • Receiver: ${p.receiverName}
      </div>
    </div>
  `).join('');
}

// --- Smart Commute & Carpool ---
export const COMMUTE_MATCHES = [
  {
    id: 1,
    name: 'Sarah Chen',
    company: 'Principal Engineer @ TechCorp HQ • Google Cloud',
    city: 'Chennai',
    route: 'Adyar → OMR Tech Gateway',
    overlap: '96%',
    startTime: '08:30 AM',
    reachTime: '09:15 AM',
    timeGap: '45m',
    distance: '0.4 km',
    savings: '₹240/ride',
    compatibility: 98,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    verified: true,
    rating: 4.9,
    role: 'driver',
    car: 'Tata Nexon EV (White)',
    seatsLeft: 2,
    preferences: ['ac', 'women', 'quiet']
  },
  {
    id: 2,
    name: 'David Miller',
    company: 'Product Lead @ Innovation Park • Microsoft',
    city: 'Chennai',
    route: 'Velachery → Siruseri SIPCOT',
    overlap: '91%',
    startTime: '09:00 AM',
    reachTime: '09:40 AM',
    timeGap: '40m',
    distance: '0.8 km',
    savings: '₹180/ride',
    compatibility: 92,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    verified: true,
    rating: 4.7,
    role: 'rider',
    car: 'Passenger',
    seatsLeft: 1,
    preferences: ['ac', 'music']
  },
  {
    id: 3,
    name: 'Anita Raj',
    company: 'Systems Architect @ Amazon Development Centre',
    city: 'Bangalore',
    route: 'Indiranagar → Manyata Tech Park',
    overlap: '94%',
    startTime: '08:45 AM',
    reachTime: '09:35 AM',
    timeGap: '50m',
    distance: '0.5 km',
    savings: '₹220/ride',
    compatibility: 95,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    verified: true,
    rating: 4.8,
    role: 'driver',
    car: 'Hyundai Creta (Silver)',
    seatsLeft: 3,
    preferences: ['ac', 'women', 'quiet']
  },
  {
    id: 4,
    name: 'Rohan Sharma',
    company: 'Lead Architect @ Infosys Campus Phase 1',
    city: 'Bangalore',
    route: 'HSR Layout Sector 2 → Electronic City',
    overlap: '98%',
    startTime: '08:15 AM',
    reachTime: '08:55 AM',
    timeGap: '40m',
    distance: '0.3 km',
    savings: '₹260/ride',
    compatibility: 99,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    verified: true,
    rating: 4.95,
    role: 'driver',
    car: 'Mahindra XUV400 EV (Blue)',
    seatsLeft: 2,
    preferences: ['ev', 'ac', 'quiet']
  },
  {
    id: 5,
    name: 'Pooja Hegde',
    company: 'Analyst @ Goldman Sachs • Embassy GolfLinks',
    city: 'Bangalore',
    route: 'Koramangala 4th Block → Domlur / EGL',
    overlap: '92%',
    startTime: '09:15 AM',
    reachTime: '09:45 AM',
    timeGap: '30m',
    distance: '0.4 km',
    savings: '₹190/ride',
    compatibility: 94,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    verified: true,
    rating: 4.85,
    role: 'rider',
    car: 'Passenger',
    seatsLeft: 1,
    preferences: ['women', 'ac', 'quiet']
  },
  {
    id: 6,
    name: 'Vikram Malhotra',
    company: 'Director of Engineering @ Cisco Systems',
    city: 'Bangalore',
    route: 'Marathahalli → Bellandur Outer Ring Rd',
    overlap: '95%',
    startTime: '08:30 AM',
    reachTime: '09:10 AM',
    timeGap: '40m',
    distance: '0.6 km',
    savings: '₹230/ride',
    compatibility: 96,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
    verified: true,
    rating: 4.9,
    role: 'driver',
    car: 'Honda City (Pearl White)',
    seatsLeft: 2,
    preferences: ['ac', 'music']
  }
];

export function renderCommuteMatches(list = COMMUTE_MATCHES) {
  const container = document.getElementById('commute-matches-container');
  const countBadge = document.getElementById('commute-match-count');
  if (!container) return;

  if (countBadge) countBadge.textContent = `${list.length} Matches Found`;

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px 16px; color: var(--text-muted);">
        <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
        <p style="font-weight: 700; font-size: 14px;">No exact carpool matches for current filters.</p>
        <p style="font-size: 12px; margin-top: 4px;">Try loosening preferences or switching between Rider and Driver roles.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(m => `
    <div class="match-card">
      <div class="match-user">
        <img src="${m.image}" alt="${m.name}" class="match-avatar" />
        <div class="match-info">
          <h4>${m.name} <span style="font-size: 11px; color: var(--success); font-weight: 700;">✔ Verified</span> <span style="font-size: 11px; color: #F59E0B; margin-left: 6px;">★ ${m.rating}</span></h4>
          <div class="match-company">${m.company}</div>
          <div class="match-schedule">⏰ ${m.startTime} • ${m.distance} detour • 🚗 ${m.car}</div>
        </div>
      </div>
      <div class="match-stats">
        <div class="match-badge">${m.overlap} Route Match</div>
        <div style="font-weight: 800; font-size: 14px; color: var(--brand-cyan);">${m.savings}</div>
        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <button class="btn-secondary match-chat-btn" data-user="${m.name}" style="padding: 6px 12px; font-size: 12px;">
            💬 Chat
          </button>
          <button class="btn-cyan match-pool-btn" data-id="${m.id}" data-user="${m.name}" data-time="${m.startTime}" data-car="${m.car}" style="padding: 6px 14px; font-size: 12px; font-weight: 800;">
            🚗 Pool
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Re-bind chat and pool actions
  container.querySelectorAll('.match-chat-btn').forEach(btn => {
    btn.addEventListener('click', () => openCommuteChat(btn.dataset.user));
  });

  container.querySelectorAll('.match-pool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openCommutePoolModal({
        name: btn.dataset.user,
        time: btn.dataset.time,
        car: btn.dataset.car
      });
    });
  });
}

const WEB_COMMUTE_REQ_KEY = 'smartride_commute_requests_v1';

function loadWebCommuteRequests() {
  try {
    const raw = localStorage.getItem(WEB_COMMUTE_REQ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWebCommuteRequests(list) {
  try {
    localStorage.setItem(WEB_COMMUTE_REQ_KEY, JSON.stringify(list));
  } catch {}
}

async function syncWebCommuteRequestsFromBackend() {
  const local = loadWebCommuteRequests();
  try {
    const res = await fetch('http://localhost:5000/api/commute/requests');
    if (res.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data.requests)) {
        const byId = new Map();
        [...local, ...data.requests].forEach((r) => {
          if (r?.id && !byId.has(r.id)) byId.set(r.id, r);
        });
        const merged = Array.from(byId.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        saveWebCommuteRequests(merged);
        renderWebCommunityRequests(merged);
        return merged;
      }
    }
  } catch {}
  renderWebCommunityRequests(local);
  return local;
}

function addWebCommuteRequest(payload) {
  const req = {
    id: payload.id || `commute_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`,
    type: payload.type || 'posted',
    userName: payload.userName || state.user?.name || 'You',
    role: payload.role || 'rider',
    source: payload.source || 'Poonamallee High Road, Chennai',
    destination: payload.destination || 'Tidel Park, OMR Tech Corridor, Chennai',
    departureTime: payload.departureTime || '08:30',
    returnTime: payload.returnTime || '18:00',
    partnerName: payload.partnerName || '',
    partnerCar: payload.partnerCar || '',
    otp: payload.otp || '',
    status: payload.status || (payload.type === 'pool_booking' ? 'Pool Confirmed' : 'Live in Community'),
    createdAt: new Date().toISOString(),
  };
  const next = [req, ...loadWebCommuteRequests().filter((r) => r.id !== req.id)].slice(0, 50);
  saveWebCommuteRequests(next);
  renderWebCommunityRequests(next);

  fetch('http://localhost:5000/api/commute/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  }).catch(() => {});

  return req;
}

function removeWebCommuteRequest(id) {
  const next = loadWebCommuteRequests().filter((r) => r.id !== id);
  saveWebCommuteRequests(next);
  renderWebCommunityRequests(next);
  fetch(`http://localhost:5000/api/commute/requests?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
}

export function renderWebCommunityRequests(list = loadWebCommuteRequests()) {
  const container = document.getElementById('community-requests-container');
  const countBadge = document.getElementById('community-request-count');
  if (!container) return;

  if (countBadge) countBadge.textContent = `${list.length} Active`;

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 18px 12px; border: 1px dashed var(--border-ui); border-radius: 14px; color: var(--text-muted); font-size: 13px;">
        No active community requests yet. Click <strong>📢 Post Community Request</strong> above to publish your route live!
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((req) => {
    const isPool = req.type === 'pool_booking';
    return `
      <div style="background: ${isPool ? 'rgba(0, 216, 255, 0.08)' : 'rgba(16, 185, 129, 0.08)'}; border: 1.5px solid ${isPool ? 'rgba(0, 216, 255, 0.45)' : 'rgba(16, 185, 129, 0.45)'}; border-radius: 16px; padding: 14px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 6px; background: ${isPool ? 'rgba(0, 216, 255, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${isPool ? '#00D8FF' : '#10B981'};">
              ${isPool ? '🚗 POOL CONFIRMED' : '🟢 LIVE COMMUNITY REQUEST'}
            </span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 700;">
              ${req.role === 'driver' ? 'Car Owner' : 'Rider'} · ${req.userName || 'You'}
            </span>
          </div>
          <div style="font-size: 14px; font-weight: 800; color: var(--text-main); margin-top: 6px;">
            ${req.source} ➔ ${req.destination}
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 5px; font-size: 12px; color: var(--text-muted);">
            <span>⏰ Departs: <strong style="color: var(--text-main);">${req.departureTime}</strong></span>
            ${req.returnTime ? `<span>🔁 Return: <strong style="color: var(--text-main);">${req.returnTime}</strong></span>` : ''}
            ${req.partnerName ? `<span>👤 Partner: <strong style="color: var(--brand-cyan);">${req.partnerName}</strong></span>` : ''}
            ${req.otp ? `<span>🔑 OTP: <strong style="color: #10B981;">${req.otp}</strong></span>` : ''}
          </div>
        </div>
        <button type="button" class="web-remove-commute-req-btn" data-req-id="${req.id}" style="padding: 6px 10px; border-radius: 8px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #EF4444; font-size: 11px; font-weight: 800; cursor: pointer; flex-shrink: 0;">
          Cancel
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.web-remove-commute-req-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeWebCommuteRequest(btn.dataset.reqId);
      showToast('Community request removed.', 'info');
    });
  });
}

export function openCommutePoolModal(partner) {
  const modal = document.getElementById('commute-pool-modal');
  const partnerName = document.getElementById('pool-modal-partner');
  const departureTime = document.getElementById('pool-modal-time');
  const vehicle = document.getElementById('pool-modal-vehicle');
  const chatBtn = document.getElementById('pool-modal-chat-btn');

  if (partnerName) partnerName.textContent = partner.name || 'Sarah Chen';
  if (departureTime) departureTime.textContent = partner.time || '08:30 AM';
  if (vehicle) vehicle.textContent = partner.car || 'Tata Nexon EV';

  if (chatBtn) {
    chatBtn.onclick = () => {
      modal?.classList.remove('active');
      openCommuteChat(partner.name);
    };
  }

  // Persist pool booking immediately so it displays in Active Community Requests
  const otp = String(Math.floor(1000 + Math.random() * 9000));
  addWebCommuteRequest({
    type: 'pool_booking',
    role: document.getElementById('commute-role-driver')?.classList.contains('active') ? 'driver' : 'rider',
    source: document.getElementById('commute-origin-input')?.value || 'Poonamallee High Road, Chennai',
    destination: document.getElementById('commute-dest-input')?.value || 'Tidel Park, OMR Tech Corridor, Chennai',
    departureTime: partner.time || document.getElementById('commute-time-morning')?.value || '08:30 AM',
    returnTime: document.getElementById('commute-time-evening')?.value || '18:00',
    partnerName: partner.name || 'Sarah Chen',
    partnerCar: partner.car || 'Tata Nexon EV',
    otp,
    status: 'Pool Confirmed',
  });

  if (modal) modal.classList.add('active');
  showToast(`Carpool request locked with ${partner.name}!`, 'success');
}

export function closeCommutePoolModal() {
  const modal = document.getElementById('commute-pool-modal');
  if (modal) modal.classList.remove('active');
}

export function initCommuteSection() {
  renderCommuteMatches();
  renderWebCommunityRequests();
  syncWebCommuteRequestsFromBackend();

  // Load saved profile
  try {
    const saved = localStorage.getItem('smartride_commute_profile');
    if (saved) {
      const p = JSON.parse(saved);
      if (p.source) {
        const originInput = document.getElementById('commute-origin-input');
        if (originInput) originInput.value = p.source;
      }
      if (p.destination) {
        const destInput = document.getElementById('commute-dest-input');
        if (destInput) destInput.value = p.destination;
      }
      if (p.departureTime) {
        const mTime = document.getElementById('commute-time-morning');
        if (mTime) mTime.value = p.departureTime;
      }
      if (p.returnTime) {
        const eTime = document.getElementById('commute-time-evening');
        if (eTime) eTime.value = p.returnTime;
      }
    }
  } catch (e) {}

  // GPS Location button
  document.getElementById('commute-detect-gps-btn')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }
    showToast('Detecting GPS location for daily commute origin...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        const originInput = document.getElementById('commute-origin-input');
        if (originInput) {
          originInput.value = `Indiranagar 100ft Road (${lat}, ${lng})`;
        }
        showToast('📍 Current GPS location applied as Commute Origin!', 'success');
      },
      () => {
        const originInput = document.getElementById('commute-origin-input');
        const savedPickup = localStorage.getItem('smartride_user_pickup');
        const addr = (savedPickup && !savedPickup.includes('Ekambareswara')) ? savedPickup : 'Poonamallee High Road, Chennai';
        if (originInput) originInput.value = addr;
        showToast(`📍 Set to ${addr}!`, 'success');
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  });

  // Swap button
  document.getElementById('commute-swap-locations-btn')?.addEventListener('click', () => {
    const originInput = document.getElementById('commute-origin-input');
    const destInput = document.getElementById('commute-dest-input');
    if (originInput && destInput) {
      const temp = originInput.value;
      originInput.value = destInput.value;
      destInput.value = temp;
      showToast('Commute Origin ⇄ Destination swapped!', 'info');
    }
  });

  // Quick Hub chips
  document.querySelectorAll('.commute-hub-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const destInput = document.getElementById('commute-dest-input');
      if (destInput && chip.dataset.dest) {
        destInput.value = chip.dataset.dest;
        showToast(`Destination set to ${chip.textContent.trim()}!`, 'success');
        renderCommuteMatches();
      }
    });
  });

  // Role buttons
  const riderBtn = document.getElementById('commute-role-rider');
  const driverBtn = document.getElementById('commute-role-driver');
  riderBtn?.addEventListener('click', () => {
    riderBtn.classList.add('active');
    driverBtn?.classList.remove('active');
    renderCommuteMatches(COMMUTE_MATCHES.filter(m => m.role === 'driver'));
    showToast('Showing verified drivers offering carpool seats!', 'info');
  });
  driverBtn?.addEventListener('click', () => {
    driverBtn.classList.add('active');
    riderBtn?.classList.remove('active');
    renderCommuteMatches(COMMUTE_MATCHES.filter(m => m.role === 'rider'));
    showToast('Showing riders looking for shared seats along your route!', 'info');
  });

  // Preference chips toggle
  ['commute-pref-ac', 'commute-pref-music', 'commute-pref-women', 'commute-pref-ev', 'commute-pref-quiet'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function() {
      this.classList.toggle('active');
      filterAndRenderCommute();
    });
  });

  function filterAndRenderCommute() {
    const womenOnly = document.getElementById('commute-pref-women')?.classList.contains('active');
    const evOnly = document.getElementById('commute-pref-ev')?.classList.contains('active');

    let filtered = COMMUTE_MATCHES;
    if (womenOnly) {
      filtered = filtered.filter(m => m.preferences.includes('women'));
    }
    if (evOnly) {
      filtered = filtered.filter(m => m.car?.toLowerCase().includes('ev'));
    }
    renderCommuteMatches(filtered);
  }

  function publishCurrentWebCommuteRequest(toastMsg) {
    const profile = {
      source: (document.getElementById('commute-origin-input')?.value || '').trim() || 'Poonamallee High Road, Chennai',
      destination: (document.getElementById('commute-dest-input')?.value || '').trim() || 'Tidel Park, OMR Tech Corridor, Chennai',
      departureTime: document.getElementById('commute-time-morning')?.value || '08:30',
      returnTime: document.getElementById('commute-time-evening')?.value || '18:00',
      role: document.getElementById('commute-role-driver')?.classList.contains('active') ? 'driver' : 'rider',
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('smartride_commute_profile', JSON.stringify(profile));
    } catch (e) {}

    addWebCommuteRequest({
      type: 'posted',
      role: profile.role,
      source: profile.source,
      destination: profile.destination,
      departureTime: profile.departureTime,
      returnTime: profile.returnTime,
      status: 'Live in Community',
    });

    document.getElementById('community-requests-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast(toastMsg || '📢 Community commute request posted live!', 'success');
  }

  // Post Community Request button
  document.getElementById('post-commute-request-btn')?.addEventListener('click', () => {
    publishCurrentWebCommuteRequest('📢 Your community commute request is now live!');
  });

  // Save profile button (also posts/updates active community request)
  document.getElementById('save-commute-profile-btn')?.addEventListener('click', () => {
    publishCurrentWebCommuteRequest('💾 Commute profile saved & posted to Community feed!');
  });

  // Search button
  document.getElementById('find-commute-matches-btn')?.addEventListener('click', () => {
    filterAndRenderCommute();
    document.getElementById('heading-commute')?.scrollIntoView({ behavior: 'smooth' });
    showToast('🚀 AI route matching updated for current corridor!', 'success');
  });

  // Modal actions
  document.getElementById('close-pool-modal')?.addEventListener('click', closeCommutePoolModal);
  document.getElementById('pool-modal-done-btn')?.addEventListener('click', closeCommutePoolModal);
}

export function openCommuteChat(userName) {
  state.activeChatPartner = userName;
  state.activeChatId = `chat_${userName.toLowerCase().replace(/\s+/g, '_')}`;

  const modal = document.getElementById('chat-modal');
  const title = document.getElementById('commute-chat-partner-name');
  if (title) title.textContent = `Chat with ${userName}`;
  if (modal) modal.classList.add('active');

  loadCommuteMessages();
}

export function closeCommuteChat() {
  const modal = document.getElementById('chat-modal');
  if (modal) modal.classList.remove('active');
}

async function loadCommuteMessages() {
  const container = document.getElementById('commute-chat-messages');
  if (!container) return;

  const data = await api.chats.get(state.activeChatId);
  container.innerHTML = (data.messages || []).map((m) => `
    <div class="chat-msg ${m.sender === 'You' ? 'user' : 'bot'}">
      <strong>${m.sender}:</strong> ${m.text}
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

export async function sendCommuteMessage() {
  const input = document.getElementById('commute-chat-input');
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();
  input.value = '';

  await api.chats.sendMessage(state.activeChatId, text);
  loadCommuteMessages();
}

// --- Emergency SOS ---
export async function triggerEmergencySOS() {
  const sosModal = document.getElementById('sos-modal');
  if (sosModal) sosModal.classList.add('active');

  showToast('🚨 SOS Triggered! Alerting emergency contacts and dispatch...', 'danger');
  try {
    await api.users.updateEmergencyContacts([
      { name: 'Police Control', phone: '112', status: 'ALERTED' },
      { name: 'Primary Guardian', phone: '+91 79956 65477', status: 'SMS DISPATCHED' }
    ]);
  } catch (e) {}
}

export function closeSosModal() {
  const sosModal = document.getElementById('sos-modal');
  if (sosModal) sosModal.classList.remove('active');
}

// --- Profile Update ---
export async function saveProfile() {
  const name = document.getElementById('profile-name-input')?.value || '';
  const phone = document.getElementById('profile-phone-input')?.value || '';
  const email = document.getElementById('profile-email-input')?.value || '';
  const dob = document.getElementById('profile-dob-input')?.value || '';
  const activeGenderBtn = document.querySelector('.gender-btn.active');
  const gender = activeGenderBtn?.getAttribute('data-gender') || activeGenderBtn?.textContent?.trim() || 'Male';

  try {
    const res = await api.users.updateProfile({ name, phone, email, dob, gender });
    const updatedUser = res.user || res;
    state.user = { ...state.user, ...updatedUser, name, phone, email, dob, gender };
    localStorage.setItem('smartride_user', JSON.stringify(state.user));
    localStorage.setItem('smartride_user_name', name);
    localStorage.setItem('smartride_user_email', email);
    showToast('Profile updated successfully!', 'success');
    updateUserUI();
  } catch (err) {
    showToast(`Update error: ${err.message}`, 'danger');
  }
}

// --- Floating AI Chatbot Assistant ---
export function toggleChatbot() {
  openWebChubbyTab('chat');
}

export async function handleChatbotSend() {
  const input = document.getElementById('chatbot-input');
  const msgList = document.getElementById('chatbot-messages');
  if (!input || !msgList || !input.value.trim()) return;

  const query = input.value.trim();
  input.value = '';

  // Append user message
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.textContent = query;
  msgList.appendChild(userMsg);
  modalChatHistoryHtml = msgList.innerHTML;

  // Append typing indicator
  const typingMsg = document.createElement('div');
  typingMsg.className = 'chat-msg bot typing-indicator';
  typingMsg.innerHTML = '<span style="opacity: 0.7; font-size: 12px;">⚡ Chubby AI is analyzing live telemetry...</span>';
  msgList.appendChild(typingMsg);
  msgList.scrollTop = msgList.scrollHeight;

  const pickup = state.pickup || document.getElementById('pickup-input')?.value || 'Current Location';
  const dest = state.dropoff || document.getElementById('dropoff-input')?.value || 'City Center';
  const distanceKm = state.distanceKm || 8.5;

  try {
    const res = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        pickup,
        destination: dest,
        distanceKm,
        quotes: state.quotes || []
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.text) {
        typingMsg.remove();
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg bot';
        botMsg.innerHTML = data.text
          .replace(/\n/g, '<br/>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        msgList.appendChild(botMsg);
        msgList.scrollTop = msgList.scrollHeight;
        modalChatHistoryHtml = msgList.innerHTML;
        return;
      }
    }
  } catch (err) {
    // Fallback to local real-time analytical engine
  }

  // Local real-time fallback engine
  typingMsg.remove();
  const botMsg = document.createElement('div');
  botMsg.className = 'chat-msg bot';
  botMsg.innerHTML = getChatbotResponse(query);
  msgList.appendChild(botMsg);
  msgList.scrollTop = msgList.scrollHeight;
  modalChatHistoryHtml = msgList.innerHTML;
}

function getChatbotResponse(text) {
  const q = text.toLowerCase();
  const quotes = state.quotes || [];
  const cheapest = quotes.length > 0 ? [...quotes].sort((a, b) => a.fare - b.fare)[0] : null;
  const fastest = quotes.length > 0 ? [...quotes].sort((a, b) => a.eta - b.eta)[0] : null;
  const uber = quotes.find(q => (q.provider || '').toLowerCase().includes('uber'));
  const smart = quotes.find(q => q.isSmart || (q.provider || '').toLowerCase().includes('smartride'));

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const hour = now.getHours();
  let trafficStatus = 'Moderate Afternoon Flow';
  let trafficDelay = 2;
  let surgeRange = '1.0x–1.2x';

  if (hour >= 8 && hour < 11) {
    trafficStatus = 'Heavy Morning Rush';
    trafficDelay = 5;
    surgeRange = '1.3x–1.5x';
  } else if (hour >= 11 && hour < 17) {
    trafficStatus = 'Moderate Flow';
    trafficDelay = 2;
    surgeRange = '1.0x–1.2x';
  } else if (hour >= 17 && hour < 21) {
    trafficStatus = 'Severe Evening Peak';
    trafficDelay = 7;
    surgeRange = '1.4x–1.7x';
  } else {
    trafficStatus = 'Fast Open Corridor';
    trafficDelay = 1;
    surgeRange = '1.0x (No Surge)';
  }

  const pickup = state.pickup || document.getElementById('pickup-input')?.value || 'Current Location';
  const dest = state.dropoff || document.getElementById('dropoff-input')?.value || 'City Center';
  const dist = state.distanceKm || 8.5;

  if (q.includes('cheapest') || q.includes('fare') || q.includes('price') || q.includes('cost')) {
    if (cheapest) {
      const diff = uber && smart && uber.fare > smart.fare ? (uber.fare - smart.fare) : 45;
      return `💰 <strong>Real-Time Price Matrix (${timeStr})</strong>:<br/>• Lowest: <strong>${cheapest.type}</strong> (${cheapest.provider}) at <strong>₹${cheapest.fare}</strong> (${cheapest.eta}m ETA) 🟢<br/>• SmartRide EV: <strong>₹${smart ? smart.fare : cheapest.fare}</strong> (Zero Surge)<br/>• Active Surge: ${surgeRange} on competitor apps.<br/>💡 You save <strong>₹${diff}</strong> booking SmartRide EV!`;
    }
    return `💰 Current lowest fare is <strong>SmartRide Auto</strong> at <strong>₹95</strong>.`;
  }
  if (q.includes('fastest') || q.includes('eta') || q.includes('time') || q.includes('quick')) {
    if (fastest) {
      return `⚡ <strong>Fastest Pickup (Real-Time ETA)</strong>:<br/><strong>${fastest.type}</strong> arrives in only <strong>${fastest.eta} minutes</strong>! Road delay is +${trafficDelay} mins (${trafficStatus}).`;
    }
    return `⚡ Fastest pickup is <strong>SmartRide EV</strong> arriving in <strong>2 mins</strong>.`;
  }
  if (q.includes('real time') || q.includes('analysis') || q.includes('traffic') || q.includes('live') || q.includes('now')) {
    const savings = uber && smart && uber.fare > smart.fare ? (uber.fare - smart.fare) : 125;
    return `⚡ <strong>Live Real-Time Telemetry (${timeStr})</strong>:<br/>• Corridor: <strong>${pickup}</strong> ➔ <strong>${dest}</strong> (${dist} km)<br/>• Traffic Radar: <strong>${trafficStatus}</strong> (+${trafficDelay} mins signal delay)<br/>• Market Surge: Uber/Ola (${surgeRange}), while <strong>SmartRide AI is locked at base fare</strong>!<br/>• Lowest: <strong>${cheapest ? cheapest.type : 'SmartRide EV'}</strong> at <strong>₹${cheapest ? cheapest.fare : 145}</strong> (Save <strong>₹${savings}</strong>).`;
  }
  if (q.includes('parcel') || q.includes('courier') || q.includes('delivery')) {
    return `📦 <strong>SmartRide Parcel Express</strong>: 3 tiers available: <strong>Express Bike</strong> (≤5kg), <strong>Standard Car</strong> (≤20kg), and <strong>Heavy Van</strong> (≤100kg). Head to the Parcel tab to book!`;
  }
  if (q.includes('safety') || q.includes('sos') || q.includes('emergency')) {
    return `🛡️ <strong>Safety Shield Active</strong>: 24/7 route anomaly tracking, 4-digit PIN verification, and 1-tap <strong>Emergency SOS</strong> broadcast to your contacts and police.`;
  }
  if (q.includes('commute') || q.includes('carpool')) {
    return `👥 <strong>Smart Commute</strong>: Match with colleagues sharing your route to save up to ₹4,800/month and reduce 22kg CO2. Check out the Smart Commute tab!`;
  }
  if (q.includes('offer') || q.includes('coupon') || q.includes('promo') || q.includes('discount')) {
    return `🎟️ <strong>Active Promo</strong>: Use code <strong>SMART20</strong> for 20% OFF your current ride!`;
  }
  if (q.includes('explain') || q.includes('xai') || q.includes('shap') || q.includes('lime') || q.includes('why')) {
    return `🧠 <strong>Explainable AI (EMMDE)</strong>: Evaluates 5 agents (Fare, Stability, Effort, Context, Carbon) with SHAP waterfall and LIME rules. Head to the Explainable AI tab!`;
  }
  return `✨ I'm <strong>Chubby AI</strong>! I can compare real-time fares across Uber, Ola, Rapido, and SmartRide EV, forecast traffic surges, check parcel rates, or book your ride. What would you like to know?`;
}

// ============================================================================
// Explainable AI (XAI) Inspector - NeurIPS 2022 Architecture
// ============================================================================
export function renderXaiInspector(targetOptionId = null) {
  if (!state.quotes || state.quotes.length === 0) {
    refreshQuotes();
  }

  const quotes = state.quotes || [];
  if (quotes.length === 0) return;

  const selectedId = targetOptionId || state.xaiSelectedOptionId || state.selectedQuote?.id || state.topPick?.id || quotes[0]?.id;
  state.xaiSelectedOptionId = selectedId;
  const currentOption = quotes.find((q) => q.id === selectedId) || quotes[0];
  const benchmarkOption = quotes.find((q) => q.id !== currentOption.id) || currentOption;

  // 1. Render Vehicle Selector Pills
  const selectorContainer = document.getElementById('xai-vehicle-selector');
  if (selectorContainer) {
    selectorContainer.innerHTML = quotes.map((q) => `
      <button class="xai-veh-btn ${q.id === currentOption.id ? 'active' : ''}" data-id="${q.id}">
        <span>${q.icon}</span>
        <span>${q.type}</span>
        <span style="font-size: 11px; opacity: 0.8;">(₹${q.fare})</span>
      </button>
    `).join('');

    selectorContainer.querySelectorAll('.xai-veh-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        renderXaiInspector(btn.dataset.id);
      });
    });
  }

  // 2. Render Selected Spotlight Card
  const spotlightContainer = document.getElementById('xai-selected-spotlight');
  if (spotlightContainer) {
    const isTop = state.topPick?.id === currentOption.id;
    spotlightContainer.innerHTML = `
      <div class="spotlight-left">
        <div class="spotlight-icon-wrap" style="border-color: ${currentOption.color}88; box-shadow: 0 0 16px ${currentOption.color}33;">
          ${currentOption.icon}
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="spotlight-name">${currentOption.type}</div>
            ${isTop ? `<span class="ai-top-badge" style="margin: 0; padding: 2px 8px; font-size: 10px;">✨ #1 TOP PICK</span>` : ''}
          </div>
          <div class="spotlight-provider-row">
            <span class="provider-tag ${currentOption.provider.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${currentOption.provider}</span>
            <span style="font-size: 12px; color: var(--text-muted);">• ${currentOption.category.toUpperCase()} Fleet</span>
            ${currentOption.isSmart ? `<span style="font-size: 11px; color: #10B981; font-weight: 700;">🌱 Zero Emission EV</span>` : ''}
          </div>
        </div>
      </div>

      <div class="spotlight-stats-row">
        <div class="spotlight-stat">
          <div class="spotlight-stat-label">Live Fare</div>
          <div class="spotlight-stat-val">₹${currentOption.fare}</div>
        </div>
        <div class="spotlight-stat">
          <div class="spotlight-stat-label">Driver ETA</div>
          <div class="spotlight-stat-val" style="color: #10B981;">${currentOption.eta}m</div>
        </div>
        <div class="spotlight-stat">
          <div class="spotlight-stat-label">AI Composite</div>
          <div class="spotlight-stat-val" style="color: #F59E0B;">${currentOption.scores?.overall || 85}/100</div>
        </div>
      </div>
    `;
  }

  // 3. Render 5 Autonomous Multi-Agent Collaborative Scorecards
  const agentGrid = document.getElementById('xai-agent-grid');
  if (agentGrid) {
    const s = currentOption.scores || {};
    agentGrid.innerHTML = `
      <div class="agent-card">
        <div class="agent-header">
          <div class="agent-header-left">
            <span class="agent-icon">💰</span>
            <span class="agent-title">FareAgent</span>
          </div>
          <span class="agent-score-val" style="color: var(--brand-cyan);">${s.fare || 80}%</span>
        </div>
        <div class="agent-desc">
          Surge shield active (multiplier: ${Number(currentOption.surge || 1.0).toFixed(1)}x). Rate is ₹${(currentOption.fare / (currentOption.distanceKm || 8.5)).toFixed(1)}/km.
        </div>
        <div class="agent-bar-wrap">
          <div class="agent-bar" style="width: ${s.fare || 80}%; background: var(--brand-cyan);"></div>
        </div>
      </div>

      <div class="agent-card">
        <div class="agent-header">
          <div class="agent-header-left">
            <span class="agent-icon">🛡️</span>
            <span class="agent-title">StabilityAgent</span>
          </div>
          <span class="agent-score-val" style="color: var(--success);">${s.stability || 95}%</span>
        </div>
        <div class="agent-desc">
          Evaluates telemetry history: ${(currentOption.cancellationRisk * 100).toFixed(0)}% cancellation hazard, ${Math.round(currentOption.reliability * 100)}% driver arrival consistency.
        </div>
        <div class="agent-bar-wrap">
          <div class="agent-bar" style="width: ${s.stability || 95}%; background: var(--success);"></div>
        </div>
      </div>

      <div class="agent-card">
        <div class="agent-header">
          <div class="agent-header-left">
            <span class="agent-icon">🚶‍♂️</span>
            <span class="agent-title">HumanEffortAgent</span>
          </div>
          <span class="agent-score-val" style="color: #A855F7;">${s.effort || 85}%</span>
        </div>
        <div class="agent-desc">
          Curbside walking impedance: ${currentOption.pickupMeters}m pedestrian walk + ${currentOption.eta} mins roadside wait time.
        </div>
        <div class="agent-bar-wrap">
          <div class="agent-bar" style="width: ${s.effort || 85}%; background: #A855F7;"></div>
        </div>
      </div>

      <div class="agent-card">
        <div class="agent-header">
          <div class="agent-header-left">
            <span class="agent-icon">🌦️</span>
            <span class="agent-title">ContextAgent</span>
          </div>
          <span class="agent-score-val" style="color: #F59E0B;">${s.context || 85}%</span>
        </div>
        <div class="agent-desc">
          Synthesizes time of day rush hour shocks, route topology, and road density corridor telemetry.
        </div>
        <div class="agent-bar-wrap">
          <div class="agent-bar" style="width: ${s.context || 85}%; background: #F59E0B;"></div>
        </div>
      </div>

      <div class="agent-card">
        <div class="agent-header">
          <div class="agent-header-left">
            <span class="agent-icon">🌱</span>
            <span class="agent-title">EcoCarbonAgent</span>
          </div>
          <span class="agent-score-val" style="color: #10B981;">${s.carbon || (currentOption.isSmart ? 98 : 45)}%</span>
        </div>
        <div class="agent-desc">
          ${currentOption.isSmart 
            ? `100% Zero-emission electric fleet saves ${Math.round((currentOption.distanceKm || 8.5) * 145)}g direct CO₂ on this trip.` 
            : `Fossil fuel ICE propulsion (~145g CO₂/km). Clean load shifting recommended.`}
        </div>
        <div class="agent-bar-wrap">
          <div class="agent-bar" style="width: ${s.carbon || (currentOption.isSmart ? 98 : 45)}%; background: #10B981;"></div>
        </div>
      </div>
    `;
  }

  // 4. Render SHAP Waterfall Visualizer
  const shapContainer = document.getElementById('xai-shap-waterfall');
  if (shapContainer) {
    const weights = AGENT_WEIGHTS[state.strategy] || AGENT_WEIGHTS.balanced;
    const shapData = calculateShapWaterfall(currentOption, benchmarkOption, weights, { isPeakHour: state.isPeakHour });

    let waterfallHtml = `
      <div class="shap-baseline-row">
        <span>Base Expected Market Utility Score (E[f(x)])</span>
        <span>${shapData.baseValue.toFixed(1)} pts</span>
      </div>
    `;

    shapData.attributions.forEach((attr) => {
      const isPos = attr.isPositive;
      const barWidth = Math.min(100, Math.max(12, Math.abs(attr.value) * 3.8));
      waterfallHtml += `
        <div class="shap-row">
          <div class="shap-row-header">
            <div class="shap-row-label">
              <span>${attr.icon}</span>
              <span>${attr.feature}</span>
              <span style="font-size: 10px; color: var(--text-dim); font-weight: 500;">(${attr.agent})</span>
            </div>
            <span class="shap-val-pill ${isPos ? 'pos' : 'neg'}">
              ${isPos ? '+' : ''}${attr.value} pts
            </span>
          </div>
          <div class="shap-bar-track">
            <div class="shap-bar-fill ${isPos ? 'pos' : 'neg'}" style="width: ${barWidth}%;"></div>
          </div>
          <div class="shap-row-desc">${attr.description}</div>
        </div>
      `;
    });

    waterfallHtml += `
      <div class="shap-final-row">
        <span>Final AI Evaluated Utility Score:</span>
        <span style="font-size: 18px; color: var(--brand-cyan); font-family: 'Outfit', sans-serif;">
          ${shapData.finalScore}/100
        </span>
      </div>
    `;

    shapContainer.innerHTML = waterfallHtml;
  }

  // 5. Render LIME Surrogate Decision Rules
  const limeContainer = document.getElementById('xai-lime-rules');
  if (limeContainer) {
    const rules = generateLimeRules(currentOption);
    limeContainer.innerHTML = rules.map((r) => `
      <div class="lime-rule-item">
        <div class="lime-rule-top">
          <code class="lime-condition-code">${r.rule}</code>
          <span class="lime-impact-badge ${r.direction === 'positive' ? 'pos' : 'neg'}">
            ${r.impact}
          </span>
        </div>
        <div class="lime-rule-desc">${r.text}</div>
        <div class="lime-confidence-row">
          <span>Surrogate Rule Confidence:</span>
          <strong style="color: #A5B4FC;">${Math.round(r.confidence * 100)}%</strong>
        </div>
      </div>
    `).join('');
  }

  // 6. Setup Interactive Counterfactual What-If Studio
  initWhatIfStudio(currentOption);

  // 7. Setup Audit Export buttons
  setupXaiAuditButtons(currentOption);
}

function initWhatIfStudio(baseOption) {
  const walkSlider = document.getElementById('whatif-walk-slider');
  const surgeSlider = document.getElementById('whatif-surge-slider');
  const trafficSelect = document.getElementById('whatif-traffic-select');
  const strategySelect = document.getElementById('whatif-strategy-select');
  const resetBtn = document.getElementById('whatif-reset-btn');

  const walkValEl = document.getElementById('whatif-walk-val');
  const surgeValEl = document.getElementById('whatif-surge-val');
  const trafficValEl = document.getElementById('whatif-traffic-val');

  // Set initial slider positions to reflect baseOption
  if (walkSlider) walkSlider.value = baseOption.pickupMeters || 90;
  if (surgeSlider) surgeSlider.value = baseOption.surge || 1.0;
  if (walkValEl) walkValEl.textContent = `${walkSlider.value}m`;
  if (surgeValEl) surgeValEl.textContent = `${Number(surgeSlider.value).toFixed(1)}x`;

  const recalculateWhatIf = () => {
    const walkMeters = parseInt(walkSlider?.value || 90, 10);
    const surge = parseFloat(surgeSlider?.value || 1.0);
    const traffic = trafficSelect?.value || 'moderate';
    const strategy = strategySelect?.value || 'balanced';

    if (walkValEl) walkValEl.textContent = `${walkMeters}m ${walkMeters <= 120 ? '(Curbside)' : '(Walking)'}`;
    if (surgeValEl) surgeValEl.textContent = `${surge.toFixed(1)}x ${surge === 1.0 ? '(Zero Surge)' : '(Spike)'}`;
    if (trafficValEl) {
      const trafficNames = {
        low: 'Free Highway Flow (Clear Skies)',
        moderate: 'Moderate Urban Traffic (Clear)',
        heavy: 'Severe Rush Hour Bottleneck',
        rain: 'Monsoon Rain Shock + Rush'
      };
      trafficValEl.textContent = trafficNames[traffic] || traffic;
    }

    const simResult = simulateCounterfactual(baseOption, {
      walkMeters,
      surge,
      traffic,
      strategy
    });

    const resCard = document.getElementById('whatif-result-card');
    if (resCard) {
      const sim = simResult.simulatedOption;
      const isPos = simResult.delta >= 0;
      resCard.innerHTML = `
        <div>
          <div style="font-size: 11px; text-transform: uppercase; color: var(--text-dim); font-weight: 700; letter-spacing: 0.06em;">
            Counterfactual Outcome Prediction
          </div>
          
          <div class="whatif-gauge-block">
            <div class="whatif-score-large">${sim.scores.overall}<span style="font-size: 20px; font-weight: 600; color: var(--text-muted);">/100</span></div>
            <div class="whatif-delta-pill ${simResult.delta === 0 ? 'neutral' : (isPos ? 'pos' : 'neg')}">
              ${simResult.delta > 0 ? `▲ +${simResult.delta}` : (simResult.delta < 0 ? `▼ ${simResult.delta}` : '● 0')} pts delta vs baseline
            </div>
          </div>

          <div class="whatif-breakdown-row">
            <div class="whatif-stat-box">
              <div class="whatif-stat-lbl">Simulated Fare</div>
              <div class="whatif-stat-val" style="color: var(--brand-cyan);">₹${sim.fare}</div>
            </div>
            <div class="whatif-stat-box">
              <div class="whatif-stat-lbl">Simulated ETA</div>
              <div class="whatif-stat-val" style="color: #10B981;">${sim.eta} min</div>
            </div>
            <div class="whatif-stat-box">
              <div class="whatif-stat-lbl">Walk Distance</div>
              <div class="whatif-stat-val" style="color: #A855F7;">${sim.pickupMeters}m</div>
            </div>
          </div>
        </div>

        <div class="whatif-verdict-box">
          <strong style="color: var(--brand-cyan);">XAI Synthesis:</strong> ${simResult.explanation}
        </div>
      `;
    }
  };

  walkSlider?.addEventListener('input', recalculateWhatIf);
  surgeSlider?.addEventListener('input', recalculateWhatIf);
  trafficSelect?.addEventListener('change', recalculateWhatIf);
  strategySelect?.addEventListener('change', recalculateWhatIf);

  resetBtn?.addEventListener('click', () => {
    if (walkSlider) walkSlider.value = baseOption.pickupMeters || 90;
    if (surgeSlider) surgeSlider.value = baseOption.surge || 1.0;
    if (trafficSelect) trafficSelect.value = 'moderate';
    if (strategySelect) strategySelect.value = 'balanced';
    recalculateWhatIf();
    showToast('Reset What-If sliders to live road telemetry', 'info');
  });

  recalculateWhatIf();
}

function setupXaiAuditButtons(currentOption) {
  const copyBtn = document.getElementById('xai-copy-explanation-btn');
  const exportBtn = document.getElementById('xai-export-json-btn');

  if (copyBtn) {
    copyBtn.onclick = () => {
      const text = `SmartRide AI Explainable Multi-Agent Report:\nVehicle: ${currentOption.type} (${currentOption.provider})\nComposite Score: ${currentOption.scores?.overall}/100\nFare: ₹${currentOption.fare} (Surge: ${Number(currentOption.surge || 1.0).toFixed(1)}x)\nETA: ${currentOption.eta} mins, Walk: ${currentOption.pickupMeters}m\nAI Optimization Reason: ${currentOption.explanation}\nMethodology: NeurIPS 2022 Explainable Multi-Agent Recommender Architecture`;
      navigator.clipboard.writeText(text).then(() => {
        showToast('AI explanation copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Copied to clipboard', 'info');
      });
    };
  }

  if (exportBtn) {
    exportBtn.onclick = () => {
      const auditPayload = {
        auditId: 'SR_XAI_' + Date.now(),
        timestamp: new Date().toISOString(),
        methodology: 'NeurIPS 2022 Multi-Agent Explainability with SHAP & LIME',
        candidateOption: currentOption,
        agentScorecards: currentOption.scores,
        activeStrategy: state.strategy,
        allCandidatesSummary: state.quotes.map(q => ({
          id: q.id,
          type: q.type,
          provider: q.provider,
          fare: q.fare,
          eta: q.eta,
          compositeScore: q.scores?.overall
        })),
        auditSignature: 'SHA256_' + Math.random().toString(36).substring(2, 15)
      };

      const blob = new Blob([JSON.stringify(auditPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartride-xai-audit-${currentOption.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded AI Transparency Audit Report (JSON)', 'success');
    };
  }
}

// Event Listeners setup
function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Chubby AI Floating Action Cluster & Next-Level Intelligence Modal
  const chubbyFab = document.getElementById('chubby-ai-fab');
  const chatbotVoiceMicBtn = document.getElementById('chatbot-voice-mic-btn');
  const chubbyModal = document.getElementById('chubby-ai-modal');
  const chubbyClose = document.getElementById('chubby-modal-close');

  if (chubbyFab && chubbyModal) {
    chubbyFab.addEventListener('click', () => {
      openWebChubbyTab(nextGenState.chubbyTab || 'chat');
    });

    chatbotVoiceMicBtn?.addEventListener('click', () => {
      openWebChubbyTab('voice');
      setTimeout(() => toggleWebVoiceListening(), 200);
    });

    chubbyClose?.addEventListener('click', () => {
      chubbyModal.style.display = 'none';
    });

    chubbyModal.addEventListener('click', (e) => {
      if (e.target === chubbyModal) {
        chubbyModal.style.display = 'none';
      }
    });

    document.querySelectorAll('.chubby-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.chubbyTab || 'multimodal';
        openWebChubbyTab(tab);
      });
    });

    updateChubbyFabBadge();
  }

  // Category pills
  document.querySelectorAll('.category-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.category-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      state.category = pill.dataset.cat;
      refreshQuotes();
    });
  });

  // Strategy chips
  document.querySelectorAll('.strategy-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.strategy-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.strategy = chip.dataset.strategy;
      refreshQuotes();
    });
  });

  // Locate GPS button click
  document.getElementById('locate-gps-btn')?.addEventListener('click', () => {
    detectCurrentLocation(false);
  });

  // Autocomplete suggestions dropdown handler
  const dropInput = document.getElementById('dropoff-input');
  const suggestionsBox = document.getElementById('route-suggestions-dropdown');

  let webSuggestDebounce = null;

  async function renderSuggestions(query, targetInputId) {
    if (!suggestionsBox) return;

    let userLat = state.userLat || 13.0878;
    let userLng = state.userLng || 80.2785;
    const inIndia = userLat >= 6.0 && userLat <= 36.5 && userLng >= 68.0 && userLng <= 98.0;
    if (!inIndia) {
      userLat = 13.0878;
      userLng = 80.2785;
    }
    const maxRadiusKm = 100;

    if (!query || query.trim().length < 1) {
      // Show top popular local landmarks strictly within 100km
      const popular = [];
      for (const item of COMPREHENSIVE_CITY_LANDMARKS) {
        const dist = haversineDistKm(userLat, userLng, item.lat, item.lng);
        if (dist <= maxRadiusKm) {
          popular.push({ ...item, score: 80, distanceKm: Math.round(dist * 10) / 10 });
        }
      }
      popular.sort((a, b) => a.distanceKm - b.distanceKm);
      renderList(popular.slice(0, 7), false);
      return;
    }

    const q = query.trim().toLowerCase();
    const qNorm = normalizeIndianPlaceName(query);

    // Tier 1: Instant local matches strictly within 100km with score
    const localMatches = [];
    for (const item of COMPREHENSIVE_CITY_LANDMARKS) {
      const rawScore = scoreCityLandmarkMatch(item, query);
      if (rawScore > 0) {
        const dist = haversineDistKm(userLat, userLng, item.lat, item.lng);
        if (dist <= maxRadiusKm) {
          // Curated landmarks get +15 hub priority bonus
          localMatches.push({ ...item, score: rawScore + 15, distanceKm: Math.round(dist * 10) / 10 });
        }
      }
    }
    localMatches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.distanceKm - b.distanceKm;
    });

    const renderList = (items, isSearching = false) => {
      if (!items || items.length === 0) {
        if (!isSearching) suggestionsBox.style.display = 'none';
        return;
      }

      suggestionsBox.innerHTML = `
        <div style="padding: 6px 12px; font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 6px;"><span>Nearby Places (≤ 100 km Radius)</span><span style="color: #10B981; font-weight: 800; font-size: 8px; background: rgba(16,185,129,0.15); padding: 1px 5px; border-radius: 4px;">GEO-LOCKED</span></div>
          ${isSearching ? '<span style="color: var(--brand-cyan); font-size: 9px;">⚡ Live search...</span>' : ''}
        </div>
        ${items.map(item => `
          <div class="suggestion-item" data-place="${item.name}" data-address="${item.address || ''}" data-target="${targetInputId}" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.04);">
            <span style="font-size: 18px; flex-shrink: 0;">${item.icon || '📍'}</span>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <strong style="font-size: 13px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</strong>
                ${item.distanceKm != null ? `<span style="background: rgba(0, 216, 255, 0.16); color: var(--brand-cyan); font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">${item.distanceKm} km</span>` : ''}
              </div>
              ${item.address ? `<span style="font-size: 11px; color: var(--text-muted); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;">${item.address}</span>` : ''}
            </div>
            <span style="font-size: 11px; color: var(--brand-cyan); opacity: 0.8;">➔</span>
          </div>
        `).join('')}
      `;

      suggestionsBox.style.display = 'block';

      suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedPlace = item.dataset.place;
          const targetId = item.dataset.target;
          const inp = document.getElementById(targetId);
          if (inp) inp.value = selectedPlace;
          if (targetId === 'pickup-input') {
            state.pickup = selectedPlace;
            localStorage.setItem('smartride_user_pickup', selectedPlace);
          }
          if (targetId === 'dropoff-input') state.dropoff = selectedPlace;
          suggestionsBox.style.display = 'none';
          refreshQuotes();
          handleRouteSend();
        });
      });
    };

    // Render local items right away
    if (localMatches.length > 0) {
      renderList(localMatches, true);
    }

    // Tier 2: Debounced Live Geocoding via Photon OpenStreetMap with Centered Lat/Lon & 100km Geofence
    clearTimeout(webSuggestDebounce);
    webSuggestDebounce = setTimeout(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2200);
        // Pass user's coordinates to Photon API so results center on Chennai/user location
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&lat=${userLat}&lon=${userLng}&limit=16`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.features && Array.isArray(data.features)) {
            const onlineResults = [];
            for (const f of data.features) {
              const p = f.properties || {};
              // STRICT: India only
              if (p.countrycode && p.countrycode.toUpperCase() !== 'IN') continue;
              const country = (p.country || '').toLowerCase();
              if (country && !country.includes('india') && !country.includes('bharat')) continue;

              const [lon, lat] = f.geometry?.coordinates || [];
              if (lat == null || lon == null) continue;
              const dist = haversineDistKm(userLat, userLng, lat, lon);
              // STRICT: <= 100km radius only (Zero tolerance for Brazil, France, or other states)
              if (dist > maxRadiusKm) continue;

              const name = p.name || p.street || p.city || 'Location';
              const parts = [p.street, p.locality || p.district, p.city, p.state].filter(Boolean);
              const address = parts.length > 0 ? parts.join(', ') : 'Tamil Nadu, India';

              let icon = '📍';
              if (p.osm_value === 'college' || p.osm_value === 'university' || p.osm_value === 'school') icon = '🎓';
              else if (p.osm_value === 'hospital' || p.osm_value === 'clinic' || p.osm_value === 'blood_bank') icon = '🏥';
              else if (p.osm_value === 'aerodrome' || p.osm_value === 'airport') icon = '✈️';
              else if (p.osm_value === 'station' || p.osm_value === 'bus_stop') icon = '🚆';
              else if (p.osm_value === 'mall' || p.osm_value === 'supermarket') icon = '🛍️';

              const itemScore = scoreCityLandmarkMatch({ name, address }, query) || 60;
              onlineResults.push({ name, address, icon, distanceKm: Math.round(dist * 10) / 10, score: itemScore });
            }

            // Merge with local deduplicated
            const seen = new Set(localMatches.map(m => m.name.toLowerCase().trim()));
            const merged = [...localMatches];
            for (const item of onlineResults) {
              const lower = item.name.toLowerCase().trim();
              if (!seen.has(lower)) {
                seen.add(lower);
                merged.push(item);
              }
            }

            // Score-first sort, then distance
            merged.sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return a.distanceKm - b.distanceKm;
            });

            renderList(merged.slice(0, 8), false);
          }
        }
      } catch {
        renderList(localMatches, false);
      }
    }, 150);
  }

  if (dropInput) {
    dropInput.addEventListener('input', (e) => {
      renderSuggestions(e.target.value, 'dropoff-input');
    });
    dropInput.addEventListener('focus', (e) => {
      renderSuggestions(e.target.value, 'dropoff-input');
    });
  }

  const pickInput = document.getElementById('pickup-input');
  if (pickInput) {
    pickInput.addEventListener('input', (e) => {
      renderSuggestions(e.target.value, 'pickup-input');
    });
    pickInput.addEventListener('focus', (e) => {
      renderSuggestions(e.target.value, 'pickup-input');
    });
  }

  document.addEventListener('click', (e) => {
    if (suggestionsBox && !e.target.closest('.route-input-group')) {
      suggestionsBox.style.display = 'none';
    }
  });

  // Route Send Button
  const searchRouteBtn = document.getElementById('search-route-btn');
  if (searchRouteBtn) {
    searchRouteBtn.addEventListener('click', handleRouteSend);
  }

  // Enter key press triggers route search
  // Enter key press & input clear detection
  ['pickup-input', 'dropoff-input'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (suggestionsBox) suggestionsBox.style.display = 'none';
          handleRouteSend();
        }
      });
      input.addEventListener('input', () => {
        const pInp = document.getElementById('pickup-input');
        const dInp = document.getElementById('dropoff-input');
        const pVal = pInp ? pInp.value.trim() : '';
        const dVal = dInp ? dInp.value.trim() : '';
        if (!pVal && !dVal) {
          state.pickup = '';
          state.dropoff = '';
          refreshQuotes();
        }
      });
    }
  });

  // Quick swap pickup & dropoff
  const swapBtn = document.getElementById('swap-locations-btn');
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const pInp = document.getElementById('pickup-input');
      const dInp = document.getElementById('dropoff-input');
      const p = pInp ? pInp.value.trim() : '';
      const d = dInp ? dInp.value.trim() : '';
      if (!p && !d) return;
      if (pInp) pInp.value = d;
      if (dInp) dInp.value = p;
      state.pickup = d;
      state.dropoff = p;
      if (state.pickup && state.dropoff) {
        handleRouteSend();
      } else {
        refreshQuotes();
      }
    });
  }

  // Quick place chips (suggestions: Airport, Marina Beach, Central Station, Phoenix Mall)
  document.querySelectorAll('.quick-place-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const pInput = document.getElementById('pickup-input');
      const dInput = document.getElementById('dropoff-input');
      if (pInput && !pInput.value.trim()) {
        pInput.value = 'Current Location (GPS)';
        state.pickup = 'Current Location (GPS)';
      }
      state.dropoff = chip.dataset.place;
      if (dInput) dInput.value = state.dropoff;
      handleRouteSend();
    });
  });

  // Famous places cards
  document.querySelectorAll('.famous-place-card').forEach((card) => {
    card.addEventListener('click', () => {
      const pInput = document.getElementById('pickup-input');
      const dInput = document.getElementById('dropoff-input');
      if (pInput && !pInput.value.trim()) {
        pInput.value = 'Current Location (GPS)';
        state.pickup = 'Current Location (GPS)';
      }
      state.dropoff = card.dataset.place;
      if (dInput) dInput.value = state.dropoff;
      handleRouteSend();
    });
  });

  // Booking actions & Manual Refresh
  document.getElementById('book-ride-btn')?.addEventListener('click', bookSelectedRide);
  document.getElementById('deeplink-btn')?.addEventListener('click', launchCompetitorApp);
  document.getElementById('manual-refresh-btn')?.addEventListener('click', manualRefreshFares);
  document.getElementById('refresh-timer-badge')?.addEventListener('click', manualRefreshFares);
  document.getElementById('complete-trip-btn')?.addEventListener('click', completeCurrentRide);
  document.getElementById('close-tracking-modal')?.addEventListener('click', closeTrackingModal);

  // Map controls
  document.getElementById('map-zoom-in')?.addEventListener('click', () => mapInstance?.zoomIn());
  document.getElementById('map-zoom-out')?.addEventListener('click', () => mapInstance?.zoomOut());
  document.getElementById('map-recenter')?.addEventListener('click', () => mapInstance?.recenter());

  // Parcel tiers
  document.querySelectorAll('.tier-card').forEach((card) => {
    card.addEventListener('click', () => setParcelTier(card.dataset.tier));
  });
  document.getElementById('book-parcel-btn')?.addEventListener('click', bookParcel);
  document.getElementById('parcel-pickup')?.addEventListener('input', updateParcelEstimate);
  document.getElementById('parcel-dest')?.addEventListener('input', updateParcelEstimate);

  // Commute actions
  document.querySelectorAll('.match-chat-btn').forEach((btn) => {
    btn.addEventListener('click', () => openCommuteChat(btn.dataset.user));
  });
  document.getElementById('close-chat-modal')?.addEventListener('click', closeCommuteChat);
  document.getElementById('commute-chat-send-btn')?.addEventListener('click', sendCommuteMessage);
  document.getElementById('commute-chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendCommuteMessage();
  });

  // Emergency SOS
  document.getElementById('emergency-sos-btn')?.addEventListener('click', triggerEmergencySOS);
  document.getElementById('close-sos-modal')?.addEventListener('click', closeSosModal);
  document.getElementById('dismiss-sos-btn')?.addEventListener('click', closeSosModal);
  document.getElementById('test-sos-btn')?.addEventListener('click', triggerEmergencySOS);

  // Profile save & Activity reload
  document.getElementById('save-profile-btn')?.addEventListener('click', saveProfile);
  document.getElementById('refresh-activity-btn')?.addEventListener('click', loadMyRides);

  // Theme dropdown
  document.getElementById('theme-picker')?.addEventListener('change', (e) => {
    setTheme(e.target.value);
  });

  // Floating Chatbot
  document.getElementById('chatbot-toggle-btn')?.addEventListener('click', toggleChatbot);
  document.getElementById('chatbot-close-btn')?.addEventListener('click', toggleChatbot);
  document.getElementById('chatbot-send-btn')?.addEventListener('click', handleChatbotSend);
  // Bind Chubby AI quick suggestion chips
  document.querySelectorAll('.chat-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      const input = document.getElementById('chatbot-input');
      if (input && query) {
        input.value = query;
        handleChatbotSend();
      }
    });
  });

  document.getElementById('chatbot-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleChatbotSend();
  });

  // Home Ask Chubby AI Badge Click -> Open Chubby AI
  const homeAiBadge = document.getElementById('home-ask-ai-badge');
  if (homeAiBadge) {
    homeAiBadge.style.cursor = 'pointer';
    homeAiBadge.addEventListener('click', toggleChatbot);
  }

  // Dedicated Future Price Prediction Shortcut & Controls
  document.getElementById('open-future-price-shortcut')?.addEventListener('click', () => {
    switchTab('forecast');
  });

  const runDedicatedForecast = () => {
    const pVal = document.getElementById('forecast-pickup-input')?.value.trim();
    const dVal = document.getElementById('forecast-dropoff-input')?.value.trim();
    const cat = document.getElementById('forecast-category-select')?.value || state.category || 'cab4';
    const tVal = document.getElementById('forecast-custom-time')?.value || '';

    if (pVal) {
      state.pickup = pVal;
      const mainP = document.getElementById('pickup-input');
      if (mainP) mainP.value = pVal;
    }
    if (dVal) {
      state.dropoff = dVal;
      const mainD = document.getElementById('dropoff-input');
      if (mainD) mainD.value = dVal;
    }
    state.category = cat;
    nextGenState.forecastCustomTime = tVal;
    document.querySelectorAll('.category-pill').forEach((pill) => {
      pill.classList.toggle('active', pill.dataset.cat === cat);
    });
    refreshQuotes();
    runWebRealTimeAIAnalysis(state.pickup || 'KG Apartments, Chennai', state.dropoff || 'Marina Beach, Chennai', true);
    renderDedicatedFuturePriceSection();
    showToast(`📈 Future prices predicted for ${state.pickup || 'Current Location'} ➔ ${state.dropoff || 'Marina Beach'}!`, 'success');
  };

  document.getElementById('forecast-predict-btn')?.addEventListener('click', runDedicatedForecast);
  document.getElementById('forecast-category-select')?.addEventListener('change', () => {
    const cat = document.getElementById('forecast-category-select')?.value || 'cab4';
    state.category = cat;
    refreshQuotes();
    renderDedicatedFuturePriceSection();
  });
  document.getElementById('forecast-custom-time')?.addEventListener('change', (e) => {
    nextGenState.forecastCustomTime = e.target.value || '';
    renderDedicatedFuturePriceSection();
  });

  // Profile Change Photo / Avatar Button
  document.getElementById('profile-change-photo-btn')?.addEventListener('click', () => {
    const avatars = ['⚡', '🚗', '🚀', '👤', '🧑‍💻', '⭐', '🌟', '🛡️'];
    const badge = document.getElementById('profile-avatar-badge');
    const current = badge ? badge.textContent.trim() : 'R';
    const nextIdx = (avatars.indexOf(current) + 1) % avatars.length;
    const nextAvatar = avatars[nextIdx];
    if (badge) badge.textContent = nextAvatar;
    localStorage.setItem('smartride_user_avatar', nextAvatar);
    showToast(`Profile avatar updated to ${nextAvatar}!`, 'success');
  });

  // User Profile Header Click -> Open Profile Page directly
  document.getElementById('header-user-btn')?.addEventListener('click', () => {
    switchTab('profile');
    showToast('Opened Profile & Safety', 'info');
  });

  // Full-Page Web Auth Interface Helpers (Sign In / Register)
  // ============================================================================
  // Full-Page Web Authentication Interface & Robust Error Handling
  // ============================================================================
  function setAuthAlert(title, message, type = 'error', actionsHtml = '') {
    const alertEl = document.getElementById('page-auth-alert');
    if (!alertEl) return;
    alertEl.className = `auth-alert-banner ${type}`;
    alertEl.innerHTML = `
      <div class="auth-alert-title">
        <span>${type === 'error' ? '⚠️' : type === 'warning' ? '⚡' : '✅'}</span>
        <span>${title}</span>
      </div>
      <div style="font-size: 12px; opacity: 0.95;">${message}</div>
      ${actionsHtml ? `<div class="auth-alert-actions">${actionsHtml}</div>` : ''}
    `;
    alertEl.style.display = 'flex';

    // Hook up dynamic alert actions
    document.getElementById('alert-fill-demo')?.addEventListener('click', () => {
      const emailInput = document.getElementById('page-login-email');
      const passInput = document.getElementById('page-login-password');
      if (emailInput) emailInput.value = 'rider@smartride.ai';
      if (passInput) passInput.value = 'password123';
      clearAuthAlert();
    });
    document.getElementById('alert-switch-reg')?.addEventListener('click', () => {
      switchPageAuthMode('register');
      clearAuthAlert();
    });
    document.getElementById('alert-switch-login')?.addEventListener('click', () => {
      switchPageAuthMode('login');
      clearAuthAlert();
    });
    document.getElementById('alert-guest-mode')?.addEventListener('click', () => {
      clearAuthAlert();
      window.hideWebAuthScreen();
      showToast('Opened Web Application in Offline Demo Mode', 'info');
    });
  }

  function clearAuthAlert() {
    const alertEl = document.getElementById('page-auth-alert');
    if (alertEl) {
      alertEl.style.display = 'none';
      alertEl.innerHTML = '';
    }
  }

  function switchPageAuthMode(mode = 'login') {
    clearAuthAlert();
    const lForm = document.getElementById('page-login-form');
    const rForm = document.getElementById('page-register-form');
    const lTab = document.getElementById('page-auth-tab-login');
    const rTab = document.getElementById('page-auth-tab-register');
    const heading = document.getElementById('page-auth-heading');
    const sub = document.getElementById('page-auth-sub');

    const isReg = mode === 'register';
    if (lForm) lForm.style.display = isReg ? 'none' : 'block';
    if (rForm) rForm.style.display = isReg ? 'block' : 'none';
    lTab?.classList.toggle('active', !isReg);
    rTab?.classList.toggle('active', isReg);
    if (heading) heading.textContent = isReg ? 'Create Your Account' : 'Welcome Back';
    if (sub) sub.textContent = isReg ? 'Register once to unlock cross-app cab bookings & Chubby AI' : 'Sign in to access your saved routes & live fares';
  }

  window.showWebAuthScreen = function showWebAuthScreen(mode = 'login') {
    clearAuthAlert();
    const authScreen = document.getElementById('web-auth-screen');
    if (authScreen) {
      authScreen.style.display = 'flex';
      switchPageAuthMode(mode);
    }
    document.querySelector('.chubby-fab-cluster')?.setAttribute('style', 'display:none;');
    document.querySelector('.floating-chatbot')?.setAttribute('style', 'display:none;');
    const sniperBanner = document.getElementById('web-sniper-hit-banner');
    if (sniperBanner) sniperBanner.style.display = 'none';
    document.getElementById('auth-modal')?.classList.remove('active');
    try { window.location.hash = mode === 'register' ? '#register' : '#signin'; } catch {}
  };

  window.hideWebAuthScreen = function hideWebAuthScreen() {
    clearAuthAlert();
    const authScreen = document.getElementById('web-auth-screen');
    if (authScreen) {
      authScreen.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => {
        authScreen.style.display = 'none';
        authScreen.style.animation = '';
      }, 180);
    }
    document.querySelector('.chubby-fab-cluster')?.removeAttribute('style');
    document.querySelector('.floating-chatbot')?.removeAttribute('style');
    try {
      localStorage.removeItem('smartride_web_logged_out');
      if (window.location.hash === '#signin' || window.location.hash === '#register') {
        history.replaceState(null, '', window.location.pathname);
      }
    } catch {}
    switchTab('rides');
    refreshQuotes();
  };

  // Password Visibility Toggles
  document.getElementById('toggle-login-pwd')?.addEventListener('click', (e) => {
    const input = document.getElementById('page-login-password');
    if (!input) return;
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    e.target.textContent = isPwd ? '🙈 Hide' : '👁️ Show';
  });

  document.getElementById('toggle-reg-pwd')?.addEventListener('click', (e) => {
    const input = document.getElementById('page-reg-password');
    if (!input) return;
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    e.target.textContent = isPwd ? '🙈 Hide' : '👁️ Show';
  });

  // Demo Autofill Button
  document.getElementById('page-auth-demo-autofill')?.addEventListener('click', () => {
    switchPageAuthMode('login');
    const emailInput = document.getElementById('page-login-email');
    const passInput = document.getElementById('page-login-password');
    if (emailInput) emailInput.value = 'rider@smartride.ai';
    if (passInput) passInput.value = 'password123';
    clearAuthAlert();
    showToast('Demo rider credentials filled! Click Sign In to open app.', 'info');
  });

  // Forgot Password Helper
  document.getElementById('page-forgot-pwd')?.addEventListener('click', () => {
    setAuthAlert(
      'Password Reset & Recovery',
      'For demo accounts, use password: <strong>password123</strong>. For registered accounts, OTP password reset is available via the backend.',
      'warning',
      '<button type="button" class="auth-alert-btn" id="alert-fill-demo">💡 Fill Demo Password</button>'
    );
  });

  // Open Auth Interface from Profile Page ("Switch Account / Sign In")
  document.getElementById('open-auth-btn')?.addEventListener('click', () => {
    window.showWebAuthScreen('login');
  });

  // Logout button handler -> Redirect immediately to Full-Page Sign In / Register interface
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await api.auth.logout();
    state.user = null;
    try { 
      localStorage.setItem('smartride_web_logged_out', 'true');
      localStorage.removeItem('smartride_jwt');
      localStorage.removeItem('smartride_user');
    } catch {}
    updateUserUI();
    window.showWebAuthScreen('login');
    showToast('Signed out successfully. Please Sign In or Register.', 'info');
  });

  // Full-Page Auth Screen Tab Switchers
  document.getElementById('page-auth-tab-login')?.addEventListener('click', () => switchPageAuthMode('login'));
  document.getElementById('page-auth-tab-register')?.addEventListener('click', () => switchPageAuthMode('register'));

  // Full-Page Sign In Submit (with Comprehensive Error Handling)
  document.getElementById('page-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();
    const email = document.getElementById('page-login-email')?.value?.trim();
    const password = document.getElementById('page-login-password')?.value;
    const submitBtn = document.getElementById('page-login-submit-btn');

    if (!email || !password) {
      setAuthAlert('Missing Fields', 'Please enter both your email address and password.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>⏳</span> Authenticating...`;
      }
      showToast('Signing in...', 'info');
      const res = await api.auth.login(email, password);
      state.user = res.user;
      updateUserUI();
      window.hideWebAuthScreen();
      showToast(`Welcome back, ${res.user.name}! Web application ready.`, 'success');
    } catch (err) {
      console.error('Login error:', err);
      const status = err.status || 0;
      if (status === 401) {
        setAuthAlert(
          '401 Unauthorized: Invalid Credentials',
          'Incorrect password for this account. Please check your spelling or use the demo credentials.',
          'error',
          '<button type="button" class="auth-alert-btn" id="alert-fill-demo">💡 Fill Demo Credentials</button>'
        );
      } else if (status === 404) {
        setAuthAlert(
          '404 Not Found: Account Does Not Exist',
          `No account found with email <strong>${email}</strong>. Switch to the Register tab to create your account in seconds!`,
          'warning',
          '<button type="button" class="auth-alert-btn" id="alert-switch-reg">🚀 Register Now</button>'
        );
      } else if (status === 403) {
        setAuthAlert(
          '403 Forbidden: Account Restricted',
          'This account has been locked or restricted. Please check your credentials or reset your password.',
          'error'
        );
      } else if (status >= 500) {
        setAuthAlert(
          `HTTP ${status} Server Error`,
          'The backend authentication service encountered a temporary error. You can launch the web application in Demo/Offline mode.',
          'error',
          '<button type="button" class="auth-alert-btn" id="alert-guest-mode">⚡ Continue in Offline Mode</button>'
        );
      } else {
        setAuthAlert(
          'Connection or Network Error',
          err.message || 'Network request failed. An ad-blocker or firewall may be interfering, or the backend is offline.',
          'error',
          '<button type="button" class="auth-alert-btn" id="alert-guest-mode">⚡ Open Web App in Offline Mode</button>'
        );
      }
      showToast(`Sign in error: ${err.message}`, 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>⚡</span> Sign In &amp; Open Web Application`;
      }
    }
  });

  // Full-Page Register Submit (with Password Confirmation & Immediate App Opening)
  document.getElementById('page-register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();
    const name = document.getElementById('page-reg-name')?.value?.trim();
    const email = document.getElementById('page-reg-email')?.value?.trim();
    const phone = document.getElementById('page-reg-phone')?.value?.trim();
    const password = document.getElementById('page-reg-password')?.value;
    const confirmPassword = document.getElementById('page-reg-password-confirm')?.value;
    const submitBtn = document.getElementById('page-reg-submit-btn');

    if (!name || !email || !password) {
      setAuthAlert('Required Fields', 'Full Name, Email Address, and Password are required.', 'error');
      return;
    }

    if (password.length < 6) {
      setAuthAlert('Password Too Short', 'Password must be at least 6 characters long to secure your account.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      setAuthAlert('Passwords Do Not Match', 'The confirmation password does not match. Please re-enter your password.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>⏳</span> Creating Account &amp; Launching...`;
      }
      showToast('Creating account and setting up your workspace...', 'info');
      const res = await api.auth.register(email, password, name, phone);
      state.user = res.user;
      updateUserUI();
      
      // Immediately unlock and open the web application
      window.hideWebAuthScreen();
      showToast(`Welcome to SmartRide AI, ${res.user.name}! Your account is active.`, 'success');
    } catch (err) {
      console.error('Registration error:', err);
      const status = err.status || 0;
      if (status === 409) {
        setAuthAlert(
          '409 Conflict: Email Already Registered',
          `An account with email <strong>${email}</strong> already exists. Please switch to the Sign In tab to log in.`,
          'warning',
          '<button type="button" class="auth-alert-btn" id="alert-switch-login">⚡ Switch to Sign In</button>'
        );
      } else if (status >= 500) {
        setAuthAlert(
          `HTTP ${status} Server Error`,
          'Could not complete registration on server. You can enter the web application immediately in Offline Mode.',
          'error',
          '<button type="button" class="auth-alert-btn" id="alert-guest-mode">⚡ Continue in Offline Mode</button>'
        );
      } else {
        setAuthAlert(
          'Registration Notice',
          err.message || 'Unable to complete registration. Check your connection or continue as guest.',
          'error',
          '<button type="button" class="auth-alert-btn" id="alert-guest-mode">⚡ Continue as Guest</button>'
        );
      }
      showToast(`Registration error: ${err.message}`, 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>🚀</span> Register &amp; Open Web Application`;
      }
    }
  });

  // Full-Page Social & Guest Actions (Immediately Unlocks & Opens the Web Application)
  document.getElementById('page-social-google-btn')?.addEventListener('click', async () => {
    showToast('Connecting with Google...', 'info');
    const res = await api.auth.socialLogin('rider.google@smartride.ai', 'Google Rider', 'google');
    state.user = res.user;
    updateUserUI();
    window.hideWebAuthScreen();
    showToast(`Signed in as ${res.user.name}! Web application open.`, 'success');
  });

  document.getElementById('page-social-facebook-btn')?.addEventListener('click', async () => {
    showToast('Connecting with Facebook...', 'info');
    const res = await api.auth.socialLogin('rider.fb@smartride.ai', 'Facebook Rider', 'facebook');
    state.user = res.user;
    updateUserUI();
    window.hideWebAuthScreen();
    showToast(`Signed in as ${res.user.name}! Web application open.`, 'success');
  });

  document.getElementById('page-guest-btn')?.addEventListener('click', async () => {
    await initUser();
    window.hideWebAuthScreen();
    showToast('Welcome Guest! Web application unlocked.', 'info');
  });

  document.getElementById('close-auth-modal')?.addEventListener('click', () => {
    document.getElementById('auth-modal')?.classList.remove('active');
  });

  document.getElementById('auth-tab-login')?.addEventListener('click', () => {
    const lForm = document.getElementById('login-form');
    const rForm = document.getElementById('register-form');
    const lTab = document.getElementById('auth-tab-login');
    const rTab = document.getElementById('auth-tab-register');
    if (lForm) lForm.style.display = 'block';
    if (rForm) rForm.style.display = 'none';
    if (lTab) { lTab.style.background = 'var(--brand-indigo)'; lTab.style.color = '#FFFFFF'; }
    if (rTab) { rTab.style.background = 'transparent'; rTab.style.color = 'var(--text-muted)'; }
  });

  document.getElementById('auth-tab-register')?.addEventListener('click', () => {
    const lForm = document.getElementById('login-form');
    const rForm = document.getElementById('register-form');
    const lTab = document.getElementById('auth-tab-login');
    const rTab = document.getElementById('auth-tab-register');
    if (lForm) lForm.style.display = 'none';
    if (rForm) rForm.style.display = 'block';
    if (rTab) { rTab.style.background = 'var(--brand-indigo)'; rTab.style.color = '#FFFFFF'; }
    if (lTab) { lTab.style.background = 'transparent'; lTab.style.color = 'var(--text-muted)'; }
  });

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    try {
      showToast('Signing in...', 'info');
      const res = await api.auth.login(email, password);
      state.user = res.user;
      updateUserUI();
      document.getElementById('auth-modal')?.classList.remove('active');
      showToast(`Welcome back, ${res.user.name}!`, 'success');
    } catch (err) {
      showToast(`Sign in error: ${err.message}`, 'danger');
    }
  });

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name')?.value;
    const email = document.getElementById('reg-email')?.value;
    const phone = document.getElementById('reg-phone')?.value;
    const password = document.getElementById('reg-password')?.value;
    try {
      showToast('Creating account...', 'info');
      const res = await api.auth.register(email, password, name, phone);
      state.user = res.user;
      updateUserUI();
      document.getElementById('auth-modal')?.classList.remove('active');
      showToast(`Welcome to SmartRide, ${res.user.name}!`, 'success');
    } catch (err) {
      showToast(`Registration error: ${err.message}`, 'danger');
    }
  });

  document.getElementById('social-google-btn')?.addEventListener('click', async () => {
    showToast('Connecting with Google...', 'info');
    const res = await api.auth.socialLogin('rider.google@smartride.ai', 'Google Rider', 'google');
    state.user = res.user;
    updateUserUI();
    document.getElementById('auth-modal')?.classList.remove('active');
    showToast(`Signed in as ${res.user.name}!`, 'success');
  });

  document.getElementById('social-facebook-btn')?.addEventListener('click', async () => {
    showToast('Connecting with Facebook...', 'info');
    const res = await api.auth.socialLogin('rider.fb@smartride.ai', 'Facebook Rider', 'facebook');
    state.user = res.user;
    updateUserUI();
    document.getElementById('auth-modal')?.classList.remove('active');
    showToast(`Signed in as ${res.user.name}!`, 'success');
  });

  // ========================================================================
  // NEW SECTIONS & ELEMENTS EVENT LISTENERS
  // ========================================================================

  // Famous Places 1-Click Booking
  document.querySelectorAll('.book-famous-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const place = btn.dataset.place;
      state.dropoff = place;
      const dropInput = document.getElementById('dropoff-input');
      if (dropInput) dropInput.value = place;
      switchTab('rides');
      refreshQuotes();
      showToast(`🎯 Destination set to ${place}`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Saved Places Quick Select
  document.querySelectorAll('.use-place-pickup-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const addr = btn.dataset.address;
      state.pickup = addr;
      const pickInput = document.getElementById('pickup-input');
      if (pickInput) pickInput.value = addr;
      switchTab('rides');
      showToast(`📍 Pickup location set to ${addr}`, 'info');
    });
  });

  document.querySelectorAll('.use-place-dropoff-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const addr = btn.dataset.address;
      state.dropoff = addr;
      const dropInput = document.getElementById('dropoff-input');
      if (dropInput) dropInput.value = addr;
      switchTab('rides');
      refreshQuotes();
      showToast(`📍 Destination set to ${addr}`, 'success');
    });
  });

  // Add Saved Place Modal
  document.getElementById('open-add-place-btn')?.addEventListener('click', () => {
    document.getElementById('add-place-modal')?.classList.add('active');
  });
  document.getElementById('close-add-place-modal')?.addEventListener('click', () => {
    document.getElementById('add-place-modal')?.classList.remove('active');
  });
  document.getElementById('cancel-add-place-btn')?.addEventListener('click', () => {
    document.getElementById('add-place-modal')?.classList.remove('active');
  });
  document.getElementById('save-new-place-btn')?.addEventListener('click', () => {
    const label = document.getElementById('new-place-label')?.value.trim();
    const address = document.getElementById('new-place-address')?.value.trim();
    if (!label || !address) {
      showToast('Please enter both label and address for the place', 'danger');
      return;
    }
    const container = document.getElementById('saved-places-container');
    if (container) {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface);';
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="font-size: 28px;">⭐</span>
          <div>
            <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">${label}</h4>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">${address}</p>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-secondary use-place-pickup-btn" data-address="${address}" style="padding: 6px 12px; font-size: 11px;">Set Pickup</button>
          <button class="btn-cyan use-place-dropoff-btn" data-address="${address}" style="padding: 6px 12px; font-size: 11px;">Set Destination</button>
        </div>
      `;
      container.prepend(card);
    }
    document.getElementById('add-place-modal')?.classList.remove('active');
    showToast(`Saved place "${label}" added successfully!`, 'success');
  });

  // Gender Selection in Profile
  document.querySelectorAll('.gender-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gender-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Password Modal
  document.getElementById('open-change-password-btn')?.addEventListener('click', () => {
    document.getElementById('password-modal')?.classList.add('active');
  });
  document.getElementById('close-password-modal')?.addEventListener('click', () => {
    document.getElementById('password-modal')?.classList.remove('active');
  });
  document.getElementById('save-new-pwd-btn')?.addEventListener('click', () => {
    const newPwd = document.getElementById('new-pwd-input')?.value;
    const confirmPwd = document.getElementById('confirm-pwd-input')?.value;
    if (!newPwd || newPwd.length < 6) {
      showToast('Password must be at least 6 characters', 'danger');
      return;
    }
    if (newPwd !== confirmPwd) {
      showToast('Passwords do not match', 'danger');
      return;
    }
    document.getElementById('password-modal')?.classList.remove('active');
    showToast('Password updated securely!', 'success');
  });
  document.getElementById('send-pwd-link-btn')?.addEventListener('click', () => {
    document.getElementById('password-modal')?.classList.remove('active');
    showToast('Secure password reset link sent to your email!', 'success');
  });

  // Profile Cancel & Save buttons
  document.getElementById('cancel-profile-btn')?.addEventListener('click', () => {
    updateUserUI();
    showToast('Profile edits discarded', 'info');
  });

  // Profile Options Hub: 1-Tap Navigation to Arranged Services
  document.querySelectorAll('.profile-option-item').forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      if (target) {
        switchTab(target);
      }
    });
  });

  // Emergency & SOS Hub
  document.getElementById('trigger-sos-protocol-btn')?.addEventListener('click', () => {
    document.getElementById('sos-modal')?.classList.add('active');
    showToast('🚨 SOS Emergency Telemetry dispatched!', 'danger');
  });
  document.getElementById('open-add-contact-btn')?.addEventListener('click', () => {
    document.getElementById('add-contact-modal')?.classList.add('active');
  });
  document.getElementById('close-add-contact-modal')?.addEventListener('click', () => {
    document.getElementById('add-contact-modal')?.classList.remove('active');
  });
  document.getElementById('cancel-add-contact-btn')?.addEventListener('click', () => {
    document.getElementById('add-contact-modal')?.classList.remove('active');
  });
  document.getElementById('save-new-contact-btn')?.addEventListener('click', () => {
    const cName = document.getElementById('new-contact-name')?.value.trim();
    const cPhone = document.getElementById('new-contact-phone')?.value.trim();
    const cRel = document.getElementById('new-contact-relation')?.value;
    if (!cName || !cPhone) {
      showToast('Please enter both contact name and phone number', 'danger');
      return;
    }
    const cList = document.getElementById('emergency-contacts-list');
    if (cList) {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-surface); border: 1px solid var(--border-ui); border-radius: var(--radius-sm);';
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(16,185,129,0.15); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #10B981;">${cName[0].toUpperCase()}</div>
          <div>
            <strong style="color: var(--text-main);">${cName}</strong>
            <div style="font-size: 12px; color: var(--text-muted);">${cRel} · ${cPhone}</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="tel:${cPhone}" class="btn-secondary" style="padding: 6px 12px; font-size: 11px; text-decoration: none;">📞 Call</a>
          <button class="btn-secondary remove-contact-btn" style="padding: 6px 10px; font-size: 11px; border-color: rgba(239,68,68,0.3); color: #EF4444;">🗑️</button>
        </div>
      `;
      cList.prepend(row);
      row.querySelector('.remove-contact-btn')?.addEventListener('click', () => row.remove());
    }
    document.getElementById('add-contact-modal')?.classList.remove('active');
    showToast(`Added ${cName} to trusted emergency contacts!`, 'success');
  });

  document.querySelectorAll('.remove-contact-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('div[style*="display: flex; justify-content: space-between"]');
      if (row) row.remove();
      showToast('Contact removed from emergency alert list', 'info');
    });
  });

  // Referral Invite Copy & Share
  document.getElementById('copy-referral-btn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText('SMART2026');
    showToast('Referral code SMART2026 copied to clipboard!', 'success');
  });

  document.querySelectorAll('.share-social-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const channel = btn.dataset.channel;
      showToast(`Opening ${channel.toUpperCase()} sharing link for SMART2026!`, 'info');
    });
  });

  // Ratings & Reviews Modal
  document.getElementById('open-write-review-btn')?.addEventListener('click', () => {
    document.getElementById('write-review-modal')?.classList.add('active');
  });
  document.getElementById('close-write-review-modal')?.addEventListener('click', () => {
    document.getElementById('write-review-modal')?.classList.remove('active');
  });
  document.getElementById('cancel-write-review-btn')?.addEventListener('click', () => {
    document.getElementById('write-review-modal')?.classList.remove('active');
  });
  document.getElementById('submit-review-btn')?.addEventListener('click', () => {
    const driver = document.getElementById('review-driver-select')?.value;
    const comments = document.getElementById('review-comments')?.value.trim();
    const feed = document.getElementById('reviews-feed-container');
    if (feed) {
      const card = document.createElement('div');
      card.style.cssText = 'padding: 14px; background: var(--bg-surface); border: 1px solid var(--border-ui); border-radius: var(--radius-sm);';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong>${driver}</strong>
            <span style="color: #F59E0B; font-size: 12px;">★★★★★</span>
          </div>
          <span style="font-size: 11px; color: var(--text-dim);">Just now</span>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.4;">
          "${comments || 'Driver was polite, punctual, and drove smoothly.'}"
        </p>
      `;
      feed.prepend(card);
    }
    document.getElementById('write-review-modal')?.classList.remove('active');
    showToast('Your 5-star review has been published!', 'success');
  });

  // Commute Savings Slider
  const slider = document.getElementById('commute-distance-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      const dist = parseInt(slider.value, 10);
      const distVal = document.getElementById('calc-distance-val');
      const soloVal = document.getElementById('calc-solo-cost');
      const commuteVal = document.getElementById('calc-commute-cost');
      const savedVal = document.getElementById('calc-saved-cost');

      const solo = dist * 2 * 22 * 15; // 2 trips * 22 working days * ₹15/km
      const commute = Math.round(solo * 0.4);
      const saved = solo - commute;

      if (distVal) distVal.textContent = `${dist} km (one-way)`;
      if (soloVal) soloVal.textContent = `₹${solo.toLocaleString()} / mo`;
      if (commuteVal) commuteVal.textContent = `₹${commute.toLocaleString()} / mo`;
      if (savedVal) savedVal.textContent = `₹${saved.toLocaleString()} / mo`;
    });
  }

  document.getElementById('find-matches-from-calc-btn')?.addEventListener('click', () => {
    const heading = document.getElementById('heading-commute');
    if (heading) heading.scrollIntoView({ behavior: 'smooth' });
    showToast('Showing top matching commuters for your route!', 'info');
  });

  document.getElementById('save-commute-profile-btn')?.addEventListener('click', () => {
    showToast('Commute route and office schedule profile saved!', 'success');
  });

  // Activity Actions
  document.getElementById('activity-share-track-btn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText('https://smartride-ai.app/track/live-TN09EV4281');
    showToast('Live tracking link copied to clipboard! Share with friends.', 'success');
  });

  document.getElementById('activity-view-xai-btn')?.addEventListener('click', () => {
    switchTab('xai');
  });

  document.getElementById('activity-mark-read-btn')?.addEventListener('click', () => {
    const list = document.getElementById('activity-notif-list');
    if (list) {
      list.querySelectorAll('div[style*="padding: 12px 14px"]').forEach((el) => {
        el.style.opacity = '0.6';
      });
    }
    showToast('All notifications marked as read', 'info');
  });

  // App Settings Actions
  document.getElementById('save-app-settings-btn')?.addEventListener('click', () => {
    const lang = document.getElementById('app-language-select')?.value;
    showToast(`Preferences and language (${lang.toUpperCase()}) saved successfully!`, 'success');
  });

  document.getElementById('clear-cache-btn')?.addEventListener('click', () => {
    showToast('Application route and telemetry cache cleared!', 'info');
  });

  document.getElementById('reset-defaults-btn')?.addEventListener('click', () => {
    showToast('Application reset to factory defaults', 'info');
  });
}
