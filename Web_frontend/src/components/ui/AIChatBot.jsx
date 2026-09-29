import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Send, ChevronRight, TrendingDown, Navigation, Zap, Clock, Leaf, DollarSign, Train, Bike, Car, Footprints, ArrowRight, Plus, ShieldCheck, Activity, BarChart2 } from 'lucide-react';
import { matches } from '../../pages/user/commute/matches';

/* ─── helpers ─── */
const SparkleIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
    <path d="M5 2L5.75 4.75L8.5 5.5L5.75 6.25L5 9L4.25 6.25L1.5 5.5L4.25 4.75L5 2Z" opacity="0.6" />
    <path d="M19 14L19.75 16.75L22.5 17.5L19.75 18.25L19 21L18.25 18.25L15.5 17.5L18.25 16.75L19 14Z" opacity="0.6" />
  </svg>
);

const TypingDots = () => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-cyan)' }}
      />
    ))}
  </div>
);

/* ─── Sub-components ─── */
const RealTimeAnalysisCard = ({ onChipClick, context }) => {
  const transitPrice = context?.transitPrice || 46;
  const autoPrice = context?.autoPrice || 98;
  const cabPrice = context?.cabPrice || 140;
  const estMinutes = context?.estMinutes || 24;
  const distanceKm = context?.distanceKm || 8.4;
  const savings = context?.savings || 94;

  const competitors = [
    { name: 'SmartRide Metro', price: `₹${transitPrice}`, time: `${estMinutes + 6}m`, status: 'Lowest Fare', color: '#10B981' },
    { name: 'SmartRide Auto', price: `₹${autoPrice}`, time: `${estMinutes}m`, status: 'Direct Pickup', color: '#00D8FF' },
    { name: 'Rapido Auto', price: `₹${autoPrice + 14}`, time: `${estMinutes + 3}m`, status: 'Normal', color: '#F59E0B' },
    { name: 'Uber Go', price: `₹${cabPrice + 25}`, time: `${Math.max(10, estMinutes - 2)}m`, status: '1.2x Surge', color: '#EF4444' },
    { name: 'Ola Mini', price: `₹${cabPrice + 40}`, time: `${Math.max(12, estMinutes + 2)}m`, status: '1.3x Surge', color: '#EF4444' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
      {/* Live Telemetry Bar */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 216, 255, 0.1), rgba(99, 102, 241, 0.05))',
        border: '1px solid rgba(0, 216, 255, 0.25)',
        borderRadius: '16px',
        padding: '12px 14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              REAL-TIME ROUTE TELEMETRY
            </span>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Updated Live
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '10px', padding: '8px', textAlign: 'center', border: '1px solid var(--border-ui)' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Distance</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{distanceKm} km</span>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '10px', padding: '8px', textAlign: 'center', border: '1px solid var(--border-ui)' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Traffic Delay</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F59E0B' }}>+2 min</span>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '10px', padding: '8px', textAlign: 'center', border: '1px solid var(--border-ui)' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Max Savings</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10B981' }}>₹{savings}</span>
          </div>
        </div>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-main)', lineHeight: 1.45, fontWeight: 500 }}>
          💡 <strong>Live Traffic Radar</strong>: Traffic along {context?.pickup || 'origin'} ➔ {context?.dropoff || 'destination'} is flowing smoothly. Uber/Ola are charging 1.2x–1.3x surge, while <strong>SmartRide AI</strong> prices remain locked at base fare!
        </p>
      </div>

      {/* Real-Time Competitor Price Matrix */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '12px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <BarChart2 size={12} color="var(--brand-cyan)" /> Live Market Price Comparison
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {competitors.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-ui)' }}>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>{c.name}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>ETA {c.time}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: c.color }}>{c.price}</span>
                <span style={{ fontSize: '0.6rem', color: c.color, background: `${c.color}15`, padding: '1px 5px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700 }}>{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <motion.button
        onClick={() => onChipClick('Book cheapest')}
        whileTap={{ scale: 0.96 }}
        style={{ width: '100%', background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))', borderRadius: '12px', padding: '12px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(0,216,255,0.25)' }}
      >
        <Zap size={15} /> Book SmartRide AI at ₹{autoPrice} (Save ₹{savings})
      </motion.button>
    </div>
  );
};

const MultiOptionCard = ({ onChipClick, context }) => {
  const transitPrice = context?.transitPrice || 46;
  const autoPrice = context?.autoPrice || 98;
  const cabPrice = context?.cabPrice || 140;
  const estMinutes = context?.estMinutes || 24;
  const savings = context?.savings || 94;

  const options = [
    {
      label: 'Metro + Bike',
      icon: Train,
      time: `${estMinutes + 8} min`,
      price: `₹${transitPrice}`,
      save: `Save ₹${savings}`,
      saveColor: '#10B981',
      tag: 'Cheapest',
      tagColor: '#10B981',
      steps: ['Metro → 4 stops', 'Bike 1.2 km'],
      accent: '#10B981',
    },
    {
      label: 'Auto Ride',
      icon: Car,
      time: `${estMinutes} min`,
      price: `₹${autoPrice}`,
      save: `Save ₹${Math.max(20, cabPrice - autoPrice)}`,
      saveColor: '#F59E0B',
      tag: 'Popular',
      tagColor: '#F59E0B',
      steps: ['Direct pickup'],
      accent: '#F59E0B',
    },
    {
      label: 'Cab (SmartRide / UberGo)',
      icon: Car,
      time: `${Math.max(12, estMinutes - 4)} min`,
      price: `₹${cabPrice}`,
      save: null,
      tag: 'Fastest',
      tagColor: 'var(--brand-indigo)',
      steps: ['AC · Direct ride'],
      accent: 'var(--brand-indigo)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand-cyan)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>
        ✦ Multi-Option Route Comparison
      </div>
      {options.map((opt, idx) => {
        const Icon = opt.icon;
        return (
          <motion.button
            key={opt.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onChipClick(opt.label)}
            style={{
              background: `linear-gradient(135deg, ${opt.accent}08, transparent)`,
              border: `1px solid ${opt.accent}30`,
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
            whileTap={{ scale: 0.97 }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `${opt.accent}15`, border: `1px solid ${opt.accent}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon size={16} color={opt.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{opt.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {opt.save && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: opt.saveColor, background: `${opt.saveColor}15`, padding: '2px 6px', borderRadius: '6px' }}>
                      {opt.save}
                    </span>
                  )}
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{opt.price}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={10} /> {opt.time}
                </span>
                {opt.steps.map((s, i) => (
                  <span key={i} style={{ fontSize: '0.65rem', color: opt.accent, background: `${opt.accent}10`, padding: '1px 6px', borderRadius: '4px' }}>{s}</span>
                ))}
              </div>
            </div>
            <ChevronRight size={14} color="var(--text-muted)" />
          </motion.button>
        );
      })}
      <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '10px', fontSize: '0.72rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Leaf size={12} /> Metro + Bike saves ₹{savings} · 12% less CO₂ than solo cab
      </div>
    </div>
  );
};

const SmartRouteCard = ({ onChipClick, context }) => {
  const metroName = context?.metroName || 'Nearest Metro Station';
  const lineName = context?.lineName || 'Main Transit Line';
  const finalDest = context?.finalDest || context?.dropoff || 'destination';
  const transitPrice = context?.transitPrice || 46;

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ background: 'rgba(0, 216, 255, 0.06)', border: '1px solid rgba(0, 216, 255, 0.15)', borderRadius: '14px', padding: '14px', marginBottom: '8px' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
          🗺 Optimised Route Plan
        </div>
        {[
          { icon: Footprints, color: '#10B981', label: 'Walk 300m', sub: `to ${metroName}`, time: '4 min', savings: 'Free' },
          { icon: Train, color: '#6366F1', label: `${lineName}`, sub: `Metro to ${finalDest}`, time: '18 min', savings: `₹${Math.round(transitPrice * 0.5)}` },
          { icon: Bike, color: '#F59E0B', label: 'Bike / Scooter (1.2 km)', sub: 'Last mile connection', time: '6 min', savings: `₹${Math.round(transitPrice * 0.5)}` },
        ].map((step, i, arr) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${step.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${step.color}25` }}>
                  <step.icon size={13} color={step.color} />
                </div>
                {i < arr.length - 1 && <div style={{ width: '1px', height: '18px', background: `linear-gradient(${step.color}, ${arr[i + 1].color})`, opacity: 0.4, margin: '2px 0' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{step.label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: step.color }}>{step.savings}</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: i < arr.length - 1 ? '2px' : '0' }}>
                  {step.sub} · {step.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <motion.button
          onClick={() => onChipClick('Walk 300m')}
          whileTap={{ scale: 0.96 }}
          style={{ flex: 1, background: 'var(--brand-cyan)', borderRadius: '10px', padding: '10px', fontSize: '0.8rem', fontWeight: 700, color: '#000', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <Navigation size={14} /> Start Journey
        </motion.button>
        <motion.button
          onClick={() => onChipClick('Compare prices')}
          whileTap={{ scale: 0.96 }}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          Other options
        </motion.button>
      </div>
    </div>
  );
};

const PriceForecastCard = ({ onChipClick, context }) => {
  const basePrice = context?.autoPrice || 98;
  const hours = [
    { time: 'Now', price: basePrice, surge: false },
    { time: '30m', price: Math.round(basePrice * 1.45), surge: true },
    { time: '1h', price: Math.round(basePrice * 1.6), surge: true },
    { time: '1.5h', price: Math.round(basePrice * 1.1), surge: false },
    { time: '2h', price: Math.round(basePrice * 0.95), surge: false },
    { time: '3h', price: Math.round(basePrice * 0.88), surge: false },
  ];
  const max = Math.max(...hours.map(h => h.price));

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '14px', padding: '14px', marginBottom: '8px' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <TrendingDown size={11} /> Price Forecast · Next 3 hours
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '64px' }}>
          {hours.map((h, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(h.price / max) * 52}px` }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: '100%',
                  background: h.surge
                    ? 'linear-gradient(180deg, #EF4444, #F97316)'
                    : i === 0
                    ? `linear-gradient(180deg, var(--brand-cyan), var(--brand-indigo))`
                    : 'linear-gradient(180deg, #10B981, #059669)',
                  borderRadius: '4px',
                  boxShadow: h.surge ? '0 0 8px rgba(239,68,68,0.3)' : i === 0 ? '0 0 8px rgba(var(--brand-cyan-rgb),0.3)' : '0 0 8px rgba(16,185,129,0.2)',
                  alignSelf: 'flex-end',
                  minHeight: '6px',
                }}
              />
              <span style={{ fontSize: '0.55rem', color: h.surge ? '#EF4444' : i === 0 ? 'var(--brand-cyan)' : 'var(--text-muted)', fontWeight: i === 0 ? 800 : 600 }}>
                {h.time}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#EF4444' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF4444' }} /> Surge
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#10B981' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981' }} /> Best price
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', fontSize: '0.75rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Zap size={13} /> Book NOW at ₹{basePrice} — price jumps 45% in 30 min!
      </div>
      <motion.button
        onClick={() => onChipClick('Book cheapest')}
        whileTap={{ scale: 0.96 }}
        style={{ width: '100%', background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '10px', padding: '11px', fontSize: '0.82rem', fontWeight: 700, color: '#fff', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <DollarSign size={14} /> Lock price at ₹{basePrice} now
      </motion.button>
    </div>
  );
};

const RouteDetailCard = ({ onChipClick, context }) => {
  const transitPrice = context?.transitPrice || 46;
  const cabPrice = context?.cabPrice || 140;
  const estMinutes = context?.estMinutes || 24;

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
        {[
          { label: 'Total Cost', value: `₹${transitPrice}`, sub: `vs ₹${cabPrice} cab`, color: '#10B981' },
          { label: 'Total Time', value: `${estMinutes + 6} min`, sub: '3 min slower', color: '#F59E0B' },
          { label: 'CO₂ Saved', value: `${((context?.distanceKm || 8) * 0.15).toFixed(1)} kg`, sub: 'eco trip', color: 'var(--brand-cyan)' },
        ].map((m, i) => (
          <div key={i} style={{ background: `${m.color}08`, border: `1px solid ${m.color}20`, borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{m.label}</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{m.sub}</div>
          </div>
        ))}
      </div>
      <motion.button
        onClick={() => onChipClick('Book cheapest')}
        whileTap={{ scale: 0.96 }}
        style={{ width: '100%', background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '10px', padding: '11px', fontSize: '0.82rem', fontWeight: 700, color: '#fff', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <Train size={14} /> Book Metro + Bike combo
      </motion.button>
    </div>
  );
};

const WalkRouteCard = ({ context }) => {
  const metroName = context?.metroName || 'Nearest Metro Station';
  const lineName = context?.lineName || 'Green Line';
  const finalDest = context?.finalDest || context?.dropoff || 'destination';
  const savings = context?.savings || 94;

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '14px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Footprints size={16} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Walk 300m north</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>To {metroName} · ~4 min</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
          <ArrowRight size={12} /> Then take the {lineName} → {finalDest} (Saves ₹{savings})
        </div>
      </div>
      <div style={{ padding: '8px 12px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', fontSize: '0.72rem', color: 'var(--brand-indigo)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Navigation size={12} /> Opening Maps navigation…
      </div>
    </div>
  );
};

const BookedCard = ({ context }) => {
  const autoPrice = context?.autoPrice || 98;
  return (
    <div style={{ marginTop: '10px' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🎉</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10B981', marginBottom: '4px' }}>Fare Locked & Confirmed!</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ride locked at ₹{autoPrice} for 15 min</div>
        <div style={{ marginTop: '10px', padding: '8px', background: 'var(--bg-elevated)', borderRadius: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Driver arriving in <span style={{ color: 'var(--brand-cyan)', fontWeight: 700 }}>2.8 min</span> · KL01 AX 2345
        </div>
      </motion.div>
    </div>
  );
};

const TransitComparisonCard = ({ onSelectTransitMode, context }) => {
  const city = context?.city || 'local';
  const dropoff = context?.dropoff || 'your destination';

  const cityMatches = useMemo(() => {
    const matchCityName = city === 'Bengaluru' ? 'Bangalore' : city;
    return matches.filter(m => m.city.toLowerCase() === matchCityName.toLowerCase());
  }, [city]);

  const transitData = useMemo(() => {
    switch (city) {
      case 'Chennai':
        return [
          {
            type: 'Metro',
            name: 'Chennai Metro (CMRL)',
            route: `Take Green/Blue Line from ${context?.metroName || 'Anna Nagar West'} to ${context?.finalDest || 'Koyambedu'}`,
            time: '25 min',
            cost: `₹${context?.transitPrice || 40}`,
            frequency: 'Every 7 mins',
            details: 'Direct air-conditioned high-speed rail route. Perfect for avoiding highway bottlenecks.',
            accent: '#00D8FF',
          },
          {
            type: 'Bus',
            name: 'MTC Express Bus 17D / 21G',
            route: 'Walk 100m to local bus shelter → Direct MTC bus to destination terminus',
            time: '45 min',
            cost: '₹15',
            frequency: 'Every 10 mins',
            details: 'Eco-friendly and most economical travel choice in Chennai.',
            accent: '#10B981',
          },
          {
            type: 'Suburban Train',
            name: 'Southern Railway Suburban local',
            route: 'Take suburban train to closest station, transfer to MRTS line',
            time: '30 min',
            cost: '₹10',
            frequency: 'Every 15 mins',
            details: 'Extremely fast rail bypass unaffected by traffic peaks.',
            accent: '#6366F1',
          },
        ];
      case 'Hyderabad':
        return [
          {
            type: 'Metro',
            name: 'Hyderabad Metro (HMRL)',
            route: `Take Red/Blue Line from ${context?.metroName || 'Ameerpet'} to ${context?.finalDest || 'Secunderabad'}`,
            time: '20 min',
            cost: `₹${context?.transitPrice || 45}`,
            frequency: 'Every 5 mins',
            details: 'Fastest elevated transit corridor. Fully air-conditioned.',
            accent: '#00D8FF',
          },
          {
            type: 'Bus',
            name: 'TSRTC City Bus 127K / 218',
            route: 'Walk to local shelter → TSRTC Ordinary/Metro Express Bus',
            time: '38 min',
            cost: '₹20',
            frequency: 'Every 10 mins',
            details: 'Highly affordable standard commute option through busy corridors.',
            accent: '#10B981',
          },
          {
            type: 'Suburban Train',
            name: 'MMTS Suburban Rail',
            route: `MMTS Local Train via ${context?.finalDest || 'Secunderabad'} line`,
            time: '35 min',
            cost: '₹10',
            frequency: 'Every 20 mins',
            details: 'Standard suburban commuter network linking major tech/commercial hubs.',
            accent: '#6366F1',
          },
        ];
      case 'Bengaluru':
        return [
          {
            type: 'Metro',
            name: 'Namma Metro (BMRCL)',
            route: `Take Purple Line from ${context?.metroName || 'Indiranagar'} to ${context?.finalDest || 'Majestic'}`,
            time: '22 min',
            cost: `₹${context?.transitPrice || 40}`,
            frequency: 'Every 6 mins',
            details: 'Best way to bypass Central Business District road congestion completely.',
            accent: '#00D8FF',
          },
          {
            type: 'Bus',
            name: 'BMTC AC Volvo Vajra 500D / 335E',
            route: 'BMTC shelter → Volvo Air-Conditioned or standard local bus to destination',
            time: '50 min',
            cost: '₹25 - ₹60',
            frequency: 'Every 8 mins',
            details: 'Volvo buses offer premium AC comfort, ordinary ones offer maximum savings.',
            accent: '#10B981',
          },
          {
            type: 'Suburban Train',
            name: 'SWR Suburban Train',
            route: 'SWR Suburban local from SBC to nearby station',
            time: '30 min',
            cost: '₹15',
            frequency: 'Every 30 mins',
            details: 'Peripheral commuter network with minimal stop delays.',
            accent: '#6366F1',
          },
        ];
      case 'Delhi':
        return [
          {
            type: 'Metro',
            name: 'Delhi Metro (DMRC)',
            route: `Take Yellow Line from ${context?.metroName || 'Rajiv Chowk'} to ${context?.finalDest || 'Connaught Place'}`,
            time: '25 min',
            cost: `₹${context?.transitPrice || 40}`,
            frequency: 'Every 3 mins',
            details: 'Ultra-frequent, fully air-conditioned underground network.',
            accent: '#00D8FF',
          },
          {
            type: 'Bus',
            name: 'DTC Low Floor AC Bus',
            route: 'Walk 200m to DTC Bus Q-Shelter → DTC Green/Red low-floor bus',
            time: '45 min',
            cost: '₹15 - ₹25',
            frequency: 'Every 10 mins',
            details: 'Comfortable low-floor buses with CCTV surveillance and economical ticket rates.',
            accent: '#10B981',
          },
          {
            type: 'Suburban Train',
            name: 'Northern Railway Local EMU',
            route: `EMU Commuter train to New Delhi (NDLS) / ${context?.finalDest || 'Connaught Place'} area`,
            time: '30 min',
            cost: '₹10',
            frequency: 'Every 20 mins',
            details: 'Heavy rail commuter service linking suburban NCR corridors efficiently.',
            accent: '#6366F1',
          },
        ];
      case 'Mumbai':
        return [
          {
            type: 'Suburban Train',
            name: 'Mumbai Suburban railway (Local)',
            route: `Take Western Line Fast Local from ${context?.metroName || 'Andheri'} to ${context?.finalDest || 'Dadar'}`,
            time: '28 min',
            cost: '₹15',
            frequency: 'Every 4 mins',
            details: 'Fastest way to travel North-South, entirely independent of road traffic.',
            accent: '#6366F1',
          },
          {
            type: 'Metro',
            name: 'Mumbai Metro (Line 1/2A/7)',
            route: `Take Blue Line 1 Metro from ${context?.metroName || 'Andheri'} to junction`,
            time: '15 min',
            cost: `₹${context?.transitPrice || 30}`,
            frequency: 'Every 5 mins',
            details: 'Air-conditioned elevated rail line connecting East and West suburbs.',
            accent: '#00D8FF',
          },
          {
            type: 'Bus',
            name: 'BEST Double-Decker / AC Bus',
            route: 'Walk to nearest BEST bus stop → Ordinary/Chalo AC bus',
            time: '40 min',
            cost: '₹10 - ₹20',
            frequency: 'Every 8 mins',
            details: 'Scenic and highly integrated road transit network with comfortable AC service.',
            accent: '#10B981',
          },
        ];
      default:
        return [
          {
            type: 'Metro',
            name: 'City Rapid Transit / Metro',
            route: `Take Metro / Express transit to ${context?.finalDest || dropoff}`,
            time: `${context?.estMinutes || 25} min`,
            cost: `₹${context?.transitPrice || 35}`,
            frequency: 'Every 8 mins',
            details: 'Rapid transit route bypassing city road traffic.',
            accent: '#00D8FF',
          },
          {
            type: 'Bus',
            name: 'Local City Express Bus',
            route: 'Walk to nearest bus stop → Express City Bus to destination',
            time: `${(context?.estMinutes || 25) + 15} min`,
            cost: '₹15 - ₹30',
            frequency: 'Every 12 mins',
            details: 'Economical road transit option.',
            accent: '#10B981',
          },
        ];
    }
  }, [city, context, dropoff]);

  const [activeTab, setActiveTab] = useState(transitData?.[0]?.type || 'Metro');
  const activeData = useMemo(() => transitData?.find(t => t.type === activeTab), [transitData, activeTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand-cyan)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        🚇 AI Public Transit Search ({city})
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-ui)', borderRadius: '14px', padding: '4px', gap: '4px' }}>
        {transitData.map(t => {
          const isActive = activeTab === t.type;
          return (
            <button
              key={t.type}
              onClick={() => setActiveTab(t.type)}
              style={{
                flex: 1,
                border: 'none',
                background: isActive ? 'var(--brand-indigo)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
                borderRadius: '10px',
                padding: '8px 4px',
                fontSize: '0.75rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              {t.type === 'Metro' ? '🚇 Metro' : t.type === 'Bus' ? '🚌 Bus' : '🚆 Train'}
            </button>
          );
        })}
      </div>

      {/* Selected Option Content */}
      <AnimatePresence mode="wait">
        {activeData && (
          <motion.div
            key={activeData.type}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            style={{
              background: `linear-gradient(135deg, ${activeData.accent}08, transparent)`,
              border: `1px solid ${activeData.accent}25`,
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{activeData.name}</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{activeData.frequency}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: activeData.accent }}>{activeData.cost}</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <Clock size={10} /> {activeData.time}
                </p>
              </div>
            </div>

            {/* Route description */}
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 12px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: activeData.accent, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Route Details</span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.4, fontWeight: 500 }}>{activeData.route}</p>
            </div>

            {/* Micro details */}
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
              💡 {activeData.details}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call To Action */}
      <motion.button
        onClick={() => {
          if (onSelectTransitMode) {
            onSelectTransitMode();
          }
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: 'linear-gradient(135deg, #10B981, #059669)',
          border: 'none',
          borderRadius: '12px',
          padding: '12px',
          color: 'white',
          fontSize: '0.82rem',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
        }}
      >
        <Navigation size={14} /> Prefer Public Transit & View on Map
      </motion.button>
    </div>
  );
};

const componentMap = {
  realtime_analysis: RealTimeAnalysisCard,
  multi_option: MultiOptionCard,
  smart_route: SmartRouteCard,
  price_forecast: PriceForecastCard,
  route_detail: RouteDetailCard,
  walk_route: WalkRouteCard,
  booked: BookedCard,
  transit_compare: TransitComparisonCard,
};

/* ─── Main Chat Message ─── */
const ChatMessage = ({ msg, onChipClick, context, onSelectTransitMode }) => {
  const isBot = msg.type === 'bot';
  const RichComponent = msg.component ? componentMap[msg.component] : null;

  const renderText = (text) => {
    if (!text) return null;
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} style={{ color: 'var(--brand-cyan)', fontWeight: 800 }}>{part.slice(2, -2)}</strong>
        : part
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end', marginBottom: '12px' }}
    >
      {isBot && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: '8px', marginTop: '2px', boxShadow: '0 0 12px rgba(var(--brand-cyan-rgb),0.3)'
        }}>
          <SparkleIcon size={14} color="white" />
        </div>
      )}
      <div style={{ maxWidth: isBot ? '88%' : '78%' }}>
        {isBot && (
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--brand-cyan)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Chubby AI Assistant
          </div>
        )}
        <div style={{
          background: isBot ? 'var(--bg-card)' : 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))',
          border: isBot ? '1px solid var(--border-ui)' : 'none',
          borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
          padding: '12px 14px',
          fontSize: '0.85rem',
          color: isBot ? 'var(--text-main)' : 'white',
          lineHeight: 1.55,
          boxShadow: isBot ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
        }}>
          {renderText(msg.text)}
          {RichComponent && <RichComponent onChipClick={onChipClick} context={context} onSelectTransitMode={onSelectTransitMode} />}
        </div>

        {/* Suggestion chips */}
        {msg.chips && msg.chips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {msg.chips.map((chip) => (
              <motion.button
                key={chip}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onChipClick(chip)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid rgba(var(--brand-cyan-rgb), 0.2)',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--brand-cyan)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(var(--brand-cyan-rgb), 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(var(--brand-cyan-rgb), 0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.borderColor = 'rgba(var(--brand-cyan-rgb), 0.2)';
                }}
              >
                {chip}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ─── Main AIChatBot Component ─── */
const AIChatBot = ({ isOpen, onClose, pickup = 'Current Location', dropoff = 'your destination', competitors = [], selectedRide, onSelectTransitMode }) => {
  const context = useMemo(() => {
    const cleanPickup = pickup || 'Current Location';
    const cleanDropoff = dropoff || 'your destination';

    const pLower = cleanPickup.toLowerCase();
    const dLower = cleanDropoff.toLowerCase();

    const city = (pLower.includes('chennai') || dLower.includes('chennai') || pLower.includes('tn') || dLower.includes('tamil nadu')) ? 'Chennai' :
                 (pLower.includes('hyderabad') || dLower.includes('hyderabad') || pLower.includes('telangana')) ? 'Hyderabad' :
                 (pLower.includes('bengaluru') || dLower.includes('bengaluru') || pLower.includes('bangalore') || pLower.includes('karnataka')) ? 'Bengaluru' :
                 (pLower.includes('delhi') || dLower.includes('delhi') || pLower.includes('ncr')) ? 'Delhi' :
                 (pLower.includes('mumbai') || dLower.includes('mumbai') || pLower.includes('maharashtra')) ? 'Mumbai' : 'local';

    const metroName = city === 'Chennai' ? 'Anna Nagar West Metro' :
                      city === 'Hyderabad' ? 'Ameerpet Metro Station' :
                      city === 'Bengaluru' ? 'Indiranagar Metro Station' :
                      city === 'Delhi' ? 'Rajiv Chowk Metro Station' :
                      city === 'Mumbai' ? 'Andheri Station' : 'Closest Transit Hub';

    const lineName = city === 'Chennai' ? 'Green Line' :
                     city === 'Hyderabad' ? 'Red Line' :
                     city === 'Bengaluru' ? 'Purple Line' :
                     city === 'Delhi' ? 'Yellow Line' :
                     city === 'Mumbai' ? 'Western Line' : 'Main Line';

    const finalDest = city === 'Chennai' ? 'Koyambedu' :
                      city === 'Hyderabad' ? 'Secunderabad' :
                      city === 'Bengaluru' ? 'Majestic' :
                      city === 'Delhi' ? 'Connaught Place' :
                      city === 'Mumbai' ? 'Dadar' : cleanDropoff;

    // Real-Time Distance and Fare Engine
    const strConcat = cleanPickup + cleanDropoff;
    let hash = 0;
    for (let i = 0; i < strConcat.length; i++) {
      hash = (hash << 5) - hash + strConcat.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const distanceKm = Number((5 + (absHash % 120) / 10).toFixed(1)); // e.g. 5.0 to 17.0 km

    const cabPrice = Math.round(50 + distanceKm * 14);
    const autoPrice = Math.round(35 + distanceKm * 9);
    const transitPrice = Math.min(55, Math.round(15 + distanceKm * 3.2));
    const bikePrice = Math.round(25 + distanceKm * 6);
    const estMinutes = Math.round(distanceKm * 2.2 + 8);
    const savings = cabPrice - transitPrice;

    return {
      pickup: cleanPickup,
      dropoff: cleanDropoff,
      city,
      metroName,
      lineName,
      finalDest,
      distanceKm,
      cabPrice,
      autoPrice,
      transitPrice,
      bikePrice,
      estMinutes,
      savings,
      competitors,
      selectedRide,
    };
  }, [pickup, dropoff, competitors, selectedRide]);

  const dynamicInitialMessage = useMemo(() => ({
    id: 0,
    type: 'bot',
    text: `⚡ **Live Real-Time Analysis Ready**!\n\nI'm **Chubby AI**. I'm actively analyzing live traffic and market fares for your route: **${context.pickup}** ➔ **${context.dropoff}** (${context.distanceKm} km).`,
    component: 'realtime_analysis',
    chips: ['⚡ Real-Time Analysis', 'Compare prices', 'Smart routes', 'Public Transit'],
  }), [context]);

  const [messages, setMessages] = useState([dynamicInitialMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const lastDropoffRef = useRef(dropoff);
  useEffect(() => {
    if (lastDropoffRef.current !== dropoff) {
      lastDropoffRef.current = dropoff;
      setMessages(prev => prev.map(m => m.id === 0 ? dynamicInitialMessage : m));
    }
  }, [dropoff, dynamicInitialMessage]);

  const chatFlows = useMemo(() => {
    return {
      '⚡ Real-Time Analysis': {
        text: `⚡ **Real-Time AI Route Analysis** for **${context.pickup}** ➔ **${context.dropoff}** (${context.distanceKm} km):\n\nHere is your live telemetry, traffic radar, and market price breakdown:`,
        component: 'realtime_analysis',
        chips: ['Compare prices', 'Book cheapest', 'Smart routes', 'Future prices'],
      },
      'Compare prices': {
        text: `Here is the real-time price comparison for your route to **${context.dropoff}** (${context.distanceKm} km):`,
        component: 'multi_option',
        chips: ['⚡ Real-Time Analysis', 'Smart routes', 'Public Transit', 'Future prices'],
      },
      'Smart routes': {
        text: `I found an optimized multimodal route to **${context.dropoff}** that saves you **₹${context.savings}** and avoids highway traffic! 🎯`,
        component: 'smart_route',
        chips: ['Walk 300m', 'Compare prices', 'Public Transit'],
      },
      'Public Transit': {
        text: `Here is the public transportation breakdown for **${context.city}** along your route to **${context.dropoff}**:`,
        component: 'transit_compare',
        chips: ['Metro + Bike', 'Smart routes', 'Compare prices'],
      },
      'Future prices': {
        text: `Based on current demand and traffic flow on the way to **${context.dropoff}**, here is the 3-hour price forecast:`,
        component: 'price_forecast',
        chips: ['Book cheapest', 'Compare prices', 'Public Transit'],
      },
      'Metro + Bike': {
        text: `Great choice! Connecting via transit to **${context.dropoff}** costs just **₹${context.transitPrice}** (saving **₹${context.savings}** vs cab). Here is your step-by-step itinerary:`,
        component: 'route_detail',
        chips: ['Book cheapest', 'Walk 300m', 'Compare prices'],
      },
      'Book cheapest': {
        text: `I'll lock in this fare of **₹${context.autoPrice}** for the next **15 minutes** ⏱️. Auto ride confirmed!`,
        component: 'booked',
        chips: ['Smart routes', 'Compare prices'],
      },
      'Walk 300m': {
        text: `Walking 300m to **${context.metroName}** saves you **₹${context.savings}**. Here is the walking direction:`,
        component: 'walk_route',
        chips: ['Metro + Bike', 'Compare prices'],
      },
    };
  }, [context]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const addBotMessage = useCallback((flow) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'bot',
          text: flow.text,
          component: flow.component,
          chips: flow.chips,
        },
      ]);
    }, 800);
  }, []);

  const handleChipClick = useCallback((chip) => {
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: chip }]);
    const flow = chatFlows[chip];
    if (flow) {
      addBotMessage(flow);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            type: 'bot',
            text: `Checking live data for **"${chip}"** on your route to **${context.dropoff}**…`,
            component: 'realtime_analysis',
            chips: ['⚡ Real-Time Analysis', 'Compare prices', 'Public Transit'],
          },
        ]);
      }, 800);
    }
  }, [addBotMessage, chatFlows, context]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text }]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const lower = text.toLowerCase();
      let response;

      if (lower.includes('real time') || lower.includes('realtime') || lower.includes('analysis') || lower.includes('live') || lower.includes('radar') || lower.includes('telemetry') || lower.includes('traffic')) {
        response = {
          text: `⚡ **Live Real-Time AI Analysis Complete**!\n\n• **Route**: **${context.pickup}** ➔ **${context.dropoff}** (${context.distanceKm} km)\n• **Traffic Status**: Normal flow (+2 min delay)\n• **Market Surge**: Uber (1.2x), Ola (1.3x), SmartRide (1.0x Base)\n• **Best Option**: SmartRide Auto at **₹${context.autoPrice}** or Metro at **₹${context.transitPrice}**.`,
          component: 'realtime_analysis',
          chips: ['Book cheapest', 'Compare prices', 'Future prices']
        };
      } else if (lower.includes('cheap') || lower.includes('price') || lower.includes('cost') || lower.includes('fare') || lower.includes('amount') || lower.includes('rate')) {
        response = {
          text: `I analyzed all pricing tiers from **${context.pickup}** to **${dropoff}** (${context.distanceKm} km):\n\n• **Public Transit / Metro**: **₹${context.transitPrice}** (Cheapest 🟢)\n• **Auto Ride**: **₹${context.autoPrice}**\n• **Cab (SmartRide)**: **₹${context.cabPrice}**\n\nYou save **₹${context.savings}** by taking the Metro + Bike combo!`,
          component: 'multi_option',
          chips: ['⚡ Real-Time Analysis', 'Book cheapest', 'Future prices']
        };
      } else if (lower.includes('fast') || lower.includes('quick') || lower.includes('urgent') || lower.includes('time') || lower.includes('duration') || lower.includes('speed')) {
        response = {
          text: `⚡ **Fastest Transit Option**:\nDirect Cab to **${dropoff}** takes only **~${Math.max(12, context.estMinutes - 4)} minutes**. Traffic along this ${context.distanceKm} km corridor is clear!`,
          component: 'price_forecast',
          chips: ['⚡ Real-Time Analysis', 'Book cheapest', 'Smart routes']
        };
      } else if (lower.includes('metro') || lower.includes('train') || lower.includes('bus') || lower.includes('public') || lower.includes('transit') || lower.includes('local train')) {
        response = {
          text: `🚇 **Public Transit Breakdown for ${context.city}**:\nConnecting via **${context.metroName}** to **${context.finalDest}** costs just **₹${context.transitPrice}**!`,
          component: 'transit_compare',
          chips: ['Metro + Bike', 'Smart routes', 'Compare prices']
        };
      } else if (lower.includes('surge') || lower.includes('later') || lower.includes('peak') || lower.includes('forecast')) {
        response = {
          text: `📈 **Fare & Traffic Forecast**:\nRight now fare is **₹${context.autoPrice}**. In 30 minutes, demand peak will push prices up to **₹${Math.round(context.autoPrice * 1.45)}**. We recommend booking now!`,
          component: 'price_forecast',
          chips: ['⚡ Real-Time Analysis', 'Book cheapest', 'Public Transit']
        };
      } else if (lower.includes('bike') || lower.includes('walk') || lower.includes('scooter') || lower.includes('last mile')) {
        response = {
          text: `🚲 **Multimodal Last-Mile Route**:\nCombine a 4-min walk (300m) with Metro and Yulu Bike to reach **${dropoff}** for **₹${context.transitPrice}**!`,
          component: 'smart_route',
          chips: ['Walk 300m', 'Compare prices', 'Book cheapest']
        };
      } else if (lower.includes('safe') || lower.includes('safety') || lower.includes('sos') || lower.includes('emergency') || lower.includes('tracking') || lower.includes('pin')) {
        response = {
          text: `🛡️ **SmartRide AI Safety Guarantee**:\n• **24/7 AI Shield**: Continuous GPS anomaly monitoring\n• **4-Digit Secure PIN**: Ride only starts after verification\n• **Instant SOS & Live Share**: Share location with family with 1 tap.`,
          chips: ['⚡ Real-Time Analysis', 'Compare prices', 'Smart routes']
        };
      } else if (lower.includes('pay') || lower.includes('payment') || lower.includes('upi') || lower.includes('cash') || lower.includes('card') || lower.includes('wallet') || lower.includes('offer') || lower.includes('coupon') || lower.includes('promo')) {
        response = {
          text: `💳 **Payment & Offers**:\n• We accept **UPI (GPay, PhonePe), Cards, Wallet & Cash**.\n• Use code **\`SMART20\`** for 20% OFF your ride to **${dropoff}**!\n• 100% instant refund policy if ride is cancelled by driver.`,
          chips: ['Compare prices', 'Book cheapest', 'Future prices']
        };
      } else if (lower.includes('driver') || lower.includes('pickup') || lower.includes('where') || lower.includes('track') || lower.includes('eta') || lower.includes('arriving')) {
        response = {
          text: `📍 **Pickup & Driver Info**:\nYour pickup is set at **${context.pickup}**. Nearby drivers are available with an average arrival time of **~2.8 minutes**.`,
          chips: ['⚡ Real-Time Analysis', 'Book cheapest', 'Compare prices']
        };
      } else {
        response = {
          text: `I'm Chubby AI! Live real-time analysis for your trip from **${context.pickup}** to **${dropoff}** (~${context.distanceKm} km):`,
          component: 'realtime_analysis',
          chips: ['⚡ Real-Time Analysis', 'Compare prices', 'Smart routes', 'Public Transit']
        };
      }

      setMessages(prev => [...prev, { id: Date.now(), type: 'bot', ...response }]);
    }, 900);
  }, [inputValue, dropoff, context]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 998 }}
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: '82%',
              background: 'var(--bg-surface)',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--border-ui)',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px 14px',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-ui)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Animated AI avatar */}
                <div style={{ position: 'relative' }}>
                  <motion.div
                    animate={{ boxShadow: ['0 0 10px rgba(var(--brand-cyan-rgb),0.3)', '0 0 20px rgba(var(--brand-cyan-rgb),0.5)', '0 0 10px rgba(var(--brand-cyan-rgb),0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      width: '40px', height: '40px', borderRadius: '14px',
                      background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <SparkleIcon size={20} color="white" />
                  </motion.div>
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', border: '2px solid var(--bg-surface)', boxShadow: '0 0 6px #10B98160' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Chubby AI</h3>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--brand-cyan)', background: 'rgba(var(--brand-cyan-rgb), 0.1)', border: '1px solid rgba(var(--brand-cyan-rgb), 0.2)', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.08em' }}>REAL-TIME AI</span>
                  </div>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Chubby AI travel assistant · Live Analysis Active</p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="var(--text-muted)" />
              </button>
            </div>

            {/* Quick-action pills */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-ui)', flexShrink: 0, overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: '6px', minWidth: 'max-content' }}>
                {[
                  { label: '⚡ Real-Time Analysis', chip: '⚡ Real-Time Analysis' },
                  { label: '🚇 Public Transit', chip: 'Public Transit' },
                  { label: '💰 Future Prices', chip: 'Future prices' },
                  { label: '🚇 Metro + Bike', chip: 'Metro + Bike' },
                  { label: '🗺 Smart Route', chip: 'Smart routes' },
                  { label: '⚡ Compare All', chip: 'Compare prices' },
                ].map(({ label, chip }) => (
                  <motion.button
                    key={label}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChipClick(chip)}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-ui)',
                      borderRadius: '20px',
                      padding: '6px 12px',
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Messages scroll area */}
            <div
              ref={scrollRef}
              className="no-scrollbar"
              style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}
            >
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  onChipClick={handleChipClick}
                  context={context}
                  onSelectTransitMode={onSelectTransitMode}
                />
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}
                  >
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '10px', flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <SparkleIcon size={14} color="white" />
                    </div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px' }}>
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input bar */}
            <div style={{
              padding: '12px 16px 20px',
              borderTop: '1px solid var(--border-ui)',
              background: 'var(--bg-surface)',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-ui)',
                borderRadius: '20px',
                padding: '8px 8px 8px 16px',
              }}>
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Chubby AI for live real-time analysis, fares, traffic..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.88rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.5,
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setMicActive(v => !v);
                    setTimeout(() => setMicActive(false), 2000);
                  }}
                  style={{
                    width: '34px', height: '34px', borderRadius: '12px',
                    background: micActive ? 'rgba(239,68,68,0.15)' : 'var(--bg-card)',
                    border: `1px solid ${micActive ? 'rgba(239,68,68,0.3)' : 'var(--border-ui)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <Mic size={16} color={micActive ? '#EF4444' : 'var(--text-muted)'} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  style={{
                    width: '34px', height: '34px', borderRadius: '12px',
                    background: inputValue.trim()
                      ? 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))'
                      : 'var(--bg-card)',
                    border: `1px solid ${inputValue.trim() ? 'transparent' : 'var(--border-ui)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: inputValue.trim() ? '0 4px 12px rgba(var(--brand-indigo-rgb),0.4)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <Send size={15} color={inputValue.trim() ? 'white' : 'var(--text-muted)'} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIChatBot;
