import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Mail, FileText,
  UserCheck, Heart, AlertTriangle, Star,
  CheckCircle2
} from 'lucide-react';

const CommuteSafety = () => {
  const navigate = useNavigate();

  const verifications = [
    { id: 1, label: 'Work Email Verified', icon: Mail, status: 'Completed', color: 'var(--brand-cyan)' },
    { id: 2, label: 'Government ID Verified', icon: FileText, status: 'Completed', color: 'var(--brand-cyan)' },
    { id: 3, label: 'Company Profile Linked', icon: UserCheck, status: 'Completed', color: 'var(--brand-cyan)' },
    { id: 4, label: 'Social Connections', icon: Heart, status: '2 Mutual Friends', color: 'var(--brand-indigo)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '60px 20px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '10px', color: 'var(--text-main)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Safety & Trust</h1>
      </div>

      {/* Trust Score Gauge */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: '32px', padding: '32px', border: '1px solid var(--border-ui)', textAlign: 'center', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'var(--brand-cyan)', filter: 'blur(100px)', opacity: 0.1 }} />
        
        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 20px' }}>
          <svg width="120" height="120" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-ui)" strokeWidth="8" />
            <motion.circle 
              cx="50" cy="50" r="45" fill="none" stroke="var(--brand-cyan)" strokeWidth="8" 
              strokeDasharray="283"
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (283 * 0.95) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>98</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Trust Score</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
          {[1,2,3,4,5].map(i => <Star key={i} size={16} fill={i <= 4 ? "#F59E0B" : "none"} color={i <= 4 ? "#F59E0B" : "var(--border-ui)"} />)}
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 700 }}>Highly Trusted Commuter</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top 5% in your professional network</p>
      </div>

      {/* Verification List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile Verification</h2>
        {verifications.map((item) => (
          <div key={item.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}>
              <item.icon size={20} color="var(--text-muted)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.label}</p>
              <p style={{ fontSize: '0.75rem', color: item.status === 'Completed' ? '#10B981' : 'var(--brand-indigo)', fontWeight: 600 }}>{item.status}</p>
            </div>
            <CheckCircle2 size={20} color={item.status === 'Completed' ? '#10B981' : 'var(--brand-indigo)'} />
          </div>
        ))}
      </div>

      {/* Safety Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button style={{ width: '100%', padding: '18px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '18px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <AlertTriangle size={20} /> Emergency Contact Mode
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ flex: 1, padding: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Report Profile</button>
          <button style={{ flex: 1, padding: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Block User</button>
        </div>
      </div>
    </div>
  );
};

export default CommuteSafety;
