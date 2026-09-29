import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';

const themes = [
  { 
    id: 'dark-ai',     
    name: 'Dark AI',       
    desc: 'Deep space futuristic',   
    preview: ['#080C14', '#00D8FF', '#6366F1'],
    vars: {
      '--bg-base': '#080C14',
      '--bg-surface': '#0F1623',
      '--bg-card': '#141C2E',
      '--bg-elevated': '#1A2340',
      '--brand-cyan': '#00D8FF',
    '--brand-cyan-rgb': '0, 216, 255',
      '--brand-indigo': '#6366F1',
    '--brand-indigo-rgb': '99, 102, 241',
      '--brand-glow': 'rgba(99,102,241,0.4)',
      '--cyan-glow': 'rgba(0,216,255,0.3)',
      '--border-ui': 'rgba(255,255,255,0.07)',
      '--text-main': '#F1F5F9',
      '--text-muted': '#9CA3AF',
      '--text-inverse': '#080C14',
      '--shadow-main': '0 8px 32px rgba(0,0,0,0.5)',
      '--shadow-sm': '0 4px 12px rgba(0,0,0,0.4)',
      '--bg-glass': 'rgba(15, 22, 35, 0.7)'
    }
  },
  { 
    id: 'midnight',    
    name: 'Midnight',       
    desc: 'Pure black minimal',      
    preview: ['#000000', '#FFFFFF', '#6B7280'],
    vars: {
      '--bg-base': '#000000',
      '--bg-surface': '#0A0A0A',
      '--bg-card': '#111111',
      '--bg-elevated': '#1A1A1A',
      '--brand-cyan': '#FFFFFF',
    '--brand-cyan-rgb': '255, 255, 255',
      '--brand-indigo': '#FFFFFF',
    '--brand-indigo-rgb': '255, 255, 255',
      '--brand-glow': 'rgba(255,255,255,0.2)',
      '--cyan-glow': 'rgba(255,255,255,0.2)',
      '--border-ui': 'rgba(255,255,255,0.1)',
      '--text-main': '#FFFFFF',
      '--text-muted': '#A3A3A3',
      '--text-inverse': '#000000',
      '--shadow-main': '0 8px 32px rgba(0,0,0,0.8)',
      '--shadow-sm': '0 4px 12px rgba(0,0,0,0.6)',
      '--bg-glass': 'rgba(0, 0, 0, 0.7)'
    }
  },
  { 
    id: 'aurora',      
    name: 'Aurora',         
    desc: 'Teal & violet northern',  
    preview: ['#0D1B2A', '#00FFC8', '#A855F7'],
    vars: {
      '--bg-base': '#0D1B2A',
      '--bg-surface': '#132336',
      '--bg-card': '#1B2E46',
      '--bg-elevated': '#243B55',
      '--brand-cyan': '#00FFC8',
    '--brand-cyan-rgb': '0, 255, 200',
      '--brand-indigo': '#A855F7',
    '--brand-indigo-rgb': '168, 85, 247',
      '--brand-glow': 'rgba(168,85,247,0.4)',
      '--cyan-glow': 'rgba(0,255,200,0.3)',
      '--border-ui': 'rgba(0,255,200,0.1)',
      '--text-main': '#F1F5F9',
      '--text-muted': '#94A3B8',
      '--text-inverse': '#0D1B2A',
      '--shadow-main': '0 8px 32px rgba(0,0,0,0.4)',
      '--shadow-sm': '0 4px 12px rgba(0,0,0,0.3)',
      '--bg-glass': 'rgba(13, 27, 42, 0.7)'
    }
  },
  { 
    id: 'ocean',       
    name: 'Ocean Depth',    
    desc: 'Deep blue calm',          
    preview: ['#0A1929', '#38BDF8', '#0EA5E9'],
    vars: {
      '--bg-base': '#0A1929',
      '--bg-surface': '#0F2133',
      '--bg-card': '#14293D',
      '--bg-elevated': '#1A334D',
      '--brand-cyan': '#38BDF8',
    '--brand-cyan-rgb': '56, 189, 248',
      '--brand-indigo': '#0EA5E9',
    '--brand-indigo-rgb': '14, 165, 233',
      '--brand-glow': 'rgba(14,165,233,0.4)',
      '--cyan-glow': 'rgba(56,189,248,0.3)',
      '--border-ui': 'rgba(56,189,248,0.1)',
      '--text-main': '#F1F5F9',
      '--text-muted': '#94A3B8',
      '--text-inverse': '#0A1929',
      '--shadow-main': '0 8px 32px rgba(0,0,0,0.4)',
      '--shadow-sm': '0 4px 12px rgba(0,0,0,0.3)',
      '--bg-glass': 'rgba(10, 25, 41, 0.7)'
    }
  },
  { 
    id: 'sunset',      
    name: 'Sunset Drive',   
    desc: 'Warm amber & rose',       
    preview: ['#1A0A0A', '#F97316', '#EC4899'],
    vars: {
      '--bg-base': '#1A0A0A',
      '--bg-surface': '#261212',
      '--bg-card': '#331A1A',
      '--bg-elevated': '#402222',
      '--brand-cyan': '#F97316',
    '--brand-cyan-rgb': '249, 115, 22',
      '--brand-indigo': '#EC4899',
    '--brand-indigo-rgb': '236, 72, 153',
      '--brand-glow': 'rgba(236,72,153,0.4)',
      '--cyan-glow': 'rgba(249,115,22,0.3)',
      '--border-ui': 'rgba(249,115,22,0.1)',
      '--text-main': '#F1F5F9',
      '--text-muted': '#A3A3A3',
      '--text-inverse': '#1A0A0A',
      '--shadow-main': '0 8px 32px rgba(0,0,0,0.5)',
      '--shadow-sm': '0 4px 12px rgba(0,0,0,0.4)',
      '--bg-glass': 'rgba(26, 10, 10, 0.7)'
    }
  },
  { 
    id: 'light',      
    name: 'Pure Light',   
    desc: 'Clean & high contrast',       
    preview: ['#F8FAFC', '#00B4D8', '#4F46E5'],
    vars: {
      '--bg-base': '#F8FAFC',
      '--bg-surface': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--bg-elevated': '#F1F5F9',
      '--brand-cyan': '#00B4D8',
      '--brand-cyan-rgb': '0, 180, 216',
      '--brand-indigo': '#4F46E5',
      '--brand-indigo-rgb': '79, 70, 229',
      '--brand-glow': 'rgba(79,70,229,0.2)',
      '--cyan-glow': 'rgba(0,180,216,0.15)',
      '--border-ui': 'rgba(0,0,0,0.15)',
      '--text-main': '#0F172A',
      '--text-muted': '#64748B',
      '--text-inverse': '#FFFFFF',
      '--shadow-main': '0 8px 32px rgba(0,0,0,0.08)',
      '--shadow-sm': '0 4px 12px rgba(0,0,0,0.06)',
      '--bg-glass': 'rgba(255, 255, 255, 0.85)'
    }
  },
];

