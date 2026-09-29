import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, FileText, Phone, HelpCircle } from 'lucide-react';

const HelpCenter = () => {
  const navigate = useNavigate();

  const faqs = [
    'How is the SmartRide AI price calculated?',
    'What happens if my driver cancels?',
    'How do I report a lost item?',
    'Can I change my drop-off location during the ride?'
  ];

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '48px 20px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
          <ArrowLeft size={18} color="var(--text-muted)" />
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Help Center</h1>
      </div>
      
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,216,255,0.1)', color: 'var(--brand-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={24} />
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Chat Support</p>
          </div>
          <div className="card" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: 'var(--brand-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={24} />
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Call Us</p>
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={18} color="var(--brand-cyan)" />
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, i) => (
            <div key={i} className="card" style={{ padding: '16px', display: 'flex', gap: '12px', cursor: 'pointer' }}>
              <FileText size={18} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{faq}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default HelpCenter;
