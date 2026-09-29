import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, Camera, ChevronRight, Calendar, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import BottomNavigation from '../../components/layout/BottomNavigation';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../lib/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, logout, updateUserProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || user?.displayName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState('+91 98765 43210');
  const [originalPhone] = useState('+91 98765 43210');
  const [editDob, setEditDob] = useState('1998-05-24');
  const [editGender, setEditGender] = useState('Male');
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const menuSections = [
    {
      title: t('rides_wallet'),
      items: [
        { icon: '👥', label: 'Smart Commute', sub: 'AI matching & shared rides', path: '/user/commute' },
        { icon: '💳', label: t('wallet_payments'), sub: '₹450 balance', path: '/user/rides' },
        { icon: '📍', label: t('saved_places'), sub: 'Home, Work & more', path: '/user/saved-places' },
      ]
    },
    {
      title: t('ai_personalization'),
      items: [
        { icon: '🧠', label: 'AI Preferences', sub: 'Customize recommendations', path: '/user/ai-insights' },
        { icon: '🎨', label: 'Theme & App Mood', sub: 'Dark AI · Energetic', path: '/user/theme' },
      ]
    },
    {
      title: t('safety'),
      items: [
        { icon: '🛡️', label: 'Safety & Privacy', sub: 'Biometric on · Location shared', path: '/user/safety' },
        { icon: '🆘', label: 'Emergency Contacts', sub: '2 contacts added', path: '/user/emergency', accent: '#EF4444' },
      ]
    },
    {
      title: t('social'),
      items: [
        { icon: '🎁', label: 'Invite a Friend', sub: 'Earn ₹150 per referral', path: '/user/invite', accent: '#A855F7' },
        { icon: '⭐', label: 'Ratings & Reviews', sub: '4.92 average', path: '/user/reviews' },
      ]
    },
    {
      title: t('support'),
      items: [
        { icon: '🛟', label: 'FAQs & Help Center', sub: 'Got questions? We have answers.', path: '/user/help' },
        { icon: '⚙️', label: t('app_settings'), sub: 'Notifications, Language', path: '/user/settings' },
      ]
    },
  ];

  const handleSaveAttempt = () => {
    if (editPhone !== originalPhone) {
      setShowOtpModal(true);
    } else {
      finalizeSave();
    }
  };

  const handleVerifyOtp = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setShowOtpModal(false);
      finalizeSave();
    }, 1500);
  };

  const finalizeSave = async () => {
    try {
      await updateUserProfile({
        name: editName,
        email: editEmail,
        phone: editPhone,
        gender: editGender,
        dob: editDob
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsEditing(false);
      }, 2000);
    } catch {
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
      
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div 
            key="profile-main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ width: '100%' }}
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(180deg, rgba(var(--brand-indigo-rgb), 0.09) 0%, transparent 100%)', padding: '52px 20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                 <p style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)' }}>Profile</p>
                 <button onClick={() => setIsEditing(true)} style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brand-cyan)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Edit</button>
              </div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Avatar */}
                <div style={{ position: 'relative' }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" style={{ width: '72px', height: '72px', borderRadius: '22px', border: '2px solid var(--brand-indigo)', boxShadow: '0 8px 24px rgba(var(--brand-indigo-rgb), 0.4)' }} />
                  ) : (
                    <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: 'white', boxShadow: '0 8px 24px rgba(var(--brand-indigo-rgb), 0.4)' }}>
                      {user?.displayName ? user.displayName.charAt(0) : 'U'}
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '18px', height: '18px', background: '#10B981', borderRadius: '6px', border: '2px solid var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{user?.name || user?.displayName || 'Valued Rider'}</h1>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '99px', background: 'var(--brand-cyan)' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand-cyan)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Verified Rider</span>
                  </div>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {[['42', 'Total Rides'], ['4.92', 'Rating'], ['₹1,240', 'Saved']].map(([v, l]) => (
                  <div key={l} className="card" style={{ flex: 1, padding: '12px 10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{v}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{l}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Menu Sections */}
            <div style={{ padding: '8px 16px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {menuSections.map((section, si) => (
                <section key={section.title}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '4px' }}>{section.title}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {section.items.map((item, ii) => (
                      <motion.button
                        key={item.label}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * (si * 3 + ii) }}
                        onClick={() => item.path && navigate(item.path)}
                        className="card"
                        style={{ width: '100%', padding: '13px 15px', display: 'flex', alignItems: 'center', gap: '13px', cursor: 'pointer', textAlign: 'left' }}
                        whileHover={{ x: 2 }}
                      >
                        <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: item.accent ? `${item.accent}12` : 'var(--bg-elevated)', border: `1px solid ${item.accent ? item.accent + '25' : 'var(--border-ui)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: item.accent || 'var(--text-main)' }}>{item.label}</p>
                          {item.sub && <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '1px' }}>{item.sub}</p>}
                        </div>
                        <ChevronRight size={15} color="var(--text-muted)" />
                      </motion.button>
                    ))}
                  </div>
                </section>
              ))}

              {/* Logout */}
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '14px', color: '#EF4444', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                {t('sign_out')}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="profile-edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ padding: '56px 20px 120px', display: 'flex', flexDirection: 'column', gap: '32px', minHeight: '100%' }}
          >
            {/* Edit Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setIsEditing(false)} className="btn-icon">
                <ArrowLeft size={20} color="var(--text-main)" />
              </button>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>Edit Profile</h2>
              <div style={{ width: '40px' }} />
            </div>

            {/* Edit Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: 'white', boxShadow: '0 12px 32px rgba(var(--brand-indigo-rgb), 0.3)' }}>
                  {editName ? editName.charAt(0) : 'U'}
                </div>
                <button style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer' }}>
                  <Camera size={16} color="var(--brand-cyan)" />
                </button>
              </div>
            </div>

            {/* Edit Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>Full Name</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '18px', padding: '16px 16px 16px 48px', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }} />
                </div>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>Email Address</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '18px', padding: '16px 16px 16px 48px', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }} />
                </div>
              </div>

              {/* Phone Number */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>Phone Number</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                  <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '18px', padding: '16px 16px 16px 48px', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }} />
                </div>
              </div>

              {/* Gender Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>Gender</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Male', 'Female', 'Other'].map(g => (
                    <button 
                      key={g} 
                      onClick={() => setEditGender(g)}
                      style={{ 
                        flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid var(--border-ui)', 
                        background: editGender === g ? 'rgba(var(--brand-cyan-rgb), 0.1)' : 'var(--bg-elevated)',
                        borderColor: editGender === g ? 'var(--brand-cyan)' : 'var(--border-ui)',
                        color: editGender === g ? 'var(--brand-cyan)' : 'var(--text-muted)',
                        fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>Date of Birth</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                  <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '18px', padding: '16px 16px 16px 48px', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }} />
                </div>
              </div>

              {/* Security Actions */}
              <div style={{ marginTop: '12px' }}>
                <button 
                  onClick={handleChangePassword}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(var(--brand-indigo-rgb), 0.05)', border: '1px dashed rgba(var(--brand-indigo-rgb), 0.3)', borderRadius: '16px', padding: '16px', color: 'var(--brand-indigo)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <Lock size={16} />
                  Change Password
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ marginTop: '20px' }}>
              <motion.button whileTap={{ scale: 0.98 }} onClick={handleSaveAttempt} style={{ width: '100%', background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))', border: 'none', borderRadius: '18px', padding: '18px', color: 'white', fontSize: '1rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 32px rgba(var(--brand-indigo-rgb), 0.3)' }}>
                Save Changes
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '32px', padding: '40px 24px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(var(--brand-cyan-rgb), 0.1)', border: '1px solid var(--brand-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <ShieldCheck size={32} color="var(--brand-cyan)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '10px' }}>Verify Phone</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>We've sent a 4-digit OTP to your new number <strong>{editPhone}</strong>. Please enter it to continue.</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
                <input 
                  type="text" maxLength="4" placeholder="0000" 
                  value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
                  style={{ width: '120px', background: 'var(--bg-elevated)', border: '2px solid var(--border-ui)', borderRadius: '16px', padding: '16px', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', letterSpacing: '8px', outline: 'none' }}
                />
              </div>

              <button onClick={handleVerifyOtp} disabled={isVerifying} style={{ width: '100%', background: 'var(--brand-cyan)', border: 'none', borderRadius: '16px', padding: '16px', color: 'var(--text-inverse)', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                {isVerifying ? 'Verifying...' : 'Verify & Save'}
              </button>
              <button onClick={() => setShowOtpModal(false)} style={{ width: '100%', marginTop: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '32px', padding: '40px 24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle2 size={40} color="#10B981" />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '12px' }}>Profile Updated</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Congratulations 🎉, your profile has been successfully updated. Enjoy your next trip!</p>
              <button onClick={() => { setShowSuccess(false); setIsEditing(false); }} style={{ width: '100%', marginTop: '32px', background: 'var(--brand-indigo)', border: 'none', borderRadius: '16px', padding: '16px', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
                Okay, Thanks
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '32px', padding: '40px 24px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(var(--brand-indigo-rgb), 0.1)', border: '1px solid var(--brand-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Lock size={32} color="var(--brand-indigo)" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '12px' }}>Link Sent</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '32px' }}>A secure password reset link has been sent to:<br/><strong style={{ color: 'var(--text-main)' }}>{editEmail}</strong></p>
              
              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowPasswordModal(false)}
                style={{ width: '100%', background: 'var(--brand-indigo)', border: 'none', borderRadius: '16px', padding: '16px', color: 'white', fontWeight: 900, cursor: 'pointer' }}
              >
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isEditing && <BottomNavigation />}
    </div>
  );
};

export default Profile;
