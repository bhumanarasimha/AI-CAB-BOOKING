import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Clock,
  Car, Bike, Train, Sparkles,
  Home, Building, Loader2
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const CreateCommuteProfile = () => {
  const navigate = useNavigate();
  const [transport, setTransport] = useState('car');
  const [workMode, setWorkMode] = useState('office');

  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState({ source: [], dest: [] });
  const [loading, setLoading] = useState({ source: false, dest: false });
  const [activeInput, setActiveInput] = useState(null);

  // Vehicle verification states
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [platePhoto, setPlatePhoto] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [isVerifyingPhoto, setIsVerifyingPhoto] = useState(false);
  const [photoVerified, setPhotoVerified] = useState(false);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPlatePhoto(URL.createObjectURL(file));
      setPhotoName(file.name);
      setIsVerifyingPhoto(true);
      setPhotoVerified(false);

      // Simulate verification in 2 seconds
      setTimeout(() => {
        setIsVerifyingPhoto(false);
        setPhotoVerified(true);
      }, 2000);
    }
  };

  const fetchSuggestions = async (query, type) => {
    if (!query || query.length < 3) {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    setActiveInput(type);

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      // Retry when Maps script finishes loading
      let retries = 0;
      const retry = setInterval(() => {
        if (window.google?.maps?.places || ++retries > 25) {
          clearInterval(retry);
          if (window.google?.maps?.places) fetchSuggestions(query, type);
          else setLoading(prev => ({ ...prev, [type]: false }));
        }
      }, 200);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions({
      input: query,
      componentRestrictions: { country: 'in' }
    }, (predictions, status) => {
      if (status === 'OK' && predictions) {
        setSuggestions(prev => ({
          ...prev,
          [type]: predictions.map(p => ({
            display_name: p.description,
            main_text: p.structured_formatting.main_text,
            secondary_text: p.structured_formatting.secondary_text
          }))
        }));
      }
      setLoading(prev => ({ ...prev, [type]: false }));
    });
  };

  const transportTypes = [
    { id: 'car', icon: Car, label: 'Car' },
    { id: 'bike', icon: Bike, label: 'Bike' },
    { id: 'train', icon: Train, label: 'Public' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '60px 20px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '10px', color: 'var(--text-main)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Commute Profile</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Progress Stepper Placeholder */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: '4px', background: i === 1 ? 'var(--brand-cyan)' : 'var(--border-ui)', borderRadius: '2px' }} />
          ))}
        </div>

        {/* Location Form */}
        <section>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Route Details</h2>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border-ui)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(var(--brand-cyan-rgb), 0.1)', padding: '10px', borderRadius: '12px' }}>
                <Home size={18} color="var(--brand-cyan)" />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Home Location</p>
                <input 
                  type="text" 
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    fetchSuggestions(e.target.value, 'source');
                  }}
                  onFocus={() => setActiveInput('source')}
                  placeholder="Enter home address" 
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
                {loading.source && <Loader2 size={12} className="animate-spin" style={{ position: 'absolute', right: 0, top: '20px', color: 'var(--brand-cyan)' }} />}
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
            
            <div style={{ width: '100%', height: '1px', background: 'var(--border-ui)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(var(--brand-indigo-rgb), 0.1)', padding: '10px', borderRadius: '12px' }}>
                <Building size={18} color="var(--brand-indigo)" />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Office Location</p>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    fetchSuggestions(e.target.value, 'dest');
                  }}
                  onFocus={() => setActiveInput('dest')}
                  placeholder="Enter office/company" 
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
                {loading.dest && <Loader2 size={12} className="animate-spin" style={{ position: 'absolute', right: 0, top: '20px', color: 'var(--brand-indigo)' }} />}
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

        {/* Timing & Work Mode */}
        <section>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Morning Commute (To Office)</h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Clock size={16} color="var(--brand-cyan)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Start Time</span>
              </div>
              <input 
                type="time" 
                defaultValue="08:30" 
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', 
                  fontSize: '1rem', fontWeight: 700, outline: 'none',
                  colorScheme: 'dark', cursor: 'pointer'
                }} 
              />
            </div>
            <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Clock size={16} color="var(--brand-indigo)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Reach Time</span>
              </div>
              <input 
                type="time" 
                defaultValue="09:15" 
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', 
                  fontSize: '1rem', fontWeight: 700, outline: 'none',
                  colorScheme: 'dark', cursor: 'pointer'
                }} 
              />
            </div>
          </div>

          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Evening Return (To Home)</h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Clock size={16} color="var(--brand-cyan)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Start Time</span>
              </div>
              <input 
                type="time" 
                defaultValue="18:00" 
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', 
                  fontSize: '1rem', fontWeight: 700, outline: 'none',
                  colorScheme: 'dark', cursor: 'pointer'
                }} 
              />
            </div>
            <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Clock size={16} color="var(--brand-indigo)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Reach Time</span>
              </div>
              <input 
                type="time" 
                defaultValue="18:45" 
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', 
                  fontSize: '1rem', fontWeight: 700, outline: 'none',
                  colorScheme: 'dark', cursor: 'pointer'
                }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-ui)', marginBottom: '16px' }}>
            {['office', 'hybrid', 'remote'].map(mode => (
              <button
                key={mode}
                onClick={() => setWorkMode(mode)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontSize: '0.8rem', fontWeight: 600,
                  textTransform: 'capitalize', cursor: 'pointer',
                  background: workMode === mode ? 'var(--brand-indigo)' : 'transparent',
                  color: workMode === mode ? 'white' : 'var(--text-muted)',
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
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Transport</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            {transportTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setTransport(type.id)}
                style={{
                  flex: 1, background: 'var(--bg-surface)', border: `1px solid ${transport === type.id ? 'var(--brand-cyan)' : 'var(--border-ui)'}`,
                  borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <type.icon size={24} color={transport === type.id ? 'var(--brand-cyan)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: transport === type.id ? 'var(--text-main)' : 'var(--text-muted)' }}>{type.label}</span>
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
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Vehicle Details & Verification</h2>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border-ui)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Vehicle Registration Number</p>
                <input 
                  type="text" 
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. TS 09 EX 1234" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '12px', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>

              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Driving License Number</p>
                <input 
                  type="text" 
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. DL-1420110012345" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '12px', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>

              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Upload Vehicle Number Plate Photo</p>
                <div style={{ 
                  border: '2px dashed var(--border-ui)', 
                  borderRadius: '16px', 
                  padding: '24px 20px', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  position: 'relative',
                  background: platePhoto ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                  borderColor: platePhoto ? '#10B981' : 'var(--border-ui)'
                }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                  />
                  {platePhoto ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '2rem' }}>🖼️</span>
                      <p style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>Photo Selected: {photoName}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click or drag to replace</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '2.2rem', opacity: 0.6 }}>📷</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>Click to capture or upload photo</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Supported formats: PNG, JPG, WEBP</p>
                    </div>
                  )}
                </div>
              </div>

              {isVerifyingPhoto && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px 16px', borderRadius: '12px' }}>
                  <Loader2 size={16} className="animate-spin" color="#F59E0B" />
                  <p style={{ fontSize: '0.78rem', color: '#F59E0B', fontWeight: 600 }}>AI checking license plate match...</p>
                </div>
              )}

              {photoVerified && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: '12px' }}
                >
                  <span style={{ fontSize: '1.2rem' }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>Plate Verified Successfully!</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Number plate in photo matches user entered: <strong>{vehicleNumber || 'Plate Number'}</strong></p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* AI Insight Card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(var(--brand-cyan-rgb), 0.1), transparent)', border: '1px solid rgba(var(--brand-cyan-rgb), 0.2)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px' }}>
          <Sparkles size={20} color="var(--brand-cyan)" />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            AI suggestion: Based on your location, 47 people from TechPark commute between 8:15 AM - 8:45 AM.
          </p>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => navigate('/user/commute/results')}
          style={{ width: '100%', padding: '18px', background: 'var(--brand-cyan)', color: 'var(--text-inverse)', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, marginTop: '20px', boxShadow: '0 8px 24px rgba(0,216,255,0.3)' }}
        >
          Generate AI Matches
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
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)',
          borderRadius: '16px', marginTop: '8px', overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)'
        }}
      >
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(item)}
            style={{
              width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
              background: 'transparent', border: 'none', borderBottom: idx === items.length - 1 ? 'none' : '1px solid var(--border-ui)',
              textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <MapPin size={14} color="var(--brand-cyan)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.main_text}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
