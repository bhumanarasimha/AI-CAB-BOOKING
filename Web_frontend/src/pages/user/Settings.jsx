import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Globe, Moon, Shield, Lock, ChevronRight, Check, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const ToggleSwitch = ({ isOn, onToggle }) => (
  <div onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ width: '44px', height: '24px', borderRadius: '99px', background: isOn ? 'var(--brand-cyan)' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
    <motion.div layout transition={{ type: 'spring', stiffness: 700, damping: 30 }} style={{ width: '20px', height: '20px', borderRadius: '99px', background: '#FFF', position: 'absolute', top: '2px', left: isOn ? '22px' : '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { language: lang, setLanguage: setLang, t } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('app-theme') !== 'light');
  const [showLangModal, setShowLangModal] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const applyTheme = (themeName) => {
    const themeVars = {
      'dark-ai': {
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
        '--text-inverse': '#080C14'
      },
      'light': {
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
        '--border-ui': 'rgba(0,0,0,0.08)',
        '--text-main': '#0F172A',
        '--text-muted': '#64748B',
        '--text-inverse': '#FFFFFF'
      }
    };
    const vars = themeVars[themeName];
    Object.keys(vars).forEach(key => {
      document.documentElement.style.setProperty(key, vars[key]);
    });
    localStorage.setItem('app-theme', themeName);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    applyTheme(newMode ? 'dark-ai' : 'light');
  };

  const settingsOptions = [
    { id: 'notif', icon: <Bell size={20} />, title: t('notifications'), desc: t('push_alerts'), type: 'toggle', state: notifications, toggle: () => setNotifications(!notifications) },
    { id: 'lang', icon: <Globe size={20} />, title: t('language'), desc: lang, type: 'modal', action: () => setShowLangModal(true) },
    { id: 'disp', icon: darkMode ? <Moon size={20} /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>, title: t('display'), desc: darkMode ? t('dark_mode_on') : t('dark_mode_off'), type: 'toggle', state: darkMode, toggle: toggleDarkMode },
    { id: 'priv', icon: <Shield size={20} />, title: t('privacy'), desc: t('manage_data'), type: 'link', action: () => showToast(t('privacy_soon')) },
    { id: 'sec', icon: <Lock size={20} />, title: t('security'), desc: t('password_2fa'), type: 'link', action: () => showToast(t('security_soon')) },
    { id: 'perf', icon: <Activity size={20} />, title: 'Performance Testing', desc: 'Run baseline load test with 100 VUs', type: 'link', action: () => navigate('/user/performance') },
  ];

  const languages = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Bengali', 'Marathi'];

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '48px 20px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
          <ArrowLeft size={18} color="var(--text-muted)" />
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('app_settings')}</h1>
      </div>
      
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {settingsOptions.map((opt) => (
            <div key={opt.id} onClick={opt.action} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', color: 'var(--brand-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {opt.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{opt.title}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.desc}</p>
              </div>
              {opt.type === 'toggle' ? (
                <ToggleSwitch isOn={opt.state} onToggle={opt.toggle} />
              ) : (
                <ChevronRight size={18} color="#4B5563" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Language Modal */}
      <AnimatePresence>
        {showLangModal && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ width: '100%', background: 'var(--bg-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', borderTop: '1px solid var(--border-ui)', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px' }}>{t('select_language')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '50vh', overflowY: 'auto' }} className="no-scrollbar">
                {languages.map(l => (
                  <button 
                    key={l} 
                    onClick={(e) => { 
                      e.stopPropagation();
                      setLang(l); 
                      setShowLangModal(false); 
                    }} 
                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: lang === l ? 'rgba(var(--brand-cyan-rgb), 0.1)' : 'var(--bg-card)', border: `1px solid ${lang === l ? 'rgba(var(--brand-cyan-rgb), 0.3)' : 'var(--border-ui)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: lang === l ? 'var(--brand-cyan)' : 'var(--text-main)', fontWeight: lang === l ? 700 : 500 }}
                  >
                    {l}
                    {lang === l && <Check size={18} color="var(--brand-cyan)" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowLangModal(false)} style={{ width: '100%', padding: '14px', marginTop: '16px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border-ui)', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}>{t('cancel')}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '99px', padding: '10px 20px', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 110, whiteSpace: 'nowrap' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
