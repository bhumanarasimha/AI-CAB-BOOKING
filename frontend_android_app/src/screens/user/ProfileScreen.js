import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { theme } from '../../theme/theme';
import { Header } from '../../components/common/Header';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Welcome');
        },
      },
    ]);
  };

  const handleEmergencySOS = () => {
    Alert.alert(
      '🚨 Emergency SOS Alert',
      'Live GPS location & vehicle coordinates will be transmitted to Chennai Police Control (112) and your trusted emergency contacts.',
      [{ text: 'Dismiss', style: 'cancel' }, { text: 'Trigger Alert', style: 'destructive' }]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Rider Profile" subtitle="Account & Safety Hub" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : 'S'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'SmartRider'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'rider@smartride.ai'}</Text>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>⭐ {user?.rating || '4.95'}</Text>
              <Text style={styles.statLabel}>Rider Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>₹{user?.savedMoney || '1,840'}</Text>
              <Text style={styles.statLabel}>Total AI Savings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{user?.ridesCount || '42'}</Text>
              <Text style={styles.statLabel}>Completed Trips</Text>
            </View>
          </View>
        </View>

        {/* Emergency SOS Button */}
        <TouchableOpacity onPress={handleEmergencySOS} activeOpacity={0.8} style={styles.sosCard}>
          <Text style={styles.sosIcon}>🚨</Text>
          <View style={styles.sosTextCol}>
            <Text style={styles.sosTitle}>Emergency Safety Shield (SOS)</Text>
            <Text style={styles.sosSub}>Instant 1-tap live location alert to Police & Family</Text>
          </View>
        </TouchableOpacity>

        {/* Preferences Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeader}>Preferences & Settings</Text>

          {/* Language Toggle */}
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🌐</Text>
              <View>
                <Text style={styles.menuTitle}>App Language</Text>
                <Text style={styles.menuSub}>Current: {language.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.langPills}>
              {['en', 'ta', 'hi'].map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setLanguage(l)}
                  style={[styles.langBtn, language === l && styles.activeLangBtn]}
                >
                  <Text style={[styles.langBtnText, language === l && styles.activeLangBtnText]}>
                    {l.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Safety PIN */}
          <TouchableOpacity
            onPress={() => Alert.alert('Ride PIN', 'Every ride requires 4-digit driver PIN verification for maximum safety.')}
            style={styles.menuItem}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🔒</Text>
              <View>
                <Text style={styles.menuTitle}>Ride Start PIN Verification</Text>
                <Text style={styles.menuSub}>Active on all bookings</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Saved Places */}
          <TouchableOpacity
            onPress={() => Alert.alert('Saved Places', 'Home (Avadi) and Work (T. Nagar) saved for 1-tap booking.')}
            style={styles.menuItem}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>⭐</Text>
              <View>
                <Text style={styles.menuTitle}>Favorite & Saved Places</Text>
                <Text style={styles.menuSub}>Home, Work, Frequent Gym</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.8} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  profileHero: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 216, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.brandCyan,
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.brandCyan,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: theme.colors.border,
  },
  sosCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: theme.radii.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  sosIcon: {
    fontSize: 26,
  },
  sosTextCol: {
    flex: 1,
  },
  sosTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F87171',
  },
  sosSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 14,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  menuSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  langPills: {
    flexDirection: 'row',
    gap: 4,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.colors.bgElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeLangBtn: {
    backgroundColor: theme.colors.brandCyan,
    borderColor: theme.colors.brandCyan,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  activeLangBtnText: {
    color: theme.colors.textInverse,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    height: 48,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
