import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

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
    <View style={styles.container}>
      {/* Glow blob */}
      <View style={styles.glowContainer} pointerEvents="none">
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
      </View>

      {/* Top Nav: Back & Skip */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => {
            if (idx > 0) setIdx(idx - 1);
            else navigate('/splash');
          }}
          style={styles.backBtn}
          accessibilityLabel="Previous Slide or Back"
        >
          <ArrowLeft size={18} color="var(--text-muted, #9CA3AF)" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigate('/login')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentArea}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
          >
            {/* Icon Container */}
            <View style={[styles.iconBox, { borderColor: 'var(--border-ui)', shadowColor: s.accentColor }]}>
              {s.icon}
            </View>

            {/* Label */}
            <View style={[styles.labelChip, { borderColor: `${s.accentColor}40` }]}>
              <View style={[styles.dot, { backgroundColor: s.accentColor }]} />
              <Text style={[styles.labelText, { color: s.accentColor }]}>{s.label}</Text>
            </View>

            <Text style={styles.titleText}>
              {s.title}
            </Text>
            <Text style={styles.descText}>
              {s.description}
            </Text>
          </motion.div>
        </AnimatePresence>
      </View>

      {/* Bottom */}
      <View style={styles.bottomArea}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => setIdx(i)}
              style={[
                styles.dotItem,
                {
                  width: i === idx ? 28 : 8,
                  backgroundColor: i === idx ? s.accentColor : 'var(--border-ui, rgba(255, 255, 255, 0.1))',
                }
              ]}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity onPress={next} style={styles.actionBtn} activeOpacity={0.8}>
          <Text style={styles.actionBtnText}>
            {idx === slides.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <ArrowRight size={18} color="#080C14" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'var(--bg-base, #080C14)',
    flexDirection: 'column',
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'var(--bg-surface, #0F1623)',
    borderWidth: 1,
    borderColor: 'var(--border-ui, rgba(255, 255, 255, 0.07))',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: 'var(--text-muted, #9CA3AF)',
    fontSize: 14,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  iconBox: {
    width: 112,
    height: 112,
    borderRadius: 32,
    backgroundColor: 'var(--bg-surface, #0F1623)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: 'var(--text-main, #F1F5F9)',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 16,
    textAlign: 'center',
  },
  descText: {
    fontSize: 15,
    color: 'var(--text-muted, #9CA3AF)',
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 280,
  },
  bottomArea: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dotItem: {
    height: 4,
    borderRadius: 2,
  },
  actionBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: 'var(--brand-cyan, #00D8FF)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#080C14',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Onboarding;
