import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const NativeMapPlaceholder = ({ originName = 'Avadi, Chennai', destinationName = 'Marina Beach, Chennai', distanceKm = 34.0, etaMin = 48 }) => {
  return (
    <View style={styles.container}>
      {/* Background Grid Pattern Simulation */}
      <View style={styles.gridOverlay}>
        <View style={[styles.gridLineHorizontal, { top: '25%' }]} />
        <View style={[styles.gridLineHorizontal, { top: '50%' }]} />
        <View style={[styles.gridLineHorizontal, { top: '75%' }]} />
        <View style={[styles.gridLineVertical, { left: '30%' }]} />
        <View style={[styles.gridLineVertical, { left: '60%' }]} />
      </View>

      {/* Simulated Route Polyline */}
      <View style={styles.routeContainer}>
        <View style={styles.originMarker}>
          <View style={styles.markerInnerDotCyan} />
        </View>
        
        {/* Curved / diagonal road simulation */}
        <View style={styles.roadLine} />
        <View style={styles.roadLineSecondary} />
        
        {/* Moving Vehicle Dot */}
        <View style={styles.driverDot}>
          <Text style={styles.driverIcon}>🚖</Text>
        </View>

        <View style={styles.destMarker}>
          <View style={styles.markerInnerDotRed} />
        </View>
      </View>

      {/* Floating Info Pill */}
      <View style={styles.floatingPill}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE GPS</Text>
        </View>
        <Text style={styles.metricText}>
          {distanceKm} km • ~{etaMin} mins
        </Text>
      </View>

      {/* Bottom Route Summary Bar */}
      <View style={styles.routeSummaryCard}>
        <View style={styles.routeRow}>
          <Text style={styles.pinSymbolCyan}>📍</Text>
          <Text style={styles.routePointText} numberOfLines={1}>
            {originName}
          </Text>
        </View>
        <View style={styles.routeRowDivider} />
        <View style={styles.routeRow}>
          <Text style={styles.pinSymbolRed}>🏁</Text>
          <Text style={styles.routePointText} numberOfLines={1}>
            {destinationName}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 220,
    backgroundColor: '#070D18',
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: 10,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#38BDF8',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#38BDF8',
  },
  routeContainer: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
  },
  originMarker: {
    position: 'absolute',
    top: 30,
    left: 40,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 216, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.brandCyan,
  },
  markerInnerDotCyan: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.brandCyan,
  },
  roadLine: {
    position: 'absolute',
    top: 42,
    left: 55,
    width: 140,
    height: 4,
    backgroundColor: theme.colors.brandCyan,
    transform: [{ rotate: '28deg' }],
    borderRadius: 2,
    opacity: 0.8,
  },
  roadLineSecondary: {
    position: 'absolute',
    top: 95,
    left: 175,
    width: 90,
    height: 4,
    backgroundColor: theme.colors.brandCyan,
    transform: [{ rotate: '-18deg' }],
    borderRadius: 2,
    opacity: 0.8,
  },
  driverDot: {
    position: 'absolute',
    top: 60,
    left: 110,
    zIndex: 10,
  },
  driverIcon: {
    fontSize: 18,
  },
  destMarker: {
    position: 'absolute',
    top: 75,
    right: 50,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  markerInnerDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  floatingPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 22, 35, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.success,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  routeSummaryCard: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(20, 28, 46, 0.92)',
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeRowDivider: {
    height: 4,
    marginLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
    marginVertical: 2,
  },
  pinSymbolCyan: {
    fontSize: 12,
  },
  pinSymbolRed: {
    fontSize: 12,
  },
  routePointText: {
    fontSize: 11,
    color: theme.colors.textMain,
    fontWeight: '500',
    flex: 1,
  },
});
