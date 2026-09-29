import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const InteractiveMap = ({ center, userLocation, onLocationChange }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Map Surface */}
      <View style={styles.mapCanvas}>
        <View style={styles.gridLineHorizontal} />
        <View style={styles.gridLineVertical} />

        {/* User Location Dot */}
        <View style={styles.userDotPulse}>
          <View style={styles.userDot} />
        </View>

        {/* Selection Center Pin */}
        {!!onLocationChange && (
          <View style={styles.centerPinContainer}>
            <View style={styles.pinHead} />
            <View style={styles.pinNeedle} />
          </View>
        )}
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#00D8FF" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F1623',
    position: 'relative',
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#121822',
    alignItems: 'center',
    justify: 'center',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  userDotPulse: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 216, 255, 0.2)',
    alignItems: 'center',
    justify: 'center',
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D8FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  centerPinContainer: {
    position: 'absolute',
    alignItems: 'center',
    justify: 'center',
  },
  pinHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00D8FF',
    borderWidth: 3,
    borderColor: '#080C14',
  },
  pinNeedle: {
    width: 2,
    height: 12,
    backgroundColor: '#00D8FF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F1623',
    alignItems: 'center',
    justify: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 8,
  },
});

export default InteractiveMap;
