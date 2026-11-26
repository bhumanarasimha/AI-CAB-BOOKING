import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Search, Navigation, ExternalLink } from 'lucide-react';
import { useGPSLocation } from '../../hooks/useLocation';
import { useAuth } from '../../lib/AuthContext';
import InteractiveMap from '../../components/ui/InteractiveMap';
import { api } from '../../lib/api';

const getSafeNumCoords = (c) => {
  if (!c) return { lat: 13.0827, lng: 80.2785 };
  const lat = typeof c.lat === 'number' ? c.lat : Number(c.lat);
  const lng = typeof c.lng === 'number' ? c.lng : Number(c.lng);
  return {
    lat: isNaN(lat) ? 13.0827 : lat,
    lng: isNaN(lng) ? 80.2785 : lng
  };
};

const MapPicker = () => {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const locationState = routerLocation.state || {};
  const isPickupMode = locationState.mode === 'pickup' || !locationState.mode;

  const location = useGPSLocation();
  const { setCurrentLocation } = useAuth();
  const [displayAddress, setDisplayAddress] = useState('Detecting...');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [pickerCoords, setPickerCoords] = useState(null);

  const openInGoogleMaps = () => {
    const coords = getSafeNumCoords(pickerCoords || location.coords);
    window.open(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`, '_blank');
  };

  const handleRecenter = () => {
    const fresh = getSafeNumCoords(location.coords);
    setPickerCoords(fresh);
    handleLocationChange(fresh.lat, fresh.lng);
  };

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      const initial = getSafeNumCoords(location.coords);
      setDisplayAddress(location.address || 'Current Location');
      setPickerCoords(initial);
      initialized.current = true;
    }
  }, [location.address, location.coords]);

  const handleLocationChange = async (firstArg, secondArg) => {
    let lat, lng;
    if (firstArg && typeof firstArg === 'object') {
      lat = Number(firstArg.lat);
      lng = Number(firstArg.lng);
    } else {
      lat = Number(firstArg);
      lng = Number(secondArg);
    }
    if (isNaN(lat) || isNaN(lng)) return;

    setPickerCoords({ lat, lng });
    setIsResolving(true);

    try {
      const res = await api.geocode.reverse(lat, lng);
      setDisplayAddress(res?.address || 'Map Location');
    } catch (err) {
      console.error("Map picker geocode failed:", err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleConfirm = () => {
    if (!pickerCoords) return;
    setIsConfirming(true);
    // Update global session location
    setCurrentLocation({
      coords: pickerCoords,
      address: displayAddress
    });
    
    if (isPickupMode) {
      if (typeof localStorage !== 'undefined' && displayAddress && displayAddress !== 'Detecting...') {
        localStorage.setItem('smartride_user_pickup', displayAddress);
      }
      setTimeout(() => {
        navigate('/user/home');
      }, 400);
    } else {
      setTimeout(() => {
        navigate('/user/ride-comparison', { state: { dropoff: displayAddress } });
      }, 400);
    }
  };

  const handleSearch = async (query) => {
    const coordRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = query.match(coordRegex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);
      setPickerCoords({ lat, lng });
      handleLocationChange(lat, lng);
      return;
    }

    setIsResolving(true);
    try {
      const res = await api.geocode.search(query, pickerCoords?.lat || 13.0827, pickerCoords?.lng || 80.2707);
      if (res && res.success && typeof res.lat === 'number' && typeof res.lng === 'number') {
        setPickerCoords({ lat: res.lat, lng: res.lng });
        setDisplayAddress(res.address || query);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', background: 'var(--bg-base)' }}>
      {/* Background Map with Blue Pin centered in visible frame */}
      <InteractiveMap 
        center={pickerCoords} 
        userLocation={location.coords}
        onLocationChange={handleLocationChange}
        showMarkerPin={true}
        offsetY={0}
      />

      {/* Header Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '48px 20px 20px', background: 'linear-gradient(to bottom, var(--bg-surface), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/user/home'))} className="btn-icon" style={{ width: '40px', height: '40px' }}>
            <ArrowLeft size={18} color="var(--text-main)" />
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>
              <Search size={16} color="var(--text-muted)" />
            </div>
            <input
              type="text"
              value={isResolving ? 'Resolving address...' : displayAddress}
              onChange={(e) => setDisplayAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(displayAddress.trim());
                }
              }}
              className="field"
              placeholder="Search for a location..."
              style={{ 
                padding: '12px 16px 12px 42px', 
                fontSize: '0.9rem', 
                background: 'var(--bg-surface)', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid var(--border-ui)',
                opacity: isResolving ? 0.6 : 1 
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, padding: '24px 20px 40px', background: 'var(--bg-surface)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-ui)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'var(--border-ui)' }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {isPickupMode ? 'Confirm Pickup / Current Location' : 'Select Destination'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(var(--brand-cyan-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={20} color="var(--brand-cyan)" />
            </div>
            <div>
              <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                {isPickupMode ? 'Current Location Pin' : 'Map Destination'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', opacity: isResolving ? 0.5 : 1, marginBottom: '4px' }}>
                {isResolving ? 'Fetching street name...' : displayAddress}
              </p>
              {pickerCoords && typeof pickerCoords.lat === 'number' && typeof pickerCoords.lng === 'number' && (
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace', opacity: 0.6 }}>
                  {pickerCoords.lat.toFixed(6)}, {pickerCoords.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={isConfirming || !pickerCoords}
          className="btn-primary"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--brand-indigo, #6366F1), var(--brand-cyan, #00D8FF))',
            color: '#080C14',
            fontSize: '1rem',
            fontWeight: 800,
            border: 'none',
            boxShadow: '0 6px 20px rgba(0, 216, 255, 0.35)',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {isConfirming ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ width: '20px', height: '20px', border: '2.5px solid rgba(0,0,0,0.3)', borderTopColor: '#080C14', borderRadius: '50%' }}
            />
          ) : (
            <>
              <span>{isPickupMode ? 'Set as Current Location' : 'Confirm Destination'}</span>
              <Navigation size={18} color="#080C14" />
            </>
          )}
        </button>
      </div>

      {/* Recenter & Google Maps buttons */}
      <div style={{ position: 'absolute', bottom: '260px', right: '20px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 20 }}>
        <button 
          onClick={openInGoogleMaps} 
          className="btn-icon" 
          title="Open in Google Maps"
          style={{ width: '44px', height: '44px', background: 'var(--bg-surface)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-ui)' }}
        >
          <ExternalLink size={18} color="var(--brand-cyan)" />
        </button>
        <button 
          onClick={handleRecenter} 
          className="btn-icon" 
          title="Recenter to my location"
          style={{ width: '44px', height: '44px', background: 'var(--bg-surface)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-ui)' }}
        >
          <Navigation size={18} color="var(--brand-cyan)" />
        </button>
      </div>
    </div>
  );
};

export default MapPicker;
