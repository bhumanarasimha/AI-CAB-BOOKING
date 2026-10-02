import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../theme/theme';
import { Header } from '../../components/common/Header';
import { NativeMapPlaceholder } from '../../components/map/NativeMapPlaceholder';
import { CategorySelector } from '../../components/ride/CategorySelector';
import { RideCard } from '../../components/ride/RideCard';
import { ChubbyAIChatModal } from '../../components/ai/ChubbyAIChatModal';
import { UberProvider } from '../../services/providers/UberProvider';
import { OlaProvider } from '../../services/providers/OlaProvider';
import { RapidoProvider } from '../../services/providers/RapidoProvider';
import { NammaYatriProvider } from '../../services/providers/NammaYatriProvider';
import { SmartRideProvider } from '../../services/providers/SmartRideProvider';
import { calculateRouteDistanceKm } from '../../services/pricing/realtimeFareEngine';

export const HomeScreen = ({ navigation }) => {
  const [pickup, setPickup] = useState('Avadi Bus Stand, Chennai');
  const [destination, setDestination] = useState('Marina Beach, Chennai');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [allOptions, setAllOptions] = useState([]);
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const distanceKm = useMemo(() => {
    return calculateRouteDistanceKm(pickup, destination);
  }, [pickup, destination]);

  const loadLiveFares = async () => {
    setLoading(true);
    try {
      const origin = { lat: 13.114, lng: 80.097, text: pickup };
      const [uberRes, olaRes, rapidoRes, nammaRes, smartRes] = await Promise.all([
        UberProvider.fetchOptions({ origin, destination }),
        OlaProvider.fetchOptions({ origin, destination }),
        RapidoProvider.fetchOptions({ origin, destination }),
        NammaYatriProvider.fetchOptions({ origin, destination }),
        SmartRideProvider.fetchOptions({ origin, destination }),
      ]);

      const combined = [
        ...smartRes,
        ...uberRes,
        ...olaRes,
        ...rapidoRes,
        ...nammaRes,
      ];
      setAllOptions(combined);
      setLastRefreshed(new Date());
    } catch (e) {
      console.warn('Error fetching live options', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveFares();
  }, [pickup, destination]);

  // Filter options by selected category tab
  const filteredOptions = useMemo(() => {
    let list = allOptions;
    if (selectedCategory !== 'all') {
      list = allOptions.filter((opt) => opt.category === selectedCategory);
    }
    // Sort by cost ascending
    return [...list].sort((a, b) => a.cost - b.cost);
  }, [allOptions, selectedCategory]);

  const bestOption = filteredOptions[0];

  const handleBookRide = (option) => {
    Alert.alert(
      'Confirm Booking',
      `Book ${option.rawProvider} - ${option.type} for ${option.currency}${option.cost}?\n\nEstimated Arrival in ~${option.durationMin} mins.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Dispatch',
          onPress: () => {
            Alert.alert('Ride Confirmed! 🚖', `Your ${option.rawProvider} driver is on the way. Tracking details added to Activity.`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="SmartRide AI"
        subtitle="Multi-App Rate Engine"
        rightElement={
          <TouchableOpacity onPress={() => setIsAiModalVisible(true)} style={styles.headerAiPill}>
            <Text style={styles.headerAiPillText}>🤖 Ask AI</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Input Box */}
        <View style={styles.searchCard}>
          <View style={styles.inputRow}>
            <Text style={styles.inputPinCyan}>📍</Text>
            <View style={styles.inputCol}>
              <Text style={styles.inputMiniLabel}>PICKUP LOCATION</Text>
              <TextInput
                style={styles.locationInput}
                value={pickup}
                onChangeText={setPickup}
                placeholder="Current Location"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputDivider} />

          <View style={styles.inputRow}>
            <Text style={styles.inputPinRed}>🏁</Text>
            <View style={styles.inputCol}>
              <Text style={styles.inputMiniLabel}>DESTINATION</Text>
              <TextInput
                style={styles.locationInput}
                value={destination}
                onChangeText={setDestination}
                placeholder="Where to go?"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Quick Action Services */}
        <View style={styles.quickServicesGrid}>
          <TouchableOpacity
            style={[styles.quickServiceCard, selectedCategory === 'all' && styles.quickServiceCardActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={styles.quickServiceEmoji}>🚖</Text>
            <Text style={styles.quickServiceTitle}>All Rides</Text>
            <Text style={styles.quickServiceSub}>Cheapest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickServiceCard}
            onPress={() => navigation.navigate('Parcel')}
          >
            <Text style={styles.quickServiceEmoji}>📦</Text>
            <Text style={styles.quickServiceTitle}>Parcel</Text>
            <Text style={styles.quickServiceSub}>Express drop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickServiceCard}
            onPress={() => navigation.navigate('RideComparison')}
          >
            <Text style={styles.quickServiceEmoji}>📊</Text>
            <Text style={styles.quickServiceTitle}>Compare</Text>
            <Text style={styles.quickServiceSub}>5 apps live</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickServiceCard}
            onPress={() => setIsAiModalVisible(true)}
          >
            <Text style={styles.quickServiceEmoji}>🤖</Text>
            <Text style={styles.quickServiceTitle}>Chubby AI</Text>
            <Text style={styles.quickServiceSub}>Assist</Text>
          </TouchableOpacity>
        </View>

        {/* Live Route Map Simulation */}
        <View style={styles.mapSection}>
          <NativeMapPlaceholder
            originName={pickup}
            destinationName={destination}
            distanceKm={distanceKm}
            etaMin={Math.round((distanceKm / 35) * 60)}
          />
        </View>

        {/* Live Refresh Status Strip */}
        <View style={styles.statusStrip}>
          <View style={styles.statusLiveCol}>
            <View style={styles.pulsingGreenDot} />
            <Text style={styles.statusLiveText}>LIVE TELEMETRY STREAMING</Text>
          </View>
          <TouchableOpacity onPress={loadLiveFares} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>↻ Refresh Fares</Text>
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <CategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Ride Options Header */}
        <View style={styles.optionsHeaderRow}>
          <Text style={styles.optionsTitle}>
            Available Rides ({filteredOptions.length})
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('RideComparison')}>
            <Text style={styles.fullCompareLink}>Detailed Analysis →</Text>
          </TouchableOpacity>
        </View>

        {/* Ride Cards List */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.brandCyan} />
            <Text style={styles.loaderText}>Fetching live competitor API feeds...</Text>
          </View>
        ) : (
          filteredOptions.map((opt, index) => (
            <RideCard
              key={`${opt.rawProvider}-${opt.type}-${index}`}
              option={opt}
              isBestChoice={opt === bestOption}
              onBook={handleBookRide}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Chubby AI Button */}
      <TouchableOpacity
        style={styles.floatingAiBtn}
        onPress={() => setIsAiModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingAiIcon}>🤖</Text>
        <Text style={styles.floatingAiText}>Ask Chubby</Text>
      </TouchableOpacity>

      {/* Chubby AI Chat Modal */}
      <ChubbyAIChatModal
        visible={isAiModalVisible}
        onClose={() => setIsAiModalVisible(false)}
        routeContext={{ pickup, destination, distanceKm }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  headerAiPill: {
    backgroundColor: 'rgba(0, 216, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.brandCyan,
  },
  headerAiPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brandCyan,
  },
  searchCard: {
    backgroundColor: theme.colors.bgCard,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: theme.radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputPinCyan: {
    fontSize: 16,
  },
  inputPinRed: {
    fontSize: 16,
  },
  inputCol: {
    flex: 1,
  },
  inputMiniLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.brandCyan,
    letterSpacing: 0.5,
  },
  locationInput: {
    fontSize: 14,
    color: theme.colors.textMain,
    fontWeight: '600',
    paddingVertical: 4,
  },
  inputDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
    marginLeft: 28,
  },
  mapSection: {
    paddingHorizontal: 16,
  },
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 6,
  },
  statusLiveCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.success,
  },
  statusLiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.success,
    letterSpacing: 0.4,
  },
  refreshBtn: {
    paddingVertical: 2,
  },
  refreshBtnText: {
    fontSize: 12,
    color: theme.colors.brandCyan,
    fontWeight: '600',
  },
  optionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 10,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  fullCompareLink: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.brandCyan,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  floatingAiBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.brandCyan,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radii.full,
    gap: 8,
    shadowColor: theme.colors.brandCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingAiIcon: {
    fontSize: 18,
  },
  floatingAiText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textInverse,
  },
  quickServicesGrid: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  quickServiceCard: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickServiceCardActive: {
    borderColor: theme.colors.brandCyan,
    backgroundColor: 'rgba(0, 216, 255, 0.08)',
  },
  quickServiceEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  quickServiceTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  quickServiceSub: {
    fontSize: 9,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
});
