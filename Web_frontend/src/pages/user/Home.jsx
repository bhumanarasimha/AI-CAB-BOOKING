import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { View, Text, Pressable, ScrollView, Image, StyleSheet } from 'react-native';
import { 
  Search, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Star, 
  Users, 
  Navigation, 
  Layers, 
  Radio, 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Minimize2 
} from 'lucide-react-native';
import InteractiveMap from '../../components/ui/InteractiveMap';
import BottomNavigation from '../../components/layout/BottomNavigation';
import { useAuth } from '../../lib/AuthContext';
import { useGPSLocation } from '../../hooks/useLocation';
import { matches } from './commute/matches';

const quickPlaces = ['🏠 Home', '💼 Work', '✈️ Airport', '☕ Cafe'];

const nearbyPlaces = [
  {
    name: 'Marina Beach',
    category: 'Beach · Landmark',
    specialty: "World's second longest urban beach, perfect for a breezy evening walk",
    distance: '2.5 km',
    rating: 4.6,
    reviews: '45.2k',
    eta: '8 min',
    emoji: '🏖️',
    accent: '#00D8FF',
    tag: 'Must Visit',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  },
  {
    name: 'Kapaleeshwarar Temple',
    category: 'Heritage · Spiritual',
    specialty: 'Iconic 7th-century Dravidian architecture with a stunning Gopuram',
    distance: '4.8 km',
    rating: 4.8,
    reviews: '12.4k',
    eta: '12 min',
    emoji: '🛕',
    accent: '#F59E0B',
    tag: 'Cultural',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80',
  },
  {
    name: 'Phoenix Marketcity',
    category: 'Shopping · Dining',
    specialty: "Chennai's premier luxury mall with international brands & IMAX",
    distance: '8.2 km',
    rating: 4.5,
    reviews: '28.1k',
    eta: '18 min',
    emoji: '🛍️',
    accent: '#6366F1',
    tag: 'Popular',
    image: 'https://images.unsplash.com/photo-1567449303078-57ad995bd17f?w=400&q=80',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useGPSLocation();
  const [sheetMode, setSheetMode] = useState('peek'); // 'peek' | 'expanded' | 'fullmap'

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const currentCity = matches.find(m => location.address?.toLowerCase().includes(m.city.toLowerCase()))?.city || 'Chennai';
  const commuteMatch = matches.find(m => m.city.toLowerCase() === currentCity.toLowerCase());

  // Height of top transparent map area based on sheetMode
  const getMapSpacerHeight = () => {
    if (sheetMode === 'fullmap') return 600; // Almost entire screen is live map
    if (sheetMode === 'expanded') return 110; // Sheet slides up
    return 300; // Standard peek: generous live map view with cruising cabs
  };

  return (
    <View style={styles.container}>
      {/* Background Interactive Live Wallpaper Google Map */}
      <View style={styles.mapLayer}>
        <InteractiveMap 
          center={location.coords} 
          userLocation={location.coords}
          onSelectCab={(cab) => navigate('/user/ride-comparison', { state: { selectedProvider: cab.type } })}
        />
      </View>

      {/* Floating Glassmorphic Top Header */}
      <View style={styles.topBar}>
        <View style={styles.greetingCol}>
          <View style={styles.greetingBadgeRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.greetingText}>{getGreeting()}</Text>
          </View>
          <Text numberOfLines={1} style={styles.userNameText}>{user?.name || user?.displayName || 'Bhumana Narasimha'}</Text>
        </View>
        
        {/* Location Badge (Tap to pick area) */}
        <Pressable onPress={() => navigate('/user/map-picker')} style={styles.locationBadge}>
          <View style={styles.locationIconBox}>
            <MapPin size={14} color="#00D8FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Current Area</Text>
            <Text numberOfLines={1} style={styles.locationAddress}>{location.address}</Text>
          </View>
          <ChevronRight size={14} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Live Fleet Radar Pill */}
      <View style={styles.fleetStatusBadge}>
        <Radio size={12} color="#00D8FF" />
        <Text style={styles.fleetStatusText}>LIVE RADAR • 5 CABS ACTIVE</Text>
      </View>

      {/* Floating Map Action Controls on right */}
      <View style={styles.mapControlsCol}>
        {/* Recenter GPS Button */}
        <Pressable 
          onPress={() => location.refresh()} 
          style={styles.mapFloatingBtn}
          accessibilityLabel="Recenter GPS"
        >
          <Navigation size={18} color="#00D8FF" />
        </Pressable>

        {/* Toggle Full Live Wallpaper / Rides Sheet Button */}
        <Pressable 
          onPress={() => setSheetMode(prev => prev === 'fullmap' ? 'peek' : 'fullmap')} 
          style={[styles.mapFloatingBtn, sheetMode === 'fullmap' && styles.mapFloatingBtnActive]}
          accessibilityLabel="Toggle Full Map"
        >
          {sheetMode === 'fullmap' ? (
            <Layers size={18} color="#00D8FF" />
          ) : (
            <Maximize2 size={18} color="#00D8FF" />
          )}
        </Pressable>
      </View>

      {/* Dynamic Map Viewport Spacer */}
      <View style={{ height: getMapSpacerHeight() }} />

      {/* Main Bottom Content Sheet */}
      <View style={[styles.sheetContainer, sheetMode === 'fullmap' && styles.sheetContainerMinimized]}>
        {/* Interactive Handle / Drag Bar */}
        <Pressable 
          onPress={() => setSheetMode(prev => prev === 'expanded' ? 'peek' : 'expanded')} 
          style={styles.handleArea}
        >
          <View style={styles.handleBar} />
          <View style={styles.handleTextRow}>
            {sheetMode === 'expanded' ? (
              <>
                <ChevronDown size={13} color="#00D8FF" />
                <Text style={styles.handleHintText}>Tap to show live map</Text>
              </>
            ) : sheetMode === 'fullmap' ? (
              <>
                <ChevronUp size={13} color="#00D8FF" />
                <Text style={styles.handleHintText}>Tap to open ride options</Text>
              </>
            ) : (
              <>
                <ChevronUp size={13} color="#00D8FF" />
                <Text style={styles.handleHintText}>Pull up for all rides • Live map active</Text>
              </>
            )}
          </View>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent} style={{ flex: 1 }}>
          {/* Search Bar - Quick Ride Entry */}
          <Pressable onPress={() => navigate('/user/search')} style={styles.searchBar}>
            <Search size={18} color="#00D8FF" />
            <Text style={styles.searchText}>Where do you want to go?</Text>
            <View style={styles.timeBadge}>
              <Clock size={12} color="#9CA3AF" />
              <Text style={styles.timeText}>Now</Text>
            </View>
          </Pressable>

          {/* AI Recommendation Card */}
          <Pressable onPress={() => navigate('/user/ride-comparison')} style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>Ask Chubby AI</Text>
              </View>
              <View style={styles.savingsTag}>
                <Text style={styles.savingsText}>Save up to 42%</Text>
              </View>
            </View>

            <View style={styles.routeRow}>
              <View style={styles.routeDots}>
                <View style={styles.cyanDot} />
                <View style={styles.line} />
                <View style={styles.indigoDot} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.routeLabel}>PICKUP</Text>
                  <Text numberOfLines={1} style={styles.routeText}>{location.address}</Text>
                </View>

                <View>
                  <Text style={styles.routeLabel}>DESTINATION</Text>
                  <Text numberOfLines={1} style={styles.routeText}>
                    {currentCity.toLowerCase() === 'bangalore' ? 'Google BLR HQ' : 
                     currentCity.toLowerCase() === 'chennai' ? 'Marina Beach Office Hub' : 
                     'Central Business District'}
                  </Text>
                </View>
              </View>

              <View style={styles.goBtn}>
                <ChevronRight size={18} color="#080C14" />
              </View>
            </View>
          </Pressable>

          {/* Quick Places Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
            {quickPlaces.map(p => (
              <Pressable 
                key={p} 
                onPress={() => navigate('/user/ride-comparison', { state: { dropoff: p.split(' ')[1] || p } })}
                style={styles.quickPill}
              >
                <Text style={styles.quickPillText}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Smart Commute Entry Point */}
          <Pressable 
            onPress={() => navigate(commuteMatch ? '/user/commute/results' : '/user/commute')}
            style={styles.commuteCard}
          >
            <View style={styles.commuteAvatar}>
              {commuteMatch ? (
                <Image source={{ uri: commuteMatch.image }} style={styles.commuteImage} />
              ) : (
                <Users size={22} color="#00D8FF" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.commuteTitle}>
                {commuteMatch ? `Ride with ${commuteMatch.name.split(' ')[0]}` : 'Smart Commute'}
              </Text>
              <Text style={styles.commuteSubtitle}>
                {commuteMatch ? `Headed to ${commuteMatch.company}` : 'Share rides with verified office colleagues'}
              </Text>
            </View>
            <View style={styles.commuteBtn}>
              <Text style={styles.commuteBtnText}>{commuteMatch ? 'Match Now' : 'Join'}</Text>
            </View>
          </Pressable>

          {/* Nearby Famous Places */}
          <View style={styles.nearbySection}>
            <View style={styles.nearbyHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="#00D8FF" />
                  <Text style={styles.nearbyTitle}>Nearby Famous Places</Text>
                </View>
                <Text style={styles.nearbySubtitle}>Places within 20 km · Tap to book</Text>
              </View>
              <Pressable onPress={() => navigate('/user/famous-places')} style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>See all</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.placesScroll}>
              {nearbyPlaces.map((place) => (
                <Pressable
                  key={place.name}
                  onPress={() => navigate('/user/ride-comparison', { state: { dropoff: place.name } })}
                  style={styles.placeCard}
                >
                  <Image source={{ uri: place.image }} style={styles.placeImage} />
                  <View style={styles.placeBody}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeCategory}>{place.emoji} {place.category}</Text>
                    <View style={styles.ratingRow}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.ratingText}>{place.rating} ({place.reviews})</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    zIndex: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 14, 24, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.22)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  greetingCol: {
    flex: 1,
    marginRight: 10,
  },
  greetingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  greetingText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: -0.3,
  },
  locationBadge: {
    backgroundColor: 'rgba(0, 216, 255, 0.08)',
    borderColor: 'rgba(0, 216, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 165,
  },
  locationIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 216, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00D8FF',
    textTransform: 'uppercase',
  },
  locationAddress: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  fleetStatusBadge: {
    position: 'absolute',
    top: 116,
    left: 20,
    zIndex: 20,
    backgroundColor: 'rgba(9, 14, 24, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  fleetStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00D8FF',
    letterSpacing: 0.5,
  },
  mapControlsCol: {
    position: 'absolute',
    top: 116,
    right: 20,
    zIndex: 20,
    flexDirection: 'column',
    gap: 10,
  },
  mapFloatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(12, 18, 30, 0.90)',
    borderColor: 'rgba(0, 216, 255, 0.25)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  mapFloatingBtnActive: {
    backgroundColor: 'rgba(0, 216, 255, 0.2)',
    borderColor: '#00D8FF',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: 'rgba(12, 18, 30, 0.92)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.2)',
    overflow: 'hidden',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 15,
  },
  sheetContainerMinimized: {
    maxHeight: 90,
  },
  handleArea: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  handleBar: {
    width: 42,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
  },
  handleTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  handleHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D8FF',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  commuteCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  commuteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#141C2E',
    alignItems: 'center',
    justify: 'center',
  },
  commuteImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  commuteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  commuteSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  commuteBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commuteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  aiCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(0, 216, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.15)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  aiHeader: {
    flexDirection: 'row',
    justify: 'space-between',
    marginBottom: 14,
  },
  aiBadge: {
    backgroundColor: 'rgba(0, 216, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00D8FF',
  },
  savingsTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDots: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cyanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D8FF',
  },
  line: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  indigoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  routeLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 1,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginTop: 2,
  },
  goBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#00D8FF',
    alignItems: 'center',
    justify: 'center',
  },
  searchBar: {
    marginHorizontal: 16,
    backgroundColor: '#141C2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchText: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  quickScroll: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  quickPill: {
    backgroundColor: '#141C2E',
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  quickPillText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  nearbySection: {
    marginTop: 8,
  },
  nearbyHeader: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nearbyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  nearbySubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  seeAllBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  placesScroll: {
    paddingHorizontal: 16,
  },
  placeCard: {
    width: 180,
    backgroundColor: '#141C2E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
    marginRight: 12,
  },
  placeImage: {
    width: '100%',
    height: 100,
  },
  placeBody: {
    padding: 12,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: 11,
    color: '#00D8FF',
    fontWeight: '600',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

export default Home;
