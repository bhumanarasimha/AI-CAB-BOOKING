import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Sparkles, Navigation, ShieldCheck, Zap, Clock, Loader2, Train, Bike, Car, RefreshCw, ChevronDown, ChevronUp, Brain, Info, ArrowDown, ArrowUp } from 'lucide-react';
import RouteMap from '../../components/ui/RouteMap';
import VehicleLoader from '../../components/ui/VehicleLoader';
import { useAuth } from '../../lib/AuthContext';
import { createRideRequest } from '../../lib/firestore';
import AIChatBot from '../../components/ui/AIChatBot';
import { useRideRefreshEngine } from '../../services/refresh/useRideRefreshEngine';

const CATEGORIES = [
  { id: 'all', label: 'All Rides', emoji: '⚡' },
  { id: 'bike', label: 'Bike', emoji: '🏍️' },
  { id: 'auto', label: 'Auto', emoji: '🛺' },
  { id: 'cab4', label: 'Cab (4-Seater)', emoji: '🚗' },
  { id: 'cab7', label: 'SUV (7-Seater)', emoji: '🚐' },
  { id: 'transit', label: 'Transit', emoji: '🚇' },
];

const PREFERENCE_FILTERS = [
  { id: 'balanced', label: 'AI Best Overall', emoji: '✨' },
  { id: 'cheapest', label: 'Cheapest', emoji: '💰' },
  { id: 'fastest', label: 'Fastest', emoji: '⚡' },
  { id: 'reliable', label: 'Most Reliable', emoji: '🛡️' },
  { id: 'effort', label: 'Lowest Effort', emoji: '🚶‍♂️' },
];

