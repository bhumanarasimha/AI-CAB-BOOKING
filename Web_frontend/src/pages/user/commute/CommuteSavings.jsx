import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Leaf, Fuel,
  Share2,
  Award, Zap
} from 'lucide-react';

const CommuteSavings = () => {
  const navigate = useNavigate();

  const history = [
    { id: 1, date: '12 May, 2024', partner: 'Sarah Chen', saved: '₹240', fuel: '0.8L', co2: '1.2kg' },
    { id: 2, date: '11 May, 2024', partner: 'David Miller', saved: '₹180', fuel: '0.6L', co2: '0.9kg' },
    { id: 3, date: '10 May, 2024', partner: 'Sarah Chen', saved: '₹240', fuel: '0.8L', co2: '1.2kg' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '60px 20px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '10px', color: 'var(--text-main)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Impact Dashboard</h1>
        </div>
        <button style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '10px', color: 'var(--text-main)' }}>
          <Share2 size={20} />
        </button>
      </div>

      {/* Main Stats Card */}
      <div style={{ background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))', borderRadius: '32px', padding: '24px', marginBottom: '32px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 30px rgba(99,102,241,0.3)' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'white', filter: 'blur(80px)', opacity: 0.2 }} />
        
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8, marginBottom: '4px' }}>Total Savings this Month</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>₹4,280</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '16px' }}>
            <Leaf size={20} style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>12.4kg</p>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.8 }}>CO2 Reduced</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '16px' }}>
            <Fuel size={20} style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>4.2L</p>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.8 }}>Fuel Saved</p>
          </div>
        </div>
      </div>

      {/* AI Insights & Badges */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Achievements</h2>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto' }} className="no-scrollbar">
          <div style={{ flexShrink: 0, width: '140px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '24px', padding: '16px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(0,216,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Award size={24} color="var(--brand-cyan)" />
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Eco Master</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>10 Shared Rides</p>
          </div>
          <div style={{ flexShrink: 0, width: '140px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '24px', padding: '16px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Zap size={24} color="var(--brand-indigo)" />
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Super Saver</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>₹2k+ Monthly</p>
          </div>
        </div>
      </div>

      {/* Commute History */}
      <div>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Shared History</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item) => (
            <div key={item.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '20px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.partner}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.date}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10B981' }}>+{item.saved}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Saved on fuel</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommuteSavings;
