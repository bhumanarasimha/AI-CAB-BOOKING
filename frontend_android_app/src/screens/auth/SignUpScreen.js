import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

export const SignUpScreen = ({ navigation }) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Required Fields', 'Please enter your name, email, and password.');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, phone, password);
      navigation.replace('MainTabs');
    } catch (e) {
      Alert.alert('Registration Failed', 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bgBase} />
      
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join SmartRide AI to unlock transparent multi-cab price comparison</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Narasimha"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. narasimha@smartride.ai"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={theme.colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create secure password"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={handleSignUp}
            activeOpacity={0.8}
            style={styles.signupBtn}
            disabled={loading}
          >
            <Text style={styles.signupBtnText}>{loading ? 'Creating Account...' : 'Get Started'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already registered? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backBtnText: {
    color: theme.colors.brandCyan,
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.5,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  form: {
    marginTop: 24,
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
  signupBtn: {
    backgroundColor: theme.colors.brandCyan,
    height: 50,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  signupBtnText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  loginLink: {
    color: theme.colors.brandCyan,
    fontSize: 14,
    fontWeight: '700',
  },
});
