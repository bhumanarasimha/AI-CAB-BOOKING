import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Image, ScrollView, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, X } from 'lucide-react-native';
import { useAuth } from '../../lib/AuthContext';

const socials = [
  { label: 'Google', logo: 'https://www.svgrepo.com/show/475656/google-color.svg' },
];

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, loginWithGoogle, loginWithEmail, sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Social Account Authentication Modal state
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialName, setSocialName] = useState('');
  const [socialEmail, setSocialEmail] = useState('');
  const [socialError, setSocialError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/user/welcome');
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    const targetEmail = (email || '').trim();
    const targetPassword = password;

    if (!targetEmail || !targetPassword) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await loginWithEmail(targetEmail, targetPassword);
      navigate('/user/welcome');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const cleanEmail = (email || '').trim();
      const res = await loginWithGoogle(cleanEmail || null, null);
      if (res && res.user) {
        navigate('/user/welcome');
      }
    } catch (err) {
      setError(err.message || 'Google Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSubmit = async () => {
    const cleanEmail = (socialEmail || '').trim().toLowerCase();
    const cleanName = (socialName || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setSocialError('Please enter a valid email address.');
      return;
    }
    if (!cleanName) {
      setSocialError('Please enter your full name.');
      return;
    }

    setSocialError('');
    setIsLoading(true);

    try {
      const res = await loginWithGoogle(cleanEmail, cleanName);
      if (res && res.user) {
        setSocialModalVisible(false);
        navigate('/user/welcome');
      }
    } catch (err) {
      setSocialError(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address in the Email field to reset your password.');
      setSuccessMsg('');
      return;
    }
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (sendPasswordReset) {
        await sendPasswordReset(email.trim());
        setSuccessMsg('Password reset email sent successfully! Please check your inbox.');
      } else {
        setSuccessMsg('If an account exists with this email, a password reset link has been dispatched.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Background ambient lighting */}
      <View style={styles.glow} />
      <View style={styles.glowSecondary} />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <Pressable 
          onPress={() => navigate('/onboarding')} 
          style={styles.backBtn}
          accessibilityLabel="Back to Onboarding"
        >
          <ArrowLeft size={18} color="#F1F5F9" />
        </Pressable>

        <View style={styles.chip}>
          <ShieldCheck size={14} color="#00D8FF" style={{ marginRight: 5 }} />
          <Text style={styles.chipText}>Secure Access</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titleText}>Welcome back</Text>
        <Text style={styles.subtitleText}>
          Sign in to your account to manage your rides, commute, and bookings.
        </Text>
      </View>

      {/* Switcher Tab Bar */}
      <View style={styles.switcher}>
        <Pressable onPress={() => navigate('/login')} style={[styles.switchBtn, styles.switchActive]}>
          <Text style={styles.switchActiveText}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => navigate('/signup')} style={styles.switchBtn}>
          <Text style={styles.switchInactiveText}>Sign Up</Text>
        </Pressable>
      </View>

      {/* Error Alert */}
      {!!error && (
        <View style={styles.errorBanner}>
          <View style={styles.errorDot} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Success Alert */}
      {!!successMsg && (
        <View style={styles.successBanner}>
          <View style={styles.successDot} />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}

      {/* Standard Credentials Form */}
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            placeholder="Email address"
            placeholderTextColor="#4B5563"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            placeholder="Password"
            placeholderTextColor="#4B5563"
            secureTextEntry={!showPw}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            style={[styles.input, { paddingRight: 46 }]}
          />
          <Pressable onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
            {showPw ? <EyeOff size={18} color="#4B5563" /> : <Eye size={18} color="#4B5563" />}
          </Pressable>
        </View>

        <Pressable onPress={handleForgotPassword} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <Pressable 
          onPress={handleLogin} 
          disabled={isLoading} 
          style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
        >
          {isLoading ? (
            <ActivityIndicator color="#080C14" />
          ) : (
            <View style={styles.btnRow}>
              <Text style={styles.submitBtnText}>Sign In </Text>
              <ArrowRight size={18} color="#080C14" />
            </View>
          )}
        </Pressable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Logins - Google Only */}
        <View style={styles.socialGrid}>
          <Pressable onPress={handleGoogleLogin} disabled={isLoading} style={styles.socialBtn}>
            <Image source={{ uri: socials[0].logo }} style={styles.socialIcon} resizeMode="contain" />
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </Pressable>
        </View>
      </View>

      {/* Google Authentication Modal */}
      <Modal
        visible={socialModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSocialModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Image 
                  source={{ uri: socials[0].logo }}
                  style={{ width: 22, height: 22, marginRight: 8 }} 
                  resizeMode="contain" 
                />
                <Text style={styles.modalTitle}>Sign In with Google</Text>
              </View>
              <Pressable onPress={() => setSocialModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#9CA3AF" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Connect your verified Google account to log in to your profile.
            </Text>

            {!!socialError && (
              <View style={styles.errorBanner}>
                <View style={styles.errorDot} />
                <Text style={styles.errorText}>{socialError}</Text>
              </View>
            )}

            <View style={styles.modalForm}>
              <View style={styles.inputContainer}>
                <TextInput
                  value={socialName}
                  onChangeText={(text) => { setSocialName(text); setSocialError(''); }}
                  placeholder="Your Full Name (e.g. John Doe)"
                  placeholderTextColor="#4B5563"
                  autoCapitalize="words"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={socialEmail}
                  onChangeText={(text) => { setSocialEmail(text); setSocialError(''); }}
                  placeholder="Your Google Email address"
                  placeholderTextColor="#4B5563"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <Pressable 
                onPress={handleSocialSubmit}
                disabled={isLoading}
                style={[styles.submitBtn, { marginTop: 12 }, isLoading && { opacity: 0.7 }]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#080C14" />
                ) : (
                  <Text style={styles.submitBtnText}>Verify & Sign In</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer link to sign up */}
      <View style={styles.footerLinkRow}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Pressable onPress={() => navigate('/signup')}>
          <Text style={styles.signupText}>Sign up</Text>
        </Pressable>
      </View>

      <Text style={styles.termsText}>
        By continuing, you agree to our{' '}
        <Text onPress={() => navigate('/terms')} style={styles.linkText}>Terms of Service</Text>{' '}
        and{' '}
        <Text onPress={() => navigate('/privacy')} style={styles.linkText}>Privacy Policy</Text>.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  glow: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 216, 255, 0.08)',
  },
  glowSecondary: {
    position: 'absolute',
    bottom: 80,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  topNav: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 216, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.25)',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D8FF',
  },
  header: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  switcher: {
    flexDirection: 'row',
    backgroundColor: '#0F1623',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  switchBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  switchActive: {
    backgroundColor: '#00D8FF',
    shadowColor: '#00D8FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  switchActiveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#080C14',
    textAlign: 'center',
  },
  switchInactiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    marginBottom: 16,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    marginBottom: 16,
  },
  successDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  successText: {
    fontSize: 13,
    color: '#10B981',
    flex: 1,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#0F1623',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F1F5F9',
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    top: 14,
    cursor: 'pointer',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 2,
    cursor: 'pointer',
  },
  forgotText: {
    fontSize: 13,
    color: '#00D8FF',
    fontWeight: '600',
  },
  submitBtn: {
    height: 52,
    backgroundColor: '#00D8FF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D8FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    cursor: 'pointer',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#080C14',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  socialGrid: {
    flexDirection: 'row',
  },
  socialBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#0F1623',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0B111D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 19,
    marginBottom: 16,
  },
  modalForm: {
    gap: 12,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  signupText: {
    fontSize: 14,
    color: '#00D8FF',
    fontWeight: '700',
    cursor: 'pointer',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  linkText: {
    color: '#9CA3AF',
    textDecorationLine: 'underline',
    cursor: 'pointer',
  },
});

export default Login;
