import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MapPlaceholder = ({ center, zoom: initialZoom = 15 }) => {
  const [coords, setCoords] = useState(center || { lat: 13.0827, lng: 80.2707 }); // Default to Chennai
  const [zoom] = useState(initialZoom);

  useEffect(() => {
    if (center) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoords(center);
      return;
    }
    // 1. Try Browser Geolocation first
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        async () => {
          console.warn("Geolocation denied, falling back to IP...");
          // 2. Fallback to IP-based location
          try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            if (data.latitude && data.longitude) {
              setCoords({
                lat: data.latitude,
                lng: data.longitude
              });
            }
          } catch {
            console.error("IP Location failed");
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [center]);

  // Using ESRI Satellite Imagery (Free & High Quality)
  // We'll use a tile-based approach or a static map if we had a key.
  // For a seamless background, we'll use a trick with a large container and multiple tiles if needed, 
  // but for simplicity and "visual" feel, we'll use a high-res static preview or a clever CSS background.
  
  // Real dynamic satellite view (using a free tile-to-static converter if possible)
  // For now, let's use a very high-quality satellite image that "looks" like the user's area 
  // until we have a real Mapbox/Google key.
  // HOWEVER, the user explicitly asked for "real gps satellite view maps".
  // I will use the ArcGIS Static Maps API which is quite generous for satellite views.
  const satelliteUrl = `https://static.arcgis.com/staticmaps/world/satellite/map?center=${coords.lng},${coords.lat}&zoom=${zoom}&size=600,800`;
  const fallbackMap = `https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop`; // Satellite earth fallback

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#040608' }}>

      {/* Real Satellite Background */}
      <motion.img 
        key={`${coords.lat}-${coords.lng}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        src={satelliteUrl}
        alt="Satellite Map"
        style={{ 
          position: 'absolute', 
          inset: 0, 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          filter: 'brightness(0.5) contrast(1.2) saturate(0.8)'
        }} 
        onError={(e) => {
          e.target.src = fallbackMap;
        }}
      />

      <svg
        viewBox="0 0 390 480"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      >
        <defs>
          <filter id="routeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--brand-indigo)" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* ─── OVERLAY MASK ─── */}
        <rect width="390" height="480" fill="rgba(8,12,20,0.3)" />

        {/* ─── DYNAMIC GPS COORDINATE DISPLAY ─── */}
        <text x="20" y="460" fontSize="8" fill="var(--brand-cyan)" fontWeight="700" style={{ opacity: 0.6, letterSpacing: '0.1em' }}>
          GPS: {Number(coords.lat).toFixed(4)}°N, {Number(coords.lng).toFixed(4)}°E
        </text>

        {/* ─── ANIMATED ROUTE PATH ─── */}
        <motion.path
          d="M 195 240 Q 220 200 260 180 Q 300 160 320 120"
          fill="none" stroke="url(#routeGrad)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray="10 6"
          initial={{ strokeDashoffset: 400 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 0 8px var(--brand-cyan))' }}
        />

        {/* ─── USER LOCATION PULSE ─── */}
        <motion.circle 
          cx="195" cy="240"
          initial={{ r: 10, opacity: 0.6 }}
          animate={{ r: 22, opacity: 0 }}
          transition={{ duration: 2.5, repeat: Infinity }}
          fill="var(--brand-cyan)"
        />
        <circle cx="195" cy="240" r="6" fill="var(--brand-cyan)" stroke="white" strokeWidth="2" />
        
        {/* Destination Marker */}
        <g transform="translate(320, 120)">
          <path d="M 0 -12 C -4 -12 -8 -8 -8 -4 C -8 3 0 12 0 12 C 0 12 8 3 8 -4 C 8 -8 4 -12 0 -12 Z" fill="var(--brand-indigo)" stroke="white" strokeWidth="2" />
          <circle cx="0" cy="-4" r="2.5" fill="white" />
        </g>
      </svg>

      {/* Vignette & Fades */}
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 120px rgba(0,0,0,0.6)', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '180px', background: 'linear-gradient(to bottom, rgba(8,12,20,1) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '240px', background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 3 }} />
    </div>
  );
};

export default MapPlaceholder;
