import { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
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

      {/* Bottom Loading Indicator */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#00D8FF" />
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
    backgroundColor: 'rgba(0, 216, 255, 0.12)',
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#1A2340',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
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
    color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  titleGradient: {
    color: '#00D8FF',
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    color: '#9CA3AF',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 64,
  },
});

export default Splash;
