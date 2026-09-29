import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Star, Loader2 } from 'lucide-react';
import BottomNavigation from '../../components/layout/BottomNavigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';
import { getUserRides } from '../../lib/firestore';

const MyRides = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [feedbackRide, setFeedbackRide] = useState(null);
  const [receiptRide, setReceiptRide] = useState(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const fetchRides = async () => {
      if (!user) return;
      try {
        const data = await getUserRides(user.uid);
        setRides(data);
      } catch (error) {
        console.error("Error fetching rides:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRides();
  }, [user]);

  const filteredRides = rides.filter(r => {
    if (tab === 'upcoming') return r.status === 'searching' || r.status === 'confirmed' || r.status === 'ongoing';
    return r.status === 'completed' || r.status === 'cancelled';
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getVehicleName = (type) => {
    switch(type) {
      case 'smart': return 'SmartRide AI';
      case 'ev': return 'Premium EV';
      case 'eco': return 'Economy';
      default: return 'Standard Ride';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', position: 'relative' }}>
      
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-surface)',
        backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-ui)',
        padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
          <ArrowLeft size={18} color="var(--text-muted)" />
        </button>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>My Rides</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '14px', padding: '4px', gap: '4px' }}>
          {['upcoming', 'past'].map((t) => (
            <button 
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, height: '38px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.25s', textTransform: 'capitalize',
                background: tab === t ? 'var(--brand-indigo)' : 'transparent',
                color: tab === t ? 'var(--text-inverse)' : 'var(--text-muted)',
                border: 'none',
                boxShadow: tab === t ? '0 4px 16px rgba(var(--brand-indigo-rgb), 0.3)' : 'none'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Rides List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 100px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="no-scrollbar">
        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" color="var(--brand-cyan)" size={32} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {filteredRides.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Clock size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>No {tab} rides</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>You have no {tab} bookings at the moment.</p>
                </div>
              ) : (
                filteredRides.map(ride => (
                  <div key={ride.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-ui)', paddingBottom: '12px' }}>
                      <div>
                        <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>{getVehicleName(ride.rideType)}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {formatDate(ride.createdAt)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>₹{ride.price}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                          {['searching', 'confirmed', 'ongoing'].includes(ride.status) && <span style={{ color: '#F59E0B', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} /> {ride.status.toUpperCase()}</span>}
                          {ride.status === 'completed' && <span style={{ color: '#10B981', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}><CheckCircle2 size={10} /> COMPLETED</span>}
                          {ride.status === 'cancelled' && <span style={{ color: '#EF4444', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}><XCircle size={10} /> CANCELLED</span>}
                        </div>
                      </div>
                    </div>

                    {/* Route */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '99px', background: 'var(--brand-cyan)' }} />
                        <div style={{ width: '1px', flex: 1, background: 'var(--border-ui)', margin: '4px 0' }} />
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--brand-indigo)' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                        <div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Pickup</p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{ride.pickup}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Dropoff</p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{ride.dropoff}</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-ui)' }}>
                      <button onClick={() => { if(ride.status === 'completed') setReceiptRide(ride); }} style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-ui)', padding: '10px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                        {ride.status === 'upcoming' ? 'Cancel Ride' : ride.status === 'cancelled' ? 'Get Help' : 'Receipt'}
                      </button>
                      {ride.status === 'completed' ? (
                        <button onClick={() => setFeedbackRide(ride)} style={{ flex: 1, background: 'rgba(var(--brand-cyan-rgb), 0.1)', border: '1px solid rgba(var(--brand-cyan-rgb), 0.2)', padding: '10px', borderRadius: '10px', color: 'var(--brand-cyan)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Star size={14} /> Rate Ride
                        </button>
                      ) : (
                        <button style={{ flex: 1, background: 'rgba(var(--brand-indigo-rgb), 0.1)', border: '1px solid rgba(var(--brand-indigo-rgb), 0.2)', padding: '10px', borderRadius: '10px', color: 'var(--brand-indigo)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                          {['searching', 'confirmed', 'ongoing'].includes(ride.status) ? 'Track Ride' : 'Rebook'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <BottomNavigation />

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackRide && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ width: '100%', background: 'var(--bg-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', borderTop: '1px solid var(--border-ui)', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', textAlign: 'center' }}>Rate your ride</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px' }}>How was your trip?</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)} style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}>
                    <Star size={36} color={star <= rating ? '#F59E0B' : 'var(--bg-elevated)'} fill={star <= rating ? '#F59E0B' : 'transparent'} style={{ transition: 'all 0.2s' }} />
                  </button>
                ))}
              </div>

              <textarea placeholder="Leave a compliment or feedback (optional)" className="field" style={{ width: '100%', height: '80px', padding: '12px', fontSize: '0.88rem', resize: 'none', marginBottom: '20px' }} />
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setFeedbackRide(null); setRating(0); }} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-ui)', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}>Skip</button>
                <button onClick={() => { setFeedbackRide(null); setRating(0); }} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--brand-cyan)', border: 'none', color: 'var(--text-inverse)', fontWeight: 700, cursor: 'pointer' }}>Submit Feedback</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {receiptRide && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ width: '100%', background: 'var(--bg-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', borderTop: '1px solid var(--border-ui)', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Ride Receipt</h2>
                <button onClick={() => setReceiptRide(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ride ID</span>
                  <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}>{receiptRide.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Date</span>
                  <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}>{formatDate(receiptRide.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Vehicle</span>
                  <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}>{getVehicleName(receiptRide.rideType)}</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-ui)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Base Fare</span>
                  <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}>₹{receiptRide.price}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Taxes & Fees</span>
                  <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}>₹15</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-ui)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700 }}>Total Paid</span>
                  <span style={{ color: 'var(--brand-cyan)', fontSize: '1.1rem', fontWeight: 800 }}>₹{parseInt(receiptRide.price) + 15}</span>
                </div>
              </div>

              <button onClick={() => setReceiptRide(null)} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--brand-cyan)', border: 'none', color: 'var(--text-inverse)', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}>Download PDF</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyRides;
