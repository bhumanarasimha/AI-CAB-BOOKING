import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, FileText, Phone, HelpCircle, ChevronDown, ChevronUp, Send, X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqsData = [
  {
    q: 'How is the SmartRide AI price calculated?',
    a: 'Our AI engine aggregates live fares from Uber, Ola, Rapido, and local transit. It computes optimal price-to-time ratios and unlocks direct SmartRide partner discounts up to 25% lower than peak surge pricing.'
  },
  {
    q: 'What happens if my driver cancels?',
    a: 'If a driver cancels, our multi-agent matching engine automatically re-assigns the nearest high-rated driver within 15 seconds at no extra surge cost.'
  },
  {
    q: 'How do I report a lost item?',
    a: 'You can tap on your completed ride in Activity / Rides, click "Need Help with this Ride", and select "Lost Item". Our 24/7 recovery desk will instantly connect you with the driver.'
  },
  {
    q: 'Can I change my drop-off location during the ride?',
    a: 'Yes, open your active ride screen, tap "Edit Destination", and enter the new address. The meter and ETA update automatically in real-time.'
  }
];

const HelpCenter = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your SmartRide Support Assistant. How can I help you today?' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSend = () => {
    if (!inputMsg.trim()) return;
    const userText = inputMsg;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Thanks for reaching out! Regarding "${userText.slice(0, 30)}...", our support team has noted your query. A human agent will connect shortly if needed.`
        }
      ]);
    }, 600);
  };

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '48px 20px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }} aria-label="Back">
          <ArrowLeft size={18} color="var(--text-muted)" />
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Help Center</h1>
      </div>
      
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }} className="no-scrollbar">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setShowChat(true)} className="card" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-ui)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,216,255,0.1)', color: 'var(--brand-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={24} />
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Chat Support</p>
          </button>
          <button onClick={() => window.open('tel:1800123456', '_self')} className="card" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-ui)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: 'var(--brand-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={24} />
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Call Us (Toll-Free)</p>
          </button>
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={18} color="var(--brand-cyan)" />
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '40px' }}>
          {faqsData.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', border: isOpen ? '1px solid var(--brand-cyan)' : '1px solid var(--border-ui)' }} onClick={() => setOpenFaq(isOpen ? null : i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <FileText size={18} color={isOpen ? 'var(--brand-cyan)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: isOpen ? 700 : 500, color: 'var(--text-main)' }}>{item.q}</p>
                  </div>
                  {isOpen ? <ChevronUp size={16} color="var(--brand-cyan)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>
                {isOpen && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: '28px', paddingTop: '4px' }}>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ height: '75%', background: 'var(--bg-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border-ui)' }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,216,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={20} color="var(--brand-cyan)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>Live Support Desk</h3>
                    <p style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>● Active Now</p>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                  <X size={18} color="var(--text-muted)" />
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }} className="no-scrollbar">
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '10px 14px', borderRadius: '16px', background: m.sender === 'user' ? 'var(--brand-indigo)' : 'var(--bg-elevated)', color: m.sender === 'user' ? '#FFFFFF' : 'var(--text-main)', fontSize: '0.85rem', lineHeight: 1.4, border: m.sender === 'bot' ? '1px solid var(--border-ui)' : 'none' }}>
                    {m.text}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-ui)', display: 'flex', gap: '8px' }}>
                <input
                  className="field"
                  placeholder="Type your issue or question..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem' }}
                />
                <button onClick={handleSend} className="btn-primary" style={{ width: '44px', height: '44px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpCenter;
