import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const RouteMap = ({ origin, destination, travelMode = 'DRIVING' }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [origin, destination, travelMode]);

  return (
    <View style={styles.container}>
      {/* Dark Map Canvas */}
      <View style={styles.mapCanvas}>
        {/* Animated Polyline representation */}
        <View style={styles.polyline} />
        <View style={styles.originMarker}>
          <View style={styles.markerInner} />
        </View>
        <View style={styles.destMarker}>
          <View style={styles.destInner} />
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#00D8FF" />
          <Text style={styles.loadingText}>Loading Route...</Text>
        </View>
      )}

      {/* Aesthetic Gradients */}
      <View style={styles.topVignette} />
      <View style={styles.bottomVignette} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#040608',
    overflow: 'hidden',
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#121822',
    position: 'relative',
    alignItems: 'center',
    justify: 'center',
  },
  polyline: {
    width: 200,
    height: 4,
    backgroundColor: '#00D8FF',
    transform: [{ rotate: '-25deg' }],
    borderRadius: 2,
    opacity: 0.8,
  },
  originMarker: {
    position: 'absolute',
    left: '25%',
    top: '55%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 216, 255, 0.2)',
    alignItems: 'center',
    justify: 'center',
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D8FF',
  },
  destMarker: {
    position: 'absolute',
    right: '25%',
    top: '35%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justify: 'center',
  },
  destInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 6, 8, 0.7)',
    alignItems: 'center',
    justify: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 10,
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(8, 12, 20, 0.7)',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(8, 12, 20, 0.9)',
  },
});

export default RouteMap;
