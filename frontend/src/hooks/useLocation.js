import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';

export const useGPSLocation = () => {
  const auth = useAuth();
  const currentLocation = auth?.currentLocation;
  const geoCache = useRef({});
  const locationRef = useRef();

  const [location, setLocation] = useState({
    coords: currentLocation?.coords || { lat: 13.0827, lng: 80.2707 },
    address: currentLocation?.address || 'Detecting location...',
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocation({
        coords: currentLocation.coords,
        address: currentLocation.address,
        loading: false,
        error: null
      });
    }
  }, [currentLocation, location.address, location.coords, location.coords?.lat, location.coords?.lng]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (geoCache.current[cacheKey]) return geoCache.current[cacheKey];

    return new Promise((resolve) => {
      const google = window.google;
      if (!google || !google.maps) {
        console.warn("Google Maps SDK not loaded yet for reverseGeocode, trying OSM Nominatim fallback");
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'SmartRide-AI-Cab' }
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.address) {
              const road = data.address.road || data.address.suburb || data.address.neighbourhood || '';
              const city = data.address.city || data.address.town || data.address.village || '';
              const finalAddr = road ? (city ? `${road}, ${city}` : road) : (data.display_name.split(',')[0] || 'Map Location');
              geoCache.current[cacheKey] = finalAddr;
              resolve(finalAddr);
            } else {
              resolve('Detecting Location...');
            }
          })
          .catch(() => {
            resolve('Detecting Location...');
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

            const finalAddr = city ? `${display}, ${city}` : display;
            geoCache.current[cacheKey] = finalAddr;
            resolve(finalAddr);
          } else {
            console.warn("Reverse geocoding status not OK, trying OSM Nominatim fallback:", status);
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
              headers: { 'Accept-Language': 'en', 'User-Agent': 'SmartRide-AI-Cab' }
            })
              .then(res => res.json())
              .then(data => {
                if (data && data.address) {
                  const road = data.address.road || data.address.suburb || data.address.neighbourhood || '';
                  const city = data.address.city || data.address.town || data.address.village || '';
                  const finalAddr = road ? (city ? `${road}, ${city}` : road) : (data.display_name.split(',')[0] || 'Map Location');
                  geoCache.current[cacheKey] = finalAddr;
                  resolve(finalAddr);
                } else {
                  resolve('Unknown Location');
                }
              })
              .catch(err => {
                console.error("Nominatim fallback failed:", err);
                resolve('Unknown Location');
              });
          }
        });
      } catch (error) {
        console.error("Reverse geocoding exception:", error);
        resolve('Unknown Location');
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

    // 3. Try ip-api.com
    try {
      const res = await fetch('http://ip-api.com/json');
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lon) {
          return { lat: data.lat, lng: data.lon, city: data.city, region: data.regionName };
        }
      }
    } catch {
      console.warn("ip-api.com failed");
    }

    return null;
  }, []);

  const fetchLocation = useCallback(async () => {
    // Ensure async start to avoid synchronous setState during effect execution
    await new Promise(resolve => setTimeout(resolve, 0));

    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      return;
    }

    // 1. Instant IP-based detection for "fast" first look
    try {
      const ipData = await fetchIPLocation();
      if (ipData && ipData.lat && ipData.lng && !currentLocation) {
        const address = await reverseGeocode(ipData.lat, ipData.lng);
        setLocation(prev => ({
          ...prev,
          coords: { lat: ipData.lat, lng: ipData.lng },
          address: address || `${ipData.city}, ${ipData.region}`,
          loading: false
        }));
      }
    } catch (err) {
      console.warn("Fast IP detection failed, waiting for GPS:", err);
    }

    // 2. High-accuracy GPS tracking (refined)
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const currentLoc = locationRef.current;

        const currentCoords = currentLoc?.coords;
        const distance = currentCoords ?
          Math.sqrt(Math.pow(latitude - currentCoords.lat, 2) + Math.pow(longitude - currentCoords.lng, 2)) * 111000 :
          100;

        if (distance > 5 || currentLoc.loading) {
          console.log(`GPS refined (${accuracy}m):`, latitude, longitude);
          const address = await reverseGeocode(latitude, longitude);
          
          setLocation({
            coords: { lat: latitude, lng: longitude },
            address,
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
      // Defer execution to avoid synchronous setState warning in effect
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

  return { ...location, refresh };
};
