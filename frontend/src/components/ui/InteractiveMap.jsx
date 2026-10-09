import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation, Crosshair, Plus, Minus, Layers, Radio } from 'lucide-react';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDZBmGSgFQXoeoNlGpJvu3A4S5p1Zkt3vU';

// Premium Dark Cyber Map Styling for Google Maps
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#090d16" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#090d16" }, { weight: 3 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#748290" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#00d8ff" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#4f657d" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d1722" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#16202e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111a26" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a99a8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e2d42" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#00d8ff" }, { weight: 0.8 }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#00d8ff" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#141e2b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#05070c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3e526a" }] }
];

// Clean Modern Daylight Light Map Styling for Google Maps
const LIGHT_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#0284c7" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e2f2e9" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#00b4d8" }, { weight: 0.8 }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#0284c7" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#0284c7" }] }
];

const INITIAL_CABS = [
  { id: 1, type: 'SmartRide AI', name: 'SmartRide EV', latOffset: 0.0022, lngOffset: -0.0018, icon: '⚡', color: '#00D8FF', rating: '4.9', eta: '2 min', fare: '₹149' },
  { id: 2, type: 'Uber', name: 'Uber Go', latOffset: -0.0025, lngOffset: 0.0031, icon: '🚗', color: '#FFFFFF', rating: '4.8', eta: '3 min', fare: '₹165' },
  { id: 3, type: 'Ola', name: 'Ola Mini', latOffset: 0.0035, lngOffset: 0.0022, icon: '🚕', color: '#10B981', rating: '4.7', eta: '4 min', fare: '₹155' },
  { id: 4, type: 'Rapido', name: 'Rapido Bike', latOffset: -0.0018, lngOffset: -0.0035, icon: '🏍️', color: '#FBBF24', rating: '4.9', eta: '1 min', fare: '₹59' },
  { id: 5, type: 'Namma Yatri', name: 'Namma Auto', latOffset: 0.0015, lngOffset: 0.0042, icon: '🛺', color: '#F59E0B', rating: '4.8', eta: '3 min', fare: '₹85' }
];

