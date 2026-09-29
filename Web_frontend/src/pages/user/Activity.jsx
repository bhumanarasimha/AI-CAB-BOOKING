import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, Gift, AlertTriangle, CheckCircle, Info, Share2 } from 'lucide-react';
import BottomNavigation from '../../components/layout/BottomNavigation';
import { subscribeToRide, updateRideStatus } from '../../lib/firestore';

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'promo',
    title: '50% Off Your Next Ride! 🎉',
    desc: 'Use code SMART50 to get up to ₹100 off on your next SmartRide AI booking.',
    time: '2 hours ago',
    icon: Gift,
    color: '#F59E0B',
    read: false
  },
  {
    id: 2,
    type: 'alert',
    title: 'Weather Advisory',
    desc: 'Heavy rain detected in your area. Demand is high, we recommend booking early.',
    time: '4 hours ago',
    icon: AlertTriangle,
    color: '#EF4444',
    read: false
  },
  {
    id: 3,
    type: 'ride',
    title: 'Ride Completed',
    desc: 'Your ride to City Center Mall with driver Amit K. was completed successfully.',
    time: 'Yesterday',
    icon: CheckCircle,
    color: '#10B981',
    read: true
  },
  {
    id: 4,
    type: 'system',
    title: 'Welcome to SmartRide AI! 🚀',
    desc: 'We are thrilled to have you. Explore our new AI comparison features for the best prices.',
    time: 'May 4',
    icon: Info,
    color: 'var(--brand-cyan)',
    read: true
  }
];

