import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, StatusBar } from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

export const SplashScreen = ({ navigation }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        if (user) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Welcome');
        }
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [user, loading, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bgBase} />
      
      <View style={styles.content}>
        {/* Glowing App Icon Container */}
        <View style={styles.iconGlowRing}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>SmartRide AI</Text>
        <Text style={styles.tagline}>Intelligent Multi-App Cab Booking & Telemetry</Text>

        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>POWERED BY EMMDE MULTI-AGENT ENGINE</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Real-Time Rate Aggregation Across Top Providers</Text>
        <Text style={styles.versionText}>v1.0.0 (Native Android Edition)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlowRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 216, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.brandCyan,
    shadowColor: theme.colors.brandCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  aiBadge: {
    marginTop: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.brandIndigo,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brandCyan,
    letterSpacing: 0.6,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  versionText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
    opacity: 0.7,
  },
});
