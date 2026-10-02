import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { theme } from '../../theme/theme';
import { Header } from '../../components/common/Header';

export const ParcelScreen = ({ navigation }) => {
  const [pickupAddr, setPickupAddr] = useState('Avadi Commercial Complex, Chennai');
  const [dropAddr, setDropAddr] = useState('Guindy Industrial Estate, Chennai');
  const [recipientPhone, setRecipientPhone] = useState('+91 91234 56789');
  const [weightTier, setWeightTier] = useState('medium');
  const [isFragile, setIsFragile] = useState(false);

  const calculateParcelCost = () => {
    let base = 60;
    if (weightTier === 'doc') base = 45;
    if (weightTier === 'heavy') base = 120;
    const distanceKm = 24.5;
    const distanceCost = Math.round(distanceKm * 4.8);
    const fragileFee = isFragile ? 20 : 0;
    return base + distanceCost + fragileFee;
  };

  const cost = calculateParcelCost();

  const handleBookCourier = () => {
    Alert.alert(
      'Confirm Express Courier',
      `Dispatch nearest 2-wheeler parcel courier for ₹${cost}?\n\nEstimated pickup in 8 minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch Now',
          onPress: () => {
            Alert.alert('Courier Dispatched! 📦', 'Driver assigned. Tracking link sent to recipient via SMS.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="SmartRide Express"
        subtitle="On-Demand City Parcel Delivery"
        showBack={Boolean(navigation?.canGoBack?.())}
        onBack={() => navigation?.goBack?.()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.bannerEmoji}>📦</Text>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Same-Day Doorstep Courier</Text>
            <Text style={styles.bannerSub}>Delivered within 60-90 minutes across Chennai</Text>
          </View>
        </View>

        {/* Pickup & Drop Details */}
        <View style={styles.formCard}>
          <Text style={styles.cardSectionTitle}>Delivery Route Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pickup Address</Text>
            <TextInput
              style={styles.textInput}
              value={pickupAddr}
              onChangeText={setPickupAddr}
              placeholder="Enter complete pickup address"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Drop Address</Text>
            <TextInput
              style={styles.textInput}
              value={dropAddr}
              onChangeText={setDropAddr}
              placeholder="Enter recipient address"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Mobile Number</Text>
            <TextInput
              style={styles.textInput}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              placeholder="+91..."
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Package Size Tier */}
        <View style={styles.formCard}>
          <Text style={styles.cardSectionTitle}>Package Type & Weight</Text>
          
          <View style={styles.tiersRow}>
            {[
              { id: 'doc', label: 'Documents', sub: '< 1 kg', icon: '📄' },
              { id: 'medium', label: 'Box / Items', sub: '1 - 5 kg', icon: '📦' },
              { id: 'heavy', label: 'Heavy Pack', sub: '5 - 15 kg', icon: '🛍️' },
            ].map((tier) => (
              <TouchableOpacity
                key={tier.id}
                onPress={() => setWeightTier(tier.id)}
                style={[styles.tierCard, weightTier === tier.id && styles.activeTierCard]}
              >
                <Text style={styles.tierIcon}>{tier.icon}</Text>
                <Text style={[styles.tierLabel, weightTier === tier.id && styles.activeTierLabel]}>
                  {tier.label}
                </Text>
                <Text style={styles.tierSub}>{tier.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fragile Toggle */}
          <View style={styles.fragileRow}>
            <View>
              <Text style={styles.fragileTitle}>Fragile Item Protection (+₹20)</Text>
              <Text style={styles.fragileDesc}>Extra padding & dedicated safe handling</Text>
            </View>
            <Switch
              value={isFragile}
              onValueChange={setIsFragile}
              trackColor={{ false: theme.colors.bgElevated, true: theme.colors.brandCyan }}
              thumbColor={isFragile ? theme.colors.textMain : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Total Cost & Book Button */}
        <View style={styles.checkoutCard}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Total Estimated Price:</Text>
            <Text style={styles.costValue}>₹{cost}</Text>
          </View>
          <Text style={styles.costSub}>Includes live GPS tracking, doorstep pickup & insurance</Text>

          <TouchableOpacity onPress={handleBookCourier} style={styles.dispatchBtn}>
            <Text style={styles.dispatchBtnText}>Dispatch Courier Now</Text>
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  heroBanner: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: theme.radii.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  bannerEmoji: {
    fontSize: 28,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  bannerSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  textInput: {
    height: 44,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    color: theme.colors.textMain,
    fontSize: 13,
  },
  tiersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tierCard: {
    flex: 1,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTierCard: {
    borderColor: theme.colors.brandCyan,
    backgroundColor: 'rgba(0, 216, 255, 0.12)',
  },
  tierIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  activeTierLabel: {
    color: theme.colors.brandCyan,
  },
  tierSub: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  fragileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  fragileTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  fragileDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  checkoutCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.brandCyan,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  costValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.brandCyan,
  },
  costSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  dispatchBtn: {
    backgroundColor: theme.colors.brandCyan,
    height: 48,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
});
