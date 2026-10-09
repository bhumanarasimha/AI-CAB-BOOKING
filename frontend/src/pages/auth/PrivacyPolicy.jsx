import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Lock, Database, Share2 } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Data Collection",
      icon: <Database size={18} color="#8B5CF6" />,
      content: "We collect location data to optimize routes and provide accurate ETAs. Personal information like name and email is used only for account management."
    },
    {
      title: "Data Security",
      icon: <Lock size={18} color="#8B5CF6" />,
      content: "Your data is encrypted both in transit and at rest. We use industry-standard security protocols to protect your personal information."
    },
    {
      title: "Third-Party Sharing",
      icon: <Share2 size={18} color="#8B5CF6" />,
      content: "We do not sell your personal data. We only share anonymized traffic and usage data with partners to improve urban mobility."
    },
    {
      title: "Your Rights",
      icon: <Eye size={18} color="#8B5CF6" />,
      content: "You have the right to access, correct, or delete your personal data at any time through the app settings."
    }
  ];

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,12,20,0.92)',
        backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
          <ArrowLeft size={18} color="#9CA3AF" />
        </button>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Privacy Policy</h1>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.6, marginBottom: '8px' }}>
            Last Updated: May 7, 2026
          </p>
          <p style={{ fontSize: '0.95rem', color: '#D1D5DB', lineHeight: 1.7 }}>
            Your privacy is our top priority. Here's how we handle your data at SmartRide AI.
          </p>
        </motion.div>

        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card"
            style={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '6px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '8px' }}>
                {section.icon}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{section.title}</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#9CA3AF', lineHeight: 1.6 }}>
              {section.content}
            </p>
          </motion.div>
        ))}

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <p style={{ fontSize: '0.8rem', color: '#4B5563' }}>
            Privacy concerns? <br/>
            Contact our Data Officer at <span style={{ color: '#8B5CF6' }}>privacy@smartride.ai</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
