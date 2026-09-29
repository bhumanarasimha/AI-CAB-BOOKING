import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText, Scale } from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      icon: <Scale size={18} color="var(--brand-cyan)" />,
      content: "By accessing and using SmartRide AI, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform."
    },
    {
      title: "2. User Responsibilities",
      icon: <FileText size={18} color="var(--brand-cyan)" />,
      content: "You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to provide accurate information."
    },
    {
      title: "3. Service Usage",
      icon: <Shield size={18} color="var(--brand-cyan)" />,
      content: "SmartRide AI provides AI-optimized routing and ride-matching services. We reserve the right to modify or terminate services for any reason, without notice."
    },
    {
      title: "4. Limitation of Liability",
      icon: <Scale size={18} color="var(--brand-cyan)" />,
      content: "SmartRide AI shall not be liable for any indirect, incidental, or consequential damages arising out of the use of our services."
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
        <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Terms of Service</h1>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.6, marginBottom: '8px' }}>
            Last Updated: May 7, 2026
          </p>
          <p style={{ fontSize: '0.95rem', color: '#D1D5DB', lineHeight: 1.7 }}>
            Welcome to SmartRide AI. Please read these terms carefully before using our platform.
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
              <div style={{ padding: '6px', background: 'rgba(0, 216, 255, 0.08)', borderRadius: '8px' }}>
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
            Questions about our Terms? <br/>
            Contact us at <span style={{ color: 'var(--brand-cyan)' }}>support@smartride.ai</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
