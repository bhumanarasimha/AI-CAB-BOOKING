import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';

export const useGPSLocation = () => {
  const auth = useAuth();
  const currentLocation = auth?.currentLocation;
  const geoCache = useRef({});
  const locationRef = useRef();

  // Retrieve user's previously confirmed pickup or fallback to neutral Current Location
  const getInitialPickup = () => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('smartride_user_pickup');
        if (saved) {
          if (
            saved.includes('Ekambareswara') || saved.includes('Agraharam') || saved.includes('Sowcarpet') ||
            saved.includes('Amphitheatre') || saved.includes('Mountain View') || saved.includes('California') ||
            saved.includes('Shoreline')
          ) {
            localStorage.removeItem('smartride_user_pickup');
          } else {
            return saved;
          }
        }
      } catch {}
    }
    return currentLocation?.address || 'Current Location';
  };

  const isOperatingCountry = (lat, lng) => {
    return typeof lat === 'number' && typeof lng === 'number' &&
      lat >= 6.0 && lat <= 36.5 && lng >= 68.0 && lng <= 98.0;
  };

  const getEffectiveCoords = (coords) => {
    if (coords && isOperatingCountry(coords.lat, coords.lng)) {
      return coords;
    }
    return { lat: 13.0827, lng: 80.2707 };
  };

  const [location, setLocation] = useState({
    coords: getEffectiveCoords(currentLocation?.coords),
    address: getInitialPickup(),
    loading: !currentLocation,
    error: null
  });

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Sync state if global location updates
  useEffect(() => {
    if (currentLocation && currentLocation.coords && location.coords && (
      currentLocation.address !== location.address || 
      currentLocation.coords.lat !== location.coords.lat ||
      currentLocation.coords.lng !== location.coords.lng
    )) {
      setLocation({
        coords: currentLocation.coords,
        address: currentLocation.address,
        loading: false,
        error: null
      });
    }
  }, [currentLocation, location.address, location.coords]);

  const sanitizeAddress = (rawAddr) => {
    if (!rawAddr) return 'Current Location';
    // Reject ISP datacenter Sowcarpet fallback street (Airtel gateway)
    if (rawAddr.includes('Ekambareswara') || rawAddr.includes('Agraharam') || rawAddr.includes('Sowcarpet')) {
      try {
        localStorage.removeItem('smartride_user_pickup');
      } catch {}
      return 'Current Location';
    }
    // Reject Android Emulator default mock GPS in Mountain View, CA
    if (
      rawAddr.includes('Amphitheatre') || 
      rawAddr.includes('Mountain View') || 
      rawAddr.includes('California') || 
      rawAddr.includes('Shoreline') ||
      rawAddr.includes('Charleston Rd')
    ) {
      try {
        localStorage.removeItem('smartride_user_pickup');
      } catch {}
      return 'Current Location';
    }
    return rawAddr;
  };

  const reverseGeocode = useCallback(async (lat, lng) => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (geoCache.current[cacheKey]) return geoCache.current[cacheKey];

    // If coordinates match known Airtel ISP gateway in Sowcarpet (13.0878, 80.2785), avoid resolving to fake street
    if (Math.abs(lat - 13.0878) < 0.008 && Math.abs(lng - 80.2785) < 0.008) {
      try {
        localStorage.removeItem('smartride_user_pickup');
      } catch {}
      geoCache.current[cacheKey] = 'Current Location';
      return 'Current Location';
    }

    return new Promise((resolve) => {
      const google = window.google;
      if (!google || !google.maps) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'SmartRide-AI-Cab/1.0' }
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.address) {
              const road = data.address.road || data.address.suburb || data.address.neighbourhood || '';
              const city = data.address.city || data.address.town || data.address.village || '';
              let finalAddr = road ? (city ? `${road}, ${city}` : road) : (data.display_name.split(',')[0] || 'Current Location');
              finalAddr = sanitizeAddress(finalAddr);
              geoCache.current[cacheKey] = finalAddr;
              resolve(finalAddr);
            } else {
              resolve('Current Location');
            }
          })
          .catch(() => {
            resolve('Current Location');
          });
        return;
      }

      try {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const display = result.formatted_address.split(',')[0];
            const city = result.address_components.find(c => c.types.includes('locality'))?.long_name || '';

            let finalAddr = city ? `${display}, ${city}` : display;
            finalAddr = sanitizeAddress(finalAddr);
            geoCache.current[cacheKey] = finalAddr;
            resolve(finalAddr);
          } else {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
              headers: { 'Accept-Language': 'en', 'User-Agent': 'SmartRide-AI-Cab/1.0' }
            })
              .then(res => res.json())
              .then(data => {
                if (data && data.address) {
                  const road = data.address.road || data.address.suburb || data.address.neighbourhood || '';
                  const city = data.address.city || data.address.town || data.address.village || '';
                  let finalAddr = road ? (city ? `${road}, ${city}` : road) : (data.display_name.split(',')[0] || 'Current Location');
                  finalAddr = sanitizeAddress(finalAddr);
                  geoCache.current[cacheKey] = finalAddr;
                  resolve(finalAddr);
                } else {
                  resolve('Current Location');
                }
              })
              .catch(() => {
                resolve('Current Location');
              });
          }
        });
      } catch (error) {
        resolve('Current Location');
      }
    });
  }, []);

  const fetchIPLocation = useCallback(async () => {
    // 1. Try ipapi.co
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          return { lat: data.latitude, lng: data.longitude, city: data.city, region: data.region };
        }
      }
    } catch {
      console.warn("ipapi.co failed, trying ipinfo.io...");
    }

    // 2. Try ipinfo.io
    try {
      const res = await fetch('https://ipinfo.io/json');
      if (res.ok) {
        const data = await res.json();
        if (data.loc) {
          const [latStr, lngStr] = data.loc.split(',');
          return {
            lat: parseFloat(latStr),
            lng: parseFloat(lngStr),
            city: data.city,
            region: data.region
          };
        }
      }
    } catch {
      console.warn("ipinfo.io failed, trying ip-api.com...");
    }

    return null;
  }, []);

  const fetchLocation = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));

    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      return;
    }

    // Fast IP estimate: do NOT set a fake street name for an IP block
    try {
      const ipData = await fetchIPLocation();
      if (ipData && ipData.lat && ipData.lng && !currentLocation) {
        const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('smartride_user_pickup') : null;
        setLocation(prev => ({
          ...prev,
          coords: { lat: ipData.lat, lng: ipData.lng },
          address: (saved && !saved.includes('Ekambareswara')) ? saved : 'Current Location',
          loading: false
        }));
      }
    } catch (err) {
      console.warn("Fast IP detection warning:", err);
    }

    // High-accuracy GPS tracking
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const currentLoc = locationRef.current;

        const safeCoords = getEffectiveCoords({ lat: latitude, lng: longitude });
        const inIndia = isOperatingCountry(latitude, longitude);

        const currentCoords = currentLoc?.coords;
        const distance = currentCoords ?
          Math.sqrt(Math.pow(safeCoords.lat - currentCoords.lat, 2) + Math.pow(safeCoords.lng - currentCoords.lng, 2)) * 111000 :
          100;

        if (distance > 5 || currentLoc.loading) {
          const rawAddress = inIndia ? await reverseGeocode(latitude, longitude) : 'Current Location';
          const cleanAddress = sanitizeAddress(rawAddress);
          setLocation({
            coords: safeCoords,
            address: cleanAddress,
            loading: false,
            error: null
          });
        }
      },
      (error) => {
        console.warn("GPS watch error:", error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return watchId;
  }, [currentLocation, reverseGeocode, fetchIPLocation]);

  useEffect(() => {
    let watchId;
    let isCancelled = false;

    if (!currentLocation) {
      const timeoutId = setTimeout(() => {
        if (isCancelled) return;
        fetchLocation().then(id => {
          if (!isCancelled) {
            watchId = id;
          } else if (id) {
            navigator.geolocation.clearWatch(id);
          }
        });
      }, 0);

      return () => {
        isCancelled = true;
        clearTimeout(timeoutId);
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [currentLocation, fetchLocation]);

  const refresh = useCallback(() => {
    if (!currentLocation) fetchLocation();
  }, [currentLocation, fetchLocation]);

  const detectHighAccuracyGPS = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocation(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
        resolve(null);
        return;
      }

      setLocation(prev => ({ ...prev, loading: true, address: 'Detecting GPS location...' }));

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const safeCoords = getEffectiveCoords({ lat: latitude, lng: longitude });
          const inIndia = isOperatingCountry(latitude, longitude);
          const rawAddress = inIndia ? await reverseGeocode(latitude, longitude) : 'Current Location';
          const sanitized = sanitizeAddress(rawAddress);
          const finalLoc = {
            coords: safeCoords,
            address: sanitized || 'Current Location',
            loading: false,
            error: null
          };
          if (typeof localStorage !== 'undefined' && sanitized && sanitized !== 'Current Location') {
            localStorage.setItem('smartride_user_pickup', sanitized);
          }
          setLocation(finalLoc);
          resolve(finalLoc);
        },
        (error) => {
          console.warn("High accuracy GPS error:", error);
          const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('smartride_user_pickup') : null;
          const fallbackLoc = {
            coords: { lat: 13.0827, lng: 80.2707 },
            address: (saved && !saved.includes('Ekambareswara')) ? saved : 'Current Location',
            loading: false,
            error: null
          };
          setLocation(fallbackLoc);
          resolve(fallbackLoc);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [reverseGeocode]);

  return { ...location, refresh, detectHighAccuracyGPS, setLocation };
};
