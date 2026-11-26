import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { resolveLocationCoord } from '../../services/ai/SmartMobilityAIEngine';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDZBmGSgFQXoeoNlGpJvu3A4S5p1Zkt3vU';

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0c1424" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#080c14" }, { weight: 3 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#00d8ff" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#132d24" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#283b56" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1c2a3e" }, { weight: 1 }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#f1f5f9" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0284c7" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#00d8ff" }, { weight: 1.5 }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#102542" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] }
];

const LIGHT_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0284c7" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] }
];

// Helper coordinates for key landmarks (Chennai & National benchmark)
const KNOWN_COORDS = {
  'kg': { lat: 13.0425, lng: 80.0820 },
  'poonamallee': { lat: 13.0480, lng: 80.0980 },
  'cmbt': { lat: 13.0674, lng: 80.2057 },
  'koyambedu': { lat: 13.0674, lng: 80.2057 },
  'lic': { lat: 13.0620, lng: 80.2670 },
  'govtestate': { lat: 13.0660, lng: 80.2760 },
  'marina': { lat: 13.0500, lng: 80.2824 },
  'beach': { lat: 13.0500, lng: 80.2824 },
  'airport': { lat: 12.9941, lng: 80.1709 },
  'central': { lat: 13.0827, lng: 80.2707 },
  'tidel': { lat: 12.9897, lng: 80.2488 },
  'phoenix': { lat: 12.9918, lng: 80.2173 }
};

const resolveCoord = (locationInput, defaultCoord) => {
  if (locationInput && typeof locationInput === 'object' && typeof locationInput.lat === 'number') {
    return { lat: locationInput.lat, lng: locationInput.lng };
  }
  const resolved = resolveLocationCoord(locationInput);
  if (resolved && typeof resolved.lat === 'number') {
    return { lat: resolved.lat, lng: resolved.lng };
  }
  return defaultCoord;
};

const RouteMap = ({ 
  origin, 
  destination, 
  travelMode = 'DRIVING',
  multimodalRoute = null 
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef([]);
  const markersRef = useRef([]);
  const [loading, setLoading] = useState(true);

  const isBright = typeof window !== 'undefined' && localStorage.getItem('app-theme') === 'light';

  useEffect(() => {
    let isCancelled = false;

    // Load Google Maps SDK dynamically if not loaded
    const loadMaps = () => {
      return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window.google?.maps) {
          return resolve(window.google.maps);
        }
        const existing = document.getElementById('google-maps-js-sdk') || document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
        if (existing) {
          if (window.google?.maps) return resolve(window.google.maps);
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

    loadMaps()
      .then((maps) => {
        if (isCancelled || !mapContainerRef.current) return;

        const originCoord = resolveCoord(origin, { lat: 13.0425, lng: 80.0820 }); // KG Apartments
        const destCoord = resolveCoord(destination, { lat: 13.0500, lng: 80.2824 }); // Marina Beach

        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapContainerRef.current, {
            center: originCoord,
            zoom: 12,
            styles: isBright ? LIGHT_MAP_STYLE : DARK_MAP_STYLE,
            disableDefaultUI: true,
            zoomControl: false,
            gestureHandling: 'greedy'
          });
          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;

        // Clear existing markers & polylines
        polylinesRef.current.forEach(p => p.setMap(null));
        polylinesRef.current = [];
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        const bounds = new maps.LatLngBounds();
        bounds.extend(originCoord);
        bounds.extend(destCoord);

        if (multimodalRoute && multimodalRoute.legs && multimodalRoute.legs.length > 0) {
          // Render Multimodal Split Route Legs (Bus + Metro + Rapido + Walk)
          // Dynamically binds coordinates to each leg anywhere in India
          multimodalRoute.legs.forEach((leg, idx) => {
            const startPt = leg.startCoord || originCoord;
            const endPt = leg.endCoord || destCoord;

            bounds.extend(startPt);
            bounds.extend(endPt);

            const isWalk = leg.mode === 'walk';
            const polylineColor = leg.color || (isWalk ? '#38BDF8' : (leg.mode === 'metro' ? '#10B981' : (leg.mode === 'bus' ? '#3B82F6' : '#FBBF24')));

            const polyline = new maps.Polyline({
              path: [startPt, endPt],
              geodesic: true,
              strokeColor: polylineColor,
              strokeOpacity: isWalk ? 0.8 : 0.95,
              strokeWeight: isWalk ? 3.5 : 5,
              map
            });
            polylinesRef.current.push(polyline);

            // Add waypoint station pin
            const marker = new maps.Marker({
              position: startPt,
              map,
              title: `${leg.label}: ${leg.from}`,
              icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: polylineColor,
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
              }
            });
            markersRef.current.push(marker);
          });

          // Final Destination Pin
          const destMarker = new maps.Marker({
            position: destCoord,
            map,
            title: destination || 'Destination',
            icon: {
              path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#EF4444',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });
          markersRef.current.push(destMarker);

        } else {
          // Standard Direct Driving Route
          const directPolyline = new maps.Polyline({
            path: [originCoord, destCoord],
            geodesic: true,
            strokeColor: '#00D8FF',
            strokeOpacity: 0.9,
            strokeWeight: 5,
            map
          });
          polylinesRef.current.push(directPolyline);

          // Origin Marker
          const originMarker = new maps.Marker({
            position: originCoord,
            map,
            title: 'Pickup Location',
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#00D8FF',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });
          markersRef.current.push(originMarker);

          // Destination Marker
          const destMarker = new maps.Marker({
            position: destCoord,
            map,
            title: destination || 'Destination',
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#6366F1',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });
          markersRef.current.push(destMarker);
        }

        map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
        setLoading(false);
      })
      .catch((err) => {
        console.warn("RouteMap load notice:", err);
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [origin, destination, travelMode, multimodalRoute, isBright]);

  return (
    <View style={[styles.container, isBright && styles.containerLight]}>
      {/* Google Maps Real DOM Container */}
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

      {/* Loading Overlay */}
      {loading && (
        <View style={[styles.loadingOverlay, isBright && styles.loadingOverlayLight]}>
          <ActivityIndicator size="small" color={isBright ? "#0284C7" : "#00D8FF"} />
          <Text style={[styles.loadingText, isBright && styles.loadingTextLight]}>
            Rendering AI Google Maps Route...
          </Text>
        </View>
      )}

      {/* Aesthetic Vignettes */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: isBright
            ? 'linear-gradient(to bottom, rgba(248, 250, 252, 0.7), transparent)'
            : 'linear-gradient(to bottom, rgba(8, 12, 20, 0.6), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: isBright
            ? 'linear-gradient(to top, rgba(248, 250, 252, 0.85), transparent)'
            : 'linear-gradient(to top, rgba(8, 12, 20, 0.8), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#080C14',
    overflow: 'hidden',
  },
  containerLight: {
    backgroundColor: '#F8FAFC',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 20, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  loadingOverlayLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  loadingText: {
    color: '#00D8FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingTextLight: {
    color: '#0284C7',
  },
});

export default RouteMap;
