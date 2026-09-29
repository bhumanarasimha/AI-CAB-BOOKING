import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';
import { Header } from '../../components/common/Header';

export const ExplainableAIScreen = () => {
  const agents = [
    {
      name: 'FareAgent (Pricing Optimizer)',
      weight: '40%',
      score: 9.8,
      status: 'Active',
      color: theme.colors.brandCyan,
      summary: 'Audits base fares, per-km rates, and isolates hidden surge markups across all 5 provider networks.',
    },
    {
      name: 'StabilityAgent (Cancellation Shield)',
      weight: '25%',
      score: 9.4,
      status: 'Active',
      color: theme.colors.success,
      summary: 'Evaluates historical driver acceptance rates and predicts cancellation risk (<6% threshold).',
    },
    {
      name: 'HumanEffortAgent (Convenience Score)',
      weight: '20%',
      score: 8.9,
      status: 'Active',
      color: theme.colors.brandIndigo,
      summary: 'Balances walking distances to pickup points against total ride savings.',
    },
    {
      name: 'ContextAgent (Environmental Matrix)',
      weight: '15%',
      score: 9.2,
      status: 'Active',
      color: '#F59E0B',
      summary: 'Factors live weather, corridor road congestion, and train/metro schedules into ETA calculations.',
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Explainable AI"
        subtitle="EMMDE Multi-Agent Transparency"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Overall System Health */}
        <View style={styles.scoreHero}>
          <View style={styles.scoreCol}>
            <Text style={styles.scoreLabel}>SYSTEM CONFIDENCE</Text>
            <Text style={styles.scoreValue}>96.4%</Text>
            <Text style={styles.scoreSub}>Deterministic Multi-Agent Consensus</Text>
          </View>
          <View style={styles.badgeCol}>
            <View style={styles.livePill}>
              <View style={styles.greenDot} />
              <Text style={styles.liveText}>REALTIME</Text>
            </View>
          </View>
        </View>

        {/* Explainability Manifesto */}
        <View style={styles.manifestoCard}>
          <Text style={styles.manifestoTitle}>Why AI Explainability Matters</Text>
          <Text style={styles.manifestoText}>
            Unlike black-box surge algorithms that inflate prices during peak hours, SmartRide's Explainable AI gives you full visibility into why each ride option is ranked, exactly how the fare is computed, and where your money goes.
          </Text>
        </View>

        {/* Multi-Agent Breakdown */}
        <Text style={styles.sectionHeading}>Coordinated Autonomous Agents</Text>

        {agents.map((ag, idx) => (
          <View key={idx} style={styles.agentCard}>
            <View style={styles.agentTopRow}>
              <View style={styles.agentTitleRow}>
                <View style={[styles.agentDot, { backgroundColor: ag.color }]} />
                <Text style={styles.agentName}>{ag.name}</Text>
              </View>
              <View style={[styles.weightBadge, { borderColor: ag.color }]}>
                <Text style={[styles.weightText, { color: ag.color }]}>{ag.weight}</Text>
              </View>
            </View>

            <Text style={styles.agentSummary}>{ag.summary}</Text>

            <View style={styles.agentFooter}>
              <Text style={styles.efficiencyLabel}>Model Accuracy Score:</Text>
              <Text style={[styles.efficiencyScore, { color: ag.color }]}>{ag.score} / 10</Text>
            </View>
          </View>
        ))}
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
  scoreHero: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  scoreCol: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.brandCyan,
    letterSpacing: 0.6,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textMain,
    marginVertical: 2,
  },
  scoreSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  badgeCol: {
    alignItems: 'flex-end',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  liveText: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  manifestoCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: theme.radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 20,
  },
  manifestoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 4,
  },
  manifestoText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 12,
  },
  agentCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  agentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  agentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
    flex: 1,
  },
  weightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  weightText: {
    fontSize: 11,
    fontWeight: '800',
  },
  agentSummary: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginTop: 8,
  },
  agentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  efficiencyLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  efficiencyScore: {
    fontSize: 12,
    fontWeight: '700',
  },
});
