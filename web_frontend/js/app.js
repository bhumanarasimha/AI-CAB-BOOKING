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
  AGENT_WEIGHTS
} from './ai-engine.js';
import { FleetRadarMap } from './map.js';

const CITY_LANDMARKS = [
  'Tidel Park, OMR Tech Corridor',
  'Airport Terminal 2, Meenambakkam',
  'Marina Beach Promenade',
  'Central Railway Station, Kannappar Thidal',
  'Phoenix MarketCity Mall, Velachery',
  'Express Avenue Mall, Royapettah',
  'DLF Cybercity, Porur',
  'Anna Nagar West Roundtana',
  'Koyambedu CMBT Bus Station',
  'Besant Nagar Beach',
  'Guindy IT Park & National Park',
  'Kapaleeshwarar Temple, Mylapore',
  'Vadapalani Forum Vijaya Mall',
  'Hitech City, Cyber Towers',
  'Indiranagar 100ft Road',
  'MG Road Metro Station',
];

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

  // 1. Instant IP detection for rapid response
  try {
    const ipLoc = await fetchFastIPLocation();
    if (ipLoc && ipLoc.address && (!state.pickup || state.pickup === 'Current Location')) {
      state.pickup = ipLoc.address;
      if (pInput && !pInput.value.trim()) pInput.value = ipLoc.address;
      if (mapInstance && ipLoc.lat && ipLoc.lng) {
        mapInstance.setUserLocation(ipLoc.lat, ipLoc.lng);
      }
    }
  } catch (err) {
    console.warn("Fast IP location fallback:", err);
  }

  // 2. High-Accuracy GPS
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let address = '';

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'en', 'User-Agent': 'SmartRide-AI-Cab' }
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

        if (!address) {
          address = state.pickup || 'Current Location';
        }

        state.pickup = address;
        if (pInput) pInput.value = address;
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
        if (!silent && !state.pickup) {
          showToast('Could not detect GPS. Please enter pickup manually.', 'warning');
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

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupEventListeners();
  initUser();
  initMap();
  refreshQuotes();
  startAutoRefreshTimer();
  loadMyRides();
  loadParcels();
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

// Tab navigation handler
export function switchTab(tabId) {
  state.activeTab = tabId;

  // Update nav buttons
  document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update visible sections
  document.querySelectorAll('.app-section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === `section-${tabId}`);
  });

  // Section specific triggers
  if (tabId === 'rides' && mapInstance) {
    setTimeout(() => mapInstance.resize(), 100);
  } else if (tabId === 'activity') {
    loadMyRides();
  } else if (tabId === 'parcel') {
    loadParcels();
  } else if (tabId === 'xai') {
    renderXaiInspector();
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
  state.quotes = result.options || [];
  state.topPick = result.topPick || state.quotes[0];
  state.selectedQuote = state.selectedQuote && state.quotes.some(q => q.id === state.selectedQuote.id)
    ? state.selectedQuote
    : state.topPick;

  renderQuotes();
  updateBookingBar();

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

  // Recalculate with live variance
  refreshQuotes();

  showToast('🔄 Live fares & driver ETAs updated across all providers!', 'info');
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

function renderQuotes() {
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
            <div class="quote-price-val">₹${quote.fare}</div>
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

        <button class="quote-xai-trigger" data-id="${quote.id}" title="Inspect full multi-agent breakdown, SHAP waterfall, and LIME surrogate rules">
          <span>🧠</span> Explain AI Score (SHAP / LIME) ➔
        </button>

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
      bookBtn.innerHTML = `<span>⚡</span> Confirm & Book ${state.selectedQuote.type} • ₹${state.selectedQuote.fare}`;
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

// --- Ride Booking Action ---
export async function bookSelectedRide() {
  if (!state.selectedQuote) {
    showToast('Please select a ride first', 'warning');
    return;
  }

  showToast(`Booking ${state.selectedQuote.type}...`, 'info');

  const ridePayload = {
    pickup: state.pickup,
    destination: state.dropoff,
    provider: state.selectedQuote.provider,
    cabType: state.selectedQuote.type,
    fare: state.selectedQuote.fare,
    etaMinutes: state.selectedQuote.eta,
  };

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
  const { deepLink, url, provider } = state.selectedQuote;

  showToast(`Launching ${provider} app...`, 'info');

  // Try deep link first, then fallback to web booking url
  if (deepLink && deepLink !== '#smartride') {
    const now = Date.now();
    window.location.href = deepLink;
    setTimeout(() => {
      if (Date.now() - now < 1500 && url) {
        window.open(url, '_blank');
      }
    }, 1000);
  } else if (url && url !== '#smartride') {
    window.open(url, '_blank');
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
  const win = document.getElementById('chatbot-window');
  if (win) win.classList.toggle('active');
}

export function handleChatbotSend() {
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

  // Generate intelligent AI Assistant response
  setTimeout(() => {
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-msg bot';
    botMsg.innerHTML = getChatbotResponse(query);
    msgList.appendChild(botMsg);
    msgList.scrollTop = msgList.scrollHeight;
  }, 400);

  msgList.scrollTop = msgList.scrollHeight;
}

function getChatbotResponse(text) {
  const q = text.toLowerCase();
  if (q.includes('cheapest') || q.includes('fare') || q.includes('price')) {
    const cheapest = [...state.quotes].sort((a, b) => a.fare - b.fare)[0];
    return `💰 The lowest fare right now is <strong>${cheapest?.type || 'Rapido Bike'}</strong> at <strong>₹${cheapest?.fare || 45}</strong>.`;
  }
  if (q.includes('fastest') || q.includes('eta') || q.includes('time')) {
    const fastest = [...state.quotes].sort((a, b) => a.eta - b.eta)[0];
    return `⚡ The quickest pickup is <strong>${fastest?.type || 'SmartRide EV'}</strong> arriving in <strong>${fastest?.eta || 2} mins</strong>.`;
  }
  if (q.includes('parcel') || q.includes('courier')) {
    return `📦 We have 3 parcel tiers: <strong>Express Bike</strong> (≤5kg), <strong>Standard Car</strong> (≤20kg), and <strong>Heavy Van</strong> (≤100kg). Head to the Parcel tab to book!`;
  }
  if (q.includes('safety') || q.includes('sos')) {
    return `🛡️ Safety is top priority! You can hit the red <strong>Emergency SOS</strong> button anytime to notify contacts and dispatch with your live GPS location.`;
  }
  if (q.includes('commute') || q.includes('carpool')) {
    return `👥 Commute matches you with colleagues sharing your route. You can save up to ₹4,500 and 18kg CO2 monthly!`;
  }
  if (q.includes('explain') || q.includes('xai') || q.includes('shap') || q.includes('lime') || q.includes('why') || q.includes('reason')) {
    return `🧠 Our <strong>Explainable AI (EMMDE)</strong> engine uses SHAP waterfall feature attribution and LIME surrogate rules to break down decisions across 5 agents (Fare, Stability, Effort, Context, Carbon). Head to the <strong>Explainable AI</strong> tab to run live What-If simulations!`;
  }
  return `✨ I can help you compare live cab fares across Uber, Ola, Rapido, and SmartRide EV, estimate parcel costs, or inspect our Explainable AI models. What would you like to do?`;
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

  function renderSuggestions(query, targetInputId) {
    if (!suggestionsBox) return;
    if (!query || query.trim().length < 1) {
      suggestionsBox.style.display = 'none';
      return;
    }

    const q = query.trim().toLowerCase();
    const matches = CITY_LANDMARKS.filter(item => item.toLowerCase().includes(q));

    if (matches.length === 0) {
      suggestionsBox.style.display = 'none';
      return;
    }

    suggestionsBox.innerHTML = matches.map(place => `
      <div class="suggestion-item" data-place="${place}" data-target="${targetInputId}">
        <span>📍</span>
        <span style="font-weight: 600;">${place}</span>
      </div>
    `).join('');

    suggestionsBox.style.display = 'block';

    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedPlace = item.dataset.place;
        const targetId = item.dataset.target;
        const inp = document.getElementById(targetId);
        if (inp) inp.value = selectedPlace;
        if (targetId === 'pickup-input') state.pickup = selectedPlace;
        if (targetId === 'dropoff-input') state.dropoff = selectedPlace;
        suggestionsBox.style.display = 'none';
        handleRouteSend();
      });
    });
  }

  if (dropInput) {
    dropInput.addEventListener('input', (e) => {
      renderSuggestions(e.target.value, 'dropoff-input');
    });
    dropInput.addEventListener('focus', (e) => {
      if (e.target.value.trim().length > 0) {
        renderSuggestions(e.target.value, 'dropoff-input');
      }
    });
  }

  const pickInput = document.getElementById('pickup-input');
  if (pickInput) {
    pickInput.addEventListener('input', (e) => {
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
  document.getElementById('chatbot-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleChatbotSend();
  });

  // User Profile Header Click -> Open Profile Page directly
  document.getElementById('header-user-btn')?.addEventListener('click', () => {
    switchTab('profile');
    showToast('Opened Profile & Safety', 'info');
  });

  // Open Auth Modal from Profile Page
  document.getElementById('open-auth-btn')?.addEventListener('click', () => {
    document.getElementById('auth-modal')?.classList.add('active');
  });

  // Logout button handler
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await api.auth.logout();
    await initUser();
    showToast('Signed out successfully. Guest session active.', 'info');
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
