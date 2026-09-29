import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const vehicles = [
  { id: 'bike', emoji: '🏍️', name: 'Bike', color: '#00D8FF' },
  { id: 'auto', emoji: '🛺', name: 'Auto', color: '#F59E0B' },
  { id: 'cab', emoji: '🚕', name: 'Cab', color: '#6366F1' },
];

const VehicleLoader = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % vehicles.length);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const current = vehicles[idx];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={[styles.glow, { backgroundColor: current.color }]} />
        <Text style={styles.emojiText}>{current.emoji}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.statusTitle}>AI-Powered {current.name} Search</Text>
        <ActivityIndicator size="small" color={current.color} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    width: 280,
    height: 140,
    backgroundColor: 'rgba(15, 22, 35, 0.6)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justify: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.1,
  },
  emojiText: {
    fontSize: 54,
  },
  textContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
  },
});

export default VehicleLoader;
