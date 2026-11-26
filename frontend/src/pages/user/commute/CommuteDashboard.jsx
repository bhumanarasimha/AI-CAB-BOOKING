import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, ChevronRight,
  TrendingUp,
  ArrowRightLeft, Loader2, ArrowLeft,
  Sparkles, ShieldCheck, MessageSquare, Navigation,
  Crosshair, Check, Car, User, Users, Leaf, VolumeX, Shield, PhoneCall,
  Trash2, Send
} from 'lucide-react';
import { matches, POPULAR_COMMUTE_HUBS } from './matches';
import { searchAllPlaces, searchLocalLandmarks } from '../../../services/placesService';
import { useAuth } from '../../../lib/AuthContext';
import {
  loadLocalCommuteRequests,
  fetchSyncedCommuteRequests,
  addCommuteRequest,
  deleteCommuteRequest,
  subscribeCommuteRequests,
} from './commuteRequestsStore';

const CommuteDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Commute State
  const [role, setRole] = useState('rider'); // 'rider' | 'driver'
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('08:30');
  const [returnTime, setReturnTime] = useState('18:00');
  const [recurrence, setRecurrence] = useState('mon-fri'); // 'mon-fri' | 'today' | 'flexible'
  const [preferences, setPreferences] = useState({
    acOnly: true,
    womenOnly: false,
    quietRide: true,
    evEco: false
  });

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState({ source: [], dest: [] });
  const [loading, setLoading] = useState({ source: false, dest: false });
  const [activeInput, setActiveInput] = useState(null); // 'source' or 'dest'
  const [requestModal, setRequestModal] = useState({ open: false, partner: null, status: 'idle' });
  const [communityRequests, setCommunityRequests] = useState(() => loadLocalCommuteRequests());
  const [justPostedToast, setJustPostedToast] = useState(Boolean(location.state?.requestCreated));

  useEffect(() => {
    let mounted = true;
    fetchSyncedCommuteRequests().then((list) => {
      if (mounted) setCommunityRequests(list);
    });
    const unsub = subscribeCommuteRequests((list) => {
      if (mounted) setCommunityRequests(list);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (justPostedToast) {
      const t = setTimeout(() => setJustPostedToast(false), 3800);
      return () => clearTimeout(t);
    }
  }, [justPostedToast]);

  // Load saved profile on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartride_commute_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.source) setSource(parsed.source);
        if (parsed.destination) setDestination(parsed.destination);
        if (parsed.departureTime) setDepartureTime(parsed.departureTime);
        if (parsed.returnTime) setReturnTime(parsed.returnTime);
        if (parsed.role) setRole(parsed.role);
        if (parsed.preferences) setPreferences(parsed.preferences);
      } else {
        // Defaults if empty - Chennai corridor & user saved pickup
        const savedPickup = typeof localStorage !== 'undefined' ? localStorage.getItem('smartride_user_pickup') : null;
        setSource((savedPickup && !savedPickup.includes('Ekambareswara')) ? savedPickup : 'Poonamallee High Road, Chennai');
        setDestination('Tidel Park, OMR Tech Corridor, Chennai');
      }
    } catch {
      // Fallback
    }
  }, []);

  // Save profile helper
  const saveCommuteState = (updates = {}) => {
    try {
      const stateToSave = {
        source: updates.source !== undefined ? updates.source : source,
        destination: updates.destination !== undefined ? updates.destination : destination,
        departureTime: updates.departureTime !== undefined ? updates.departureTime : departureTime,
        returnTime: updates.returnTime !== undefined ? updates.returnTime : returnTime,
        role: updates.role !== undefined ? updates.role : role,
        recurrence: updates.recurrence !== undefined ? updates.recurrence : recurrence,
        preferences: updates.preferences !== undefined ? updates.preferences : preferences,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('smartride_commute_profile', JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Could not save commute profile to localStorage", e);
    }
  };

  // 1-Tap GPS Location Detector
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser or device.");
      return;
    }

    setDetectingGps(true);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        const resolvedAddress = `Current Location (${lat}, ${lng})`;
        setSource(resolvedAddress);
        setDetectingGps(false);
        setGpsSuccess(true);
        saveCommuteState({ source: resolvedAddress });
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      (_err) => {
        // High-accuracy fallback
        const savedPickup = typeof localStorage !== 'undefined' ? localStorage.getItem('smartride_user_pickup') : null;
        const fallbackAddress = (savedPickup && !savedPickup.includes('Ekambareswara')) ? savedPickup : 'Poonamallee High Road, Chennai';
        setSource(fallbackAddress);
        setDetectingGps(false);
        setGpsSuccess(true);
        saveCommuteState({ source: fallbackAddress });
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
    saveCommuteState({ source: destination, destination: temp });
  };

  // Smart Autocomplete with fast resilient fallback
  const fetchSuggestions = (query, type) => {
    if (!query || query.length < 2) {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    setActiveInput(type);

    // Fast local matches from POPULAR_COMMUTE_HUBS & COMPREHENSIVE_LANDMARKS
    const hubMatches = POPULAR_COMMUTE_HUBS.filter(h => 
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.city.toLowerCase().includes(query.toLowerCase()) ||
      h.landmark.toLowerCase().includes(query.toLowerCase())
    ).map(h => ({
      display_name: `${h.name}, ${h.city}`,
      main_text: h.name,
      secondary_text: `${h.landmark} • ${h.city}`
    }));

    const extraLandmarks = searchLocalLandmarks(query, 6).map(l => ({
      display_name: l.fullText,
      main_text: l.name,
      secondary_text: l.address
    }));

    // Merge deduplicated
    const seen = new Set(hubMatches.map(h => h.main_text.toLowerCase().trim()));
    const localFiltered = [...hubMatches];
    for (const el of extraLandmarks) {
      const lower = el.main_text.toLowerCase().trim();
      if (!seen.has(lower)) {
        seen.add(lower);
        localFiltered.push(el);
      }
    }

    if (window.google?.maps?.places) {
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions({
          input: query,
          componentRestrictions: { country: 'in' }
        }, (predictions, status) => {
          if (status === 'OK' && predictions && predictions.length > 0) {
            const googleResults = predictions.map(p => ({
              display_name: p.description,
              main_text: p.structured_formatting.main_text,
              secondary_text: p.structured_formatting.secondary_text
            }));
            setSuggestions(prev => ({ ...prev, [type]: googleResults }));
          } else {
            setSuggestions(prev => ({ ...prev, [type]: localFiltered }));
          }
          setLoading(prev => ({ ...prev, [type]: false }));
        });
        return;
      } catch {
        // Fallback to local
      }
    }

    // Immediate local results + async live geocoding
    setSuggestions(prev => ({ ...prev, [type]: localFiltered }));
    searchAllPlaces(query).then(places => {
      setLoading(prev => ({ ...prev, [type]: false }));
      if (places && places.length > 0) {
        const liveFormatted = places.map(p => ({
          display_name: p.fullText || `${p.name}, ${p.address}`,
          main_text: p.name,
          secondary_text: p.address
        }));
        const combinedSeen = new Set(localFiltered.map(x => x.main_text.toLowerCase().trim()));
        const mergedAll = [...localFiltered];
        for (const item of liveFormatted) {
          const l = item.main_text.toLowerCase().trim();
          if (!combinedSeen.has(l)) {
            combinedSeen.add(l);
            mergedAll.push(item);
          }
        }
        setSuggestions(prev => ({ ...prev, [type]: mergedAll.slice(0, 8) }));
      }
    }).catch(() => {
      setLoading(prev => ({ ...prev, [type]: false }));
    });
  };

  // Filter dynamic matches
  const displayMatches = matches.filter(m => {
    if (preferences.womenOnly && !m.preferences.some(p => p.toLowerCase().includes('women'))) {
      return false;
    }
    if (preferences.evEco && !m.car?.toLowerCase().includes('ev')) {
      return false;
    }
    return true;
  });

  // Publish a Live Community Commute Request directly from the Commute Dashboard
  const handlePublishCommunityRequest = () => {
    const resolvedSource = (source || '').trim() || 'Poonamallee High Road, Chennai';
    const resolvedDest = (destination || '').trim() || 'Tidel Park, OMR Tech Corridor, Chennai';
    saveCommuteState({ source: resolvedSource, destination: resolvedDest });
    const created = addCommuteRequest({
      type: 'posted',
      userName: user?.name || (user?.email ? user.email.split('@')[0] : 'You'),
      role,
      source: resolvedSource,
      destination: resolvedDest,
      departureTime,
      returnTime,
      transport: role === 'driver' ? 'car' : 'shared',
      workMode: recurrence,
      status: 'Live in Community',
    });
    setCommunityRequests((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
    setJustPostedToast(true);
  };

  // Handle Instant Pool Request (and save it to Community Requests feed!)
  const handleRequestPool = (partner) => {
    setRequestModal({ open: true, partner, status: 'requesting' });
    setTimeout(() => {
      const otp = String(Math.floor(1000 + Math.random() * 9000));
      const booked = addCommuteRequest({
        type: 'pool_booking',
        userName: user?.name || (user?.email ? user.email.split('@')[0] : 'You'),
        role,
        source: (source || '').trim() || 'Current Location',
        destination: (destination || '').trim() || 'Tidel Park, OMR',
        departureTime: partner?.startTime || departureTime,
        returnTime,
        partnerName: partner?.name || 'Commute Partner',
        partnerCar: partner?.car || 'Sedan',
        otp,
        status: 'Pool Confirmed',
      });
      setCommunityRequests((prev) => [booked, ...prev.filter((r) => r.id !== booked.id)]);
      setRequestModal({ open: true, partner: { ...partner, otp }, status: 'confirmed' });
    }, 1000);
  };

  const handleRemoveCommunityRequest = (id) => {
    const updated = deleteCommuteRequest(id);
    setCommunityRequests(updated);
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', overflowX: 'hidden', background: 'var(--bg-base, #080C14)', paddingBottom: '120px', position: 'relative', boxSizing: 'border-box' }}>

      {/* Top Header */}
      <div style={{ padding: '44px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <button 
            onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/user/home'))}
            style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'var(--bg-surface, #0F1623)', border: '1px solid var(--border-ui, rgba(255,255,255,0.1))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            aria-label="Go Back"
          >
            <ArrowLeft size={18} color="var(--text-main, #F1F5F9)" />
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Sparkles size={12} color="var(--brand-cyan, #00D8FF)" />
              <span style={{ fontSize: '0.68rem', color: 'var(--brand-cyan, #00D8FF)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                AI Smart Commute Hub
              </span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main, #F1F5F9)', letterSpacing: '-0.02em', lineHeight: '1.2', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Daily Carpool & <span style={{ color: 'var(--brand-cyan, #00D8FF)' }}>Rideshare</span>
            </h1>
          </div>
        </div>

        {/* Role Toggle Pill */}
        <div style={{ background: 'var(--bg-surface, #0F1623)', border: '1px solid var(--border-ui, rgba(255,255,255,0.12))', borderRadius: '16px', padding: '3px', display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => { setRole('rider'); saveCommuteState({ role: 'rider' }); }}
            style={{
              padding: '6px 12px', borderRadius: '12px', border: 'none',
              background: role === 'rider' ? 'linear-gradient(135deg, #00D8FF, #0284C7)' : 'transparent',
              color: role === 'rider' ? '#080C14' : 'var(--text-muted, #9CA3AF)',
              fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <User size={13} /> Rider
          </button>
          <button
            onClick={() => { setRole('driver'); saveCommuteState({ role: 'driver' }); }}
            style={{
              padding: '6px 12px', borderRadius: '12px', border: 'none',
              background: role === 'driver' ? 'linear-gradient(135deg, #6366F1, #818CF8)' : 'transparent',
              color: role === 'driver' ? '#FFFFFF' : 'var(--text-muted, #9CA3AF)',
              fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <Car size={13} /> Driver
          </button>
        </div>
      </div>

      {/* AI Savings & Eco Impact Metric Banner */}
      <div style={{ padding: '0 16px', marginBottom: '18px' }}>
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(0, 216, 255, 0.12))',
            borderRadius: '24px',
            padding: '18px 20px',
            border: '1px solid rgba(0, 216, 255, 0.25)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
          }}
        >
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'var(--brand-cyan, #00D8FF)', filter: 'blur(50px)', opacity: 0.15 }} />
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(0, 216, 255, 0.15)', border: '1px solid rgba(0, 216, 255, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={22} color="var(--brand-cyan, #00D8FF)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main, #F1F5F9)' }}>
                    {role === 'driver' ? 'Earn up to ₹6,200/mo' : 'Save up to ₹4,800/mo'}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.18)', padding: '2px 8px', borderRadius: '8px' }}>
                    96% AI Match
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9CA3AF)', marginTop: '2px' }}>
                  🌱 22 kg CO₂ reduced • Based on shared route corridor
                </p>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/user/commute/savings')}
              style={{ 
                flex: 1, padding: '10px 14px', background: 'rgba(15, 22, 35, 0.85)',
                border: '1px solid rgba(0, 216, 255, 0.3)', borderRadius: '12px',
                color: 'var(--brand-cyan, #00D8FF)', fontSize: '0.8rem', fontWeight: 700,
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Leaf size={14} /> Full Savings Report <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => navigate('/user/commute/safety')}
              style={{ 
                padding: '10px 14px', background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)', borderRadius: '12px',
                color: '#818CF8', fontSize: '0.8rem', fontWeight: 700,
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={14} /> Verified Safety
            </button>
          </div>
        </motion.div>
      </div>

      {/* Main Route & Schedule Setup Card */}
      <div style={{ padding: '0 16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-surface, #0F1623)', borderRadius: '24px', padding: '18px 16px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', boxShadow: '0 12px 35px rgba(0,0,0,0.25)', overflow: 'hidden', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Route Inputs with Swap & GPS Detect */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--brand-cyan, #00D8FF)', boxShadow: '0 0 10px var(--brand-cyan, #00D8FF)' }} />
                <button 
                  onClick={handleSwapLocations}
                  title="Swap Origin and Destination"
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    color: 'var(--text-main, #F1F5F9)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-cyan, #00D8FF)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                >
                  <ArrowRightLeft size={14} />
                </button>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--brand-indigo, #6366F1)', boxShadow: '0 0 10px var(--brand-indigo, #6366F1)' }} />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Origin / Home Input */}
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Origin / Pickup Spot
                    </span>
                    <button
                      onClick={handleDetectGPS}
                      disabled={detectingGps}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: gpsSuccess ? '#10B981' : 'var(--brand-cyan, #00D8FF)',
                        fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {detectingGps ? (
                        <>
                          <Loader2 size={11} className="animate-spin" /> Detecting...
                        </>
                      ) : gpsSuccess ? (
                        <>
                          <Check size={11} /> GPS Located
                        </>
                      ) : (
                        <>
                          <Crosshair size={11} /> Use My Location
                        </>
                      )}
                    </button>
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--bg-elevated, rgba(255,255,255,0.03))', borderRadius: '14px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', padding: '0 12px' }}>
                    <MapPin size={16} color="var(--brand-cyan, #00D8FF)" style={{ marginRight: '8px', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => {
                        setSource(e.target.value);
                        saveCommuteState({ source: e.target.value });
                        fetchSuggestions(e.target.value, 'source');
                      }}
                      onFocus={() => setActiveInput('source')}
                      placeholder="Enter home / pickup location"
                      style={{ width: '100%', height: '44px', background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)', fontSize: '0.88rem', outline: 'none' }}
                    />
                    {loading.source && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--brand-cyan, #00D8FF)' }} />}
                  </div>
                  <SuggestionList 
                    show={activeInput === 'source' && suggestions.source.length > 0} 
                    items={suggestions.source} 
                    onSelect={(item) => {
                      setSource(item.display_name);
                      saveCommuteState({ source: item.display_name });
                      setSuggestions(prev => ({ ...prev, source: [] }));
                      setActiveInput(null);
                    }}
                  />
                </div>

                {/* Destination / Office Input */}
                <div style={{ position: 'relative' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>
                    Destination / Office Tech Hub
                  </span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--bg-elevated, rgba(255,255,255,0.03))', borderRadius: '14px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', padding: '0 12px' }}>
                    <MapPin size={16} color="var(--brand-indigo, #6366F1)" style={{ marginRight: '8px', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        saveCommuteState({ destination: e.target.value });
                        fetchSuggestions(e.target.value, 'dest');
                      }}
                      onFocus={() => setActiveInput('dest')}
                      placeholder="Enter office / company / tech park"
                      style={{ width: '100%', height: '44px', background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)', fontSize: '0.88rem', outline: 'none' }}
                    />
                    {loading.dest && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--brand-indigo, #6366F1)' }} />}
                  </div>
                  <SuggestionList 
                    show={activeInput === 'dest' && suggestions.dest.length > 0} 
                    items={suggestions.dest} 
                    onSelect={(item) => {
                      setDestination(item.display_name);
                      saveCommuteState({ destination: item.display_name });
                      setSuggestions(prev => ({ ...prev, dest: [] }));
                      setActiveInput(null);
                    }}
                  />
                </div>

              </div>
            </div>

            {/* Quick-Pick Popular Office / Tech Hubs */}
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'block' }}>
                Quick Tech Hubs
              </span>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {POPULAR_COMMUTE_HUBS.slice(0, 5).map((hub, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const fullHub = `${hub.name}, ${hub.city}`;
                      setDestination(fullHub);
                      saveCommuteState({ destination: fullHub });
                    }}
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

            {/* Shift & Schedule - Responsive 2-Row Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Departure & Return Timings - 2 Equal Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Morning Out */}
                <div style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.03))',
                  borderRadius: '16px', padding: '10px 12px',
                  border: '1px solid var(--border-ui, rgba(255,255,255,0.08))',
                  display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} color="var(--brand-cyan, #00D8FF)" />
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                      Morning Out
                    </span>
                  </div>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => {
                      setDepartureTime(e.target.value);
                      saveCommuteState({ departureTime: e.target.value });
                    }}
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)',
                      fontSize: '0.92rem', fontWeight: 800, width: '100%', outline: 'none',
                      colorScheme: 'dark', cursor: 'pointer', padding: 0
                    }}
                  />
                </div>

                {/* Evening Return */}
                <div style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.03))',
                  borderRadius: '16px', padding: '10px 12px',
                  border: '1px solid var(--border-ui, rgba(255,255,255,0.08))',
                  display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} color="var(--brand-indigo, #6366F1)" />
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                      Evening Return
                    </span>
                  </div>
                  <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => {
                      setReturnTime(e.target.value);
                      saveCommuteState({ returnTime: e.target.value });
                    }}
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)',
                      fontSize: '0.92rem', fontWeight: 800, width: '100%', outline: 'none',
                      colorScheme: 'dark', cursor: 'pointer', padding: 0
                    }}
                  />
                </div>
              </div>

              {/* Schedule Recurrence Selector - Full Width */}
              <div style={{
                background: 'var(--bg-elevated, rgba(255,255,255,0.03))',
                borderRadius: '16px', padding: '10px 12px',
                border: '1px solid var(--border-ui, rgba(255,255,255,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.85rem' }}>📅</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                    Schedule
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
                  {[
                    { id: 'mon-fri', label: 'Mon–Fri' },
                    { id: 'today', label: 'Today Only' },
                    { id: 'flexible', label: 'Hybrid' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setRecurrence(s.id);
                        saveCommuteState({ recurrence: s.id });
                      }}
                      style={{
                        padding: '5px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800,
                        border: recurrence === s.id ? '1px solid var(--brand-cyan, #00D8FF)' : '1px solid rgba(255,255,255,0.06)',
                        background: recurrence === s.id ? 'rgba(0, 216, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: recurrence === s.id ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-muted, #9CA3AF)',
                        cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Commute Preference Filters - 2x2 Symmetrical Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...preferences, acOnly: !preferences.acOnly };
                  setPreferences(updated);
                  saveCommuteState({ preferences: updated });
                }}
                style={{
                  padding: '9px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer',
                  background: preferences.acOnly ? 'rgba(0,216,255,0.14)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${preferences.acOnly ? 'var(--brand-cyan, #00D8FF)' : 'rgba(255,255,255,0.08)'}`,
                  color: preferences.acOnly ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-muted, #9CA3AF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.2s', minWidth: 0
                }}
              >
                <span>❄️</span> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>AC Only</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...preferences, womenOnly: !preferences.womenOnly };
                  setPreferences(updated);
                  saveCommuteState({ preferences: updated });
                }}
                style={{
                  padding: '9px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer',
                  background: preferences.womenOnly ? 'rgba(236,72,153,0.16)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${preferences.womenOnly ? '#EC4899' : 'rgba(255,255,255,0.08)'}`,
                  color: preferences.womenOnly ? '#F472B6' : 'var(--text-muted, #9CA3AF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.2s', minWidth: 0
                }}
              >
                <span>👩</span> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Women Only</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...preferences, evEco: !preferences.evEco };
                  setPreferences(updated);
                  saveCommuteState({ preferences: updated });
                }}
                style={{
                  padding: '9px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer',
                  background: preferences.evEco ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${preferences.evEco ? '#10B981' : 'rgba(255,255,255,0.08)'}`,
                  color: preferences.evEco ? '#34D399' : 'var(--text-muted, #9CA3AF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.2s', minWidth: 0
                }}
              >
                <span>⚡</span> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>EV / Eco</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...preferences, quietRide: !preferences.quietRide };
                  setPreferences(updated);
                  saveCommuteState({ preferences: updated });
                }}
                style={{
                  padding: '9px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer',
                  background: preferences.quietRide ? 'rgba(99,102,241,0.16)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${preferences.quietRide ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
                  color: preferences.quietRide ? '#A5B4FC' : 'var(--text-muted, #9CA3AF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.2s', minWidth: 0
                }}
              >
                <VolumeX size={13} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Quiet Ride</span>
              </button>
            </div>

            {/* Action Buttons: Post Community Request + Explore AI Matches */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handlePublishCommunityRequest}
                style={{ 
                  width: '100%', height: '48px', background: 'linear-gradient(90deg, #10B981, #00D8FF)',
                  color: '#080C14', borderRadius: '16px', fontWeight: 900,
                  fontSize: '0.92rem', border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 22px rgba(16,185,129,0.32)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={15} color="#080C14" /> <span>Post Community Ride Request</span>
              </button>

              <button
                onClick={() => {
                  saveCommuteState();
                  navigate('/user/commute/results');
                }}
                style={{ 
                  width: '100%', height: '46px', background: 'linear-gradient(90deg, #6366F1, #00D8FF)',
                  color: '#080C14', borderRadius: '16px', fontWeight: 900,
                  fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(0,216,255,0.22)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <span>Explore All {displayMatches.length} AI Matches</span> <ArrowRightLeft size={15} color="#080C14" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Toast Confirmation When User Posts a Request */}
      <AnimatePresence>
        {justPostedToast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{
              margin: '0 16px 14px', padding: '11px 14px', borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.16)', border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#10B981', fontSize: '0.78rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Check size={16} />
            <span>Your commute request is live and visible in the Community feed below!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 USER-CREATED ACTIVE COMMUNITY REQUESTS SECTION */}
      <div style={{ padding: '0 16px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={17} color="#10B981" />
            <h2 style={{ fontSize: '1.02rem', fontWeight: 900, color: 'var(--text-main, #F1F5F9)' }}>
              Active Community Requests ({communityRequests.length})
            </h2>
          </div>
          <button
            onClick={() => navigate('/user/commute/create-profile')}
            style={{
              fontSize: '0.72rem', fontWeight: 800, color: '#00D8FF',
              background: 'rgba(0,216,255,0.1)', border: '1px solid rgba(0,216,255,0.3)',
              borderRadius: '8px', padding: '4px 9px', cursor: 'pointer'
            }}
          >
            + New Request
          </button>
        </div>

        {communityRequests.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface, #0F1623)', borderRadius: '18px', padding: '16px',
            border: '1px dashed var(--border-ui, rgba(255,255,255,0.12))', textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)' }}>
              No active community requests yet.
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted, #9CA3AF)', marginTop: '3px' }}>
              Tap <strong>Post Community Ride Request</strong> above or <strong>+ New Request</strong> to publish your route live!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {communityRequests.map((req) => {
              const isPool = req.type === 'pool_booking';
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: isPool ? 'rgba(0, 216, 255, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    border: `1.5px solid ${isPool ? 'rgba(0, 216, 255, 0.45)' : 'rgba(16, 185, 129, 0.45)'}`,
                    borderRadius: '18px', padding: '14px',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.18)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
                          padding: '2px 7px', borderRadius: '6px',
                          background: isPool ? 'rgba(0, 216, 255, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isPool ? '#00D8FF' : '#10B981'
                        }}>
                          {isPool ? '🚗 POOL CONFIRMED' : '🟢 LIVE COMMUNITY REQUEST'}
                        </span>
                        <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)' }}>
                          {req.role === 'driver' ? 'Car Owner' : 'Rider'} · {req.userName || 'You'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--text-main, #F1F5F9)', marginTop: '6px', lineHeight: 1.35 }}>
                        {req.source} ➔ {req.destination}
                      </p>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted, #9CA3AF)', fontWeight: 700 }}>
                        <span>⏰ Departs: <strong style={{ color: 'var(--text-main, #F1F5F9)' }}>{req.departureTime}</strong></span>
                        {req.returnTime && <span>🔁 Return: <strong style={{ color: 'var(--text-main, #F1F5F9)' }}>{req.returnTime}</strong></span>}
                        {req.partnerName && <span>👤 Partner: <strong style={{ color: '#00D8FF' }}>{req.partnerName}</strong></span>}
                        {req.vehicleNumber && <span>🚘 {req.vehicleNumber}</span>}
                        {req.otp && <span>🔑 OTP: <strong style={{ color: '#10B981' }}>{req.otp}</strong></span>}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveCommunityRequest(req.id)}
                      title="Cancel / Remove Request"
                      style={{
                        padding: '6px 8px', borderRadius: '10px', flexShrink: 0,
                        background: 'rgba(239, 68, 68, 0.14)', border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '0.68rem', fontWeight: 800
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Matched Route Partners Section */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--brand-cyan, #00D8FF)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main, #F1F5F9)' }}>
              Top Daily Route Matches
            </h2>
          </div>
          <button 
            onClick={() => navigate('/user/commute/results')}
            style={{ fontSize: '0.8rem', color: 'var(--brand-cyan, #00D8FF)', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            See All ({displayMatches.length})
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {displayMatches.slice(0, 3).map((match) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--bg-surface, #0F1623)',
                borderRadius: '22px',
                padding: '16px',
                border: '1px solid var(--border-ui, rgba(255,255,255,0.08))',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            >
              {/* Partner Card Top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={match.image} 
                      style={{ width: '46px', height: '46px', borderRadius: '15px', objectFit: 'cover', background: 'rgba(0,216,255,0.15)' }} 
                      alt={match.name} 
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (el.dataset.fallbackApplied) return;
                        el.dataset.fallbackApplied = '1';
                        const ch = (match.name || 'S').charAt(0).toUpperCase();
                        el.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#0EA5E9"/><text x="50%" y="54%" font-size="42" font-family="sans-serif" font-weight="bold" fill="#080C14" text-anchor="middle" dominant-baseline="middle">${ch}</text></svg>`)}`;
                      }}
                    />
                    <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#00D8FF', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={9} color="#080C14" />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #F1F5F9)' }}>
                        {match.name}
                      </h3>
                      <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '6px', color: 'var(--brand-cyan, #00D8FF)', fontWeight: 700 }}>
                        {match.rating} ★
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted, #9CA3AF)', marginTop: '1px' }}>
                      {match.company}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 8px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 800, color: '#10B981', display: 'inline-block' }}>
                    {match.overlap} MATCH
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--brand-cyan, #00D8FF)', fontWeight: 800, marginTop: '3px' }}>
                    {match.savings}
                  </div>
                </div>
              </div>

              {/* Ride Route & Timing Details */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-elevated, rgba(255,255,255,0.03))', padding: '10px 12px', borderRadius: '14px', border: '1px solid var(--border-ui, rgba(255,255,255,0.06))', marginBottom: '12px' }}>
                <Clock size={14} color="var(--brand-cyan, #00D8FF)" />
                <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>Pickup</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main, #F1F5F9)' }}>{match.startTime}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--brand-cyan, #00D8FF)', fontWeight: 800 }}>{match.timeGap}</span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted, #9CA3AF)' }}>{match.distance} deviation</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>Drop-off</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main, #F1F5F9)' }}>{match.reachTime}</span>
                  </div>
                </div>
              </div>

              {/* Car & Seats info */}
              {match.car && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted, #9CA3AF)', marginBottom: '12px' }}>
                  <span>🚗 <strong>{match.car}</strong></span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>{match.seatsLeft} seats available</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => navigate('/user/commute/chat')}
                  style={{ flex: 1, minWidth: 0, height: '40px', background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-ui, rgba(255,255,255,0.1))', borderRadius: '12px', color: 'var(--text-main, #F1F5F9)', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer', padding: '0 4px' }}
                >
                  <MessageSquare size={13} color="var(--brand-cyan, #00D8FF)" /> Chat
                </button>
                <button 
                  onClick={() => navigate('/user/commute/compatibility')}
                  style={{ flex: 1, minWidth: 0, height: '40px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: '#A5B4FC', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer', padding: '0 4px' }}
                >
                  <Navigation size={13} color="#A5B4FC" /> Route Fit
                </button>
                <button 
                  onClick={() => handleRequestPool(match)}
                  style={{ flex: 1.2, minWidth: 0, height: '40px', background: 'linear-gradient(135deg, #00D8FF, #0284C7)', border: 'none', borderRadius: '12px', color: '#080C14', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,216,255,0.3)', padding: '0 6px' }}
                >
                  <Car size={13} /> Pool Ride
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Instant Pool Request Modal */}
      <AnimatePresence>
        {requestModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: '#0F1623', border: '1px solid rgba(0,216,255,0.3)',
                borderRadius: '26px', padding: '26px', width: '100%', maxWidth: '380px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)', textAlign: 'center'
              }}
            >
              {requestModal.status === 'requesting' ? (
                <div>
                  <Loader2 size={36} className="animate-spin" color="var(--brand-cyan, #00D8FF)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#F1F5F9', marginBottom: '6px' }}>
                    Connecting with {requestModal.partner?.name}...
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                    Verifying route intersection and locking shared seats.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <Check size={28} color="#10B981" />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F1F5F9', marginBottom: '6px' }}>
                    Shared Commute Booked!
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '16px' }}>
                    You are paired with <strong>{requestModal.partner?.name}</strong> for {departureTime} AM.
                  </p>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px', textAlign: 'left', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#9CA3AF' }}>Pickup Point:</span>
                      <strong style={{ color: '#00D8FF' }}>{source.slice(0, 24)}...</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#9CA3AF' }}>Vehicle:</span>
                      <strong style={{ color: '#F1F5F9' }}>{requestModal.partner?.car || 'Sedan'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9CA3AF' }}>Security OTP:</span>
                      <strong style={{ color: '#10B981', letterSpacing: '0.1em' }}>4829</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setRequestModal({ open: false, partner: null, status: 'idle' });
                        navigate('/user/commute/chat');
                      }}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid rgba(0,216,255,0.3)',
                        background: 'rgba(0,216,255,0.1)', color: '#00D8FF', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
                      }}
                    >
                      Chat with Driver
                    </button>
                    <button
                      onClick={() => setRequestModal({ open: false, partner: null, status: 'idle' })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '14px', border: 'none',
                        background: 'linear-gradient(90deg, #6366F1, #00D8FF)', color: '#080C14', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer'
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)'
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
            <MapPin size={15} color="var(--brand-cyan, #00D8FF)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #F1F5F9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.main_text}
              </p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted, #9CA3AF)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.secondary_text}
              </p>
            </div>
          </button>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

export default CommuteDashboard;
