import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, MapPin, Package, Weight, Ruler, Clock, ArrowLeft, Camera, User, Phone, CheckCircle2, HelpCircle, XCircle, CreditCard, Sparkles, Navigation, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { createParcelOrder } from '../../lib/firestore';
import InteractiveMap from '../../components/ui/InteractiveMap';
import { useGPSLocation } from '../../hooks/useLocation';
import VehicleLoader from '../../components/ui/VehicleLoader';

// Simulated Address Suggestions
const addressSuggestions = [
  "Block C, Silver Oak Apartments, Sector 4",
  "Tech Park, Building 9, Cyber City",
  "FitPro Arena, Downtown",
  "Airport Terminal 2, International",
  "Central Mall, Main Street",
  "Blue Ridge Towers, Phase 1",
  "Sunshine Cafe, 5th Avenue",
  "Metro Station, Sector 18",
  "Green Valley Residency, Block A",
  "Global Tech Hub, Ring Road"
];

// Address Autocomplete Component
const AddressAutocomplete = ({ value, onChange, placeholder, icon: Icon }) => {
  const [focused, setFocused] = useState(false);
  const suggestions = value.length >= 2 
    ? addressSuggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value)
    : [];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <Icon size={17} color="var(--text-muted)" />
      </div>
      <input 
        className="field" 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        style={{ width: '100%', padding: '13px 14px 13px 42px', fontSize: '0.88rem' }}
      />
      {focused && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '12px', zIndex: 10, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          {suggestions.map((s, i) => (
            <div key={s} onClick={() => { onChange(s); setFocused(false); }}
              style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-main)', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-ui)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} color="var(--text-muted)" /> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const parcelTypes = [
  { id: 'express', name: 'Express Bike', tag: 'Fastest', tagColor: '#F59E0B', desc: 'Bike courier · Up to 5 kg', price: '₹90', eta: '18 min', maxWeight: '5 kg', maxSize: '40×30 cm', border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.05)', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M15 6h2l2 5H5l2-5h2"/><path d="M8 6V4h8v2"/></svg> },
  { id: 'standard', name: 'Standard Cab', tag: null, desc: 'Car delivery · Up to 20 kg', price: '₹160', eta: '35 min', maxWeight: '20 kg', maxSize: '60×50 cm', border: 'rgba(255,255,255,0.07)', bg: 'transparent', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
  { id: 'heavy', name: 'Heavy Van', tag: 'New', tagColor: '#A855F7', desc: 'Van · Up to 100 kg · Fragile ok', price: '₹320', eta: '50 min', maxWeight: '100 kg', maxSize: '120×80 cm', border: 'rgba(168,85,247,0.3)', bg: 'rgba(168,85,247,0.05)', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
];

const Parcel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useGPSLocation();
  const mapCenter = location.coords;
  
  // Workflow state
  const [step, setStep] = useState(1); // 1: Location/Receiver, 2: Vehicle, 3: Package Details, 4: Compare, 5: Tracking

  // Step 1 State
  const [pickup, setPickup] = useState('Block C, Silver Oak Apartments, Sector 4');
  const [dropoff, setDropoff] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');

  // Step 2 State
  const [selected, setSelected] = useState('express');

  // Step 3 State
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [fragile, setFragile] = useState(false);
  const [photoAdded, setPhotoAdded] = useState(false);

  // Step 4 State (Comparison)
  const [showInsight, setShowInsight] = useState(false);
  const [selectedComp, setSelectedComp] = useState('smartride');

  // Step 5 State (Tracking)
  const [isSearching, setIsSearching] = useState(false);
  const [driverAssigned, setDriverAssigned] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isPaid, setIsPaid] = useState(false);

  const sel = parcelTypes.find(p => p.id === selected);
  const totalFare = sel ? parseInt(sel.price.replace('₹', '')) + (fragile ? 20 : 0) + 5 : 0;

  const parcelCompetitors = [
    { id: 'porter', name: 'Porter', price: totalFare - 10, time: '15 min', url: 'https://porter.in/' },
    { id: 'smartride', name: 'SmartRide AI Delivery', price: totalFare, time: '18 min', url: null },
    { id: 'borzo', name: 'Borzo', price: totalFare + 15, time: '20 min', url: 'https://borzodelivery.com/' },
    { id: 'dunzo', name: 'Dunzo', price: totalFare + 25, time: '25 min', url: 'https://www.dunzo.com/' }
  ].sort((a, b) => a.price - b.price);

  const handleSchedule = () => {
    setStep(4);
  };

  const handleBookNative = async () => {
    try {
      setIsBooking(true);
      await createParcelOrder(user?.uid || 'demo-user-123', {
        category: sel?.name,
        pickup,
        dropoff,
        weight,
        fare: totalFare,
        receiverName,
        receiverPhone,
        fragile
      });
      setStep(5);
      setIsSearching(true);
      setTimeout(() => {
        setIsSearching(false);
        setDriverAssigned(true);
        setIsBooking(false);
      }, 3000);
    } catch (error) {
      console.error("Booking error:", error);
      setIsBooking(false);
    }
  };

  const handlePayment = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
      setIsPaid(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        setTimeout(() => setPaymentStatus('pending'), 300);
      }, 1500);
    }, 2000);
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return 'Delivery Details';
      case 2: return 'Select Parcel Type';
      case 3: return 'Package Details';
      case 4: return 'Compare Apps';
      case 5: return isSearching ? 'Connecting...' : 'Booking Confirmed';
      default: return '';
    }
  };

  const canProceedStep1 = dropoff.length > 3 && receiverName.length > 2 && receiverPhone.length === 10;
  const canProceedStep3 = weight !== '' && photoAdded;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Interactive Map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <InteractiveMap center={mapCenter} zoom={15} showUserLocation={true} />
      </div>

      {/* Top Header Overlay */}
      {step < 4 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, padding: '48px 20px 0', pointerEvents: 'none' }}>
          <button 
            onClick={() => navigate(-1)} 
            className="btn-icon" 
            style={{ width: '44px', height: '44px', pointerEvents: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
          >
            <ArrowLeft size={20} color="var(--text-main)" />
          </button>
        </div>
      )}

      {/* Spacer to keep map visible below header */}
      <div style={{ height: '140px', flexShrink: 0 }} />

      {/* Main Content Sheet (Steps 1-3) */}
      {step < 4 && (
        <motion.div 
          drag="y"
          dragConstraints={{ top: 0, bottom: 450 }}
          dragElastic={0.05}
          dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
          initial={{ y: 0 }}
          style={{
            position: 'relative',
            zIndex: 30,
            background: 'var(--bg-surface)', 
            borderTopLeftRadius: '32px', 
            borderTopRightRadius: '32px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(24px)',
            display: 'flex', 
            flexDirection: 'column',
            height: 'calc(100% - 140px)',
            touchAction: 'none'
          }}
        >
          {/* Draggable Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '8px', cursor: 'grab' }}>
            <div style={{ width: '40px', height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.15)' }} />
          </div>

          <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              {getStepTitle()}
            </h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ width: s === step ? '20px' : '6px', height: '6px', borderRadius: '99px', background: s === step ? 'var(--brand-indigo)' : 'var(--border-ui)', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="no-scrollbar">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '4px' }}>Locations</p>
                    <AddressAutocomplete placeholder="Pickup location" value={pickup} onChange={setPickup} icon={MapPin} />
                    <AddressAutocomplete placeholder="Drop-off location" value={dropoff} onChange={setDropoff} icon={MapPin} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '4px' }}>Receiver Details</p>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><User size={17} color="var(--text-muted)" /></div>
                      <input type="text" value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Receiver's Name" className="field" style={{ padding: '13px 14px 13px 42px', fontSize: '0.88rem', width: '100%' }} />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Phone size={17} color="var(--text-muted)" /></div>
                      <input type="tel" value={receiverPhone} onChange={e => { const val = e.target.value.replace(/\D/g, ''); if (val.length <= 10) setReceiverPhone(val); }} placeholder="Receiver's Phone Number (10 digits)" className="field" style={{ padding: '13px 14px 13px 42px', fontSize: '0.88rem', width: '100%' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {parcelTypes.map(p => {
                    const active = selected === p.id;
                    return (
                      <motion.button key={p.id} onClick={() => setSelected(p.id)} whileHover={{ y: -1 }}
                        style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active ? p.bg : 'var(--bg-card)', border: `1px solid ${active ? p.border : 'var(--border-ui)'}`, borderRadius: '16px', padding: '14px', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '50px', height: '50px', borderRadius: '13px', background: 'var(--bg-base)', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {p.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</span>
                              {p.tag && <span style={{ fontSize: '0.62rem', fontWeight: 800, color: p.tagColor, background: `${p.tagColor}18`, border: `1px solid ${p.tagColor}30`, borderRadius: '99px', padding: '2px 7px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.tag}</span>}
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '5px' }}>{p.desc}</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}><Weight size={11} />{p.maxWeight}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}><Ruler size={11} />{p.maxSize}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: '1.05rem', fontWeight: 800, color: active ? 'var(--text-main)' : 'var(--text-muted)', marginBottom: '2px' }}>{p.price}</p>
                            <p style={{ fontSize: '0.75rem', color: active ? (p.tagColor || 'var(--brand-cyan)') : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                              <Clock size={11} />{p.eta}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', paddingLeft: '4px' }}>Parcel Verification</p>
                    <button 
                      onClick={() => setPhotoAdded(true)}
                      style={{ height: '80px', borderRadius: '14px', border: photoAdded ? '1px solid var(--brand-cyan)' : '1px dashed var(--border-ui)', background: photoAdded ? 'rgba(var(--brand-cyan-rgb), 0.05)' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {photoAdded ? (
                        <>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--brand-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={18} color="var(--bg-base)" /></div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--brand-cyan)' }}>Photo Uploaded Successfully</span>
                        </>
                      ) : (
                        <>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={18} color="var(--text-muted)" /></div>
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Upload Parcel Photo</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Required for driver verification</p>
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                  <div style={{ position: 'relative', marginTop: '4px' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Weight size={17} color="var(--text-muted)" /></div>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={`Approximate Weight in kg (max ${sel?.maxWeight})`} className="field" style={{ padding: '13px 14px 13px 42px', fontSize: '0.88rem', width: '100%' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Package size={17} color="var(--text-muted)" /></div>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions (optional)" className="field" style={{ padding: '13px 14px 13px 42px', fontSize: '0.88rem', width: '100%' }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', background: fragile ? 'rgba(245,158,11,0.06)' : 'var(--bg-card)', border: `1px solid ${fragile ? 'rgba(245,158,11,0.3)' : 'var(--border-ui)'}`, borderRadius: '14px', transition: 'all 0.2s' }} onClick={() => setFragile(!fragile)}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '7px', border: `2px solid ${fragile ? '#F59E0B' : 'var(--border-ui)'}`, background: fragile ? '#F59E0B' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                      {fragile && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" /></svg>}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.88rem', fontWeight: 700, color: fragile ? '#F59E0B' : 'var(--text-main)' }}>⚠️ Fragile Item</p>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>Extra careful handling · +₹20</p>
                    </div>
                  </label>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '14px', padding: '14px 16px', marginTop: '4px' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Fare Estimate</p>
                    {[
                      ['Base fare', sel?.price],
                      ['Fragile handling', fragile ? '+₹20' : '—'],
                      ['Platform fee', '₹5'],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                        <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{l}</span>
                        <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-main)' }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border-ui)', paddingTop: '9px', marginTop: '5px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Total</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-cyan)' }}>
                        ₹{totalFare}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-ui)' }}>
            {step === 1 && (
              <button className={canProceedStep1 ? "btn-primary w-full" : "w-full"} onClick={() => canProceedStep1 && setStep(2)} style={{ height: '52px', fontSize: '0.97rem', gap: '8px', background: canProceedStep1 ? 'var(--brand-indigo)' : 'var(--bg-card)', color: canProceedStep1 ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, transition: 'all 0.2s' }}>
                {canProceedStep1 ? "Continue to Parcel Type" : "Enter details to proceed"} <ChevronRight size={18} opacity={canProceedStep1 ? 1 : 0.5} />
              </button>
            )}
            {step === 2 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}><ArrowLeft size={20} /></button>
                <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 1, height: '52px', fontSize: '0.97rem', gap: '8px' }}>Continue with {sel?.name} <ChevronRight size={18} /></button>
              </div>
            )}
            {step === 3 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(2)} style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}><ArrowLeft size={20} /></button>
                <button onClick={() => canProceedStep3 && handleSchedule()} style={{ flex: 1, height: '52px', fontSize: '0.97rem', gap: '8px', background: canProceedStep3 ? 'var(--brand-cyan)' : 'var(--bg-card)', color: canProceedStep3 ? 'var(--bg-base)' : 'var(--text-muted)', border: 'none', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, transition: 'all 0.2s' }}>
                  {canProceedStep3 ? "Schedule Pickup" : "Missing Details"} <ChevronRight size={18} opacity={canProceedStep3 ? 1 : 0.5} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* STEP 4: Aggregator Comparison */}
      <AnimatePresence>
        {step === 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 20px 10px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-ui)' }}>
               <button onClick={() => setStep(3)} className="btn-icon" style={{ width: '40px', height: '40px' }}><ArrowLeft size={18} color="var(--text-main)" /></button>
               <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Compare Delivery Apps</h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-ui)', overflow: 'hidden' }}>
                  {parcelCompetitors.map((comp, idx) => {
                    const isActive = selectedComp === comp.id;
                    const isLowest = idx === 0; 
                    return (
                      <div key={comp.id} onClick={() => setSelectedComp(comp.id)} style={{ padding: '16px', borderBottom: idx !== parcelCompetitors.length - 1 ? '1px solid var(--border-ui)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isActive ? 'rgba(var(--brand-cyan-rgb), 0.08)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isActive ? 'var(--brand-cyan)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isActive ? 'none' : '1px solid var(--border-ui)' }}>
                             {comp.id === 'smartride' ? <Package size={18} color={isActive ? "var(--bg-base)" : "var(--text-muted)"} /> : <Navigation size={18} color={isActive ? "var(--bg-base)" : "var(--text-muted)"} />}
                           </div>
                           <div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <p style={{ fontSize: '0.95rem', fontWeight: isActive ? 800 : 600, color: 'var(--text-main)' }}>{comp.name}</p>
                               {isLowest && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-inverse)', background: 'var(--brand-cyan)', borderRadius: '4px', padding: '2px 6px', textTransform: 'uppercase' }}>Lowest Price</span>}
                             </div>
                             <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pickup in {comp.time}</p>
                           </div>
                        </div>
                        <p style={{ fontSize: '1.1rem', fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--brand-cyan)' : 'var(--text-muted)' }}>₹{comp.price}</p>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => setShowInsight(!showInsight)} style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'rgba(var(--brand-indigo-rgb), 0.1)', border: '1px solid rgba(var(--brand-indigo-rgb), 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                    <Sparkles size={18} color="var(--brand-indigo)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Ask AI for Recommendations</span>
                  </button>
                  <AnimatePresence>
                    {showInsight && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '16px', position: 'relative', marginTop: '4px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(var(--brand-indigo-rgb), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={16} color="var(--brand-indigo)" /></div>
                            <div>
                              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>AI Delivery Insight</h4>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                <strong>{parcelCompetitors[0].name}</strong> offers the best rate at ₹{parcelCompetitors[0].price}. Booking immediately guarantees pickup within {parcelCompetitors[0].time}.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-ui)' }}>
               <button 
                 disabled={isBooking}
                 className="btn-primary w-full" 
                 style={{ height: '52px', opacity: isBooking ? 0.7 : 1 }} 
                 onClick={() => {
                   const target = parcelCompetitors.find(c => c.id === selectedComp);
                   if (target.id === 'smartride') {
                     handleBookNative();
                   } else {
                     window.open(target.url, '_blank');
                   }
                }}>
                  {isBooking ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      Book on {parcelCompetitors.find(c => c.id === selectedComp)?.name}
                      {selectedComp === 'smartride' ? <ChevronRight size={18} /> : <Navigation size={16} style={{ marginLeft: '4px' }} />}
                    </>
                  )}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 5: Tracking Overlay */}
      <AnimatePresence>
        {step === 5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <InteractiveMap center={mapCenter} zoom={15} showUserLocation={true} />
              <div style={{ position: 'absolute', top: '50px', left: '20px', zIndex: 20 }}>
                <button 
                  onClick={() => { setStep(4); setDriverAssigned(false); setIsPaid(false); }} 
                  className="btn-icon" 
                  style={{ width: '44px', height: '44px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)' }}
                >
                  <ArrowLeft size={20} color="var(--text-main)" />
                </button>
              </div>
            </div>
            
            {/* Draggable Tracking Sheet */}
            <motion.div 
              drag="y"
              dragConstraints={{ top: 0, bottom: 400 }}
              dragElastic={0.05}
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              style={{ 
                background: 'var(--bg-surface)', 
                borderTopLeftRadius: '32px', 
                borderTopRightRadius: '32px', 
                padding: '12px 20px 40px', 
                boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', 
                backdropFilter: 'blur(24px)',
                borderTop: '1px solid var(--border-ui)', 
                zIndex: 10,
                touchAction: 'none'
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
                <div style={{ width: '40px', height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.15)' }} />
              </div>
              {!driverAssigned ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '10px 0' }}>
                  <VehicleLoader />
                  <div style={{ textAlign: 'center' }}><h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Searching nearby partners...</h2><p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Connecting with the fastest {sel?.name}</p></div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div><div className="ai-chip px-3 py-1" style={{ fontSize: '0.65rem', marginBottom: '8px' }}>Confirmed</div><h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Arriving in 4 min</h2></div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--brand-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>📦</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '99px', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden' }}><img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=150" alt="Driver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                    <div style={{ flex: 1 }}><h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>Raj Kumar</h3><div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sel?.name}</span><span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>★ 4.9</span></div></div>
                    <div style={{ textAlign: 'right' }}><p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.05em' }}>DL 4C 9821</p></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '14px 16px' }}>
                    <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isPaid ? 'Amount Paid' : 'Amount to Pay'}</p><p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>₹{totalFare}</p></div>
                    {isPaid ? <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={15} /> Paid</div> : <button onClick={() => setShowPaymentModal(true)} style={{ background: 'var(--brand-indigo)', color: 'white', padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={15} /> Pay Early</button>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><Phone size={15} /> Call Driver</button>
                    <button style={{ padding: '12px', borderRadius: '12px', background: 'rgba(var(--brand-cyan-rgb), 0.1)', border: '1px solid rgba(var(--brand-cyan-rgb), 0.3)', color: 'var(--brand-cyan)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>Share Tracking</button>
                    <button style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><HelpCircle size={15} /> Support</button>
                    <button onClick={() => { setStep(4); setDriverAssigned(false); setIsPaid(false); }} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}><XCircle size={16} /> Cancel Order</button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ background: 'var(--bg-surface)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', padding: '24px 20px 40px', borderTop: '1px solid var(--border-ui)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Payment Options</h3>
                <button onClick={() => setShowPaymentModal(false)} className="btn-icon" style={{ width: '32px', height: '32px' }}><XCircle size={18} color="var(--text-muted)" /></button>
              </div>

              {paymentStatus === 'success' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '30px 0' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} style={{ width: '64px', height: '64px', borderRadius: '99px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={32} color="#10B981" />
                  </motion.div>
                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981' }}>Payment Successful</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>₹{totalFare} paid securely</p>
                  </div>
                </div>
              ) : paymentStatus === 'processing' ? (
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '40px', height: '40px', borderRadius: '99px', border: '3px solid rgba(var(--brand-cyan-rgb), 0.2)', borderTopColor: 'var(--brand-cyan)' }} />
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Processing Payment...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Amount to Pay</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>₹{totalFare}</span>
                  </div>

                  <button onClick={handlePayment} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(var(--brand-cyan-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={18} color="var(--brand-cyan)" /></div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>UPI</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Google Pay, PhonePe, Paytm</p>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </button>

                  <button onClick={handlePayment} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(var(--brand-indigo-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={18} color="var(--brand-indigo)" /></div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Credit / Debit Card</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visa, Mastercard, RuPay</p>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Parcel;
