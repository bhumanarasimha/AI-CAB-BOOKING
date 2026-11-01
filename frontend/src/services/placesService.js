/**
 * SmartRide AI - 100km Radius Geofenced Place Autocomplete & Geocoding Service
 * Strictly restricts suggestions to within a 100 km radius of the user's pickup / current GPS location.
 * Excludes far-off locations, other states, and foreign countries (e.g., Brazil, France, etc.).
 */

// User Location Default: Chennai Central (lat: 13.0827, lng: 80.2707)
export const DEFAULT_USER_COORDS = { lat: 13.0827, lng: 80.2707 };

/**
 * Standard Haversine formula to compute great-circle distance in kilometers
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 99999;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Phonetic & Substring Normalizer for Indian Place Names
 */
export function normalizeIndianPlace(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/oo/g, 'o')
    .replace(/ee/g, 'i')
    .replace(/ll/g, 'l')
    .replace(/aa/g, 'a')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Curated Landmarks with Coordinates (Strictly within Chennai & Nearby Corridors ≤ 100km)
 */
export const COMPREHENSIVE_LANDMARKS = [
  // Poonamallee & West Chennai Corridor
  { name: 'Poonamallee Bus Terminus & Bypass', address: 'Poonamallee High Road, Chennai, Tamil Nadu', lat: 13.0487, lng: 80.1114, aliases: ['ponamallee', 'ponamal', 'poonamalli', 'ponamalli', 'poonamallee bypass'], category: 'transit', icon: '🚌' },
  { name: 'Poonamallee High Road (EVR Periyar Salai)', address: 'National Highway 48, Chennai, Tamil Nadu', lat: 13.0612, lng: 80.1245, aliases: ['ponamallee high road', 'ponamal road', 'nh48 poonamallee'], category: 'landmark', icon: '🛣️' },
  { name: 'Poonamallee Blind School & Market', address: 'Bazaar Street, Poonamallee, Chennai', lat: 13.0515, lng: 80.1082, aliases: ['poonamallee market', 'ponamal market'], category: 'landmark', icon: '🛍️' },
  { name: 'Saveetha University (SIMATS)', address: 'Poonamallee High Road, Velappanchavadi, Chennai', lat: 13.0574, lng: 80.1232, aliases: ['saveetha', 'simats', 'saveetha university poonamallee', 'ponamal saveetha'], category: 'education', icon: '🎓' },
  { name: 'Saveetha Engineering College', address: 'Chettipadu – Nemam Road, Thandalam, Chennai', lat: 13.0265, lng: 80.0159, aliases: ['saveetha engineering', 'saveetha college', 'saveetha thandalam'], category: 'education', icon: '🎓' },
  { name: 'Saveetha Medical College & Hospital', address: 'Saveetha Nagar, Thandalam, Kanchipuram', lat: 13.0246, lng: 80.0173, aliases: ['saveetha medical college', 'saveetha hospital'], category: 'hospital', icon: '🏥' },
  { name: 'Saveetha Dental College & Hospital', address: '162, Poonamallee High Road, Velappanchavadi, Chennai', lat: 13.0590, lng: 80.1330, aliases: ['saveetha dental', 'saveetha velappanchavadi'], category: 'hospital', icon: '🏥' },
  { name: 'Panimalar Engineering College', address: 'Bangalore Trunk Road, Varadharajapuram, Poonamallee', lat: 13.0478, lng: 80.0762, aliases: ['panimalar', 'panimalar poonamallee'], category: 'education', icon: '🎓' },
  { name: 'Rajalakshmi Engineering College (REC)', address: 'Rajalakshmi Nagar, Thandalam, Chennai', lat: 13.0084, lng: 80.0035, aliases: ['rec', 'rajalakshmi', 'rec thandalam'], category: 'education', icon: '🎓' },
  { name: 'Porur Roundtana & Junction', address: 'Mount Poonamallee Road, Porur, Chennai', lat: 13.0360, lng: 80.1585, aliases: ['porur', 'porur signal', 'porur junction'], category: 'transit', icon: '📍' },
  { name: 'DLF Cybercity, Porur', address: 'Shivaji Garden, Mount Poonamallee Road, Manapakkam, Chennai', lat: 13.0289, lng: 80.1650, aliases: ['dlf', 'dlf porur', 'dlf cybercity'], category: 'tech', icon: '🏢' },
  { name: 'Maduravoyal Flyover & Grade Separator', address: 'Koyambedu – Maduravoyal Highway, Chennai', lat: 13.0655, lng: 80.1680, aliases: ['maduravoyal', 'maduravoyal bypass'], category: 'transit', icon: '🛣️' },
  { name: 'Koyambedu CMBT Bus Terminus', address: 'Jawaharlal Nehru Road, Koyambedu, Chennai', lat: 13.0694, lng: 80.1948, aliases: ['koyambedu', 'cmbt', 'koyambedu bus stand'], category: 'transit', icon: '🚌' },

  // OMR & South Chennai IT Corridor
  { name: 'Tidel Park, OMR Tech Corridor', address: 'Rajiv Gandhi Salai, Taramani, Chennai', lat: 12.9893, lng: 80.2474, aliases: ['tidel park', 'omr tidel', 'taramani'], category: 'tech', icon: '🏢' },
  { name: 'Ascendas International Tech Park (ITPB)', address: 'CSIR Road, Taramani, Chennai', lat: 12.9865, lng: 80.2435, aliases: ['ascendas', 'itpb chennai'], category: 'tech', icon: '🏢' },
  { name: 'Ramanujan IT City', address: 'Rajiv Gandhi Salai, Taramani, Chennai', lat: 12.9880, lng: 80.2450, aliases: ['ramanujan', 'ramanujan it park'], category: 'tech', icon: '🏢' },
  { name: 'RMZ Millenia Business Park', address: 'MGR Road, Perungudi, Chennai', lat: 12.9658, lng: 80.2428, aliases: ['rmz millenia', 'perungudi rmz'], category: 'tech', icon: '🏢' },
  { name: 'SIPCOT IT Park, Siruseri', address: 'Rajiv Gandhi Salai (OMR), Siruseri, Tamil Nadu', lat: 12.8285, lng: 80.2220, aliases: ['sipcot', 'siruseri', 'omr sipcot'], category: 'tech', icon: '🏢' },
  { name: 'SRM Institute of Science and Technology', address: 'GST Road, Kattankulathur, Chengalpattu', lat: 12.8231, lng: 80.0442, aliases: ['srm', 'srm university', 'srm ktr'], category: 'education', icon: '🎓' },
  { name: 'VIT Chennai (Vellore Institute of Tech)', address: 'Vandalur-Kelambakkam Road, Chennai', lat: 12.8406, lng: 80.1534, aliases: ['vit', 'vit chennai', 'vit vandalur'], category: 'education', icon: '🎓' },
  { name: 'IIT Madras (Indian Institute of Technology)', address: 'Sardar Patel Road, Adyar, Chennai', lat: 12.9915, lng: 80.2337, aliases: ['iit', 'iit madras', 'iitm'], category: 'education', icon: '🎓' },
  { name: 'Anna University Guindy Campus', address: 'Sardar Patel Road, Guindy, Chennai', lat: 13.0102, lng: 80.2355, aliases: ['anna university', 'ceg guindy'], category: 'education', icon: '🎓' },
  { name: 'Olympia Technology Park, Guindy', address: 'SIDCO Industrial Estate, Guindy, Chennai', lat: 13.0118, lng: 80.2078, aliases: ['olympia', 'olympia tech park'], category: 'tech', icon: '🏢' },
  { name: 'Guindy Kathipara Flyover & Metro Junction', address: 'GST Road, Guindy, Chennai', lat: 13.0067, lng: 80.2025, aliases: ['kathipara', 'guindy metro'], category: 'transit', icon: '📍' },

  // Airports, Stations & Transit
  { name: 'Chennai International Airport (MAA) Terminal 1 & 2', address: 'GST Road, Meenambakkam, Chennai', lat: 12.9941, lng: 80.1709, aliases: ['airport', 'chennai airport', 'maa airport', 'meenambakkam airport'], category: 'transit', icon: '✈️' },
  { name: 'Chennai Central Railway Station (Dr. MGR Central)', address: 'Kannappar Thidal, Periamet, Chennai', lat: 13.0827, lng: 80.2755, aliases: ['central station', 'chennai central', 'mgr central'], category: 'transit', icon: '🚆' },
  { name: 'Chennai Egmore Railway Station', address: 'Gandhi Irwin Road, Egmore, Chennai', lat: 13.0783, lng: 80.2612, aliases: ['egmore', 'egmore station'], category: 'transit', icon: '🚆' },
  { name: 'Tambaram Railway Station & Transit Hub', address: 'GST Road, Tambaram, Chennai', lat: 12.9249, lng: 80.1000, aliases: ['tambaram', 'tambaram station', 'tambaram sanatorium'], category: 'transit', icon: '🚆' },
  { name: 'Kilambakkam KCBT Bus Terminus', address: 'GST Road, Kilambakkam, Vandalur, Chennai', lat: 12.8682, lng: 80.0712, aliases: ['kcbt', 'kilambakkam', 'kilambakkam bus stand'], category: 'transit', icon: '🚌' },
  { name: 'Avadi Railway Station & HVF', address: 'CTH Road, Avadi, Chennai', lat: 13.1165, lng: 80.1025, aliases: ['avadi', 'avadi station'], category: 'transit', icon: '🚆' },
  { name: 'Ambattur Industrial Estate & OT Bus Stand', address: 'Third Main Road, Ambattur, Chennai', lat: 13.0980, lng: 80.1620, aliases: ['ambattur', 'ambattur ot', 'ambattur estate'], category: 'tech', icon: '🏢' },

  // Shopping Malls, Beaches & Hospitals
  { name: 'Phoenix MarketCity & Palladium Mall', address: '142, Velachery Road, Indira Gandhi Nagar, Chennai', lat: 12.9922, lng: 80.2173, aliases: ['phoenix mall', 'phoenix marketcity', 'velachery mall'], category: 'mall', icon: '🛍️' },
  { name: 'Express Avenue Mall, Royapettah', address: '2, Club House Road, Royapettah, Chennai', lat: 13.0588, lng: 80.2642, aliases: ['ea mall', 'express avenue'], category: 'mall', icon: '🛍️' },
  { name: 'VR Chennai Mall, Anna Nagar', address: '100 Feet Road, Jawaharlal Nehru Road, Anna Nagar, Chennai', lat: 13.0847, lng: 80.1983, aliases: ['vr mall', 'vr chennai'], category: 'mall', icon: '🛍️' },
  { name: 'Forum Vijaya Mall, Vadapalani', address: 'Arcot Road, NSK Salai, Vadapalani, Chennai', lat: 13.0505, lng: 80.2093, aliases: ['forum mall', 'vijaya mall', 'vadapalani forum'], category: 'mall', icon: '🛍️' },
  { name: 'Marina Beach Promenade & Lighthouse', address: 'Kamarajar Salai, Triplicane, Chennai', lat: 13.0399, lng: 80.2785, aliases: ['marina beach', 'marina lighthouse'], category: 'landmark', icon: '🏖️' },
  { name: 'Besant Nagar Elliot\'s Beach (Bessie)', address: '6th Avenue, Besant Nagar, Chennai', lat: 12.9990, lng: 80.2700, aliases: ['besant nagar beach', 'elliots beach', 'bessie'], category: 'landmark', icon: '🏖️' },
  { name: 'Kapaleeshwarar Temple, Mylapore', address: 'Vadakkumada St, Mylapore, Chennai', lat: 13.0335, lng: 80.2694, aliases: ['kapaleeshwarar', 'mylapore temple'], category: 'landmark', icon: '🛕' },
  { name: 'T. Nagar Panagal Park Shopping District', address: 'GN Chetty Road, T. Nagar, Chennai', lat: 13.0418, lng: 80.2341, aliases: ['t nagar', 'panagal park', 'ranganathan street'], category: 'landmark', icon: '🛍️' },
  { name: 'Apollo Hospitals Greams Road', address: '21 Greams Lane, Thousand Lights, Chennai', lat: 13.0569, lng: 80.2526, aliases: ['apollo greams road', 'apollo thousand lights'], category: 'hospital', icon: '🏥' },
  { name: 'MIOT International Hospital', address: '4/112, Mount Poonamallee Rd, Manapakkam, Chennai', lat: 13.0245, lng: 80.1830, aliases: ['miot hospital', 'miot manapakkam'], category: 'hospital', icon: '🏥' },

  // Nearby Satellite Hubs (Strictly ≤ 100km radius)
  { name: 'Sriperumbudur Industrial Hub & Memorial', address: 'Bangalore Highway NH48, Sriperumbudur, Tamil Nadu', lat: 12.9699, lng: 79.9405, aliases: ['sriperumbudur', 'sipcot sriperumbudur'], category: 'tech', icon: '🏢' },
  { name: 'Chengalpattu Junction & Medical College', address: 'GST Road, Chengalpattu, Tamil Nadu', lat: 12.6841, lng: 79.9836, aliases: ['chengalpattu', 'chengalpet'], category: 'transit', icon: '🚆' },
  { name: 'Kanchipuram Temple City & Silk Center', address: 'Kanchipuram, Tamil Nadu', lat: 12.8342, lng: 79.7036, aliases: ['kanchipuram', 'kanchi'], category: 'landmark', icon: '🛕' },
  { name: 'Mahabalipuram Shore Temple & Heritage Site', address: 'East Coast Road (ECR), Mahabalipuram, Tamil Nadu', lat: 12.6186, lng: 80.1989, aliases: ['mahabalipuram', 'mamallapuram'], category: 'landmark', icon: '🏖️' },
  { name: 'Thiruvallur Veeraraghava Swamy Temple', address: 'Thiruvallur, Tamil Nadu', lat: 13.1432, lng: 79.9077, aliases: ['thiruvallur', 'tiruvallur'], category: 'landmark', icon: '🛕' },
  { name: 'Maraimalai Nagar Industrial SIPCOT', address: 'GST Road, Maraimalai Nagar, Tamil Nadu', lat: 12.7932, lng: 80.0270, aliases: ['maraimalai nagar', 'mmnagar'], category: 'tech', icon: '🏢' },
  { name: 'Guduvanchery Transit Hub & Bus Stand', address: 'GST Road, Guduvanchery, Chengalpattu', lat: 12.8437, lng: 80.0610, aliases: ['guduvanchery'], category: 'transit', icon: '🚌' },
  { name: 'Kelambakkam Junction (OMR - ECR Link)', address: 'Vandalur-Kelambakkam Rd, Kelambakkam', lat: 12.7876, lng: 80.2201, aliases: ['kelambakkam', 'omr kelambakkam'], category: 'transit', icon: '📍' },
  { name: 'Thiruporur Murugan Temple (OMR Corridor)', address: 'Old Mahabalipuram Rd, Thiruporur', lat: 12.7248, lng: 80.1873, aliases: ['thiruporur', 'tiruporur'], category: 'landmark', icon: '🛕' }
];

