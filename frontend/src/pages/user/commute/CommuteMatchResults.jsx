import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Filter, ShieldCheck,
  Clock, MessageCircle,
  Star, Briefcase, Car, Check, Users, Navigation, Sparkles
} from 'lucide-react';
import { matches } from './matches';

const CommuteMatchResults = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [sortBy, setSortBy] = useState('overlap'); // 'overlap' | 'savings' | 'rating'
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterRole, setFilterRole] = useState('all'); // 'all' | 'driver' | 'rider'
  const [connectedModal, setConnectedModal] = useState({ open: false, partner: null });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartride_commute_profile');
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const filteredMatches = matches.filter(m => {
    if (filterRole !== 'all' && m.role !== filterRole) return false;
    return true;
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (sortBy === 'savings') {
      const savA = parseInt(a.savings.replace(/\D/g, '')) || 0;
      const savB = parseInt(b.savings.replace(/\D/g, '')) || 0;
      return savB - savA;
    }
    if (sortBy === 'rating') {
      return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
    }
    return (parseInt(b.overlap) || 0) - (parseInt(a.overlap) || 0);
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base, #080C14)', padding: '60px 20px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ background: 'var(--bg-surface, #0F1623)', border: '1px solid var(--border-ui, rgba(255,255,255,0.1))', borderRadius: '14px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main, #F1F5F9)', cursor: 'pointer' }}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main, #F1F5F9)' }}>
              AI Commute Matches
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9CA3AF)' }}>
              {sortedMatches.length} route partners found • {profile?.destination?.split(',')[0] || 'Top Corridors'}
            </p>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            style={{
              background: showFilterMenu ? 'rgba(0,216,255,0.15)' : 'var(--bg-surface, #0F1623)',
              border: `1px solid ${showFilterMenu ? 'var(--brand-cyan, #00D8FF)' : 'var(--border-ui, rgba(255,255,255,0.1))'}`,
              borderRadius: '12px', padding: '10px', color: showFilterMenu ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-main, #F1F5F9)',
              cursor: 'pointer'
            }}
            aria-label="Filter matches"
          >
            <Filter size={18} />
          </button>

          {showFilterMenu && (
            <div style={{ position: 'absolute', right: 0, top: '48px', background: 'var(--bg-elevated, #1A2340)', border: '1px solid var(--border-ui, rgba(255,255,255,0.15))', borderRadius: '16px', padding: '10px', zIndex: 50, minWidth: '180px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', padding: '4px 8px' }}>Sort Priority</p>
              {[
                { id: 'overlap', label: 'Highest Route Overlap' },
                { id: 'savings', label: 'Maximum Fare Savings' },
                { id: 'rating', label: 'Top Rated Drivers' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setShowFilterMenu(false); }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: 'none', background: sortBy === opt.id ? 'rgba(0,216,255,0.15)' : 'transparent', color: sortBy === opt.id ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-main, #F1F5F9)', fontSize: '0.78rem', fontWeight: 700, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}
                >
                  {opt.label} {sortBy === opt.id && '✓'}
                </button>
              ))}

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', padding: '4px 8px' }}>Filter Role</p>
              {[
                { id: 'all', label: 'All Partners' },
                { id: 'driver', label: '🚗 Car Owners Only' },
                { id: 'rider', label: '🙋 Riders Looking' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setFilterRole(opt.id); setShowFilterMenu(false); }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: 'none', background: filterRole === opt.id ? 'rgba(99,102,241,0.2)' : 'transparent', color: filterRole === opt.id ? '#818CF8' : 'var(--text-main, #F1F5F9)', fontSize: '0.78rem', fontWeight: 700, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                >
                  {opt.label} {filterRole === opt.id && '✓'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Corridor Summary Banner */}
      {profile && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.62rem', color: '#00D8FF', fontWeight: 800, textTransform: 'uppercase' }}>Active Corridor</span>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F1F5F9', marginTop: '1px' }}>
              {profile.source?.split(',')[0]} → {profile.destination?.split(',')[0]}
            </p>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '4px 8px', borderRadius: '8px', fontWeight: 800 }}>
            ⏰ {profile.departureTime || '08:30 AM'}
          </span>
        </div>
      )}

      {/* Match Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sortedMatches.map((match, idx) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            style={{
              background: 'var(--bg-surface, #0F1623)',
              borderRadius: '24px',
              padding: '20px',
              border: '1px solid var(--border-ui, rgba(255,255,255,0.08))',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <img src={match.image} alt={match.name} style={{ width: '58px', height: '58px', borderRadius: '18px', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--brand-cyan, #00D8FF)', borderRadius: '50%', padding: '4px', border: '2px solid #0F1623' }}>
                  <ShieldCheck size={11} color="#080C14" />
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main, #F1F5F9)' }}>
                      {match.name}
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted, #9CA3AF)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Briefcase size={12} /> {match.company}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--brand-cyan, #00D8FF)' }}>
                      {match.overlap} Overlap
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end', marginTop: '2px' }}>
                      <Star size={11} fill="#F59E0B" color="#F59E0B" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main, #F1F5F9)' }}>
                        {match.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timing & Metric Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border-ui, rgba(255,255,255,0.06))' }}>
                <Clock size={15} color="var(--brand-cyan, #00D8FF)" />
                <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>Pickup</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main, #F1F5F9)' }}>{match.startTime}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--brand-cyan, #00D8FF)', fontWeight: 800 }}>{match.timeGap}</span>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted, #9CA3AF)' }}>{match.distance} detour</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>Arrival</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main, #F1F5F9)' }}>{match.reachTime}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '2px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>Fare Savings</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10B981' }}>{match.savings}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '2px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>Vehicle / Role</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #F1F5F9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {match.car || 'Commuter'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => navigate('/user/commute/chat')}
                style={{ flex: 1, padding: '12px', background: 'var(--bg-elevated, #1A2340)', color: 'var(--text-main, #F1F5F9)', border: '1px solid var(--border-ui, rgba(255,255,255,0.1))', borderRadius: '14px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <MessageCircle size={15} color="var(--brand-cyan, #00D8FF)" /> Chat
              </button>
              <button 
                onClick={() => setConnectedModal({ open: true, partner: match })}
                style={{ flex: 1.6, padding: '12px', background: 'linear-gradient(135deg, #00D8FF, #0284C7)', color: '#080C14', border: 'none', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,216,255,0.3)' }}
              >
                <Car size={15} /> Instant Pool
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {connectedModal.open && (
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
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Check size={28} color="#10B981" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F1F5F9', marginBottom: '6px' }}>
                Carpool Request Sent!
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '16px' }}>
                <strong>{connectedModal.partner?.name}</strong> has received your ride-match request.
              </p>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px', textAlign: 'left', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#9CA3AF' }}>Route Match:</span>
                  <strong style={{ color: '#00D8FF' }}>{connectedModal.partner?.overlap} Overlap</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#9CA3AF' }}>Est. Savings:</span>
                  <strong style={{ color: '#10B981' }}>{connectedModal.partner?.savings}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9CA3AF' }}>Vehicle:</span>
                  <strong style={{ color: '#F1F5F9' }}>{connectedModal.partner?.car || 'Verified Carpool'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setConnectedModal({ open: false, partner: null });
                    navigate('/user/commute/chat');
                  }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid rgba(0,216,255,0.3)',
                    background: 'rgba(0,216,255,0.1)', color: '#00D8FF', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  Open Chat
                </button>
                <button
                  onClick={() => setConnectedModal({ open: false, partner: null })}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '14px', border: 'none',
                    background: 'linear-gradient(90deg, #6366F1, #00D8FF)', color: '#080C14', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  Great!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommuteMatchResults;
