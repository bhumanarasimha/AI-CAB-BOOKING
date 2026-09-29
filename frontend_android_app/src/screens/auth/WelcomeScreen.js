import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, StatusBar } from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

export const WelcomeScreen = ({ navigation }) => {
  const { login } = useAuth();

  const handleDemoBypass = async () => {
    await login('demo.rider@smartride.ai', 'demo123');
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bgBase} />
      
      {/* Top Banner Graphic */}
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.welcomeHeading}>Welcome to</Text>
        <Text style={styles.brandTitle}>SmartRide AI</Text>
        <Text style={styles.brandSub}>
          Compare Uber, Ola, Rapido, and Namma Yatri side-by-side with zero surge markup.
        </Text>
      </View>

      {/* Feature Highlights Card */}
      <View style={styles.featuresCard}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>⚡</Text>
          <View style={styles.featureTextCol}>
            <Text style={styles.featureTitle}>Real-Time Rate Aggregation</Text>
            <Text style={styles.featureDesc}>Live fares calibrated to Chennai & Metro city rates</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🧠</Text>
          <View style={styles.featureTextCol}>
            <Text style={styles.featureTitle}>EMMDE Multi-Agent Optimizer</Text>
            <Text style={styles.featureDesc}>Recommends best ride balancing cost, ETA & reliability</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🛡️</Text>
          <View style={styles.featureTextCol}>
            <Text style={styles.featureTitle}>Zero Surge Protection</Text>
            <Text style={styles.featureDesc}>Intelligent multi-modal switching when peak surge hits</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          activeOpacity={0.8}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDemoBypass}
          activeOpacity={0.7}
          style={styles.demoBypassBtn}
        >
          <Text style={styles.demoBypassText}>⚡ Quick Demo Access (Instant Explore)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 216, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.brandCyan,
    marginBottom: 16,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  welcomeHeading: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  brandSub: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: '90%',
  },
  featuresCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  featureDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: theme.colors.brandCyan,
    height: 50,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.brandCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: theme.colors.bgCard,
    height: 50,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryBtnText: {
    color: theme.colors.textMain,
    fontSize: 15,
    fontWeight: '600',
  },
  demoBypassBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  demoBypassText: {
    color: theme.colors.brandCyan,
    fontSize: 13,
    fontWeight: '600',
  },
});
