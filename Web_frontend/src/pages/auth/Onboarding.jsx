import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const slides = [
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="20" stroke="#00D8FF" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
        <circle cx="28" cy="28" r="10" fill="rgba(0,216,255,0.15)" stroke="#00D8FF" strokeWidth="2"/>
        <path d="M28 18V28L35 35" stroke="#00D8FF" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="28" cy="28" r="3" fill="#00D8FF"/>
      </svg>
    ),
    label:       'Explainable AI',
    title:       'Decisions You\nCan Trust',
    description: 'See exactly why each route is recommended. Full AI transparency — no black boxes.',
    accentColor: '#00D8FF',
    glow:        'rgba(0,216,255,0.15)',
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path d="M10 46 C16 30, 24 38, 28 20 C32 8, 38 24, 46 16" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="28" cy="20" r="4" fill="#6366F1"/>
        <path d="M22 38L28 20L34 32" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" fill="rgba(99,102,241,0.05)"/>
      </svg>
    ),
    label:       'Multi-Agent AI',
    title:       'Routes Built\nAround You',
    description: 'Our AI agents calculate effort, cost and time simultaneously to find your perfect route.',
    accentColor: '#6366F1',
    glow:        'rgba(99,102,241,0.15)',
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path d="M28 8L48 20V36L28 48L8 36V20L28 8Z" stroke="#8B5CF6" strokeWidth="1.5" fill="rgba(139,92,246,0.08)"/>
        <path d="M28 18L38 24V36L28 42L18 36V24L28 18Z" fill="rgba(139,92,246,0.2)" stroke="#8B5CF6" strokeWidth="1.5"/>
        <circle cx="28" cy="30" r="4" fill="#8B5CF6"/>
      </svg>
    ),
    label:       'Stability Index',
    title:       'Smooth Rides,\nEvery Time',
    description: 'Real-time road, vehicle and driver analytics ensure every trip is predictably smooth.',
    accentColor: '#8B5CF6',
    glow:        'rgba(139,92,246,0.15)',
  },
];

const Onboarding = () => {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(() => {
    if (idx < slides.length - 1) setIdx(idx + 1);
    else navigate('/login');
  }, [idx, navigate]);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(p => (p < slides.length - 1 ? p + 1 : p));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const s = slides[idx];

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Glow blob */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%,-50%)',
              width: '280px', height: '280px',
              background: `radial-gradient(circle, ${s.glow} 0%, transparent 70%)`,
              filter: 'blur(30px)',
            }}
          />
        </AnimatePresence>
      </div>

      {/* Skip */}
      <div className="flex justify-end p-6 pt-10 z-10">
        <button
          onClick={() => navigate('/login')}
          style={{ color: '#4B5563', fontSize: '0.875rem', fontWeight: 500 }}
          className="hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon Container */}
            <div style={{
              width: '112px', height: '112px', borderRadius: '32px',
              background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))`,
              border: `1px solid rgba(255,255,255,0.08)`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${s.accentColor}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '36px',
            }}>
              {s.icon}
            </div>

            {/* Label */}
            <div className="ai-chip px-3 py-1.5 mb-5" style={{ borderColor: `${s.accentColor}40`, color: s.accentColor }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '99px', background: s.accentColor, flexShrink: 0 }} />
              {s.label}
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: 1.15, marginBottom: '16px', whiteSpace: 'pre-line' }}>
              {s.title}
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#6B7280', lineHeight: 1.7, maxWidth: '280px' }}>
              {s.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="p-8 pb-12 z-10">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{
                height: '4px',
                width: i === idx ? '28px' : '8px',
                borderRadius: '99px',
                background: i === idx ? s.accentColor : 'rgba(255,255,255,0.12)',
                transition: 'all 0.3s ease',
                border: 'none', cursor: 'pointer',
              }}
            />
          ))}
        </div>

        {/* Button */}
        <button onClick={next} className="btn-primary w-full h-14" style={{ gap: '8px', fontSize: '1rem', letterSpacing: '-0.01em' }}>
          {idx === slides.length - 1 ? 'Get Started' : 'Continue'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
