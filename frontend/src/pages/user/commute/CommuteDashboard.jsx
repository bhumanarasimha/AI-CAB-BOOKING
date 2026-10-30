import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, ChevronRight,
  TrendingUp, Plus,
  ArrowRightLeft, Loader2, ArrowLeft,
  Sparkles, ShieldCheck, MessageSquare, Navigation
} from 'lucide-react';

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

    if (!window.google || !window.google.maps || !window.google.maps.places) {
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-base, #080C14)', paddingBottom: '120px', position: 'relative' }}>

      {/* Top Header */}
      <div style={{ padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: '14px', zIndex: 10 }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'var(--bg-surface, #0F1623)', border: '1px solid var(--border-ui, rgba(255,255,255,0.1))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          aria-label="Go Back"
        >
          <ArrowLeft size={18} color="var(--text-main, #F1F5F9)" />
        </button>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ flex: 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Sparkles size={12} color="var(--brand-cyan, #00D8FF)" />
            <span style={{ fontSize: '0.7rem', color: 'var(--brand-cyan, #00D8FF)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              AI Commute Engine
            </span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main, #F1F5F9)', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
            Find Your <span style={{ color: 'var(--brand-cyan, #00D8FF)' }}>Perfect Match</span>
          </h1>
        </motion.div>
      </div>

      {/* AI Savings Feature Banner */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(0, 216, 255, 0.1))',
            borderRadius: '24px',
            padding: '20px',
            border: '1px solid rgba(0, 216, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'var(--brand-cyan, #00D8FF)', filter: 'blur(50px)', opacity: 0.15 }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '16px', background: 'rgba(0, 216, 255, 0.12)', border: '1px solid rgba(0, 216, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={22} color="var(--brand-cyan, #00D8FF)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main, #F1F5F9)' }}>Save up to ₹4,500/mo</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '6px' }}>98% Match</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9CA3AF)', lineHeight: 1.3 }}>
                Based on your office route similarity analytics
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/user/commute/savings')}
            style={{ 
              width: '100%', padding: '12px 16px', background: 'rgba(15, 22, 35, 0.8)',
              border: '1px solid rgba(0, 216, 255, 0.25)', borderRadius: '14px',
              color: 'var(--brand-cyan, #00D8FF)', fontSize: '0.85rem', fontWeight: 700,
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            View AI Savings Report <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>

      {/* Main Route Search Card */}
      <div style={{ padding: '0 20px', marginBottom: '28px' }}>
        <div style={{ background: 'var(--bg-surface, #0F1623)', borderRadius: '24px', padding: '20px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', boxShadow: '0 12px 35px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Route Connectors */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '14px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--brand-cyan, #00D8FF)', boxShadow: '0 0 10px var(--brand-cyan, #00D8FF)' }} />
                <div style={{ width: '2px', height: '38px', background: 'linear-gradient(to bottom, var(--brand-cyan, #00D8FF), var(--brand-indigo, #6366F1))' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--brand-indigo, #6366F1)', boxShadow: '0 0 10px var(--brand-indigo, #6366F1)' }} />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Home Location Input */}
                <div style={{ position: 'relative' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>
                    Origin / Home
                  </span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--bg-elevated, rgba(255,255,255,0.03))', borderRadius: '14px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', padding: '0 14px' }}>
                    <MapPin size={16} color="var(--brand-cyan, #00D8FF)" style={{ marginRight: '10px' }} />
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => {
                        setSource(e.target.value);
                        fetchSuggestions(e.target.value, 'source');
                      }}
                      onFocus={() => setActiveInput('source')}
                      placeholder="Enter home location"
                      style={{ width: '100%', height: '46px', background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)', fontSize: '0.9rem', outline: 'none' }}
                    />
                    {loading.source && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--brand-cyan, #00D8FF)' }} />}
                  </div>
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

                {/* Office Location Input */}
                <div style={{ position: 'relative' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', display: 'block' }}>
                    Destination / Office
                  </span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--bg-elevated, rgba(255,255,255,0.03))', borderRadius: '14px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', padding: '0 14px' }}>
                    <MapPin size={16} color="var(--brand-indigo, #6366F1)" style={{ marginRight: '10px' }} />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        fetchSuggestions(e.target.value, 'dest');
                      }}
                      onFocus={() => setActiveInput('dest')}
                      placeholder="Enter office / company name"
                      style={{ width: '100%', height: '46px', background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)', fontSize: '0.9rem', outline: 'none' }}
                    />
                    {loading.dest && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--brand-indigo, #6366F1)' }} />}
                  </div>
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

            {/* Time Pickers Row */}
            <div style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.03))', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <Clock size={16} color="var(--brand-cyan, #00D8FF)" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>Departure</span>
                  <input
                    type="time"
                    defaultValue="08:30"
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)',
                      fontSize: '0.9rem', fontWeight: 800, width: '100%', outline: 'none',
                      colorScheme: 'dark', cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              <div style={{ width: '1px', height: '28px', background: 'var(--border-ui, rgba(255,255,255,0.1))' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <Clock size={16} color="var(--brand-indigo, #6366F1)" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>Arrival</span>
                  <input
                    type="time"
                    defaultValue="09:15"
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--text-main, #F1F5F9)',
                      fontSize: '0.9rem', fontWeight: 800, width: '100%', outline: 'none',
                      colorScheme: 'dark', cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* AI Search Action Button */}
            <button
              onClick={() => navigate('/user/commute/results')}
              style={{ 
                width: '100%', height: '52px', background: 'linear-gradient(90deg, #6366F1, #00D8FF)',
                color: '#080C14', borderRadius: '16px', fontWeight: 900,
                fontSize: '1rem', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(0,216,255,0.3)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <span>Find Matches</span> <ArrowRightLeft size={18} color="#080C14" />
            </button>

          </div>
        </div>
      </div>

      {/* Recent Commute / Active Match Section */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--brand-cyan, #00D8FF)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main, #F1F5F9)' }}>Recent Commute</h2>
          </div>
          <button 
            onClick={() => navigate('/user/commute/results')}
            style={{ fontSize: '0.8rem', color: 'var(--brand-cyan, #00D8FF)', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            See All
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-surface, #0F1623)',
            borderRadius: '24px',
            padding: '20px',
            border: '1px solid var(--border-ui, rgba(255,255,255,0.08))',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" style={{ width: '48px', height: '48px', borderRadius: '16px', objectFit: 'cover' }} alt="Avatar" />
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#00D8FF', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={10} color="#080C14" />
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #F1F5F9)' }}>Anita Raj</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9CA3AF)' }}>Tech Park → Indiranagar</p>
              </div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 800, color: '#10B981' }}>
              ACTIVE MATCH
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-elevated, rgba(255,255,255,0.03))', padding: '12px 14px', borderRadius: '16px', border: '1px solid var(--border-ui, rgba(255,255,255,0.08))', marginBottom: '16px' }}>
            <Clock size={16} color="var(--brand-cyan, #00D8FF)" />
            <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>Departure</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main, #F1F5F9)' }}>08:45 AM</span>
              </div>
              <div style={{ width: '48px', height: '1px', background: 'var(--border-ui, rgba(255,255,255,0.1))', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-surface, #0F1623)', padding: '0 4px', fontSize: '0.65rem', color: 'var(--brand-cyan, #00D8FF)', fontWeight: 800 }}>50m</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>Arrival</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main, #F1F5F9)' }}>09:35 AM</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/user/commute/chat')}
              style={{ flex: 1, height: '44px', background: 'var(--bg-elevated, rgba(255,255,255,0.05))', border: '1px solid var(--border-ui, rgba(255,255,255,0.1))', borderRadius: '14px', color: 'var(--text-main, #F1F5F9)', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <MessageSquare size={15} color="var(--brand-cyan, #00D8FF)" /> Chat
            </button>
            <button 
              onClick={() => navigate('/user/commute/safety')}
              style={{ flex: 1, height: '44px', background: 'var(--brand-indigo, #6366F1)', border: 'none', borderRadius: '14px', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
            >
              <Navigation size={15} color="#FFFFFF" /> Track Ride
            </button>
          </div>
        </motion.div>
      </div>

      {/* Floating Action Add Profile Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/user/commute/create-profile')}
        style={{
          position: 'fixed', bottom: '85px', right: '20px',
          width: '56px', height: '56px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #6366F1, #00D8FF)', border: 'none',
          color: '#080C14', display: 'flex', justifyContent: 'center', alignItems: 'center',
          boxShadow: '0 8px 25px rgba(0,216,255,0.4)', zIndex: 50, cursor: 'pointer'
        }}
        aria-label="Create Commute Profile"
      >
        <Plus size={26} color="#080C14" />
      </motion.button>

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
          background: 'var(--bg-elevated, #1A2340)', border: '1px solid var(--border-ui, rgba(255,255,255,0.1))',
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
              background: 'transparent', border: 'none', borderBottom: idx === items.length - 1 ? 'none' : '1px solid var(--border-ui, rgba(255,255,255,0.08))',
              textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <MapPin size={16} color="var(--brand-cyan, #00D8FF)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #F1F5F9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.main_text}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted, #9CA3AF)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
