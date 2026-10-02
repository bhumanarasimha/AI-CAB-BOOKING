import { useState, useEffect, useRef } from 'react';
import { Navigation, Car, Crosshair, Radio, Plus, Minus, Layers } from 'lucide-react';

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#090d16" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#090d16" }] },
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

const INITIAL_CABS = [
  { id: 1, type: 'SmartRide AI', name: 'SmartRide EV', x: 44, y: 36, icon: '⚡', color: '#00D8FF', angle: 45, rating: '4.9', eta: '2 min', fare: '₹149' },
  { id: 2, type: 'Uber', name: 'Uber Go', x: 68, y: 30, icon: '🚗', color: '#FFFFFF', angle: 110, rating: '4.8', eta: '3 min', fare: '₹165' },
  { id: 3, type: 'Ola', name: 'Ola Mini', x: 28, y: 55, icon: '🚕', color: '#10B981', angle: -25, rating: '4.7', eta: '4 min', fare: '₹155' },
  { id: 4, type: 'Rapido', name: 'Rapido Bike', x: 76, y: 65, icon: '🏍️', color: '#FBBF24', angle: 85, rating: '4.9', eta: '1 min', fare: '₹59' },
  { id: 5, type: 'Namma Yatri', name: 'Namma Auto', x: 52, y: 72, icon: '🛺', color: '#F59E0B', angle: -50, rating: '4.8', eta: '3 min', fare: '₹85' }
];