/**
 * Filter Curated Landmarks within 100km radius with phonetic matching
 */
export function searchLocalLandmarks(query, userCoords = DEFAULT_USER_COORDS, maxDistanceKm = 100, limit = 8) {
  if (!query || query.trim().length === 0) return [];
  const qClean = query.trim().toLowerCase();
  const qNorm = normalizeIndianPlace(query);

  const latAnchor = userCoords?.lat || DEFAULT_USER_COORDS.lat;
  const lngAnchor = userCoords?.lng || DEFAULT_USER_COORDS.lng;

  const matches = [];

  for (const item of COMPREHENSIVE_LANDMARKS) {
    const nameLower = item.name.toLowerCase();
    const addrLower = item.address.toLowerCase();
    const nameNorm = normalizeIndianPlace(item.name);
    const addrNorm = normalizeIndianPlace(item.address);

    const isMatch = 
      nameLower.includes(qClean) || 
      addrLower.includes(qClean) ||
      nameNorm.includes(qNorm) || 
      addrNorm.includes(qNorm) ||
      (item.aliases && item.aliases.some(a => a.includes(qClean) || normalizeIndianPlace(a).includes(qNorm)));

    if (isMatch) {
      const distance = haversineDistance(latAnchor, lngAnchor, item.lat, item.lng);
      // STRICT FILTER: Discard any place > 100km away
      if (distance <= maxDistanceKm) {
        matches.push({
          id: `local_${item.name}`,
          name: item.name,
          address: item.address,
          fullText: `${item.name}, ${item.address}`,
          category: item.category,
          icon: item.icon || '📍',
          lat: item.lat,
          lng: item.lng,
          distanceKm: Math.round(distance * 10) / 10,
          isOnline: false
        });
      }
    }
  }

  // Sort closest first
  matches.sort((a, b) => a.distanceKm - b.distanceKm);
  return matches.slice(0, limit);
}

