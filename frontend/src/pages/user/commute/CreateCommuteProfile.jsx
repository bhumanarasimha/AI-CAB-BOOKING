import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Clock,
  Car, Bike, Train, Sparkles,
  Home, Building, Loader2, Crosshair, Check
} from 'lucide-react';
import { POPULAR_COMMUTE_HUBS } from './matches';

const CreateCommuteProfile = () => {
  const navigate = useNavigate();
  const [transport, setTransport] = useState('car');
  const [workMode, setWorkMode] = useState('office');

  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('08:30');
  const [reachTime, setReachTime] = useState('09:15');
  const [returnStart, setReturnStart] = useState('18:00');
  const [returnReach, setReturnReach] = useState('18:45');

  const [suggestions, setSuggestions] = useState({ source: [], dest: [] });
  const [loading, setLoading] = useState({ source: false, dest: false });
  const [activeInput, setActiveInput] = useState(null);

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Vehicle verification states
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [platePhoto, setPlatePhoto] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [isVerifyingPhoto, setIsVerifyingPhoto] = useState(false);
  const [photoVerified, setPhotoVerified] = useState(false);

  // Load existing profile from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartride_commute_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.source) setSource(p.source);
        if (p.destination) setDestination(p.destination);
        if (p.departureTime) setDepartureTime(p.departureTime);
        if (p.returnTime) setReturnStart(p.returnTime);
        if (p.transport) setTransport(p.transport);
        if (p.workMode) setWorkMode(p.workMode);
        if (p.vehicleNumber) setVehicleNumber(p.vehicleNumber);
        if (p.licenseNumber) setLicenseNumber(p.licenseNumber);
      }
    } catch (e) {}
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPlatePhoto(URL.createObjectURL(file));
      setPhotoName(file.name);
      setIsVerifyingPhoto(true);
      setPhotoVerified(false);

      setTimeout(() => {
        setIsVerifyingPhoto(false);
        setPhotoVerified(true);
      }, 1500);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const resolved = `Current Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
        setSource(resolved);
        setDetectingGps(false);
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 2500);
      },
      () => {
        setSource('Indiranagar 100ft Road, Bangalore');
        setDetectingGps(false);
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 2500);
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  const fetchSuggestions = (query, type) => {
    if (!query || query.length < 2) {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    setActiveInput(type);

    const localMatches = POPULAR_COMMUTE_HUBS.filter(h =>
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.city.toLowerCase().includes(query.toLowerCase())
    ).map(h => ({
      display_name: `${h.name}, ${h.city}`,
      main_text: h.name,
      secondary_text: `${h.landmark} • ${h.city}`
    }));

    if (window.google?.maps?.places) {
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions({ input: query, componentRestrictions: { country: 'in' } }, (preds, status) => {
          if (status === 'OK' && preds && preds.length > 0) {
            setSuggestions(prev => ({
              ...prev,
              [type]: preds.map(p => ({
                display_name: p.description,
                main_text: p.structured_formatting.main_text,
                secondary_text: p.structured_formatting.secondary_text
              }))
            }));
          } else {
            setSuggestions(prev => ({ ...prev, [type]: localMatches }));
          }
          setLoading(prev => ({ ...prev, [type]: false }));
        });
        return;
      } catch {}
    }

    setSuggestions(prev => ({ ...prev, [type]: localMatches }));
    setLoading(prev => ({ ...prev, [type]: false }));
  };

  const handleSaveAndGenerate = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('smartride_commute_profile') || '{}');
      const updated = {
        ...existing,
        source: source || 'Indiranagar 100ft Road, Bangalore',
        destination: destination || 'Electronic City Phase 1, Bangalore',
        departureTime,
        returnTime: returnStart,
        transport,
        workMode,
        vehicleNumber,
        licenseNumber,
        photoVerified,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('smartride_commute_profile', JSON.stringify(updated));
    } catch (e) {}
    navigate('/user/commute/results');
  };

  const transportTypes = [
    { id: 'car', icon: Car, label: 'Car' },
    { id: 'bike', icon: Bike, label: 'Bike' },
    { id: 'train', icon: Train, label: 'Public' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base, #080C14)', padding: '60px 20px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--bg-surface, #0F1623)', border: '1px solid var(--border-ui, rgba(255,255,255,0.1))', borderRadius: '12px', padding: '10px', color: 'var(--text-main, #F1F5F9)', cursor: 'pointer' }}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main, #F1F5F9)' }}>
          Create Commute Profile
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Progress Stepper */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: '4px', background: i === 1 ? 'var(--brand-cyan, #00D8FF)' : 'var(--border-ui, rgba(255,255,255,0.1))', borderRadius: '2px' }} />
          ))}
        </div>

        {/* Location Form */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Route Details</h2>
            <button
              onClick={handleDetectGPS}
              disabled={detectingGps}
              style={{ background: 'none', border: 'none', color: gpsSuccess ? '#10B981' : 'var(--brand-cyan, #00D8FF)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {detectingGps ? <Loader2 size={11} className="animate-spin" /> : gpsSuccess ? <Check size={11} /> : <Crosshair size={11} />}
              {gpsSuccess ? 'GPS Set' : 'Use My GPS'}
            </button>
          </div>

          <div style={{ background: 'var(--bg-surface, #0F1623)', borderRadius: '20px', padding: '18px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(0,216,255,0.1)', padding: '10px', borderRadius: '12px' }}>
                <Home size={18} color="var(--brand-cyan, #00D8FF)" />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted, #9CA3AF)', marginBottom: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Home / Pickup</p>
                <input 
                  type="text" 
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    fetchSuggestions(e.target.value, 'source');
                  }}
                  onFocus={() => setActiveInput('source')}
                  placeholder="Enter home location" 
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)', fontSize: '0.92rem', outline: 'none' }} 
                />
                {loading.source && <Loader2 size={12} className="animate-spin" style={{ position: 'absolute', right: 0, top: '20px', color: 'var(--brand-cyan, #00D8FF)' }} />}
                <SuggestionList 
                  show={activeInput === 'source' && suggestions.source.length > 0} 
                  items={suggestions.source} 
                  onSelect={(item) => {
                    setSource(item.display_name);
                    setSuggestions(prev => ({ ...prev, source: [] }));
                    setActiveInput(null);
                  }}
                />
              </div>
            </div>
            
            <div style={{ width: '100%', height: '1px', background: 'var(--border-ui, rgba(255,255,255,0.06))' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '10px', borderRadius: '12px' }}>
                <Building size={18} color="var(--brand-indigo, #6366F1)" />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted, #9CA3AF)', marginBottom: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Office / Tech Park</p>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    fetchSuggestions(e.target.value, 'dest');
                  }}
                  onFocus={() => setActiveInput('dest')}
                  placeholder="Enter office / company / tech park" 
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)', fontSize: '0.92rem', outline: 'none' }} 
                />
                {loading.dest && <Loader2 size={12} className="animate-spin" style={{ position: 'absolute', right: 0, top: '20px', color: 'var(--brand-indigo, #6366F1)' }} />}
                <SuggestionList 
                  show={activeInput === 'dest' && suggestions.dest.length > 0} 
                  items={suggestions.dest} 
                  onSelect={(item) => {
                    setDestination(item.display_name);
                    setSuggestions(prev => ({ ...prev, dest: [] }));
                    setActiveInput(null);
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Tech Hubs */}
        <div>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
            Popular Tech Corridors
          </span>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {POPULAR_COMMUTE_HUBS.slice(0, 5).map((hub, idx) => (
              <button
                key={idx}
                onClick={() => setDestination(`${hub.name}, ${hub.city}`)}
                style={{
                  background: destination.includes(hub.name) ? 'rgba(0, 216, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${destination.includes(hub.name) ? 'var(--brand-cyan, #00D8FF)' : 'rgba(255,255,255,0.08)'}`,
                  color: destination.includes(hub.name) ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-main, #F1F5F9)',
                  padding: '6px 12px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                  whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0
                }}
              >
                🏢 {hub.name}
              </button>
            ))}
          </div>
        </div>

        {/* Timing & Work Mode */}
        <section>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
            Morning Commute (To Office)
          </h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, background: 'var(--bg-surface, #0F1623)', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Clock size={14} color="var(--brand-cyan, #00D8FF)" />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)' }}>Departure Time</span>
              </div>
              <input 
                type="time" 
                value={departureTime}
                onChange={e => setDepartureTime(e.target.value)}
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)', 
                  fontSize: '0.95rem', fontWeight: 800, outline: 'none',
                  colorScheme: 'dark', cursor: 'pointer'
                }} 
              />
            </div>
            <div style={{ flex: 1, background: 'var(--bg-surface, #0F1623)', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Clock size={14} color="var(--brand-indigo, #6366F1)" />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)' }}>Target Arrival</span>
              </div>
              <input 
                type="time" 
                value={reachTime}
                onChange={e => setReachTime(e.target.value)}
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)', 
                  fontSize: '0.95rem', fontWeight: 800, outline: 'none',
                  colorScheme: 'dark', cursor: 'pointer'
                }} 
              />
            </div>
          </div>

          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
            Evening Return (To Home)
          </h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, background: 'var(--bg-surface, #0F1623)', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Clock size={14} color="var(--brand-cyan, #00D8FF)" />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)' }}>Departure Time</span>
              </div>
              <input 
                type="time" 
                value={returnStart}
                onChange={e => setReturnStart(e.target.value)}
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)', 
                  fontSize: '0.95rem', fontWeight: 800, outline: 'none',
                  colorScheme: 'dark', cursor: 'pointer'
                }} 
              />
            </div>
            <div style={{ flex: 1, background: 'var(--bg-surface, #0F1623)', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Clock size={14} color="var(--brand-indigo, #6366F1)" />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)' }}>Target Arrival</span>
              </div>
              <input 
                type="time" 
                value={returnReach}
                onChange={e => setReturnReach(e.target.value)}
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)', 
                  fontSize: '0.95rem', fontWeight: 800, outline: 'none',
                  colorScheme: 'dark', cursor: 'pointer'
                }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-surface, #0F1623)', padding: '5px', borderRadius: '16px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', marginBottom: '16px' }}>
            {['office', 'hybrid', 'remote'].map(mode => (
              <button
                key={mode}
                onClick={() => setWorkMode(mode)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontSize: '0.78rem', fontWeight: 700,
                  textTransform: 'capitalize', cursor: 'pointer',
                  background: workMode === mode ? 'var(--brand-indigo, #6366F1)' : 'transparent',
                  color: workMode === mode ? '#FFFFFF' : 'var(--text-muted, #9CA3AF)',
                  transition: 'all 0.2s'
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </section>

        {/* Transport Type */}
        <section>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Transport Mode</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            {transportTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setTransport(type.id)}
                style={{
                  flex: 1, background: 'var(--bg-surface, #0F1623)', border: `1px solid ${transport === type.id ? 'var(--brand-cyan, #00D8FF)' : 'var(--border-ui, rgba(255,255,255,0.08))'}`,
                  borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <type.icon size={22} color={transport === type.id ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-muted, #9CA3AF)'} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: transport === type.id ? 'var(--text-main, #F1F5F9)' : 'var(--text-muted, #9CA3AF)' }}>{type.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Vehicle Details & Verification (For Car/Bike) */}
        {(transport === 'car' || transport === 'bike') && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Vehicle Details & Verification</h2>
            <div style={{ background: 'var(--bg-surface, #0F1623)', borderRadius: '20px', padding: '18px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted, #9CA3AF)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Vehicle Registration Number</p>
                <input 
                  type="text" 
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. KA 01 MJ 4829" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', borderRadius: '12px', padding: '12px', color: 'var(--text-main, #F1F5F9)', fontSize: '0.9rem', outline: 'none' }} 
                />
              </div>

              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted, #9CA3AF)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Driving License Number</p>
                <input 
                  type="text" 
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. DL-1420110012345" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', borderRadius: '12px', padding: '12px', color: 'var(--text-main, #F1F5F9)', fontSize: '0.9rem', outline: 'none' }} 
                />
              </div>

              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted, #9CA3AF)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Vehicle Number Plate Photo</p>
                <div style={{ 
                  border: '2px dashed var(--border-ui, rgba(255,255,255,0.12))', 
                  borderRadius: '16px', 
                  padding: '20px', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  position: 'relative',
                  background: platePhoto ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                  borderColor: platePhoto ? '#10B981' : 'var(--border-ui, rgba(255,255,255,0.12))'
                }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                  />
                  {platePhoto ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.8rem' }}>🖼️</span>
                      <p style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 700 }}>Photo Selected: {photoName}</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted, #9CA3AF)' }}>Tap to replace</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '2rem', opacity: 0.6 }}>📷</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-main, #F1F5F9)', fontWeight: 600 }}>Click to capture or upload photo</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted, #9CA3AF)' }}>Supported formats: PNG, JPG, WEBP</p>
                    </div>
                  )}
                </div>
              </div>

              {isVerifyingPhoto && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px 14px', borderRadius: '12px' }}>
                  <Loader2 size={15} className="animate-spin" color="#F59E0B" />
                  <p style={{ fontSize: '0.78rem', color: '#F59E0B', fontWeight: 600 }}>AI checking license plate match...</p>
                </div>
              )}

              {photoVerified && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '12px 14px', borderRadius: '12px' }}
                >
                  <span style={{ fontSize: '1.2rem' }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>Number Plate Verified!</p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted, #9CA3AF)' }}>Plate: <strong>{vehicleNumber || 'Verified Vehicle'}</strong></p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* AI Insight Card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(0, 216, 255, 0.1), transparent)', border: '1px solid rgba(0, 216, 255, 0.2)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px' }}>
          <Sparkles size={18} color="var(--brand-cyan, #00D8FF)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-main, #F1F5F9)', lineHeight: 1.5 }}>
            AI suggestion: 42 verified professionals commute along this corridor between 8:15 AM - 8:45 AM.
          </p>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleSaveAndGenerate}
          style={{ width: '100%', padding: '16px', background: 'linear-gradient(90deg, #6366F1, #00D8FF)', color: '#080C14', border: 'none', borderRadius: '16px', fontSize: '0.98rem', fontWeight: 900, marginTop: '8px', boxShadow: '0 8px 24px rgba(0,216,255,0.3)', cursor: 'pointer' }}
        >
          Save Profile & Generate Matches
        </button>
      </div>
    </div>
  );
};

const SuggestionList = ({ show, items, onSelect }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60,
          background: 'var(--bg-elevated, #1A2340)', border: '1px solid var(--border-ui, rgba(255,255,255,0.15))',
          borderRadius: '16px', marginTop: '8px', overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)'
        }}
      >
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(item)}
            style={{
              width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px',
              background: 'transparent', border: 'none', borderBottom: idx === items.length - 1 ? 'none' : '1px solid var(--border-ui, rgba(255,255,255,0.06))',
              textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <MapPin size={14} color="var(--brand-cyan, #00D8FF)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #F1F5F9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.main_text}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted, #9CA3AF)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.secondary_text}
              </p>
            </div>
          </button>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

export default CreateCommuteProfile;
