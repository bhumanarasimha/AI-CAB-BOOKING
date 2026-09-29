import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Fingerprint, Eye, EyeOff, Shield, MapPin } from 'lucide-react';

const Toggle = ({ value, onChange, accent = 'var(--brand-cyan)' }) => (
  <div onClick={() => onChange(!value)}
    style={{ width: '46px', height: '26px', borderRadius: '99px', background: value ? accent : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'all 0.3s', boxShadow: value ? `0 0 10px ${accent}50` : 'none', flexShrink: 0 }}
  >
    <div style={{ position: 'absolute', top: '3px', left: value ? '22px' : '3px', width: '20px', height: '20px', borderRadius: '99px', background: 'white', transition: 'left 0.25s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
  </div>
);

const Row = ({ icon, label, sub, onClick, children, danger }) => (
  <button className="card" onClick={onClick}
    style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: onClick || children ? 'pointer' : 'default', textAlign: 'left' }}
  >
    <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.88rem', fontWeight: 600, color: danger ? '#EF4444' : '#F1F5F9' }}>{label}</p>
      {sub && <p style={{ fontSize: '0.74rem', color: '#4B5563', marginTop: '1px' }}>{sub}</p>}
    </div>
    {children || (onClick && <ChevronRight size={16} color="#374151" />)}
  </button>
);

const SafetyPrivacy = () => {
  const navigate = useNavigate();
  const [biometric, setBiometric] = useState(true);
  const [liveLocation, setLiveLocation] = useState(true);
  const [tripSharing, setTripSharing] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, rgba(var(--brand-indigo-rgb), 0.07) 0%, transparent 100%)', padding: '52px 20px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
          <ArrowLeft size={18} color="#9CA3AF" />
        </button>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F1F5F9' }}>Safety & Privacy</h1>
          <p style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '2px' }}>Control your data and security</p>
        </div>
      </div>

      <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Security */}
        <section>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Security</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
              <Row icon={<Fingerprint size={20} color="var(--brand-indigo)" />} label="Biometric Login" sub="Face ID / Fingerprint unlock">
                <Toggle value={biometric} onChange={setBiometric} accent="var(--brand-indigo)" />
              </Row>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
              <Row icon={<Shield size={20} color="var(--brand-cyan)" />} label="Two-Factor Auth" sub="Extra login verification" onClick={() => {}} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Row icon={<span style={{ fontSize: '1rem' }}>🔑</span>} label="Change Password" onClick={() => {}} />
            </motion.div>
          </div>
        </section>

        {/* Location Privacy */}
        <section>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Location Privacy</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Row icon={<MapPin size={20} color="#10B981" />} label="Live Location Sharing" sub="Allow during active rides">
              <Toggle value={liveLocation} onChange={setLiveLocation} accent="#10B981" />
            </Row>
            <Row icon={<span style={{ fontSize: '1rem' }}>🔗</span>} label="Trip Link Sharing" sub="Share trip link with contacts">
              <Toggle value={tripSharing} onChange={setTripSharing} />
            </Row>
          </div>
        </section>

        {/* Data & Analytics */}
        <section>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Data & Analytics</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Row icon={<Eye size={20} color="#F59E0B" />} label="Usage Analytics" sub="Help improve the app">
              <Toggle value={analytics} onChange={setAnalytics} accent="#F59E0B" />
            </Row>
            <Row icon={<span style={{ fontSize: '1rem' }}>📢</span>} label="Personalized Ads" sub="Based on your activity">
              <Toggle value={marketing} onChange={setMarketing} accent="#F59E0B" />
            </Row>
            <Row icon={<span style={{ fontSize: '1rem' }}>📄</span>} label="Download My Data" onClick={() => {}} />
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Danger Zone</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Row icon={<EyeOff size={20} color="#EF4444" />} label="Delete Account" sub="Permanently remove all data" danger />
          </div>
        </section>
      </div>
    </div>
  );
};

export default SafetyPrivacy;
