import { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../lib/AuthContext';

const socials = [
  { label: 'Google', logo: 'https://www.svgrepo.com/show/475656/google-color.svg' },
  { label: 'Facebook', logo: 'https://www.svgrepo.com/show/475647/facebook-color.svg' },
];

const SignUp = () => {
  const navigate = useNavigate();

  const { registerWithEmail, loginWithGoogle, loginWithFacebook } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 10);
    setPhone(cleaned);
  };

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await registerWithEmail(email, password, name);
      navigate('/user/welcome');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      navigate('/user/welcome');
    } catch (err) {
      setError(err.message || 'Google Sign Up failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleFacebookSignUp = async () => {
    try {
      setIsLoading(true);
      await loginWithFacebook();
      navigate('/user/welcome');
    } catch (err) {
      setError(err.message || 'Facebook Sign Up failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Glow */}
      <View style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titleText}>Create account</Text>
        <Text style={styles.subtitleText}>Join SmartRide AI as a Rider today.</Text>
      </View>

      {/* Switcher */}
      <View style={styles.switcher}>
        <Pressable onPress={() => navigate('/login')} style={styles.switchBtn}>
          <Text style={styles.switchInactiveText}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => navigate('/signup')} style={[styles.switchBtn, styles.switchActive]}>
          <Text style={styles.switchActiveText}>Sign Up</Text>
        </Pressable>
      </View>

      {/* Error Banner */}
      {!!error && (
        <View style={styles.errorBanner}>
          <View style={styles.errorDot} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full Name"
          placeholderTextColor="#4B5563"
          style={styles.input}
        />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor="#4B5563"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={phone}
          onChangeText={handlePhoneChange}
          placeholder="Phone number"
          placeholderTextColor="#4B5563"
          keyboardType="phone-pad"
          maxLength={10}
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Create password"
          placeholderTextColor="#4B5563"
          secureTextEntry
          style={styles.input}
        />

        <Pressable onPress={handleSubmit} disabled={isLoading} style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}>
          {isLoading ? (
            <ActivityIndicator color="#080C14" />
          ) : (
            <View style={styles.btnRow}>
              <Text style={styles.submitBtnText}>Create Account </Text>
              <ArrowRight size={18} color="#080C14" />
            </View>
          )}
        </Pressable>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or sign up with</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Grid */}
      <View style={styles.socialGrid}>
        <Pressable onPress={handleGoogleSignUp} disabled={isLoading} style={styles.socialBtn}>
          <Image source={{ uri: socials[0].logo }} style={styles.socialIcon} resizeMode="contain" />
        </Pressable>
        <Pressable onPress={handleFacebookSignUp} disabled={isLoading} style={styles.socialBtn}>
          <Image source={{ uri: socials[1].logo }} style={styles.socialIcon} resizeMode="contain" />
        </Pressable>
      </View>

      {/* Footer link */}
      <View style={styles.footerLinkRow}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable onPress={() => navigate('/login')}>
          <Text style={styles.signinText}>Sign in</Text>
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
    top: 0,
    right: -40,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 216, 255, 0.06)',
  },
  header: {
    marginBottom: 28,
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
    justify: 'center',
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
  form: {
    gap: 12,
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
  submitBtn: {
    height: 54,
    backgroundColor: '#00D8FF',
    borderRadius: 16,
    alignItems: 'center',
    justify: 'center',
    marginTop: 8,
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
    marginVertical: 20,
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
    justify: 'center',
  },
  socialIcon: {
    width: 22,
    height: 22,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justify: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  signinText: {
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

export default SignUp;
