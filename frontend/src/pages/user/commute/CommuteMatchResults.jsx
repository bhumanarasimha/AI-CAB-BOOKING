import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Filter, ShieldCheck,
  Clock, MessageCircle,
  Star, Briefcase
} from 'lucide-react';
import { useGPSLocation } from '../../../hooks/useLocation';
import { matches } from './matches';

const CommuteMatchResults = () => {
  const navigate = useNavigate();
  const { address } = useGPSLocation();
  const currentCity = matches.find(m => address?.toLowerCase().includes(m.city.toLowerCase()))?.city || 'Chennai';

  const filteredMatches = matches.filter(m => m.city.toLowerCase() === currentCity.toLowerCase());

  const [sortBy, setSortBy] = useState('overlap'); // 'overlap' | 'savings' | 'rating'
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '60px 20px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '10px', color: 'var(--text-main)', cursor: 'pointer' }}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>AI Matches</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sortedMatches.length} partners found in {currentCity}</p>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            style={{ background: showFilterMenu ? 'rgba(0,216,255,0.15)' : 'var(--bg-surface)', border: `1px solid ${showFilterMenu ? 'var(--brand-cyan)' : 'var(--border-ui)'}`, borderRadius: '12px', padding: '10px', color: showFilterMenu ? 'var(--brand-cyan)' : 'var(--text-main)', cursor: 'pointer' }}
            aria-label="Filter matches"
          >
            <Filter size={20} />
          </button>
          {showFilterMenu && (
            <div style={{ position: 'absolute', right: 0, top: '48px', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '14px', padding: '8px', zIndex: 50, minWidth: '160px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px' }}>Sort By</p>
              {[
                { id: 'overlap', label: 'Highest Overlap' },
                { id: 'savings', label: 'Maximum Savings' },
                { id: 'rating', label: 'Top Rated' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setShowFilterMenu(false); }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: 'none', background: sortBy === opt.id ? 'rgba(0,216,255,0.1)' : 'transparent', color: sortBy === opt.id ? 'var(--brand-cyan)' : 'var(--text-main)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                >
                  {opt.label} {sortBy === opt.id && '✓'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Match Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sortedMatches.map((match, idx) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '24px',
              padding: '20px',
              border: '1px solid var(--border-ui)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <img src={match.image} alt={match.name} style={{ width: '64px', height: '64px', borderRadius: '20px', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--brand-cyan)', borderRadius: '50%', padding: '4px', border: '2px solid var(--bg-surface)' }}>
                  <ShieldCheck size={12} color="white" />
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{match.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Briefcase size={12} /> {match.company}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-cyan)' }}>{match.overlap} Overlap</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end', marginTop: '2px' }}>
                      <Star size={10} fill="#F59E0B" color="#F59E0B" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{match.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border-ui)' }}>
                <Clock size={14} color="var(--brand-cyan)" />
                <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{match.startTime}</span>
                  </div>
                  <div style={{ width: '40px', height: '1px', background: 'var(--border-ui)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-surface)', padding: '0 4px', fontSize: '0.6rem', color: 'var(--brand-cyan)', fontWeight: 700 }}>{match.timeGap}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reach</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{match.reachTime}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Savings</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>{match.savings}</span>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Distance</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{match.distance}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => navigate('/user/commute/chat')}
                style={{ flex: 1, padding: '12px', background: 'var(--bg-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-ui)', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <MessageCircle size={16} /> Message
              </button>
              <button 
                onClick={() => navigate('/user/commute/compatibility')}
                style={{ flex: 2, padding: '12px', background: 'var(--brand-indigo)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
              >
                Connect & Match
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CommuteMatchResults;
