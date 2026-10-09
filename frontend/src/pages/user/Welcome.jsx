import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../lib/AuthContext';

const Welcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.displayName || 'Rider';
  const accent = '#00D8FF';

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/user/home');
    }, 3500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <View style={styles.container}>
      {/* Background Glows */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Top Header with Back & Skip */}
      <View style={styles.topHeader}>
        <Pressable 
          onPress={() => navigate('/login')} 
          style={styles.backBtn}
          accessibilityLabel="Back to Login"
        >
          <ArrowLeft size={18} color="#9CA3AF" />
        </Pressable>
        <Pressable 
          onPress={() => navigate('/user/home')} 
          style={styles.skipBtn}
          accessibilityLabel="Skip to Home"
        >
          <Text style={styles.skipText}>Skip</Text>
          <ArrowRight size={14} color="#00D8FF" />
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Sparkles size={44} color={accent} />
        </View>

        <Text style={styles.badgeText}>IDENTITY VERIFIED</Text>

        <Text style={styles.welcomeTitle}>
          Welcome back,{'\n'}
          <Text style={styles.nameText}>{userName}</Text>
        </Text>

        <Text style={styles.subtitle}>
          Preparing your AI-optimized commute experience...
        </Text>

        {/* Progress indicator */}
        <View style={styles.progressBox}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* Status Chip */}
        <View style={styles.statusChip}>
          <ActivityIndicator size="small" color={accent} style={{ marginRight: 8 }} />
          <Text style={styles.statusText}>Syncing neural preferences...</Text>
        </View>

        {/* Enter Button */}
        <Pressable 
          onPress={() => navigate('/user/home')} 
          style={styles.enterBtn}
          accessibilityLabel="Continue to Home"
        >
          <Text style={styles.enterBtnText}>Continue to Home</Text>
          <ArrowRight size={16} color="#080C14" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'var(--bg-base, #080C14)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: '10%',
    right: '5%',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  iconBox: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: 'var(--bg-surface, rgba(0, 216, 255, 0.05))',
    borderWidth: 1,
    borderColor: 'var(--border-ui, rgba(0, 216, 255, 0.2))',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    shadowColor: 'var(--brand-cyan, #00D8FF)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  badgeText: {
    fontSize: 13,
    color: 'var(--brand-cyan, #00D8FF)',
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: 'var(--text-main, #F1F5F9)',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 12,
  },
  nameText: {
    color: 'var(--brand-cyan, #00D8FF)',
  },
  subtitle: {
    fontSize: 15,
    color: 'var(--text-muted, #9CA3AF)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  progressBox: {
    marginTop: 48,
    alignItems: 'center',
  },
  progressBar: {
    width: 220,
    height: 6,
    backgroundColor: 'var(--border-ui, rgba(255, 255, 255, 0.05))',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--brand-cyan, #00D8FF)',
    borderRadius: 99,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'var(--border-ui, rgba(255, 255, 255, 0.05))',
  },
  statusText: {
    fontSize: 12,
    color: 'var(--text-muted, #9CA3AF)',
    fontWeight: '600',
  },
  topHeader: {
    position: 'absolute',
    top: 48,
    left: 20,
    right: 20,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'var(--bg-surface, rgba(255, 255, 255, 0.05))',
    borderWidth: 1,
    borderColor: 'var(--border-ui, rgba(255, 255, 255, 0.1))',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.2)',
    cursor: 'pointer',
  },
  skipText: {
    fontSize: 12,
    color: 'var(--brand-cyan, #00D8FF)',
    fontWeight: '700',
  },
  enterBtn: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'var(--brand-cyan, #00D8FF)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    width: '100%',
    maxWidth: 240,
    cursor: 'pointer',
    shadowColor: 'var(--brand-cyan, #00D8FF)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  enterBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'var(--text-inverse, #080C14)',
    letterSpacing: -0.2,
  },
});

export default Welcome;