// Helper to load Google Maps SDK dynamically if not yet ready
const loadGoogleMapsSDK = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      return resolve(window.google.maps);
    }
    const existing = document.getElementById('google-maps-js-sdk');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google?.maps));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry`;
    script.async = true;
    script.onload = () => resolve(window.google?.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const InteractiveMap = ({ 
  center, 
  userLocation, 
  onLocationChange, 
  onSelectCab, 
  showMarkerPin = false,
  showControls = false,
  theme = 'dark'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userCircleRef = useRef(null);
  const cabMarkersRef = useRef([]);

  const [isMapReady, setIsMapReady] = useState(false);
  const [mapTheme, setMapTheme] = useState(theme); // 'dark' | 'standard' | 'satellite'
  const [selectedCab, setSelectedCab] = useState(null);
  const [activeCoords, setActiveCoords] = useState(center || userLocation || { lat: 13.0118, lng: 80.0526 });
  const [zoomLevel, setZoomLevel] = useState(15);
  const [locationAccuracy, setLocationAccuracy] = useState(null);

  // 1. Live GPS tracking: detect present user location
  useEffect(() => {
    if (!navigator.geolocation) return;

    const onSuccess = (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;
      setLocationAccuracy(accuracy);

      const newCoords = { lat, lng };
      setActiveCoords(newCoords);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newCoords);
      }
      if (onLocationChange) {
        onLocationChange(newCoords);
      }
    };

    const onError = (err) => {
      console.warn("GPS Geolocation notice:", err.message);
    };

    // Quick initial position
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000
    });

    // Continuous real-time location watch
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onLocationChange]);

  // Sync external center updates
  useEffect(() => {
    if (center && (center.lat !== activeCoords.lat || center.lng !== activeCoords.lng)) {
      setActiveCoords(center);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(center);
      }
    }
  }, [center]);

  // 2. Initialize real Google Map
  useEffect(() => {
    let isCancelled = false;

    loadGoogleMapsSDK()
      .then((maps) => {
        if (isCancelled || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapContainerRef.current, {
            center: { lat: activeCoords.lat, lng: activeCoords.lng },
            zoom: zoomLevel,
            styles: mapTheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
            mapTypeId: mapTheme === 'satellite' ? 'hybrid' : 'roadmap',
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy'
          });

          mapInstanceRef.current = map;
          setIsMapReady(true);

          // Listen to user map interactions
          if (onLocationChange) {
            map.addListener('idle', () => {
              const c = map.getCenter();
              onLocationChange({ lat: c.lat(), lng: c.lng() });
            });
          }
        }
      })
      .catch((err) => {
        console.warn("Google Maps load notice:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // 3. Sync theme prop from parent
  useEffect(() => {
    if (theme) {
      setMapTheme(theme);
    }
  }, [theme]);

  // Update map style / theme when user toggles or theme changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (mapTheme === 'dark') {
      map.setMapTypeId('roadmap');
      map.setOptions({ styles: DARK_MAP_STYLE });
    } else if (mapTheme === 'satellite') {
      map.setMapTypeId('hybrid');
      map.setOptions({ styles: null });
    } else {
      map.setMapTypeId('roadmap');
      map.setOptions({ styles: LIGHT_MAP_STYLE });
    }
  }, [mapTheme]);

  // 4. Render User Location Radar & Beacon on Google Map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const maps = window.google.maps;
    const map = mapInstanceRef.current;

    // Remove existing user marker & circle
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    if (userCircleRef.current) userCircleRef.current.setMap(null);

    // Glowing translucent accuracy radar circle
    userCircleRef.current = new maps.Circle({
      strokeColor: '#007AFF',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#007AFF',
      fillOpacity: 0.18,
      map,
      center: activeCoords,
      radius: Math.max(30, Math.min(100, locationAccuracy || 50))
    });

    // High-visibility Official Blue Dot user location beacon
    userMarkerRef.current = new maps.Marker({
      position: activeCoords,
      map,
      title: "Your Present Location",
      zIndex: 999,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#1A73E8',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3.5
      }
    });
  }, [activeCoords, locationAccuracy, isMapReady]);

  // 5. Render nearby real-time cabs on Google Map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const maps = window.google.maps;
    const map = mapInstanceRef.current;

    // Clean up old markers
    cabMarkersRef.current.forEach(m => m.setMap(null));
    cabMarkersRef.current = [];

    INITIAL_CABS.forEach(cab => {
      const cabPos = {
        lat: activeCoords.lat + cab.latOffset,
        lng: activeCoords.lng + cab.lngOffset
      };

      const marker = new maps.Marker({
        position: cabPos,
        map,
        title: `${cab.name} (${cab.type})`,
        zIndex: 10,
        icon: {
          path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: cab.color === '#FFFFFF' ? '#E2E8F0' : cab.color,
          fillOpacity: 1,
          strokeColor: '#080C14',
          strokeWeight: 1.5,
          rotation: Math.random() * 360
        }
      });

      marker.addListener('click', () => {
        setSelectedCab(cab);
        if (onSelectCab) onSelectCab(cab);
      });

      cabMarkersRef.current.push(marker);
    });

    return () => {
      cabMarkersRef.current.forEach(m => m.setMap(null));
    };
  }, [activeCoords, isMapReady, onSelectCab]);

  // Recenter Google Map to user's exact present GPS location
  const handleRecenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const freshCoords = { lat, lng };
          setActiveCoords(freshCoords);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo(freshCoords);
            mapInstanceRef.current.setZoom(16);
          }
        },
        () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo(activeCoords);
            mapInstanceRef.current.setZoom(16);
          }
        },
        { enableHighAccuracy: true }
      );
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(activeCoords);
      mapInstanceRef.current.setZoom(16);
    }
  };

  const handleZoom = (delta) => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || zoomLevel;
      const nextZoom = Math.min(19, Math.max(12, currentZoom + delta));
      mapInstanceRef.current.setZoom(nextZoom);
      setZoomLevel(nextZoom);
    } else {
      setZoomLevel(prev => Math.min(19, Math.max(12, prev + delta)));
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', background: '#080C14', userSelect: 'none' }}>
      
      {/* 1. Real Google Maps Container */}
      <div 
        ref={mapContainerRef} 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 1
        }} 
      />

      {/* Center Fixed Pin (for MapPicker / destination choosing) */}
      {showMarkerPin && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -100%)',
          zIndex: 20,
          pointerEvents: 'none'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50% 50% 50% 0',
            background: '#00D8FF',
            transform: 'rotate(-45deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px #00D8FF'
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#080C14' }} />
          </div>
        </div>
      )}

      {/* Floating Selected Cab Card */}
      {selectedCab && (
        <div 
          onClick={() => {
            if (onSelectCab) onSelectCab(selectedCab);
          }}
          style={{
            position: 'absolute',
            bottom: '120px',
            left: '20px',
            right: '20px',
            maxWidth: '380px',
            margin: '0 auto',
            background: 'rgba(10, 16, 28, 0.94)',
            backdropFilter: 'blur(20px)',
            border: `1.5px solid ${selectedCab.color}`,
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
            zIndex: 30,
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${selectedCab.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              {selectedCab.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>{selectedCab.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>
                <span style={{ color: '#00D8FF' }}>ETA {selectedCab.eta}</span> · ★ {selectedCab.rating}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981' }}>{selectedCab.fare}</div>
            <div style={{ fontSize: '0.7rem', color: '#00D8FF', fontWeight: 700 }}>Tap to Book →</div>
          </div>
        </div>
      )}

      {/* Optional Top Floating Map Controls (when standalone) */}
      {showControls && (
        <>
          <div style={{
            position: 'absolute',
            top: '110px',
            right: '16px',
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Recenter My Location Button */}
            <button
              onClick={handleRecenter}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(10, 16, 28, 0.9)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(0, 216, 255, 0.4)',
                color: '#00D8FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
                transition: 'all 0.2s ease'
              }}
              title="Recenter to My Present Location"
            >
              <Crosshair size={20} color="#00D8FF" />
            </button>

            {/* Map Type Switcher (Dark / Standard / Satellite) */}
            <button
              onClick={() => {
                if (mapTheme === 'dark') setMapTheme('satellite');
                else if (mapTheme === 'satellite') setMapTheme('standard');
                else setMapTheme('dark');
              }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(10, 16, 28, 0.9)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
              }}
              title={`Current: ${mapTheme.toUpperCase()} - Tap to switch to ${mapTheme === 'dark' ? 'Satellite' : (mapTheme === 'satellite' ? 'Standard Google Map' : 'Dark Mode')}`}
            >
              <Layers size={18} color={mapTheme === 'satellite' ? '#10B981' : (mapTheme === 'dark' ? '#00D8FF' : '#F59E0B')} />
            </button>

            {/* Zoom In */}
            <button
              onClick={() => handleZoom(1)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(10, 16, 28, 0.9)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
              }}
              title="Zoom In"
            >
              <Plus size={18} color="#00D8FF" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={() => handleZoom(-1)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(10, 16, 28, 0.9)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
              }}
              title="Zoom Out"
            >
              <Minus size={18} color="#9CA3AF" />
            </button>
          </div>

          {/* Floating Live GPS & Google Maps Status Pill */}
          <div style={{
            position: 'absolute',
            top: '64px',
            left: '16px',
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(8, 12, 20, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 216, 255, 0.3)',
            borderRadius: '99px',
            padding: '4px 10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
            pointerEvents: 'none'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D8FF', animation: 'pulse 1.8s infinite' }} />
            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#00D8FF', letterSpacing: '0.04em' }}>
              GOOGLE MAPS LIVE
            </span>
            <span style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>
              · {mapTheme === 'dark' ? 'Night View' : (mapTheme === 'satellite' ? 'Satellite View' : 'Standard View')}
            </span>
          </div>
        </>
      )}

      {/* Top and Bottom Subtle Vignettes for UI readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: mapTheme === 'dark'
          ? 'linear-gradient(to bottom, rgba(8, 12, 20, 0.75) 0%, transparent 100%)'
          : 'linear-gradient(to bottom, rgba(248, 250, 252, 0.8) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 2
      }} />

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '90px',
        background: mapTheme === 'dark'
          ? 'linear-gradient(to top, rgba(8, 12, 20, 0.8) 0%, transparent 100%)'
          : 'linear-gradient(to top, rgba(248, 250, 252, 0.85) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 2
      }} />
    </div>
  );
};

export default InteractiveMap;
