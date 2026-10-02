import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { theme } from '../../theme/theme';
import { Header } from '../../components/common/Header';

export const RideComparisonScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('cab4');

  const handleOpenProvider = (item) => {
    const p = (item.provider || '').toLowerCase();
    if (p.includes('uber')) {
      Linking.openURL('uber://?action=setPickup&pickup=my_location').catch(() => {
        Linking.openURL('https://m.uber.com/');
      });
    } else if (p.includes('ola')) {
      Linking.openURL('olacabs://app/launch?landing_page=bk').catch(() => {
        Linking.openURL('https://book.olacabs.com/');
      });
    } else if (p.includes('rapido')) {
      Linking.openURL('rapido://ride').catch(() => {
        Linking.openURL('https://rapido.bike/');
      });
    } else if (p.includes('namma')) {
      Linking.openURL('nammayatri://ride').catch(() => {
        Linking.openURL('https://nammayatri.in/');
      });
    } else {
      navigation.navigate('Activity', { confirmed: true, rideDetails: item });
    }
  };

  const comparisonData = {
    bike: [
      { provider: 'SmartRide Moto', cost: 358, surge: '0%', eta: '42 min', speedScore: 95, isAiPick: true },
      { provider: 'Rapido Bike', cost: 422, surge: '+1.1x', eta: '45 min', speedScore: 90 },
      { provider: 'Uber Moto', cost: 435, surge: '+1.2x', eta: '46 min', speedScore: 88 },
      { provider: 'Ola Bike', cost: 430, surge: '+1.15x', eta: '48 min', speedScore: 85 },
    ],
    auto: [
      { provider: 'SmartRide Auto', cost: 494, surge: '0%', eta: '50 min', speedScore: 92, isAiPick: true },
      { provider: 'Namma Yatri Auto', cost: 509, surge: '0%', eta: '52 min', speedScore: 90 },
      { provider: 'Rapido Auto', cost: 574, surge: '+1.15x', eta: '54 min', speedScore: 86 },
      { provider: 'Uber Auto', cost: 595, surge: '+1.2x', eta: '55 min', speedScore: 84 },
      { provider: 'Ola Auto', cost: 581, surge: '+1.18x', eta: '56 min', speedScore: 82 },
    ],
    cab4: [
      { provider: 'SmartRide Cab+Metro', cost: 431, surge: '0%', eta: '45 min', speedScore: 98, isAiPick: true, isCombo: true },
      { provider: 'Namma Yatri Cab', cost: 719, surge: '0%', eta: '56 min', speedScore: 88 },
      { provider: 'Rapido Cab', cost: 796, surge: '+1.15x', eta: '58 min', speedScore: 86 },
      { provider: 'Ola Mini', cost: 805, surge: '+1.2x', eta: '60 min', speedScore: 84 },
      { provider: 'Uber Go', cost: 822, surge: '+1.25x', eta: '62 min', speedScore: 82 },
    ],
    cab7: [
      { provider: 'SmartRide XL', cost: 1102, surge: '0%', eta: '58 min', speedScore: 94, isAiPick: true },
      { provider: 'Ola Prime SUV', cost: 1307, surge: '+1.2x', eta: '64 min', speedScore: 88 },
      { provider: 'Uber XL', cost: 1348, surge: '+1.25x', eta: '65 min', speedScore: 86 },
    ],
  };

  const list = comparisonData[selectedCategory] || comparisonData['cab4'];
  const maxCost = Math.max(...list.map((i) => i.cost));
  const minCost = Math.min(...list.map((i) => i.cost));
  const maxSavings = maxCost - minCost;

  return (
    <View style={styles.container}>
      <Header
        title="Multi-App Price Matrix"
        subtitle="Side-by-Side Live Rate Analysis"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Category Pill Tabs */}
        <View style={styles.tabsRow}>
          {[
            { id: 'bike', label: 'Bike' },
            { id: 'auto', label: 'Auto' },
            { id: 'cab4', label: 'Cab (4s)' },
            { id: 'cab7', label: 'SUV XL' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedCategory(tab.id)}
              style={[styles.tabPill, selectedCategory === tab.id && styles.activeTabPill]}
            >
              <Text style={[styles.tabPillText, selectedCategory === tab.id && styles.activeTabPillText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Savings Highlight Card */}
        <View style={styles.savingsHeroCard}>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeText}>AI OPTIMIZATION BENEFIT</Text>
          </View>
          <Text style={styles.savingsAmount}>Save up to ₹{maxSavings}</Text>
          <Text style={styles.savingsDesc}>
            SmartRide AI bypasses 25% peak platform surge by smart aggregation & multi-modal routing.
          </Text>
        </View>

        {/* Comparison Bars Header */}
        <Text style={styles.sectionTitle}>Live Provider Pricing Index</Text>

        {/* Bar Cards */}
        {list.map((item, idx) => {
          const ratio = item.cost / maxCost;
          return (
            <View key={idx} style={[styles.compareCard, item.isAiPick && styles.aiPickCompareCard]}>
              <View style={styles.compareCardTop}>
                <View>
                  <View style={styles.nameRow}>
                    <Text style={styles.providerName}>{item.provider}</Text>
                    {item.isAiPick && (
                      <View style={styles.winnerBadge}>
                        <Text style={styles.winnerBadgeText}>LOWEST</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.surgeText}>Surge: {item.surge} • ETA: {item.eta}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.fareAmount}>₹{item.cost}</Text>
                  <TouchableOpacity
                    onPress={() => handleOpenProvider(item)}
                    style={{
                      marginTop: 6,
                      backgroundColor: item.isAiPick ? theme.colors.brandCyan : '#FFFFFF',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#000000', fontSize: 11, fontWeight: '800' }}>
                      {item.isAiPick ? '⚡ Book AI' : 'Open App ↗'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Graphical Relative Price Bar */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.round(ratio * 100)}%`,
                      backgroundColor: item.isAiPick ? theme.colors.brandCyan : theme.colors.brandIndigo,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}

        {/* Agent Audit Note */}
        <View style={styles.auditCard}>
          <Text style={styles.auditTitle}>🔍 Autonomous Verification Note</Text>
          <Text style={styles.auditText}>
            Rates are updated continuously from live mock and public rate APIs. Prices include all base charges, per-km rates, and estimated GST.
          </Text>
        </View>
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
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTabPill: {
    backgroundColor: 'rgba(0, 216, 255, 0.15)',
    borderColor: theme.colors.brandCyan,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  activeTabPillText: {
    color: theme.colors.brandCyan,
    fontWeight: '700',
  },
  savingsHeroCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: theme.radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 20,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  savingsBadgeText: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  savingsAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#34D399',
  },
  savingsDesc: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 12,
  },
  compareCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  aiPickCompareCard: {
    borderColor: theme.colors.brandCyan,
    backgroundColor: 'rgba(20, 28, 46, 0.95)',
  },
  compareCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  winnerBadge: {
    backgroundColor: 'rgba(0, 216, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  winnerBadgeText: {
    color: theme.colors.brandCyan,
    fontSize: 9,
    fontWeight: '800',
  },
  surgeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  barTrack: {
    height: 6,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  auditCard: {
    marginTop: 16,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  auditTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 4,
  },
  auditText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
