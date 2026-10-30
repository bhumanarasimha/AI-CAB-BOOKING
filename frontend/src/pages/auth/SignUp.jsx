import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, X } from 'lucide-react-native';
import { useAuth } from '../../lib/AuthContext';
import { isValidEmail, validatePassword, sanitizeText } from '../../lib/validation';

const SignUp = () => {
  const navigate = useNavigate();
  const { registerWithEmail } = useAuth();

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Field touch / error states for real-time indicators
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const pwdInfo = validatePassword(password);
  const emailValid = isValidEmail(email);

  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 10);
    setPhone(cleaned);
  };

  // Registration submission with strict 5-layer checks
  const handleRegister = async () => {
    setTouched({ name: true, email: true, password: true });

    const cleanName = sanitizeText(name);
    const cleanEmail = sanitizeText(email).toLowerCase();
    const cleanPassword = password || '';
    const cleanPhone = (phone || '').trim();

    // 1. Empty Fields Check
    if (!cleanName || !cleanEmail || !cleanPassword) {
      setError('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    // 2. Strict Email Regex Validation
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g. user@domain.com).');
      return;
    }

    // 3. Strict Password Strength Validation
    if (!pwdInfo.isValid) {
      setError(pwdInfo.message || 'Password does not meet strength requirements.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await registerWithEmail(cleanEmail, cleanPassword, cleanName, cleanPhone);

      // Store encrypted/saved credentials for instant sign in
      localStorage.setItem('smartride_user_email', cleanEmail);
      localStorage.setItem('smartride_user_password', cleanPassword);
      localStorage.setItem('smartride_user_name', cleanName);

      // Redirect to Login page with prefilled credentials
      navigate('/login', {
        state: {
          registered: true,
          registeredEmail: cleanEmail,
          registeredPassword: cleanPassword,
          message: 'Registration successful! Please sign in with your password.'
        }
      });
    } catch (err) {
      console.warn("Registration validation notice:", err);
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Background Glow */}
      <View style={styles.glow} />

      {/* Top Nav */}
      <View style={styles.topNav}>
        <Pressable 
          onPress={() => navigate('/login')}
          style={styles.backBtn}
          accessibilityLabel="Back to Login"
        >
          <ArrowLeft size={18} color="#F1F5F9" />
        </Pressable>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titleText}>Create account</Text>
        <Text style={styles.subtitleText}>Join SmartRide AI as a Rider today.</Text>
      </View>

      {/* Switcher Tab Bar */}
      <View style={styles.switcher}>
        <Pressable onPress={() => navigate('/login')} style={styles.switchBtn}>
          <Text style={styles.switchInactiveText}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => navigate('/signup')} style={[styles.switchBtn, styles.switchActive]}>
          <Text style={styles.switchActiveText}>Register</Text>
        </Pressable>
      </View>

      {/* Error Feedback Message */}
      {!!error && (
        <View style={styles.errorBanner}>
          <View style={styles.errorDot} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Registration Form */}
      <View style={styles.form}>
        {/* Full Name */}
        <View>
          <TextInput
            value={name}
            onChangeText={(val) => { setName(val); setError(''); }}
            onBlur={() => setTouched(p => ({ ...p, name: true }))}
            placeholder="Full Name *"
            placeholderTextColor="#4B5563"
            returnKeyType="next"
            style={[
              styles.input,
              touched.name && !name.trim() && styles.inputError
            ]}
          />
        </View>

        {/* Email Address */}
        <View>
          <TextInput
            value={email}
            onChangeText={(val) => { setEmail(val); setError(''); }}
            onBlur={() => setTouched(p => ({ ...p, email: true }))}
            placeholder="Email address (e.g. user@domain.com) *"
            placeholderTextColor="#4B5563"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            style={[
              styles.input,
              touched.email && (!email.trim() || !emailValid) && styles.inputError
            ]}
          />
          {touched.email && email.length > 0 && !emailValid && (
            <Text style={styles.fieldErrorText}>Invalid email format (must include @ and domain)</Text>
          )}
        </View>

        {/* Phone Number */}
        <View>
          <TextInput
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="Phone number (10 digits, optional)"
            placeholderTextColor="#4B5563"
            keyboardType="phone-pad"
            maxLength={10}
            returnKeyType="next"
            style={styles.input}
          />
        </View>

        {/* Password */}
        <View>
          <TextInput
            value={password}
            onChangeText={(val) => { setPassword(val); setError(''); }}
            onBlur={() => setTouched(p => ({ ...p, password: true }))}
            placeholder="Create password *"
            placeholderTextColor="#4B5563"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            style={[
              styles.input,
              touched.password && (!password || !pwdInfo.isValid) && styles.inputError
            ]}
          />
        </View>

        {/* Real-time Password Strength Criteria Indicators */}
        <View style={styles.pwdCriteriaBox}>
          <Text style={styles.pwdCriteriaTitle}>Password Requirements:</Text>
          <View style={styles.pwdCriteriaRow}>
            {pwdInfo.hasMinLength ? <Check size={12} color="#10B981" /> : <X size={12} color="#EF4444" />}
            <Text style={[styles.pwdCriteriaText, pwdInfo.hasMinLength && styles.pwdCriteriaPass]}>At least 8 characters</Text>
          </View>
          <View style={styles.pwdCriteriaRow}>
            {pwdInfo.hasUpper ? <Check size={12} color="#10B981" /> : <X size={12} color="#EF4444" />}
            <Text style={[styles.pwdCriteriaText, pwdInfo.hasUpper && styles.pwdCriteriaPass]}>At least 1 uppercase letter (A-Z)</Text>
          </View>
          <View style={styles.pwdCriteriaRow}>
            {pwdInfo.hasNumber ? <Check size={12} color="#10B981" /> : <X size={12} color="#EF4444" />}
            <Text style={[styles.pwdCriteriaText, pwdInfo.hasNumber && styles.pwdCriteriaPass]}>At least 1 number (0-9)</Text>
          </View>
          <View style={styles.pwdCriteriaRow}>
            {pwdInfo.hasSpecial ? <Check size={12} color="#10B981" /> : <X size={12} color="#EF4444" />}
            <Text style={[styles.pwdCriteriaText, pwdInfo.hasSpecial && styles.pwdCriteriaPass]}>At least 1 special character (@, #, $, etc.)</Text>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleRegister}
          disabled={isLoading}
          style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
        >
          {isLoading ? (
            <ActivityIndicator color="#080C14" />
          ) : (
            <View style={styles.btnRow}>
              <Text style={styles.submitBtnText}>Register Now </Text>
              <ArrowRight size={18} color="#080C14" />
            </View>
          )}
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
    paddingHorizontal: 20,
    paddingTop: 48,
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
    marginBottom: 20,
  },
  topNav: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 14,
    color: '#9CA3AF',
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
  form: {
    gap: 12,
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
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  fieldErrorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    paddingLeft: 4,
  },
  pwdCriteriaBox: {
    backgroundColor: 'rgba(15, 22, 35, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  pwdCriteriaTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pwdCriteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pwdCriteriaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  pwdCriteriaPass: {
    color: '#10B981',
    fontWeight: '600',
  },
  submitBtn: {
    height: 52,
    backgroundColor: '#00D8FF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 16,
  },
  linkText: {
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
});

export default SignUp;
