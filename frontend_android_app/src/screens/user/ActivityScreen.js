import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';
import { Header } from '../../components/common/Header';

export const ActivityScreen = () => {
  const [activeTab, setActiveTab] = useState('rides');

  const pastRides = [
    {
      id: 'SR-9201',
      date: 'Today, 2:45 PM',
      from: 'Avadi Bus Stand',
      to: 'Marina Beach',
      provider: 'SmartRide AI (Cab+Metro)',
      cost: 431,
      status: 'Completed',
      saved: 245,
    },
    {
      id: 'SR-8842',
      date: 'Yesterday, 8:15 PM',
      from: 'T. Nagar Central',
      to: 'Chennai Airport Terminal 2',
      provider: 'Rapido Auto',
      cost: 310,
      status: 'Completed',
      saved: 120,
    },
    {
      id: 'SR-7619',
      date: '28 Aug, 9:30 AM',
      from: 'Porur Junction',
      to: 'Phoenix Marketcity',
      provider: 'Namma Yatri Auto',
      cost: 215,
      status: 'Completed',
      saved: 85,
    },
  ];

  const parcels = [
    {
      id: 'PCL-1044',
      date: 'Today, 11:20 AM',
      pickup: 'Avadi Electronics Market',
      drop: 'Adyar Residential Hub',
      weight: '1.5 kg',
      status: 'In Transit 🚚',
      cost: 165,
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Your Activity"
        subtitle="Rides & Delivery History"
      />

      <View style={styles.tabToggleRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('rides')}
          style={[styles.toggleBtn, activeTab === 'rides' && styles.activeToggleBtn]}
        >
          <Text style={[styles.toggleText, activeTab === 'rides' && styles.activeToggleText]}>
            Cab Rides ({pastRides.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('parcels')}
          style={[styles.toggleBtn, activeTab === 'parcels' && styles.activeToggleBtn]}
        >
          <Text style={[styles.toggleText, activeTab === 'parcels' && styles.activeToggleText]}>
            Parcels ({parcels.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'rides' ? (
          pastRides.map((ride) => (
            <View key={ride.id} style={styles.activityCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.rideId}>{ride.id}</Text>
                  <Text style={styles.rideDate}>{ride.date}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.costText}>₹{ride.cost}</Text>
                  <Text style={styles.statusBadgeText}>{ride.status}</Text>
                </View>
              </View>

              <View style={styles.routeBox}>
                <View style={styles.routeItem}>
                  <Text style={styles.pinIcon}>📍</Text>
                  <Text style={styles.routeText}>{ride.from}</Text>
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.pinIcon}>🏁</Text>
                  <Text style={styles.routeText}>{ride.to}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.providerTag}>{ride.provider}</Text>
                <Text style={styles.savedPill}>Saved ₹{ride.saved} vs Peak</Text>
              </View>
            </View>
          ))
        ) : (
          parcels.map((p) => (
            <View key={p.id} style={styles.activityCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.rideId}>{p.id}</Text>
                  <Text style={styles.rideDate}>{p.date}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.costText}>₹{p.cost}</Text>
                  <Text style={[styles.statusBadgeText, { color: theme.colors.warning }]}>{p.status}</Text>
                </View>
              </View>

              <View style={styles.routeBox}>
                <View style={styles.routeItem}>
                  <Text style={styles.pinIcon}>📦</Text>
                  <Text style={styles.routeText}>Pickup: {p.pickup}</Text>
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.pinIcon}>🏠</Text>
                  <Text style={styles.routeText}>Drop: {p.drop}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.providerTag}>Weight: {p.weight}</Text>
                <Text style={styles.savedPill}>Express Same-Day</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: theme.radii.full,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    alignItems: 'center',
  },
  activeToggleBtn: {
    backgroundColor: 'rgba(0, 216, 255, 0.15)',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  activeToggleText: {
    color: theme.colors.brandCyan,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  activityCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rideId: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  rideDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  costText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.success,
    marginTop: 2,
  },
  routeBox: {
    marginVertical: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinIcon: {
    fontSize: 12,
  },
  routeText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerTag: {
    fontSize: 12,
    color: theme.colors.brandCyan,
    fontWeight: '600',
  },
  savedPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
});
