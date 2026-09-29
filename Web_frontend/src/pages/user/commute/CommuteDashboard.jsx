import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, ChevronRight,
  TrendingUp, Plus,
  ArrowRightLeft, Loader2
} from 'lucide-react';
import BottomNavigation from '../../../components/layout/BottomNavigation';

const CommuteDashboard = () => {
  const navigate = useNavigate();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState({ source: [], dest: [] });
  const [loading, setLoading] = useState({ source: false, dest: false });
  const [activeInput, setActiveInput] = useState(null); // 'source' or 'dest'

  const fetchSuggestions = async (query, type) => {
    if (!query || query.length < 3) {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    setActiveInput(type);

    if (!query || query.length < 3) return;

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ padding: '60px 20px 20px' }}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--brand-cyan)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Smart Commute
          </p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Find Your <span style={{ color: 'var(--brand-indigo)' }}>Perfect Match</span>
          </h1>
        </motion.div>
      </div>

      {/* Hero Card - Save Money */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--brand-indigo-rgb), 0.2), rgba(var(--brand-cyan-rgb), 0.1))',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--brand-indigo)', filter: 'blur(60px)', opacity: 0.3 }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <TrendingUp size={20} color="var(--brand-cyan)" />
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Save up to ₹4,500/mo</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Based on your office route similarity</p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/user/commute/savings')}
            style={{ 
              width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
              color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600,
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
            }}
          >
            View Savings Report <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>

      {/* Route Input Section */}
      <div style={{ padding: '0 20px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-surface)', borderRadius: '24px', padding: '20px', border: '1px solid var(--border-ui)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--brand-cyan)' }} />
                <div style={{ width: '2px', height: '30px', background: 'linear-gradient(to bottom, var(--brand-cyan), var(--brand-indigo))' }} />
                <MapPin size={14} color="var(--brand-indigo)" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      fetchSuggestions(e.target.value, 'source');
                    }}
                    onFocus={() => setActiveInput('source')}
                    placeholder="Home Location"
                    style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-ui)', padding: '8px 0', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}
                  />
                  {loading.source && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 0, top: '10px', color: 'var(--brand-cyan)' }} />}
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

                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      fetchSuggestions(e.target.value, 'dest');
                    }}
                    onFocus={() => setActiveInput('dest')}
                    placeholder="Office/Company Name"
                    style={{ width: '100%', background: 'transparent', border: 'none', padding: '8px 0', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}
                  />
                  {loading.dest && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 0, top: '10px', color: 'var(--brand-indigo)' }} />}
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

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-ui)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start</span>
                <input 
                  type="time" 
                  defaultValue="08:30" 
                  style={{ 
                    background: 'transparent', border: 'none', color: 'var(--text-main)', 
                    fontSize: '0.9rem', fontWeight: 700, width: '100%', outline: 'none',
                    colorScheme: 'dark', cursor: 'pointer'
                  }} 
                />
              </div>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-ui)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reach</span>
                <input 
                  type="time" 
                  defaultValue="09:15" 
                  style={{ 
                    background: 'transparent', border: 'none', color: 'var(--text-main)', 
                    fontSize: '0.9rem', fontWeight: 700, width: '100%', outline: 'none',
                    colorScheme: 'dark', cursor: 'pointer'
                  }} 
                />
              </div>
            </div>

            <button 
              onClick={() => navigate('/user/commute/results')}
              style={{ 
                width: '100%', background: 'var(--brand-indigo)', color: 'white', 
                borderRadius: '16px', padding: '16px', fontWeight: 800, 
                fontSize: '1rem', border: 'none', 
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
              }}
            >
              Find <ArrowRightLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Commute */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--brand-cyan)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Recent Commute</h2>
          </div>
          <button 
            onClick={() => navigate('/user/commute/results')}
            style={{ fontSize: '0.75rem', color: 'var(--brand-indigo)', fontWeight: 600, background: 'transparent', border: 'none' }}
          >
            See All
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '24px',
            padding: '20px',
            border: '1px solid var(--border-ui)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover' }} />
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Anita Raj</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tech Park → Indiranagar</p>
              </div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, color: '#10B981' }}>
              ACTIVE MATCH
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border-ui)', marginBottom: '16px' }}>
            <Clock size={14} color="var(--brand-cyan)" />
            <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>08:45 AM</span>
              </div>
              <div style={{ width: '40px', height: '1px', background: 'var(--border-ui)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-surface)', padding: '0 4px', fontSize: '0.6rem', color: 'var(--brand-cyan)', fontWeight: 700 }}>50m</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reach</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>09:35 AM</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/user/commute/chat')}
              style={{ flex: 1, padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-ui)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Message
            </button>
            <button 
              onClick={() => navigate('/user/commute/safety')}
              style={{ flex: 1, padding: '12px', background: 'var(--brand-indigo)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Track Ride
            </button>
          </div>
        </motion.div>
      </div>

      {/* Quick Action Floating Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/user/commute/create-profile')}
        style={{
          position: 'fixed', bottom: '110px', right: '20px',
          width: '56px', height: '56px', borderRadius: '20px',
          background: 'var(--brand-indigo)', border: 'none',
          color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
          boxShadow: '0 8px 24px rgba(99,102,241,0.4)', zIndex: 10
        }}
      >
        <Plus size={24} />
      </motion.button>

      <BottomNavigation />
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
            <MapPin size={16} color="var(--brand-cyan)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.main_text}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
