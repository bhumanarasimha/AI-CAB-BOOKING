/**
 * SmartRide AI - Resilient Multi-Provider Place Autocomplete & Geocoding Service
 * Combines comprehensive offline curated Indian landmark hubs with live Photon & Nominatim OpenStreetMap
 * and Google Places Autocomplete fallback.
 */

export const COMPREHENSIVE_LANDMARKS = [
  // Colleges & Universities (Chennai & South India)
  { name: 'Saveetha Engineering College', address: 'Chettipadu – Nemam Road, Thandalam, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'Saveetha University (SIMATS)', address: 'Poonamallee High Road, Velappanchavadi, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'Saveetha Medical College & Hospital', address: 'Saveetha Nagar, Thandalam, Kanchipuram, Tamil Nadu', category: 'hospital', icon: '🏥' },
  { name: 'Saveetha Dental College & Hospital', address: '162, Poonamallee High Road, Velappanchavadi, Chennai', category: 'hospital', icon: '🏥' },
  { name: 'Saveetha School of Management & Law', address: 'Poonamallee Bypass Road, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'SRM Institute of Science and Technology', address: 'Kattankulathur, Chengalpattu, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'SRM University Ramapuram Campus', address: 'Bharathi Salai, Ramapuram, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'VIT Chennai (Vellore Institute of Tech)', address: 'Vandalur-Kelambakkam Road, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'IIT Madras (Indian Institute of Technology)', address: 'Sardar Patel Road, Adyar, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'Anna University Guindy Campus', address: 'Sardar Patel Road, Guindy, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'Loyola College', address: 'Sterling Road, Nungambakkam, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'Madras Christian College (MCC)', address: 'Tambaram East, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'SSN College of Engineering', address: 'Rajiv Gandhi Salai (OMR), Kalavakkam, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'Sathyabama Institute of Science and Technology', address: 'Jeppiaar Nagar, Rajiv Gandhi Salai, Chennai', category: 'education', icon: '🎓' },
  { name: 'Hindustan Institute of Tech & Science (HITS)', address: 'Rajiv Gandhi Salai (OMR), Padur, Chennai', category: 'education', icon: '🎓' },
  { name: 'B.S. Abdur Rahman Crescent Institute', address: 'GST Road, Vandalur, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'Panimalar Engineering College', address: 'Bangalore Trunk Road, Varadharajapuram, Poonamallee, Chennai', category: 'education', icon: '🎓' },
  { name: 'Rajalakshmi Engineering College (REC)', address: 'Rajalakshmi Nagar, Thandalam, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'Sri Venkateswara College of Engineering (SVCE)', address: 'Pennalur, Sriperumbudur, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'St. Joseph\'s College of Engineering', address: 'OMR, Kamaraj Nagar, Semmancheri, Chennai', category: 'education', icon: '🎓' },
  { name: 'Stella Maris College', address: 'Cathedral Road, Teynampet, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'Ethiraj College for Women', address: 'Ethiraj Salai, Egmore, Chennai, Tamil Nadu', category: 'education', icon: '🎓' },
  { name: 'DG Vaishnav College', address: 'Gokul Bagh, Poonamallee High Road, Arumbakkam, Chennai', category: 'education', icon: '🎓' },

  // Tech Parks & Business Corridors
  { name: 'Tidel Park, OMR Tech Corridor', address: 'No. 4, Rajiv Gandhi Salai, Taramani, Chennai', category: 'tech', icon: '🏢' },
  { name: 'DLF Cybercity, Porur', address: 'Mount Poonamallee Road, Shivaji Nagar, Manapakkam, Chennai', category: 'tech', icon: '🏢' },
  { name: 'RMZ Millenia Business Park', address: 'Campus 1B, MGR Road, Perungudi, Chennai', category: 'tech', icon: '🏢' },
  { name: 'Ascendas International Tech Park (ITPB)', address: 'CSIR Road, Taramani, Chennai, Tamil Nadu', category: 'tech', icon: '🏢' },
  { name: 'Ramanujan IT City', address: 'Rajiv Gandhi Salai, Taramani, Chennai, Tamil Nadu', category: 'tech', icon: '🏢' },
  { name: 'Olympia Technology Park', address: '1, SIDCO Industrial Estate, Guindy, Chennai', category: 'tech', icon: '🏢' },
  { name: 'SIPCOT IT Park, Siruseri', address: 'Rajiv Gandhi Salai (OMR), Siruseri, Tamil Nadu', category: 'tech', icon: '🏢' },
  { name: 'L&T Innovation Campus & IT Park', address: 'Mount Poonamallee Road, Manapakkam, Chennai', category: 'tech', icon: '🏢' },
  { name: 'Prince Info City I & II', address: 'Rajiv Gandhi Salai, Kandanchavadi, Perungudi, Chennai', category: 'tech', icon: '🏢' },
  { name: 'Ambattur Industrial Estate & Tech Zone', address: 'Third Main Road, Ambattur, Chennai', category: 'tech', icon: '🏢' },
  { name: 'Electronic City Phase 1 & 2', address: 'Hosur Road, South Bangalore, Karnataka', category: 'tech', icon: '🏢' },
  { name: 'Manyata Embassy Business Park', address: 'Outer Ring Road, Nagavara, Bangalore', category: 'tech', icon: '🏢' },
  { name: 'Bagmane Tech Park', address: 'CV Raman Nagar, Bangalore, Karnataka', category: 'tech', icon: '🏢' },
  { name: 'Hitech City Cyber Towers', address: 'Madhapur, Hitech City, Hyderabad, Telangana', category: 'tech', icon: '🏢' },
  { name: 'DLF Cyber City DLF Phase 2', address: 'Sector 24, Gurugram, Haryana', category: 'tech', icon: '🏢' },
  { name: 'Bandra Kurla Complex (BKC)', address: 'Bandra East, Mumbai, Maharashtra', category: 'tech', icon: '🏢' },

  // Transport Hubs & Airports
  { name: 'Chennai International Airport (MAA) Terminal 1 & 2', address: 'GST Road, Meenambakkam, Chennai', category: 'transit', icon: '✈️' },
  { name: 'Chennai Central Railway Station (Dr. MGR Central)', address: 'Kannappar Thidal, Periamet, Chennai', category: 'transit', icon: '🚆' },
  { name: 'Chennai Egmore Railway Station', address: 'Gandhi Irwin Road, Egmore, Chennai', category: 'transit', icon: '🚆' },
  { name: 'Tambaram Railway Station & Transit Hub', address: 'GST Road, Tambaram, Chennai', category: 'transit', icon: '🚆' },
  { name: 'Koyambedu CMBT Bus Terminus', address: 'Jawaharlal Nehru Road, Koyambedu, Chennai', category: 'transit', icon: '🚌' },
  { name: 'Kilambakkam KCBT Bus Terminus', address: 'GST Road, Kilambakkam, Vandalur, Chennai', category: 'transit', icon: '🚌' },
  { name: 'Kempegowda International Airport (BLR)', address: 'Devanahalli, Bangalore, Karnataka', category: 'transit', icon: '✈️' },
  { name: 'KSR Bengaluru City Railway Station', address: 'Majestic, Bengaluru, Karnataka', category: 'transit', icon: '🚆' },
  { name: 'Indira Gandhi International Airport (DEL)', address: 'Palam, New Delhi, Delhi', category: 'transit', icon: '✈️' },
  { name: 'Rajiv Gandhi International Airport (HYD)', address: 'Shamshabad, Hyderabad, Telangana', category: 'transit', icon: '✈️' },

  // Hospitals & Healthcare
  { name: 'Apollo Hospitals Greams Road', address: '21 Greams Lane, Thousand Lights, Chennai', category: 'hospital', icon: '🏥' },
  { name: 'Apollo Speciality Hospitals OMR', address: '05/639, Old Mahabalipuram Rd, Perungudi, Chennai', category: 'hospital', icon: '🏥' },
  { name: 'MIOT International Hospital', address: '4/112, Mount Poonamallee Rd, Manapakkam, Chennai', category: 'hospital', icon: '🏥' },
  { name: 'Fortis Malar Hospital', address: '52, 1st Main Rd, Gandhi Nagar, Adyar, Chennai', category: 'hospital', icon: '🏥' },
  { name: 'SIMS Hospital Vadapalani', address: '1, Jawaharlal Nehru Salai, Vadapalani, Chennai', category: 'hospital', icon: '🏥' },
  { name: 'Gleneagles Global Health City', address: '439, Cheran Nagar, Perumbakkam, Chennai', category: 'hospital', icon: '🏥' },
  { name: 'Dr. Rela Institute & Medical Centre', address: '7, CLC Works Rd, Nagappa Nagar, Chromepet, Chennai', category: 'hospital', icon: '🏥' },
  { name: 'Kauvery Hospital Alwarpet', address: '199, Luz Church Rd, Alwarpet, Chennai', category: 'hospital', icon: '🏥' },
  { name: 'Madras Medical College & RGGGH', address: 'EVR Periyar Salai, Park Town, Chennai', category: 'hospital', icon: '🏥' },

  // Famous Shopping Malls & Tourist Destinations
  { name: 'Phoenix MarketCity & Palladium Mall', address: '142, Velachery Road, Indira Gandhi Nagar, Chennai', category: 'mall', icon: '🛍️' },
  { name: 'Express Avenue Mall', address: '2, Club House Road, Royapettah, Chennai', category: 'mall', icon: '🛍️' },
  { name: 'VR Chennai Mall', address: '100 Feet Road, Jawaharlal Nehru Road, Anna Nagar, Chennai', category: 'mall', icon: '🛍️' },
  { name: 'Forum Vijaya Mall', address: 'Arcot Road, NSK Salai, Vadapalani, Chennai', category: 'mall', icon: '🛍️' },
  { name: 'Marina Beach Promenade & Lighthouse', address: 'Kamarajar Salai, Triplicane, Chennai', category: 'landmark', icon: '🏖️' },
  { name: 'Besant Nagar Elliot\'s Beach (Bessie)', address: '6th Avenue, Besant Nagar, Chennai', category: 'landmark', icon: '🏖️' },
  { name: 'Kapaleeshwarar Temple', address: 'Vadakkumada St, Mylapore, Chennai', category: 'landmark', icon: '🛕' },
  { name: 'Anna Nagar West Roundtana & Tower Park', address: '3rd Avenue, Anna Nagar West, Chennai', category: 'landmark', icon: '🌳' },
  { name: 'T. Nagar Panagal Park & Shopping District', address: 'Gopathy Narayanaswamy Chetty Rd, T. Nagar, Chennai', category: 'landmark', icon: '🛍️' },
  { name: 'Guindy National Park & Children\'s Park', address: 'Rangeguindy, Guindy, Chennai', category: 'landmark', icon: '🦁' },
  { name: 'Indiranagar 100ft Road', address: 'Indiranagar, Bangalore, Karnataka', category: 'landmark', icon: '📍' },
  { name: 'MG Road & Brigade Road', address: 'Central Business District, Bangalore, Karnataka', category: 'landmark', icon: '📍' },
  { name: 'Vadapalani Murugan Temple', address: 'Palani Andavar Koil St, Vadapalani, Chennai', category: 'landmark', icon: '🛕' }
];

/**
 * Fast synchronous search on curated landmarks
 */
export function searchLocalLandmarks(query, limit = 8) {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();

  return COMPREHENSIVE_LANDMARKS.filter(item => {
    return item.name.toLowerCase().includes(q) || 
           item.address.toLowerCase().includes(q) ||
           (item.category && item.category.toLowerCase().includes(q));
  }).slice(0, limit).map(item => ({
    id: `local_${item.name}`,
    name: item.name,
    address: item.address,
    fullText: `${item.name}, ${item.address}`,
    category: item.category,
    icon: item.icon || '📍',
    isOnline: false
  }));
}

/**
 * Live Online Geocoding via Photon OpenStreetMap API (Fast & Free)
 */
async function fetchPhotonSuggestions(query, limit = 6) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map(f => {
      const p = f.properties || {};
      const name = p.name || p.street || p.city || 'Location';
      const parts = [p.street, p.locality || p.district, p.city, p.state, p.country].filter(Boolean);
      const address = parts.length > 0 ? parts.join(', ') : 'India';

      let icon = '📍';
      if (p.osm_value === 'college' || p.osm_value === 'university' || p.osm_value === 'school') icon = '🎓';
      else if (p.osm_value === 'hospital' || p.osm_value === 'clinic' || p.osm_value === 'blood_bank') icon = '🏥';
      else if (p.osm_value === 'aerodrome' || p.osm_value === 'airport') icon = '✈️';
      else if (p.osm_value === 'station' || p.osm_value === 'bus_stop') icon = '🚆';
      else if (p.osm_value === 'mall' || p.osm_value === 'supermarket') icon = '🛍️';

      return {
        id: `osm_${p.osm_id || Math.random()}`,
        name: name,
        address: address,
        fullText: `${name}, ${address}`,
        category: p.osm_value || 'place',
        icon: icon,
        isOnline: true
      };
    });
  } catch (_e) {
    return [];
  }
}

/**
 * Fallback Live Online Geocoding via Nominatim OpenStreetMap API
 */
async function fetchNominatimSuggestions(query, limit = 5) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=in&limit=${limit}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map(item => {
      const parts = (item.display_name || '').split(',').map(s => s.trim());
      const name = item.name || parts[0] || 'Location';
      const address = parts.slice(1, 4).join(', ') || parts.join(', ');

      let icon = '📍';
      if (item.type === 'college' || item.type === 'university') icon = '🎓';
      else if (item.type === 'hospital') icon = '🏥';

      return {
        id: `nom_${item.place_id}`,
        name: name,
        address: address,
        fullText: item.display_name,
        category: item.type || 'place',
        icon: icon,
        isOnline: true
      };
    });
  } catch (_e) {
    return [];
  }
}

