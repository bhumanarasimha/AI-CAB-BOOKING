import { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useNavigate } from 'react-router-dom';
import appIcon from '../../assets/app-icon.png';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate('/onboarding'), 2800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <View style={styles.container}>
      {/* Background glow circle */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Logo & Title */}
      <View style={styles.logoContainer}>
        <View style={styles.iconBox}>
          <Image source={{ uri: appIcon }} style={styles.iconImage} resizeMode="cover" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.titleText}>
            SmartRide <Text style={styles.titleGradient}>AI</Text>
          </Text>
          <Text style={styles.subtitleText}>
            INTELLIGENT MOBILITY
          </Text>
        </View>
      </View>

      {/* Bottom Loading Indicator & Continue */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#00D8FF" />
        <Pressable 
          onPress={() => navigate('/onboarding')} 
          style={styles.continueBtn}
          accessibilityLabel="Continue to Onboarding"
        >
          <Text style={styles.continueText}>Continue →</Text>
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
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: [{ translateX: -160 }, { translateY: -160 }],
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: '20%',
    right: '15%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'var(--bg-surface, #1A2340)',
    borderWidth: 1,
    borderColor: 'var(--border-ui, rgba(255, 255, 255, 0.07))',
    overflow: 'hidden',
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 38,
    fontWeight: '800',
    color: 'var(--text-main, #F1F5F9)',
    letterSpacing: -0.5,
  },
  titleGradient: {
    color: 'var(--brand-cyan, #00D8FF)',
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    color: 'var(--text-muted, #9CA3AF)',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 64,
    alignItems: 'center',
    gap: 12,
  },
  continueBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.25)',
    cursor: 'pointer',
  },
  continueText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'var(--brand-cyan, #00D8FF)',
  },
});

export default Splash;
