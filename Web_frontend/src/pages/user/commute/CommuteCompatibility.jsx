import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Share2, Leaf, Zap, Info, TrendingDown,
  Globe, User
} from 'lucide-react';

const CommuteCompatibility = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '60px 0 100px' }}>
      {/* Header */}
      <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '10px', color: 'var(--text-main)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Compatibility Analysis</h1>
        <button style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '10px', color: 'var(--text-main)' }}>
          <Share2 size={20} />
        </button>
      </div>

      {/* Hero Visual - Route Overlap */}
      <div style={{ padding: '0 20px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', height: '240px', background: 'var(--bg-surface)', borderRadius: '32px', border: '1px solid var(--border-ui)', overflow: 'hidden' }}>
          {/* Mock Map Background */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.4, background: 'radial-gradient(circle at 50% 50%, var(--brand-indigo) 0%, transparent 70%)' }} />
          
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '200px', height: '120px' }}>
              {/* Route lines */}
              <svg width="200" height="120" viewBox="0 0 200 120" fill="none">
                <motion.path 
                  d="M20 100 Q 100 20 180 100" 
                  stroke="var(--brand-cyan)" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                <motion.path 
                  d="M30 100 Q 100 30 170 100" 
                  stroke="var(--brand-indigo)" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                />
              </svg>
              
              <div style={{ position: 'absolute', top: '10px', left: '80px', background: 'var(--brand-cyan)', color: 'black', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>
                94% Overlap
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Sarah</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <User size={20} color="var(--brand-indigo)" />
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>You</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-surface)', borderRadius: '24px', padding: '20px', border: '1px solid var(--border-ui)' }}>
          <Leaf size={24} color="#10B981" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>1.2kg</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CO2 Saved / Week</p>
        </div>
        <div style={{ background: 'var(--bg-surface)', borderRadius: '24px', padding: '20px', border: '1px solid var(--border-ui)' }}>
          <TrendingDown size={24} color="var(--brand-cyan)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>40%</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Traffic Reduction</p>
        </div>
        <div style={{ background: 'var(--bg-surface)', borderRadius: '24px', padding: '20px', border: '1px solid var(--border-ui)' }}>
          <Globe size={24} color="var(--brand-indigo)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>₹960</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Monthly Savings</p>
        </div>
        <div style={{ background: 'var(--bg-surface)', borderRadius: '24px', padding: '20px', border: '1px solid var(--border-ui)' }}>
          <Zap size={24} color="#F59E0B" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>8min</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Time Optimized</p>
        </div>
      </div>

      {/* AI Explanation */}
      <div style={{ padding: '0 20px', marginBottom: '32px' }}>
        <div style={{ background: 'rgba(var(--brand-indigo-rgb), 0.05)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(var(--brand-indigo-rgb), 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Info size={18} color="var(--brand-indigo)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>AI Matching Logic</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Sarah and you share 8.2km of the 9km route. Your pickup times are within a 5-minute window. Both of you prefer a quiet morning commute and work at the same tech park, making this a <span style={{ color: 'var(--brand-cyan)', fontWeight: 700 }}>high-trust match</span>.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          onClick={() => navigate('/user/commute/chat')}
          style={{ width: '100%', padding: '18px', background: 'var(--brand-indigo)', color: 'white', border: 'none', borderRadius: '18px', fontSize: '1rem', fontWeight: 800, boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
        >
          Request Shared Ride
        </button>
        <button 
          onClick={() => navigate('/user/commute/safety')}
          style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-ui)', borderRadius: '18px', fontSize: '0.9rem', fontWeight: 600 }}
        >
          View Safety & Trust
        </button>
      </div>
    </div>
  );
};

export default CommuteCompatibility;
