import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const RideCard = ({ option, onBook, isBestChoice = false }) => {
  if (!option) return null;

  const getProviderBadgeColor = (provider) => {
    switch (provider) {
      case 'SmartRide AI': return { bg: 'rgba(0, 216, 255, 0.15)', text: theme.colors.brandCyan, border: theme.colors.brandCyan };
      case 'Uber': return { bg: 'rgba(255, 255, 255, 0.12)', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.3)' };
      case 'Ola': return { bg: 'rgba(234, 179, 8, 0.15)', text: '#FACC15', border: 'rgba(234, 179, 8, 0.3)' };
      case 'Rapido': return { bg: 'rgba(249, 115, 22, 0.15)', text: '#FB923C', border: 'rgba(249, 115, 22, 0.3)' };
      case 'Namma Yatri': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' };
      default: return { bg: 'rgba(99, 102, 241, 0.15)', text: theme.colors.brandIndigo, border: theme.colors.brandIndigo };
    }
  };

  const badgeStyle = getProviderBadgeColor(option.rawProvider);

  return (
    <View style={[styles.card, isBestChoice && styles.bestChoiceCard]}>
      {isBestChoice && (
        <View style={styles.bestBanner}>
          <Text style={styles.bestBannerText}>✨ AI OPTIMAL PICK (BEST FARE & RELIABILITY)</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.providerRow}>
          <View style={[styles.providerBadge, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
            <Text style={[styles.providerBadgeText, { color: badgeStyle.text }]}>
              {option.rawProvider}
            </Text>
          </View>
          <Text style={styles.vehicleType}>{option.type}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{option.currency || '₹'}{option.cost}</Text>
          <Text style={styles.etaText}>~{option.durationMin} mins</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Pickup:</Text>
          <Text style={styles.metaValue}>{option.pickupMeters || 300}m away</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaLabel}>Reliability:</Text>
          <Text style={[styles.metaValue, { color: theme.colors.success }]}>
            {Math.round((option.historicalReliability || 0.95) * 100)}%
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onBook && onBook(option)}
          activeOpacity={0.8}
          style={[styles.bookBtn, isBestChoice && styles.bestChoiceBtn]}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bestChoiceCard: {
    borderColor: theme.colors.brandCyan,
    backgroundColor: 'rgba(20, 28, 46, 0.95)',
    shadowColor: theme.colors.brandCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  bestBanner: {
    backgroundColor: 'rgba(0, 216, 255, 0.2)',
    marginHorizontal: -14,
    marginTop: -14,
    marginBottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderTopLeftRadius: theme.radii.lg - 1,
    borderTopRightRadius: theme.radii.lg - 1,
  },
  bestBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.brandCyan,
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  providerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  providerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vehicleType: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  footerRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  metaDot: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginHorizontal: 2,
  },
  bookBtn: {
    backgroundColor: theme.colors.bgElevated,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bestChoiceBtn: {
    backgroundColor: theme.colors.brandCyan,
    borderColor: theme.colors.brandCyan,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
});
