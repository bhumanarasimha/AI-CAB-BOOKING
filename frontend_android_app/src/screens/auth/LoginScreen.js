import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('bhumanarasimha25@gmail.com');
  const [password, setPassword] = useState('demo');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your phone/email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigation.replace('MainTabs');
    } catch (e) {
      Alert.alert('Login Failed', 'Unable to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = async () => {
    await login('bhumanarasimha25@gmail.com', 'demo');
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bgBase} />
      
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to access real-time ride comparison and bookings</Text>

        {/* Inputs */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email or Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. rider@smartride.ai"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.8}
            style={styles.loginBtn}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDemoBypass}
            activeOpacity={0.7}
            style={styles.demoBtn}
          >
            <Text style={styles.demoBtnText}>⚡ Demo Bypass (Instant Login)</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: 8,
  },
  backBtnText: {
    color: theme.colors.brandCyan,
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  form: {
    marginTop: 32,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  input: {
    height: 50,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    color: theme.colors.textMain,
    fontSize: 15,
  },
  loginBtn: {
    backgroundColor: theme.colors.brandCyan,
    height: 50,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  demoBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoBtnText: {
    color: theme.colors.brandCyan,
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  signupLink: {
    color: theme.colors.brandCyan,
    fontSize: 14,
    fontWeight: '700',
  },
});