/**
 * Live Online Geocoding via Photon OpenStreetMap API with STRICT 100KM RADIUS FILTER
 */
async function fetchPhotonNearbySuggestions(query, userCoords = DEFAULT_USER_COORDS, maxDistanceKm = 100, limit = 6) {
  try {
    const latAnchor = userCoords?.lat || DEFAULT_USER_COORDS.lat;
    const lngAnchor = userCoords?.lng || DEFAULT_USER_COORDS.lng;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2400);

    // Pass lat/lon to bias Photon towards the user's city
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${latAnchor}&lon=${lngAnchor}&limit=16`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.features || !Array.isArray(data.features)) return [];

    const validNearby = [];

    for (const f of data.features) {
      const p = f.properties || {};

      // STRICT CHECK 1: Must be in India! Exclude Brazil, France, US, Europe, etc.
      const countryCode = (p.countrycode || '').toUpperCase();
      const countryName = (p.country || '').toLowerCase();
      if (countryCode && countryCode !== 'IN') continue;
      if (countryName && !countryName.includes('india') && !countryName.includes('bharat')) continue;

      // Extract coordinates: GeoJSON is [lon, lat]
      const [featLon, featLat] = f.geometry?.coordinates || [];
      if (featLat == null || featLon == null) continue;

      // STRICT CHECK 2: Calculate exact Haversine distance in km
      const distance = haversineDistance(latAnchor, lngAnchor, featLat, featLon);
      if (distance > maxDistanceKm) {
        // Discard far-off places (e.g. Kerala at 500km, Brazil at 14000km, etc.)
        continue;
      }

      const name = p.name || p.street || p.city || 'Location';
      const parts = [p.street, p.locality || p.district, p.city, p.state].filter(Boolean);
      const address = parts.length > 0 ? parts.join(', ') : 'Tamil Nadu, India';

      let icon = '📍';
      if (p.osm_value === 'college' || p.osm_value === 'university' || p.osm_value === 'school') icon = '🎓';
      else if (p.osm_value === 'hospital' || p.osm_value === 'clinic' || p.osm_value === 'blood_bank') icon = '🏥';
      else if (p.osm_value === 'aerodrome' || p.osm_value === 'airport') icon = '✈️';
      else if (p.osm_value === 'station' || p.osm_value === 'bus_stop') icon = '🚆';
      else if (p.osm_value === 'mall' || p.osm_value === 'supermarket') icon = '🛍️';

      validNearby.push({
        id: `osm_${p.osm_id || Math.random()}`,
        name: name,
        address: address,
        fullText: `${name}, ${address}`,
        category: p.osm_value || 'place',
        icon: icon,
        lat: featLat,
        lng: featLon,
        distanceKm: Math.round(distance * 10) / 10,
        isOnline: true
      });
    }

    validNearby.sort((a, b) => a.distanceKm - b.distanceKm);
    return validNearby.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Fallback Live Online Geocoding via Nominatim with Strict 100km Viewbox
 */
async function fetchNominatimNearbySuggestions(query, userCoords = DEFAULT_USER_COORDS, maxDistanceKm = 100, limit = 5) {
  try {
    const latAnchor = userCoords?.lat || DEFAULT_USER_COORDS.lat;
    const lngAnchor = userCoords?.lng || DEFAULT_USER_COORDS.lng;

    // Viewbox for ~100 km (~0.9 degree latitude, ~1.0 degree longitude)
    const latDelta = (maxDistanceKm / 111.0);
    const lonDelta = (maxDistanceKm / (111.0 * Math.cos(latAnchor * Math.PI / 180)));

    const left = (lngAnchor - lonDelta).toFixed(4);
    const bottom = (latAnchor - latDelta).toFixed(4);
    const right = (lngAnchor + lonDelta).toFixed(4);
    const top = (latAnchor + latDelta).toFixed(4);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2400);

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&viewbox=${left},${bottom},${right},${top}&bounded=1&countrycodes=in&limit=${limit}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results = [];
    for (const item of data) {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (isNaN(lat) || isNaN(lon)) continue;

      const distance = haversineDistance(latAnchor, lngAnchor, lat, lon);
      if (distance > maxDistanceKm) continue;

      const parts = (item.display_name || '').split(',').map(s => s.trim());
      const name = item.name || parts[0] || 'Location';
      const address = parts.slice(1, 4).join(', ') || parts.join(', ');

      let icon = '📍';
      if (item.type === 'college' || item.type === 'university') icon = '🎓';
      else if (item.type === 'hospital') icon = '🏥';
      else if (item.type === 'town' || item.type === 'suburb') icon = '🏙️';

      results.push({
        id: `nom_${item.place_id}`,
        name: name,
        address: address,
        fullText: item.display_name,
        category: item.type || 'place',
        icon: icon,
        lat: lat,
        lng: lon,
        distanceKm: Math.round(distance * 10) / 10,
        isOnline: true
      });
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return results;
  } catch {
    return [];
  }
}

/**
 * Universal Place Autocomplete Orchestrator (100km Geofenced)
 * 1. Delivers instantaneous local matches within 100km
 * 2. Enriches with live geocoded Indian locations within 100km
 * 3. Discards any overseas or >100km places (Brazil, France, distant states)
 */
export async function searchAllPlaces(query, userCoords = DEFAULT_USER_COORDS, onLiveUpdate = null, maxDistanceKm = 100) {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const cleanQuery = query.trim();

  // Tier 1: Instant local results (guaranteed <= 100km)
  const localMatches = searchLocalLandmarks(cleanQuery, userCoords, maxDistanceKm, 6);
  if (onLiveUpdate && localMatches.length > 0) {
    onLiveUpdate(localMatches);
  }

  // Tier 2: Live online geocoding restricted to <= 100km & India only
  try {
    let onlineResults = await fetchPhotonNearbySuggestions(cleanQuery, userCoords, maxDistanceKm, 6);

    // If phonetic query expansion is needed (e.g. ponamal -> poonamallee)
    if (onlineResults.length === 0 && cleanQuery.toLowerCase().includes('ponam')) {
      onlineResults = await fetchPhotonNearbySuggestions('poonamallee', userCoords, maxDistanceKm, 5);
    }

    if (!onlineResults || onlineResults.length === 0) {
      onlineResults = await fetchNominatimNearbySuggestions(cleanQuery, userCoords, maxDistanceKm, 5);
      if (onlineResults.length === 0 && cleanQuery.toLowerCase().includes('ponam')) {
        onlineResults = await fetchNominatimNearbySuggestions('poonamallee', userCoords, maxDistanceKm, 5);
      }
    }

    // Merge and deduplicate by name
    const seenNames = new Set(localMatches.map(m => m.name.toLowerCase().trim()));
    const uniqueOnline = [];

    for (const item of onlineResults) {
      const lower = item.name.toLowerCase().trim();
      if (!seenNames.has(lower) && item.distanceKm <= maxDistanceKm) {
        seenNames.add(lower);
        uniqueOnline.push(item);
      }
    }

    const merged = [...localMatches, ...uniqueOnline];
    merged.sort((a, b) => a.distanceKm - b.distanceKm);

    const finalFiltered = merged.slice(0, 8);
    if (onLiveUpdate) {
      onLiveUpdate(finalFiltered);
    }
    return finalFiltered;
  } catch {
    return localMatches;
  }
}
