import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Cpu, Fingerprint, Zap, Activity, Wind, Footprints, Clock, ShieldCheck, BarChart3, CloudRain } from 'lucide-react';
import BottomNavigation from '../../components/layout/BottomNavigation';

const GlassCard = ({ children, className, style, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    style={{
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid var(--border-ui)',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: 'var(--shadow-main)',
      ...style
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const NeuralNetworkBackground = () => {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNodes([...Array(20)].map(() => ({
      cx: `${Math.random() * 100}%`,
      cy: `${Math.random() * 100}%`,
      r: Math.random() * 2 + 1,
      x: [0, Math.random() * 20 - 10, 0],
      y: [0, Math.random() * 20 - 10, 0],
      duration: Math.random() * 5 + 5,
    })));
  }, []);

  if (nodes.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.4 }}>
      <svg width="100%" height="100%">
        <defs>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--brand-cyan)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {nodes.map((node, i) => (
          <motion.circle
            key={i}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill="var(--brand-cyan)"
            initial={{ opacity: 0.1 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.5, 1],
              x: node.x,
              y: node.y,
            }}
            transition={{
              duration: node.duration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </svg>
    </div>
  );
};

const Metric = ({ label, value, sub, accent, icon: Icon, delay }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    style={{ 
      background: 'var(--bg-elevated)', 
      border: '1px solid var(--border-ui)', 
      borderRadius: '18px', 
      padding: '16px', 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', background: `radial-gradient(circle at top right, ${accent}15, transparent 70%)` }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ padding: '6px', background: `${accent}10`, borderRadius: '10px', display: 'flex' }}>
        {Icon && <Icon size={16} color={accent} />}
      </div>
      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
    </div>
    <div>
      <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</p>}
    </div>
  </motion.div>
);

const PremiumProgressBar = ({ label, value, color, delay }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: color }}>{value}%</span>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
    <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.5, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{ 
          height: '100%', 
          background: `linear-gradient(90deg, ${color}CC, ${color})`, 
          borderRadius: '99px', 
          boxShadow: `0 0 15px ${color}40`,
          position: 'relative'
        }}
      >
        <motion.div 
          animate={{ x: ['0%', '100%'], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', top: 0, left: 0, width: '30px', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
        />
      </motion.div>
    </div>
  </div>
);

const ExplainableAI = () => {
  const navigate = useNavigate();

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }} className="no-scrollbar">
      <NeuralNetworkBackground />
      
      {/* Premium Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50, 
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-ui)',
        padding: '56px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '42px', height: '42px', borderRadius: '14px' }}>
            <ArrowLeft size={20} color="var(--text-main)" />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Cpu size={14} color="var(--brand-cyan)" />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-cyan)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>System Neural Engine</span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>AI Insights</h1>
          </div>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(var(--brand-cyan-rgb), 0.1)', border: '1px solid rgba(var(--brand-cyan-rgb), 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Fingerprint size={20} color="var(--brand-cyan)" />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1, paddingBottom: '120px' }}>
        
        {/* Real-time Processing Card */}
        <GlassCard style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '8px' }}>Logic Transparency</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Our Multi-Agent AI system evaluates millions of permutations to find your optimal path.</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(var(--brand-indigo-rgb), 0.1)', borderRadius: '16px', border: '1px solid rgba(var(--brand-indigo-rgb), 0.2)' }}>
              <Brain size={24} color="var(--brand-indigo)" />
            </div>
          </div>

          <div style={{ position: 'relative', height: '180px', background: 'var(--bg-elevated)', borderRadius: '20px', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
             {/* Animated Neural Connections */}
             <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
                <svg width="100%" height="100%" viewBox="0 0 300 150">
                  <motion.path 
                    d="M50 75 Q150 20 250 75" fill="none" stroke="var(--brand-cyan)" strokeWidth="1" strokeDasharray="5,5"
                    animate={{ strokeDashoffset: [0, -100] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.path 
                    d="M50 75 Q150 130 250 75" fill="none" stroke="var(--brand-indigo)" strokeWidth="1" strokeDasharray="5,5"
                    animate={{ strokeDashoffset: [0, 100] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.circle cx="50" cy="75" r="4" fill="var(--brand-cyan)" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
                  <motion.circle cx="250" cy="75" r="4" fill="var(--brand-indigo)" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
                </svg>
             </div>
             <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--brand-cyan)', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>Confidence Score</p>
                <h3 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>98.4%</h3>
             </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <Metric label="Latency" value="12ms" sub="Real-time" accent="var(--brand-cyan)" icon={Zap} delay={0.2} />
            <Metric label="Agents" value="14" sub="Parallel" accent="var(--brand-indigo)" icon={Activity} delay={0.3} />
          </div>
        </GlassCard>

        {/* Human Effort Optimization (HEWRO) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <Wind size={18} color="#10B981" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Human Effort Weighting</h3>
          </div>
          
          <GlassCard style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.02)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '20px', border: '1px solid var(--border-ui)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Footprints size={16} color="#10B981" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Walking</span>
                </div>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>-240m</p>
                <p style={{ fontSize: '0.65rem', color: '#10B981', marginTop: '4px', fontWeight: 700 }}>34% less effort</p>
              </div>
              <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '20px', border: '1px solid var(--border-ui)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Clock size={16} color="#F59E0B" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wait Time</span>
                </div>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>3.2 min</p>
                <p style={{ fontSize: '0.65rem', color: '#F59E0B', marginTop: '4px', fontWeight: 700 }}>Optimized pickup</p>
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <ShieldCheck size={20} color="#10B981" />
               <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                 <strong>HEWRO Algorithm:</strong> Your physical effort is minimized by prioritizing routes with lower walking and idle times.
               </p>
            </div>
          </GlassCard>
        </div>

        {/* Stability Analytics */}
        <GlassCard style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(var(--brand-violet-rgb), 0.1)', borderRadius: '12px', border: '1px solid rgba(var(--brand-violet-rgb), 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={20} color="var(--brand-violet)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>Stability Prediction</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Journey reliability index</p>
            </div>
          </div>

          <PremiumProgressBar label="Road Smoothness" value={92} color="var(--brand-violet)" delay={0.4} />
          <PremiumProgressBar label="Vehicle Integrity" value={98} color="var(--brand-cyan)" delay={0.5} />
          <PremiumProgressBar label="Route Reliability" value={87} color="var(--brand-indigo)" delay={0.6} />

          <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-ui)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Stability Score</p>
               <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-violet)' }}>EXCEPTIONAL</p>
             </div>
             <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--brand-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px var(--brand-violet)40' }}>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)' }}>A+</span>
             </div>
          </div>
        </GlassCard>

        {/* AI Insight Row */}
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '4px' }} className="no-scrollbar">
           {[
             { title: 'Weather Aware', desc: 'Avoiding open vehicles due to rain.', icon: CloudRain, color: '#38BDF8' },
             { title: 'Surge Lock', desc: 'Fare locked for the next 15 minutes.', icon: Lock, color: '#F59E0B' },
             { title: 'Eco Route', desc: 'Saving 2.4kg of CO2 on this path.', icon: Leaf, color: '#10B981' }
           ].map((insight, idx) => (
             <motion.div 
               key={idx}
               whileHover={{ y: -5, borderColor: `${insight.color}40` }}
               style={{ 
                 minWidth: '240px', 
                 background: 'rgba(255, 255, 255, 0.03)', 
                 backdropFilter: 'blur(10px)',
                 border: '1px solid rgba(255, 255, 255, 0.06)', 
                 borderRadius: '20px', 
                 padding: '20px',
                 cursor: 'pointer',
                 transition: 'all 0.3s'
               }}
             >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${insight.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: `1px solid ${insight.color}30` }}>
                  {React.createElement(insight.icon || Info, { size: 18, color: insight.color })}
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>{insight.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{insight.desc}</p>
             </motion.div>
           ))}
        </div>

      </div>

      <BottomNavigation />
    </div>
  );
};

// Missing icons for the mapping above
const Lock = ({ size, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const Leaf = ({ size, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;
const Info = ({ size, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;

export default ExplainableAI;
