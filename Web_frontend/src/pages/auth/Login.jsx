import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react-native';
import { useAuth } from '../../lib/AuthContext';

const socials = [
  { label: 'Google', logo: 'https://www.svgrepo.com/show/475656/google-color.svg' },
  { label: 'Facebook', logo: 'https://www.svgrepo.com/show/475647/facebook-color.svg' },
];

const Login = () => {
  const navigate = useNavigate();
  const accent = '#00D8FF';

  const { user, loading, loginWithGoogle, loginWithFacebook, loginWithEmail, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/user/welcome');
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await loginWithEmail(email, password);
      navigate('/user/welcome');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/user/welcome');
    } catch (err) {
      if (err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Google Login failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithFacebook();
      navigate('/user/welcome');
    } catch (err) {
      if (err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Facebook Login failed. Please try again.');
      }
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
      await sendPasswordReset(email);
      setSuccessMsg('Password reset email sent successfully! Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Glow */}
      <View style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.chip}>
          <View style={styles.chipDot} />
          <Text style={styles.chipText}>Rider Portal</Text>
        </View>
        <Text style={styles.titleText}>Welcome back</Text>
        <Text style={styles.subtitleText}>Sign in to your SmartRide AI account.</Text>
      </View>

      {/* Switcher */}
      <View style={styles.switcher}>
        <Pressable onPress={() => navigate('/login')} style={[styles.switchBtn, styles.switchActive]}>
          <Text style={styles.switchActiveText}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => navigate('/signup')} style={styles.switchBtn}>
          <Text style={styles.switchInactiveText}>Sign Up</Text>
        </Pressable>
      </View>

      {/* Error Banner */}
      {!!error && (
        <View style={styles.errorBanner}>
          <View style={styles.errorDot} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Success Banner */}
      {!!successMsg && (
        <View style={styles.successBanner}>
          <View style={styles.successDot} />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#4B5563"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#4B5563"
            secureTextEntry={!showPw}
            style={[styles.input, { paddingRight: 46 }]}
          />
          <Pressable onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
            {showPw ? <EyeOff size={18} color="#4B5563" /> : <Eye size={18} color="#4B5563" />}
          </Pressable>
        </View>

        <Pressable onPress={handleForgotPassword} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <Pressable onPress={handleLogin} disabled={isLoading} style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}>
          {isLoading ? (
            <ActivityIndicator color="#080C14" />
          ) : (
            <View style={styles.btnRow}>
              <Text style={styles.submitBtnText}>Sign In </Text>
              <ArrowRight size={18} color="#080C14" />
            </View>
          )}
        </Pressable>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Grid */}
      <View style={styles.socialGrid}>
        <Pressable onPress={handleGoogleLogin} disabled={isLoading} style={styles.socialBtn}>
          <Image source={{ uri: socials[0].logo }} style={styles.socialIcon} resizeMode="contain" />
        </Pressable>
        <Pressable onPress={handleFacebookLogin} disabled={isLoading} style={styles.socialBtn}>
          <Image source={{ uri: socials[1].logo }} style={styles.socialIcon} resizeMode="contain" />
        </Pressable>
      </View>

      {/* Footer link */}
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
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
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
  header: {
    marginBottom: 28,
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
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D8FF',
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D8FF',
  },
  titleText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  switcher: {
    flexDirection: 'row',
    backgroundColor: '#1A2340',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  switchBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#00D8FF',
    shadowColor: '#00D8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  switchActiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#080C14',
  },
  switchInactiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
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
    width: 4,
    height: 4,
    borderRadius: 2,
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
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  successText: {
    fontSize: 13,
    color: '#10B981',
    flex: 1,
  },
  form: {
    gap: 14,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#0F1623',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
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
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    color: '#00D8FF',
    fontWeight: '500',
  },
  submitBtn: {
    height: 54,
    backgroundColor: '#00D8FF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D8FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#080C14',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
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
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#0F1623',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 22,
    height: 22,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  signupText: {
    fontSize: 14,
    color: '#00D8FF',
    fontWeight: '700',
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
  },
});

export default Login;