/**
 * Universal Place Autocomplete Orchestrator
 * Returns instantaneous local matches + dynamically enriched live geocoding results
 */
export async function searchAllPlaces(query, onLiveUpdate = null) {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const cleanQuery = query.trim();

  // 1. Instant local results
  const localMatches = searchLocalLandmarks(cleanQuery, 6);
  if (onLiveUpdate && localMatches.length > 0) {
    onLiveUpdate(localMatches);
  }

  // If query is very short, local is sufficient
  if (cleanQuery.length < 2) {
    return localMatches;
  }

  // 2. Fetch live online results concurrently
  try {
    let onlineResults = await fetchPhotonSuggestions(cleanQuery, 6);
    if (!onlineResults || onlineResults.length === 0) {
      onlineResults = await fetchNominatimSuggestions(cleanQuery, 5);
    }

    // 3. Deduplicate by lowercased name
    const seenNames = new Set(localMatches.map(m => m.name.toLowerCase().trim()));
    const uniqueOnline = [];

    for (const item of onlineResults) {
      const lower = item.name.toLowerCase().trim();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        uniqueOnline.push(item);
      }
    }

    const merged = [...localMatches, ...uniqueOnline].slice(0, 8);
    if (onLiveUpdate) {
      onLiveUpdate(merged);
    }
    return merged;
  } catch {
    return localMatches;
  }
}
