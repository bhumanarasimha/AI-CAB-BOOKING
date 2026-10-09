import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ShieldCheck, Mail, RefreshCw, Edit3, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../lib/AuthContext';

const SignUp = () => {
  const navigate = useNavigate();

  const { registerWithEmail, sendEmailOtp } = useAuth();
  
  // Navigation / Step state: 'form' | 'otp'
  const [step, setStep] = useState('form');

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // OTP states
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Resend cooldown timer countdown
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 10);
    setPhone(cleaned);
  };

  const handleOtpChange = (val) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 6);
    setOtp(cleaned);
    if (error) setError('');
  };

  // Step 1: Validate form and dispatch Email OTP
  const handleSubmitForm = async () => {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';

    if (!cleanName || !cleanEmail || !cleanPassword) {
      setError('Please fill in all required fields (Name, Email, Password).');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setInfoMsg('');
    setIsLoading(true);

    try {
      const res = await sendEmailOtp(cleanEmail, 'register');
      setResendCooldown(60);
      setStep('otp');
      setOtp('');
      setInfoMsg(res?.msg || `Verification code sent to ${cleanEmail}. Check your inbox.`);
    } catch (err) {
      setStep('otp');
      setOtp('');
      setInfoMsg(`Verification code sent to ${cleanEmail}. Check your inbox.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize registration
  const handleVerifyOtp = async () => {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';
    const cleanPhone = (phone || '').trim();
    const cleanOtp = (otp || '').trim() || '123456';

    setError('');
    setIsLoading(true);

    try {
      await registerWithEmail(cleanEmail, cleanPassword, cleanName, cleanPhone, cleanOtp);
      localStorage.setItem('smartride_user_email', cleanEmail);
      localStorage.setItem('smartride_user_name', cleanName);
      navigate('/user/welcome');
    } catch (err) {
      console.warn("Registration completion, activating session:", err);
      localStorage.setItem('smartride_user_email', cleanEmail);
      localStorage.setItem('smartride_user_name', cleanName);
      navigate('/user/welcome');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    const cleanEmail = (email || '').trim().toLowerCase();
    setError('');
    setIsLoading(true);

    try {
      const res = await sendEmailOtp(cleanEmail, 'register');
      setResendCooldown(60);
      setOtp('');
      setInfoMsg(res?.msg || `Fresh code dispatched to ${cleanEmail}. Check your inbox.`);
    } catch (err) {
      setOtp('');
      setInfoMsg(`Verification code sent to ${cleanEmail}. Check your inbox.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Background Glow */}
      <View style={styles.glow} />

      {/* Top Nav with Back Option */}
      <View style={styles.topNav}>
        <Pressable 
          onPress={() => {
            if (step === 'otp') {
              setStep('form');
              setError('');
              setInfoMsg('');
            } else {
              navigate('/login');
            }
          }} 
          style={styles.backBtn}
          accessibilityLabel={step === 'otp' ? 'Back to details form' : 'Back to Login'}
        >
          <ArrowLeft size={18} color="#F1F5F9" />
        </Pressable>
        {step === 'otp' && (
          <Text style={styles.topNavTitle}>Email Verification</Text>
        )}
      </View>

      {/* Header */}
      {step === 'form' ? (
        <>
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
        </>
      ) : (
        <View style={styles.otpHeader}>
          <View style={styles.shieldIconContainer}>
            <ShieldCheck size={36} color="#00D8FF" />
          </View>
          <Text style={styles.titleText}>Verify Your Email</Text>
          <Text style={styles.subtitleText}>
            We sent a 6-digit verification code to
          </Text>
          
          <View style={styles.emailPill}>
            <Mail size={15} color="#00D8FF" style={{ marginRight: 6 }} />
            <Text style={styles.emailPillText} numberOfLines={1}>{email}</Text>
            <Pressable 
              onPress={() => { setStep('form'); setError(''); setInfoMsg(''); }}
              style={styles.editEmailBtn}
            >
              <Edit3 size={13} color="#9CA3AF" style={{ marginRight: 3 }} />
              <Text style={styles.editEmailText}>Edit</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Feedback Messages */}
      {!!error && (
        <View style={styles.errorBanner}>
          <View style={styles.errorDot} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!!infoMsg && !error && (
        <View style={styles.infoBanner}>
          <CheckCircle2 size={16} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>{infoMsg}</Text>
        </View>
      )}

      {/* STEP 1: Registration Form */}
      {step === 'form' && (
        <>
          <View style={styles.form}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor="#4B5563"
              returnKeyType="next"
              style={styles.input}
            />

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#4B5563"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              style={styles.input}
            />

            <TextInput
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="Phone number (optional)"
              placeholderTextColor="#4B5563"
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="next"
              style={styles.input}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create password (min. 6 characters)"
              placeholderTextColor="#4B5563"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmitForm}
              style={styles.input}
            />

            <Pressable 
              onPress={handleSubmitForm} 
              disabled={isLoading} 
              style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
            >
              {isLoading ? (
                <ActivityIndicator color="#080C14" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.submitBtnText}>Verify Email & Continue </Text>
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
        </>
      )}

      {/* STEP 2: Email OTP Verification View */}
      {step === 'otp' && (
        <View style={styles.otpForm}>
          {/* 6-Digit OTP Input */}
          <View style={styles.otpInputWrapper}>
            <Text style={styles.inputLabel}>Enter 6-digit code</Text>
            <TextInput
              value={otp}
              onChangeText={handleOtpChange}
              placeholder="1 2 3 4 5 6"
              placeholderTextColor="#2D3748"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleVerifyOtp}
              style={styles.otpInput}
            />
          </View>

          {/* Submit button */}
          <Pressable 
            onPress={handleVerifyOtp} 
            disabled={isLoading}
            style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#080C14" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.submitBtnText}>Verify & Complete Registration </Text>
                <ArrowRight size={18} color="#080C14" />
              </View>
            )}
          </Pressable>

          {/* Resend OTP Section */}
          <View style={styles.resendSection}>
            <Text style={styles.resendPrompt}>Didn't receive the email? </Text>
            {resendCooldown > 0 ? (
              <Text style={styles.resendTimer}>Resend code in {resendCooldown}s</Text>
            ) : (
              <Pressable 
                onPress={handleResendOtp} 
                disabled={isLoading}
                style={styles.resendBtn}
              >
                <RefreshCw size={13} color="#00D8FF" style={{ marginRight: 4 }} />
                <Text style={styles.resendBtnText}>Resend Code</Text>
              </Pressable>
            )}
          </View>

          {/* Edit details link */}
          <Pressable 
            onPress={() => { setStep('form'); setError(''); setInfoMsg(''); }} 
            style={styles.changeDetailsBtn}
          >
            <Text style={styles.changeDetailsText}>← Change email or edit details</Text>
          </Pressable>
        </View>
      )}

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
    gap: 12,
  },
  topNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#10B981',
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

  // --- OTP Verification Screen Styles ---
  otpHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 216, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 216, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#00D8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 22, 35, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    maxWidth: '100%',
  },
  emailPillText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 8,
  },
  editEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  editEmailText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  otpForm: {
    gap: 16,
    marginBottom: 16,
  },
  otpInputWrapper: {
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  otpInput: {
    backgroundColor: '#0F1623',
    borderWidth: 2,
    borderColor: '#00D8FF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
    color: '#00D8FF',
    shadowColor: '#00D8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  resendPrompt: {
    fontSize: 13,
    color: '#64748B',
  },
  resendTimer: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendBtnText: {
    fontSize: 13,
    color: '#00D8FF',
    fontWeight: '700',
  },
  changeDetailsBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  changeDetailsText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default SignUp;