const moods = [
  { id: 'calm',       emoji: '🌙', label: 'Calm',       desc: 'Reduced animations, softer tones' },
  { id: 'energetic',  emoji: '⚡', label: 'Energetic',  desc: 'Vibrant, fast transitions' },
  { id: 'focus',      emoji: '🎯', label: 'Focus',      desc: 'Minimal, distraction-free' },
  { id: 'explorer',   emoji: '🚀', label: 'Explorer',   desc: 'All features visible' },
];

const ThemeSettings = () => {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('app-theme') || 'dark-ai');
  const [selectedMood, setSelectedMood] = useState(localStorage.getItem('app-mood') || 'energetic');
  const [textSize, setTextSize] = useState(parseInt(localStorage.getItem('app-text-size')) || 2);

  const handleApply = () => {
    const theme = themes.find(t => t.id === selectedTheme);
    if (theme) {
      Object.entries(theme.vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }

    // Set mood/text size effects (simplified example)
    document.body.style.fontSize = textSize === 1 ? '14px' : textSize === 3 ? '18px' : textSize === 4 ? '20px' : '16px';
    
    // Save to local storage
    localStorage.setItem('app-theme', selectedTheme);
    localStorage.setItem('app-mood', selectedMood);
    localStorage.setItem('app-text-size', textSize);

    alert('Theme applied successfully!');
    navigate('/user/profile');
  };

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
      {/* Header */}
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
          <ArrowLeft size={18} color="var(--text-muted)" />
        </button>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Theme & Mood</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Personalize your app experience</p>
        </div>
      </div>

      <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Color Theme */}
        <section>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Color Theme</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {themes.map((t, i) => (
              <motion.button key={t.id} onClick={() => setSelectedTheme(t.id)}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}
                className="card"
                style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', border: selectedTheme === t.id ? `1px solid ${t.preview[1]}` : undefined, background: selectedTheme === t.id ? `${t.preview[1]}10` : undefined }}
              >
                {/* Color preview */}
                <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', width: '48px', height: '32px', flexShrink: 0 }}>
                  {t.preview.map(c => <div key={c} style={{ flex: 1, background: c }} />)}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{t.name}</p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '1px' }}>{t.desc}</p>
                </div>
                {selectedTheme === t.id && (
                  <div style={{ width: '22px', height: '22px', borderRadius: '99px', background: t.preview[1], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={13} color="white" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </section>

        {/* App Mood */}
        <section>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>App Mood</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {moods.map((m) => (
              <button key={m.id} onClick={() => setSelectedMood(m.id)}
                className="card"
                style={{ padding: '16px', textAlign: 'left', cursor: 'pointer', border: selectedMood === m.id ? '1px solid var(--brand-cyan)' : undefined, background: selectedMood === m.id ? 'rgba(0,216,255,0.05)' : undefined, position: 'relative' }}
              >
                {selectedMood === m.id && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', width: '18px', height: '18px', borderRadius: '99px', background: 'var(--brand-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={11} color="#080C14" />
                  </div>
                )}
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{m.emoji}</div>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>{m.label}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Text Size */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Text Size</p>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-indigo)' }}>{['S','M','L','XL'][textSize - 1]}</span>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <input type="range" min={1} max={4} value={textSize} onChange={e => setTextSize(+e.target.value)} style={{ width: '100%', accentColor: 'var(--brand-indigo)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              {['S','M','L','XL'].map(s => <span key={s} style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s}</span>)}
            </div>
          </div>
        </section>

        {/* Apply */}
        <button onClick={handleApply} className="btn-primary" style={{ width: '100%', height: '52px', gap: '8px', fontSize: '0.95rem' }}>
          Apply Theme
        </button>
      </div>
    </div>
  );
};

export default ThemeSettings;
