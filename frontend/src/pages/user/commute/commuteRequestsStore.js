/**
 * Community / Smart Commute Requests Store
 * Persists user-created commute requests & pool bookings in localStorage
 * and syncs with Backend /api/commute/requests so they appear immediately
 * on the Community / Commute interface across both Web and Android.
 */

const STORAGE_KEY = 'smartride_commute_requests_v1';
const UPDATE_EVENT = 'smartride:commute-requests-updated';

function getBackendBaseUrl() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return '';
}

export function loadLocalCommuteRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalCommuteRequests(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: list }));
    }
  } catch (err) {
    console.warn('Could not save commute requests:', err);
  }
}

export async function fetchSyncedCommuteRequests() {
  const local = loadLocalCommuteRequests();
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) return local;

  try {
    const res = await fetch(`${baseUrl}/api/commute/requests`);
    if (!res.ok) return local;
    const data = await res.json();
    if (data?.success && Array.isArray(data.requests)) {
      // Merge backend + local deduplicated by id (newest first)
      const byId = new Map();
      [...local, ...data.requests].forEach((item) => {
        if (item?.id && !byId.has(item.id)) {
          byId.set(item.id, item);
        }
      });
      const merged = Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      saveLocalCommuteRequests(merged);
      return merged;
    }
  } catch {
    // Offline/Android WebView gracefully uses localStorage
  }
  return local;
}

export function addCommuteRequest(payload) {
  const req = {
    id: payload.id || `commute_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`,
    type: payload.type || 'posted', // 'posted' | 'pool_booking'
    userName: payload.userName || 'You',
    role: payload.role || 'rider',
    source: payload.source || 'Current Location',
    destination: payload.destination || 'Tidel Park, OMR',
    departureTime: payload.departureTime || '08:30',
    returnTime: payload.returnTime || '18:00',
    transport: payload.transport || 'car',
    workMode: payload.workMode || 'office',
    vehicleNumber: payload.vehicleNumber || '',
    partnerName: payload.partnerName || '',
    partnerCar: payload.partnerCar || '',
    otp: payload.otp || '',
    seats: payload.seats || 1,
    status: payload.status || (payload.type === 'pool_booking' ? 'Pool Confirmed' : 'Active Request'),
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  const current = loadLocalCommuteRequests().filter((r) => r.id !== req.id);
  const next = [req, ...current].slice(0, 50);
  saveLocalCommuteRequests(next);

  // Fire-and-forget backend sync
  const baseUrl = getBackendBaseUrl();
  if (baseUrl) {
    fetch(`${baseUrl}/api/commute/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }).catch(() => {});
  }

  return req;
}

export function deleteCommuteRequest(id) {
  const next = loadLocalCommuteRequests().filter((r) => r.id !== id);
  saveLocalCommuteRequests(next);

  const baseUrl = getBackendBaseUrl();
  if (baseUrl && id) {
    fetch(`${baseUrl}/api/commute/requests?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  }

  return next;
}

export function subscribeCommuteRequests(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(loadLocalCommuteRequests());
  window.addEventListener(UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
