import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react-native';
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
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
    backgroundColor: 'rgba(0, 216, 255, 0.08)',
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
    backgroundColor: 'rgba(0, 216, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.2)',
    alignItems: 'center',
    justify: 'center',
    marginBottom: 36,
    shadowColor: '#00D8FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  badgeText: {
    fontSize: 13,
    color: '#00D8FF',
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F1F5F9',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 12,
  },
  nameText: {
    color: '#00D8FF',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#00D8FF',
    borderRadius: 99,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

export default Welcome;