const RideComparison = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentLocation } = useAuth();

  const [activeCategory, setActiveCategory] = useState('cab4');
  const [userPreferences, setUserPreferences] = useState('balanced');
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);

  const destination = location.state?.dropoff || 'Downtown Metro Station';

  // Real-Time Refresh & Multi-Agent EMMDE Engine Hook
  const {
    rankedOptions,
    topPick,
    decisionExplanation,
    isLoading,
    isRefreshing,
    secondsAgo,
    manualRefresh,
  } = useRideRefreshEngine({
    origin: currentLocation?.coords,
    destination,
    activeCategory,
    userPreferences,
    refreshIntervalMs: 10000,
  });

  // Dynamic sorting based on active user preference strategy
  const displayOptions = useMemo(() => {
    if (!rankedOptions || rankedOptions.length === 0) return [];
    const list = [...rankedOptions];

    switch (userPreferences) {
      case 'cheapest':
        return list.sort((a, b) => a.fare - b.fare);
      case 'fastest':
        return list.sort((a, b) => a.eta - b.eta);
      case 'reliable':
        return list.sort((a, b) => b.stabilityScore - a.stabilityScore);
      case 'effort':
        return list.sort((a, b) => b.humanEffortScore - a.humanEffortScore);
      case 'balanced':
      default:
        return list.sort((a, b) => b.overallScore - a.overallScore);
    }
  }, [rankedOptions, userPreferences]);

  // Keep selected option valid
  useEffect(() => {
    if (displayOptions.length > 0) {
      if (!selectedOptionId || !displayOptions.some(o => o.id === selectedOptionId)) {
        setSelectedOptionId(displayOptions[0].id);
      }
    }
  }, [displayOptions, selectedOptionId]);

  const selectedOption = useMemo(() => {
    return displayOptions.find(o => o.id === selectedOptionId) || displayOptions[0] || topPick;
  }, [displayOptions, selectedOptionId, topPick]);

  const handleBooking = async () => {
    if (!selectedOption) return;
    if (selectedOption.isSmart) {
      try {
        setIsBooking(true);
        const rideId = await createRideRequest(user?.uid || 'demo-user-123', {
          rideType: selectedOption.rideType,
          price: selectedOption.fare,
          pickup: currentLocation?.address || "Current Location",
          dropoff: destination,
          eta: `${selectedOption.eta} min`
        });
        navigate('/user/activity', { state: { rideId, confirmed: true } });
      } catch {
        setIsBooking(false);
      }
    } else if (selectedOption.url) {
      window.open(selectedOption.url, '_blank');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />

      {/* Map Section */}
      <div style={{ height: '32%', position: 'relative', overflow: 'hidden' }}>
        <RouteMap origin={currentLocation?.coords} destination={destination} travelMode={activeCategory === 'transit' ? 'TRANSIT' : 'DRIVING'} />
        <div style={{ position: 'absolute', top: '44px', left: '16px', zIndex: 50 }}>
          <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'var(--bg-surface)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-ui)' }}>
            <ArrowLeft size={18} color="var(--text-main)" />
          </button>
        </div>

        {/* Floating Destination Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ position: 'absolute', bottom: '20px', left: '16px', right: '16px', zIndex: 50 }}
        >
          <div style={{ 
            background: 'var(--bg-surface)', 
            backdropFilter: 'blur(24px)', 
            border: '1px solid var(--border-ui)', 
            borderRadius: '18px', 
            padding: '10px 14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 12px 48px rgba(0,0,0,0.25)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00D8FF' }} />
                <div style={{ width: '1px', height: '12px', background: '#6366F1' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Route Destination</p>
                <h3 style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{destination}</h3>
              </div>
            </div>

            {/* Real-Time Live Badge */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                borderRadius: '10px',
                padding: '4px 10px',
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#10B981',
                flexShrink: 0,
                marginLeft: '8px',
              }}
            >
              🟢 REAL-TIME FARES
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Sheet UI */}
      <div style={{ 
        flex: 1, 
        background: 'var(--bg-surface)', 
        backdropFilter: 'blur(30px) saturate(180%)',
        borderTopLeftRadius: '28px', 
        borderTopRightRadius: '28px', 
        marginTop: '-12px', 
        zIndex: 100, 
        display: 'flex', 
        flexDirection: 'column', 
        border: '1px solid var(--border-ui)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Pull Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'var(--border-ui)' }} />
        </div>

        {/* Real-Time Status & Action Bar */}
        <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              fontSize: '0.65rem', fontWeight: 800, 
              color: '#10B981',
              background: 'rgba(16,185,129,0.12)',
              padding: '3px 10px', borderRadius: '8px', 
              border: '1px solid rgba(16,185,129,0.4)',
            }}>
              LIVE FARES
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Updated {secondsAgo} sec ago
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => manualRefresh()}
              disabled={isRefreshing}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)',
                borderRadius: '10px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px',
                cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-main)', fontWeight: 700
              }}
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} color="var(--brand-cyan)" />
              <span>Refresh</span>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.92 }}
              onClick={() => setChatOpen(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '5px', 
                background: 'rgba(0, 216, 255, 0.12)', 
                border: '1px solid rgba(0, 216, 255, 0.3)', 
                borderRadius: '10px', padding: '6px 12px', 
                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, color: '#00D8FF' 
              }}
            >
              <Sparkles size={13} color="#00D8FF" /> Chubby AI
            </motion.button>
          </div>
        </div>

        {/* Preferences / AI Agent Strategy Filters */}
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
            {PREFERENCE_FILTERS.map(pref => {
              const isActive = userPreferences === pref.id;
              return (
                <motion.button
                  key={pref.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserPreferences(pref.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '14px',
                    border: isActive ? '1px solid #6366F1' : '1px solid var(--border-ui)',
                    background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
                    color: isActive ? '#818CF8' : 'var(--text-muted)',
                    fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 0 14px rgba(99, 102, 241, 0.3)' : 'none',
                    transition: 'all 0.25s'
                  }}
                >
                  <span>{pref.emoji}</span>
                  <span>{pref.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Category Bar */}
        <div style={{ padding: '0 16px 10px' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '14px',
                    border: isActive ? '1px solid #00D8FF' : '1px solid var(--border-ui)',
                    background: isActive ? 'rgba(0, 216, 255, 0.15)' : 'var(--bg-card)',
                    color: isActive ? '#00D8FF' : 'var(--text-muted)',
                    fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 0 14px rgba(0, 216, 255, 0.2)' : 'none',
                    transition: 'all 0.25s'
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Options List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="no-scrollbar">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                <VehicleLoader />
              </motion.div>
            ) : (
              <motion.div key={activeCategory + userPreferences} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {displayOptions.map((opt) => {
                  const isActive = selectedOptionId === opt.id;
                  const isTopPick = topPick && topPick.id === opt.id;

                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ 
                        width: '100%', textAlign: 'left', cursor: 'pointer', 
                        background: isActive ? 'rgba(0, 216, 255, 0.08)' : 'var(--bg-card)', 
                        border: `1px solid ${isTopPick ? '#00D8FF' : isActive ? 'rgba(0, 216, 255, 0.4)' : 'var(--border-ui)'}`, 
                        borderRadius: '20px', padding: '16px 18px', position: 'relative', overflow: 'hidden',
                        transition: 'all 0.25s',
                        boxShadow: isTopPick ? '0 0 20px rgba(0, 216, 255, 0.15)' : 'none'
                      }}
                    >
                      {isTopPick && (
                        <div style={{ 
                          position: 'absolute', top: 0, right: 0, 
                          background: 'linear-gradient(135deg, #00D8FF, #6366F1)',
                          color: '#080C14', fontSize: '0.58rem', fontWeight: 900,
                          padding: '3px 10px', borderBottomLeftRadius: '12px',
                          letterSpacing: '0.08em', textTransform: 'uppercase'
                        }}>
                          ✨ AI PICK • BEST OVERALL
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1, marginTop: isTopPick ? '6px' : '0' }}>
                        <div style={{ 
                          width: '46px', height: '46px', borderRadius: '14px', 
                          background: isTopPick ? '#00D8FF' : 'var(--bg-elevated)', 
                          border: '1px solid var(--border-ui)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {opt.category === 'bike' ? (
                            <Bike size={20} color={isTopPick ? '#05070A' : 'var(--brand-cyan)'} />
                          ) : opt.category === 'transit' ? (
                            <Train size={20} color={isTopPick ? '#05070A' : '#10B981'} />
                          ) : (
                            <Car size={20} color={isTopPick ? '#05070A' : 'var(--brand-cyan)'} />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.rideType}</span>
                            <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                              LIVE
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              ETA {opt.eta} min · {opt.pickupDistance}m pickup
                            </span>
                          </div>

                          {/* Agent Scores Bar */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            <span style={{ fontSize: '0.62rem', color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Stability: {opt.stabilityScore}/100
                            </span>
                            <span style={{ fontSize: '0.62rem', color: '#6366F1', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Effort: {opt.humanEffortScore}/100
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>₹{opt.fare}</p>
                            {opt.fareDelta !== 0 && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: opt.fareDelta < 0 ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center' }}>
                                {opt.fareDelta < 0 ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                                ₹{Math.abs(opt.fareDelta)}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.68rem', color: 'var(--brand-cyan)', fontWeight: 800, marginTop: '2px' }}>
                            AI Score: {opt.overallScore}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}

                {/* Expandable "How AI Decided" Audit Panel */}
                {topPick && (
                  <motion.div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '20px', overflow: 'hidden', marginTop: '6px' }}>
                    <button
                      onClick={() => setShowAuditPanel(!showAuditPanel)}
                      style={{
                        width: '100%', padding: '14px 18px', background: 'transparent', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '6px', background: 'rgba(0, 216, 255, 0.1)', borderRadius: '8px' }}>
                          <Brain size={16} color="#00D8FF" />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>How AI Decided (EMMDE Audit)</h4>
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Multi-agent evaluation breakdown</p>
                        </div>
                      </div>
                      {showAuditPanel ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </button>

                    <AnimatePresence>
                      {showAuditPanel && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border-ui)' }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '14px 0' }}>
                            <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '10px', border: '1px solid var(--border-ui)' }}>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>Fare Agent</span>
                              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10B981' }}>{topPick.agentBreakdown?.fare.fareScore || 85}/100</span>
                            </div>
                            <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '10px', border: '1px solid var(--border-ui)' }}>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>Stability Agent</span>
                              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#6366F1' }}>{topPick.agentBreakdown?.stability.stabilityScore || 90}/100</span>
                            </div>
                            <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '10px', border: '1px solid var(--border-ui)' }}>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>Human Effort Agent</span>
                              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F59E0B' }}>{topPick.agentBreakdown?.effort.humanEffortScore || 88}/100</span>
                            </div>
                            <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '10px', border: '1px solid var(--border-ui)' }}>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>Context Agent</span>
                              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#00D8FF' }}>{topPick.agentBreakdown?.context.contextScore || 85}/100</span>
                            </div>
                          </div>

                          {/* Decision Rationale */}
                          {decisionExplanation && (
                            <div style={{ background: 'rgba(0,216,255,0.05)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(0,216,255,0.15)' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#00D8FF', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                {decisionExplanation.title}
                              </span>
                              {decisionExplanation.reasons.map((r, i) => (
                                <p key={i} style={{ fontSize: '0.72rem', color: 'var(--text-main)', marginTop: '2px' }}>{r}</p>
                              ))}

                              {decisionExplanation.whyNotAlternative && (
                                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#F59E0B' }}>Why not {decisionExplanation.whyNotAlternative.alternativeName}?</span>
                                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{decisionExplanation.whyNotAlternative.reason}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => navigate('/user/ai-insights')}
                            style={{
                              width: '100%', marginTop: '12px', background: 'transparent', border: 'none',
                              color: '#00D8FF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center'
                            }}
                          >
                            View Full System Neural Diagnostics →
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <div style={{ padding: '16px 20px 24px', borderTop: '1px solid var(--border-ui)' }}>
          <motion.button 
            whileTap={{ scale: 0.98 }}
            disabled={isBooking || isLoading || !selectedOption}
            onClick={handleBooking}
            className="btn-primary" 
            style={{ 
              width: '100%', height: '54px', fontSize: '1.05rem', fontWeight: 900, 
              borderRadius: '18px', gap: '10px', 
              opacity: (isBooking || isLoading || !selectedOption) ? 0.7 : 1 
            }}
          >
            {(isBooking || isLoading) ? (
              <Loader2 className="animate-spin" size={20} />
            ) : selectedOption?.isSmart ? (
              <>Book {selectedOption.rideType} · ₹{selectedOption.fare} <ChevronRight size={20} /></>
            ) : (
              <>Open {selectedOption?.rideType} · ₹{selectedOption?.fare} <Navigation size={18} /></>
            )}
          </motion.button>
        </div>
      </div>

      <AIChatBot 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        pickup={currentLocation?.address || 'Current Location'} 
        dropoff={destination} 
        competitors={displayOptions}
        selectedRide={selectedOption}
        onSelectTransitMode={(mode = 'transit') => {
          setActiveCategory(mode);
          setChatOpen(false);
        }}
      />
    </div>
  );
};

export default RideComparison;
