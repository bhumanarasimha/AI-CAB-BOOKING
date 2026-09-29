import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Gift, Users, Star } from 'lucide-react';

const InviteFriend = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const code = 'ALEX2025';

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    { label: 'WhatsApp',  bg: '#25D366', emoji: '💬' },
    { label: 'Messages',  bg: 'var(--brand-indigo)', emoji: '📱' },
    { label: 'Email',     bg: '#374151', emoji: '📧' },
    { label: 'More',      bg: 'var(--bg-elevated)', emoji: '⋯' },
  ];

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
      {/* Header */}
      <div style={{ padding: '52px 20px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
          <ArrowLeft size={18} color="#9CA3AF" />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          style={{ width: '90px', height: '90px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(var(--brand-cyan-rgb), 0.15), rgba(var(--brand-indigo-rgb), 0.15))', border: '1px solid rgba(var(--brand-cyan-rgb), 0.2)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}
        >🎁</motion.div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em', marginBottom: '10px' }}>
          Invite friends,<br/>earn free rides
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#6B7280', lineHeight: 1.65 }}>
          Share your code and get <span style={{ color: 'var(--brand-cyan)', fontWeight: 700 }}>₹150 ride credit</span> for every friend who books their first ride.
        </p>
      </div>

      <div style={{ padding: '24px 16px 100px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Referral Code */}
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Your Referral Code</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15,22,35,0.8)', border: '1px dashed rgba(var(--brand-indigo-rgb), 0.4)', borderRadius: '14px', padding: '16px 18px' }}>
            <span style={{ flex: 1, fontSize: '1.5rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '0.12em', textAlign: 'center' }}>{code}</span>
            <button onClick={handleCopy} style={{ width: '38px', height: '38px', borderRadius: '10px', background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(var(--brand-indigo-rgb), 0.12)', border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(var(--brand-indigo-rgb), 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              {copied ? <Check size={18} color="#10B981" /> : <Copy size={18} color="var(--brand-indigo)" />}
            </button>
          </div>
          {copied && <p style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '8px', fontWeight: 600 }}>✓ Copied to clipboard</p>}
        </div>

        {/* Share buttons */}
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Share via</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {shareOptions.map(opt => (
              <button key={opt.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '14px 8px', background: `${opt.bg}18`, border: `1px solid ${opt.bg}30`, borderRadius: '14px', cursor: 'pointer' }}>
                <span style={{ fontSize: '1.4rem' }}>{opt.emoji}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9CA3AF' }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Your Referral Stats</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { icon: <Users size={20} color="var(--brand-cyan)" />, val: '3', label: 'Friends Joined' },
              { icon: <Gift size={20} color="#A855F7" />, val: '₹450', label: 'Credits Earned' },
              { icon: <Star size={20} color="#F59E0B" />, val: 'Silver', label: 'Referrer Tier' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', background: 'rgba(15,22,35,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 6px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>{s.icon}</div>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '2px' }}>{s.val}</p>
                <p style={{ fontSize: '0.65rem', color: '#4B5563' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteFriend;