const InteractiveMap = ({ center, userLocation, onLocationChange, onSelectCab }) => {
  const mapContainerRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const [cabs, setCabs] = useState(INITIAL_CABS);
  const [selectedCab, setSelectedCab] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(15);

  const coords = center || userLocation || { lat: 13.0118, lng: 80.0526 };

  // 1. Attempt Google Maps SDK Mount if available
  useEffect(() => {
    let checkInterval;
    const tryInitGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps && mapContainerRef.current) {
        try {
          if (!googleMapInstanceRef.current) {
            const map = new window.google.maps.Map(mapContainerRef.current, {
              center: { lat: coords.lat, lng: coords.lng },
              zoom: zoomLevel,
              styles: DARK_MAP_STYLE,
              disableDefaultUI: true,
              zoomControl: false,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              gestureHandling: 'greedy'
            });

            googleMapInstanceRef.current = map;
            setUseGoogleMaps(true);

            // User Location Marker
            new window.google.maps.Marker({
              position: { lat: coords.lat, lng: coords.lng },
              map,
              title: "Your Location",
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#00D8FF',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
              }
            });

            if (onLocationChange) {
              map.addListener('center_changed', () => {
                const c = map.getCenter();
                onLocationChange({ lat: c.lat(), lng: c.lng() });
              });
            }
          } else {
            googleMapInstanceRef.current.setCenter({ lat: coords.lat, lng: coords.lng });
          }
        } catch (e) {
          console.warn("Google Maps init fallback to dark live wallpaper:", e);
          setUseGoogleMaps(false);
        }
      }
    };

    tryInitGoogleMaps();
    checkInterval = setInterval(tryInitGoogleMaps, 1000);
    return () => clearInterval(checkInterval);
  }, [coords.lat, coords.lng, zoomLevel, onLocationChange]);

  // 2. Animate nearby cabs to simulate real-time roaming traffic
  useEffect(() => {
    const interval = setInterval(() => {
      setCabs(prev => prev.map(cab => {
        const dx = (Math.random() - 0.49) * 2.2;
        const dy = (Math.random() - 0.49) * 2.2;
        const newX = Math.max(12, Math.min(88, cab.x + dx));
        const newY = Math.max(15, Math.min(85, cab.y + dy));
        const newAngle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
        return {
          ...cab,
          x: newX,
          y: newY,
          angle: newAngle
        };
      }));
    }, 2600);

    return () => clearInterval(interval);
  }, []);

  // Compute OpenStreetMap / CartoDB dark tile URL based on current coordinates
  const latRad = (coords.lat * Math.PI) / 180;
  const n = Math.pow(2, zoomLevel);
  const tileX = Math.floor(((coords.lng + 180) / 360) * n);
  const tileY = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);

  const handleZoom = (delta) => {
    const nextZoom = Math.min(17, Math.max(13, zoomLevel + delta));
    setZoomLevel(nextZoom);
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setZoom(nextZoom);
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', background: '#080C14', userSelect: 'none' }}>
      
      {/* Google Maps Container (Active when SDK loaded) */}
      <div 
        ref={mapContainerRef} 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: useGoogleMaps ? 1 : 0,
          opacity: useGoogleMaps ? 1 : 0,
          transition: 'opacity 0.6s ease'
        }} 
      />

      {/* Dynamic Live Wallpaper Map (Active by default or alongside Google Maps) */}
      {!useGoogleMaps && (
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'hidden' }}>
          
          {/* Real CartoDB Dark Matter Street Tile Grid */}
          <div style={{
            position: 'absolute',
            inset: '-20%',
            width: '140%',
            height: '140%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            opacity: 0.94,
            filter: 'contrast(1.2) brightness(0.92)',
          }}>
            {[-1, 0, 1].flatMap(dy => 
              [-1, 0, 1].map(dx => (
                <div 
                  key={`${dx}_${dy}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(https://a.basemaps.cartocdn.com/rastertiles/dark_all/${zoomLevel}/${tileX + dx}/${tileY + dy}.png)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#090D16'
                  }}
                />
              ))
            )}
          </div>

          {/* Glowing Cyberpunk Arterial Routes & Street Vectors */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.5 }}>
            <defs>
              <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D8FF" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.4" />
              </linearGradient>
              <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Simulated Live Traffic Arteries */}
            <path d="M -60 180 Q 200 240 500 210" stroke="url(#routeGlow)" strokeWidth="3" fill="none" filter="url(#neonBlur)" strokeDasharray="8 4" opacity="0.8" />
            <path d="M 140 -20 Q 220 340 260 900" stroke="#00D8FF" strokeWidth="2.5" fill="none" opacity="0.6" strokeDasharray="6 4" />
            <path d="M -20 460 Q 220 420 500 520" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M 340 80 Q 200 480 90 900" stroke="#6366F1" strokeWidth="2" fill="none" opacity="0.4" />
          </svg>

          {/* Chembarambakkam Area Landmarks & Road Badges */}
          <div style={{ position: 'absolute', top: '24%', left: '18%', pointerEvents: 'none', zIndex: 6, opacity: 0.85 }}>
            <div style={{ background: 'rgba(9, 13, 22, 0.8)', border: '1px solid rgba(0, 216, 255, 0.25)', borderRadius: '6px', padding: '2px 7px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00D8FF' }} />
              <span style={{ fontSize: '0.62rem', color: '#9CA3AF', fontWeight: 600 }}>NH 48 Bangalore Hwy</span>
            </div>
          </div>

          <div style={{ position: 'absolute', top: '38%', right: '14%', pointerEvents: 'none', zIndex: 6, opacity: 0.85 }}>
            <div style={{ background: 'rgba(9, 13, 22, 0.8)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '6px', padding: '2px 7px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#6366F1' }} />
              <span style={{ fontSize: '0.62rem', color: '#9CA3AF', fontWeight: 600 }}>Saveetha Tech Park</span>
            </div>
          </div>

          {/* User Location Center Beacon & Sonar Radar Waves */}
          <div style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            {/* Sonar Radar Wave 1 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '130px',
              height: '130px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '1.5px solid rgba(0, 216, 255, 0.45)',
              background: 'radial-gradient(circle, rgba(0, 216, 255, 0.14) 0%, transparent 70%)',
              animation: 'ping 2.8s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} />

            {/* Sonar Radar Wave 2 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '220px',
              height: '220px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '1px solid rgba(0, 216, 255, 0.22)',
              animation: 'ping 4.2s cubic-bezier(0, 0, 0.2, 1) infinite',
              animationDelay: '1.4s'
            }} />

            {/* Center Pulsing GPS Dot */}
            <div style={{
              position: 'relative',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#00D8FF',
              boxShadow: '0 0 20px #00D8FF, 0 0 45px rgba(0, 216, 255, 0.7)',
              border: '3.5px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#080C14' }} />
            </div>

            {/* Location Label Floating Pill */}
            <div style={{
              position: 'absolute',
              top: '28px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(8, 12, 20, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 216, 255, 0.35)',
              borderRadius: '99px',
              padding: '3px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D8FF', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '0.04em' }}>YOU ARE HERE</span>
            </div>
          </div>

          {/* Animated Cruising Cabs Around You */}
          {cabs.map(cab => (
            <div 
              key={cab.id}
              onClick={() => setSelectedCab(selectedCab?.id === cab.id ? null : cab)}
              style={{
                position: 'absolute',
                top: `${cab.y}%`,
                left: `${cab.x}%`,
                transform: `translate(-50%, -50%) rotate(${cab.angle}deg)`,
                transition: 'top 2.6s linear, left 2.6s linear, transform 1s ease',
                pointerEvents: 'auto',
                cursor: 'pointer',
                zIndex: selectedCab?.id === cab.id ? 20 : 8
              }}
            >
              <div style={{
                position: 'relative',
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                background: 'rgba(15, 22, 35, 0.95)',
                border: `1.8px solid ${cab.color}`,
                boxShadow: `0 0 16px ${cab.color}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                {cab.icon}
                {/* Cab Headlight Beam */}
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  width: '16px',
                  height: '16px',
                  background: `radial-gradient(ellipse at bottom, ${cab.color}77 0%, transparent 80%)`,
                  borderRadius: '50% 50% 0 0',
                  pointerEvents: 'none'
                }} />
              </div>

              {/* Floating Cab Info Tooltip when tapped */}
              {selectedCab?.id === cab.id && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectCab) onSelectCab(cab);
                  }}
                  style={{
                    position: 'absolute',
                    top: '-60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(10, 16, 28, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${cab.color}`,
                    borderRadius: '12px',
                    padding: '6px 12px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    pointerEvents: 'auto',
                    zIndex: 25
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{cab.name}</span>
                    <span style={{ color: '#FBBF24' }}>★ {cab.rating}</span>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#9CA3AF', marginTop: '2px', display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#00D8FF' }}>ETA {cab.eta}</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>Est. {cab.fare}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Interactive Zoom Controls on Map */}
          <div style={{
            position: 'absolute',
            top: '120px',
            right: '16px',
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button
              onClick={() => handleZoom(1)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(12, 18, 30, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}
              title="Zoom In"
            >
              <Plus size={16} color="#00D8FF" />
            </button>
            <button
              onClick={() => handleZoom(-1)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(12, 18, 30, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}
              title="Zoom Out"
            >
              <Minus size={16} color="#9CA3AF" />
            </button>
          </div>

        </div>
      )}

      {/* Top and Bottom Subtle Map Vignettes */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '90px',
        background: 'linear-gradient(to bottom, rgba(8, 12, 20, 0.8) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 2
      }} />

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100px',
        background: 'linear-gradient(to top, rgba(8, 12, 20, 0.85) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 2
      }} />
    </div>
  );
};

export default InteractiveMap;
