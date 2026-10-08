import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const RouteMap = ({ origin, destination, travelMode = 'DRIVING' }) => {
  const [loading, setLoading] = useState(true);
  const isBright = typeof window !== 'undefined' && localStorage.getItem('app-theme') === 'light';

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [origin, destination, travelMode]);

  return (
    <View style={[styles.container, isBright && styles.containerLight]}>
      {/* Map Canvas */}
      <View style={[styles.mapCanvas, isBright && styles.mapCanvasLight]}>
        {/* Animated Polyline representation */}
        <View style={[styles.polyline, isBright && styles.polylineLight]} />
        <View style={[styles.originMarker, isBright && styles.originMarkerLight]}>
          <View style={[styles.markerInner, isBright && styles.markerInnerLight]} />
        </View>
        <View style={styles.destMarker}>
          <View style={styles.destInner} />
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={[styles.loadingOverlay, isBright && styles.loadingOverlayLight]}>
          <ActivityIndicator size="small" color={isBright ? "#0284C7" : "#00D8FF"} />
          <Text style={[styles.loadingText, isBright && styles.loadingTextLight]}>Loading Route...</Text>
        </View>
      )}

      {/* Aesthetic Gradients */}
      <View style={[styles.topVignette, isBright && styles.topVignetteLight]} />
      <View style={[styles.bottomVignette, isBright && styles.bottomVignetteLight]} />
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
    justifyContent: 'center',
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
    justifyContent: 'center',
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
    justifyContent: 'center',
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
    justifyContent: 'center',
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
  // --- Bright / Light Mode Theme Additions ---
  containerLight: {
    backgroundColor: '#F8FAFC',
  },
  mapCanvasLight: {
    backgroundColor: '#E2E8F0',
  },
  polylineLight: {
    backgroundColor: '#0284C7',
    opacity: 0.9,
  },
  originMarkerLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
  },
  markerInnerLight: {
    backgroundColor: '#0284C7',
  },
  loadingOverlayLight: {
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
  },
  loadingTextLight: {
    color: '#475569',
  },
  topVignetteLight: {
    backgroundColor: 'rgba(248, 250, 252, 0.65)',
  },
  bottomVignetteLight: {
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
  },
});

export default RouteMap;