const Activity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rideId = location.state?.rideId;
  const [activeRide, setActiveRide] = useState(null);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [showPlateVerify, setShowPlateVerify] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const handleShareTracking = () => {
    navigator.clipboard.writeText(`https://smartride-ai-cab.firebaseapp.com/track/ride-${rideId || 'demo'}`);
    setShowShareToast(true);
    setTimeout(() => {
      setShowShareToast(false);
    }, 3000);
  };

  useEffect(() => {
    if (!rideId) return;

    // Subscribe to real-time Firestore database updates
    const unsubscribe = subscribeToRide(rideId, (ride) => {
      if (ride) {
        setActiveRide(ride);
      }
    });

    return () => unsubscribe();
  }, [rideId]);

  // Simulate real-time status transitions on the backend
  useEffect(() => {
    if (!rideId || !activeRide) return;

    let timer;
    if (activeRide.status === 'searching') {
      timer = setTimeout(() => {
        updateRideStatus(rideId, 'confirmed');
      }, 5000);
    } else if (activeRide.status === 'confirmed') {
      timer = setTimeout(() => {
        updateRideStatus(rideId, 'ongoing');
      }, 12000);
    } else if (activeRide.status === 'ongoing') {
      timer = setTimeout(() => {
        updateRideStatus(rideId, 'completed');
      }, 15000);
    }

    return () => clearTimeout(timer);
  }, [rideId, activeRide?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', position: 'relative' }}>
      
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-surface)',
        backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-ui)',
        padding: '48px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
            <ArrowLeft size={18} color="var(--text-muted)" />
          </button>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Activity
              {unreadCount > 0 && (
                <span style={{ background: 'var(--brand-cyan)', color: 'var(--bg-base)', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '99px' }}>
                  {unreadCount} NEW
                </span>
              )}
            </h1>
          </div>
        </div>

        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ background: 'transparent', border: 'none', color: 'var(--brand-indigo)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="no-scrollbar">
        
        {/* Active Ride Tracker */}
        {activeRide && activeRide.status !== 'completed' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-card))',
              border: '1px solid rgba(0, 216, 255, 0.25)',
              borderRadius: '24px',
              padding: '20px',
              boxShadow: '0 12px 32px rgba(0,216,255,0.08)',
              marginBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeRide.status === 'searching' ? 'var(--brand-cyan)' : '#10B981', boxShadow: `0 0 10px ${activeRide.status === 'searching' ? 'var(--brand-cyan)' : '#10B981'}`, animation: 'pulse-slow 2s infinite' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {activeRide.status === 'searching' ? 'SEARCHING FOR DRIVER' : activeRide.status === 'confirmed' ? 'DRIVER EN ROUTE' : 'TRIP IN PROGRESS'}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>{activeRide.price}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 216, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {activeRide.status === 'searching' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    style={{ width: '20px', height: '20px', border: '2.5px solid rgba(0,216,255,0.2)', borderTopColor: 'var(--brand-cyan)', borderRadius: '50%' }}
                  />
                ) : (
                  <span style={{ fontSize: '1.25rem' }}>🚗</span>
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {activeRide.status === 'searching' ? 'Matching you with drivers...' : activeRide.status === 'confirmed' ? 'Amit K. (4.9 ★)' : 'Heading to destination'}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeRide.status === 'searching' ? `Route: ${activeRide.dropoff}` : activeRide.status === 'confirmed' ? 'Arriving in 3.2 min · Suzuki Dzire (White)' : `ETA ${activeRide.eta} · Heading to ${activeRide.dropoff}`}
                </p>
              </div>
            </div>

            {activeRide.status !== 'searching' && (
              <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-ui)', borderRadius: '16px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Vehicle Info</span>
                  <span style={{ fontSize: '0.65rem', background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', borderRadius: '6px', padding: '2px 6px', fontWeight: 800 }}>AI VERIFIED</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                  <span>Vehicle Number:</span>
                  <strong style={{ letterSpacing: '0.05em' }}>TS 09 EX 1234</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                  <span>License:</span>
                  <strong>DL-12202300489</strong>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setShowPlateVerify(!showPlateVerify)}
                    style={{ flex: 1, padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    🔍 {showPlateVerify ? 'Hide' : 'Verify'} Plate Photo
                  </button>
                  <button 
                    onClick={handleShareTracking}
                    style={{ flex: 1, padding: '8px', background: 'rgba(0, 216, 255, 0.1)', border: '1px solid rgba(0, 216, 255, 0.2)', borderRadius: '10px', color: '#00D8FF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Share2 size={12} /> Share Live Track
                  </button>
                </div>

                <AnimatePresence>
                  {showPlateVerify && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', overflow: 'hidden' }}
                    >
                      {/* Interactive License Plate representation */}
                      <div style={{ 
                        background: '#FFD700', color: '#000000', border: '3px solid #000000', 
                        borderRadius: '6px', width: '100%', maxWidth: '200px', height: '50px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '1.25rem', fontFamily: 'monospace', letterSpacing: '2px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)', position: 'relative'
                      }}>
                        <div style={{ position: 'absolute', top: 2, left: 4, fontSize: '0.5rem', fontWeight: 800 }}>IND</div>
                        TS 09 EX 1234
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700, textAlign: 'center' }}>
                        ✅ Plate Photo Match Verified: TS 09 EX 1234 matches the user-entered vehicle number plate.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-ui)', paddingTop: '14px' }}>
              <button 
                onClick={() => navigate('/user/ai-insights')}
                style={{ flex: 1, padding: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: 'var(--brand-indigo)', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
              >
                ✦ Explainable AI Insights
              </button>
              <button 
                onClick={() => navigate('/user/home')}
                style={{ padding: '10px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Track Map
              </button>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {notifications.map((notif, index) => {
            const Icon = notif.icon;
            return (
              <motion.div 
                key={notif.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="card"
                style={{ 
                  padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start',
                  background: notif.read ? 'var(--bg-card)' : 'var(--bg-elevated)',
                  border: `1px solid ${notif.read ? 'var(--border-ui)' : 'rgba(var(--brand-cyan-rgb), 0.2)'}`
                }}
                onClick={() => {
                  if(!notif.read) {
                    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                  }
                }}
              >
                {/* Icon Box */}
                <div style={{ 
                  width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                  background: `${notif.color}15`, border: `1px solid ${notif.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={18} color={notif.color} />
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', paddingRight: '10px' }}>
                      {notif.title}
                    </h3>
                    {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '99px', background: 'var(--brand-cyan)', flexShrink: 0, marginTop: '4px' }} />}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '8px' }}>
                    {notif.desc}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {notif.time}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>No Notifications</p>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>You're all caught up!</p>
          </div>
        )}
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{ 
              position: 'fixed', bottom: '100px', left: '20px', right: '20px', zIndex: 1000,
              background: 'rgba(0, 216, 255, 0.95)', color: '#05070A', padding: '14px 20px', 
              borderRadius: '16px', fontWeight: 800, fontSize: '0.85rem', display: 'flex', 
              alignItems: 'center', gap: '8px', boxShadow: '0 10px 30px rgba(0,216,255,0.3)'
            }}
          >
            <span>🔗</span> Live tracking link copied! Share it with friends and family.
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavigation />
    </div>
  );
};

export default Activity;
