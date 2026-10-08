import { useState, useEffect } from 'react';
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
  Minimize2,
  ArrowLeft 
} from 'lucide-react-native';
import { Sun, Moon } from 'lucide-react';
import InteractiveMap from '../../components/ui/InteractiveMap';
import BottomNavigation from '../../components/layout/BottomNavigation';
import { useAuth } from '../../lib/AuthContext';
import { useGPSLocation } from '../../hooks/useLocation';
import { matches } from './commute/matches';

const themeVars = {
  light: {
    '--bg-base': '#F8FAFC',
    '--bg-surface': '#FFFFFF',
    '--bg-card': '#FFFFFF',
    '--bg-elevated': '#F1F5F9',
    '--brand-cyan': '#00B4D8',
    '--brand-cyan-rgb': '0, 180, 216',
    '--brand-indigo': '#4F46E5',
    '--brand-indigo-rgb': '79, 70, 229',
    '--brand-glow': 'rgba(79,70,229,0.2)',
    '--cyan-glow': 'rgba(0,180,216,0.15)',
    '--border-ui': 'rgba(0,0,0,0.08)',
    '--text-main': '#0F172A',
    '--text-muted': '#64748B',
    '--text-inverse': '#FFFFFF',
    '--shadow-main': '0 8px 32px rgba(0,0,0,0.08)',
    '--shadow-sm': '0 4px 12px rgba(0,0,0,0.06)',
    '--bg-glass': 'rgba(255, 255, 255, 0.90)',
    '--icon-invert': 'invert(0)'
  },
  'dark-ai': {
    '--bg-base': '#080C14',
    '--bg-surface': '#0F1623',
    '--bg-card': '#141C2E',
    '--bg-elevated': '#1A2340',
    '--brand-cyan': '#00D8FF',
    '--brand-cyan-rgb': '0, 216, 255',
    '--brand-indigo': '#6366F1',
    '--brand-indigo-rgb': '99, 102, 241',
    '--brand-glow': 'rgba(99,102,241,0.4)',
    '--cyan-glow': 'rgba(0,216,255,0.3)',
    '--border-ui': 'rgba(255,255,255,0.07)',
    '--text-main': '#F1F5F9',
    '--text-muted': '#9CA3AF',
    '--text-inverse': '#080C14',
    '--shadow-main': '0 8px 32px rgba(0,0,0,0.5)',
    '--shadow-sm': '0 4px 12px rgba(0,0,0,0.4)',
    '--bg-glass': 'rgba(15, 22, 35, 0.88)',
    '--icon-invert': 'invert(1)'
  }
};

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
  
  // Theme state: defaults to 'light' (bright UI/UX)
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('app-theme') || 'light');
  const isBright = currentTheme === 'light';

  useEffect(() => {
    const vars = themeVars[currentTheme] || themeVars['light'];
    if (vars) {
      Object.entries(vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
  }, [currentTheme]);

  const toggleTheme = () => {
    const next = isBright ? 'dark-ai' : 'light';
    setCurrentTheme(next);
    localStorage.setItem('app-theme', next);
    const vars = themeVars[next] || themeVars['light'];
    if (vars) {
      Object.entries(vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const currentCity = matches.find(m => location.address?.toLowerCase().includes(m.city.toLowerCase()))?.city || 'Chennai';
  const commuteMatch = matches.find(m => m.city.toLowerCase() === currentCity.toLowerCase());

  // Clean short address formatter for the header badge
  const formatShortAddress = (addr) => {
    if (!addr) return 'Current Area';
    const parts = addr.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return parts[0] || 'Current Area';
  };

  // Height of top transparent map area based on sheetMode
  const getMapSpacerHeight = () => {
    if (sheetMode === 'fullmap') return 580; // Immersive Google Maps view
    if (sheetMode === 'expanded') return 84;  // Sheet slides up right below top header
    return 310; // Standard peek: generous live map view with cruising cabs
  };

  return (
    <View style={[styles.container, isBright && styles.containerLight]}>
      {/* Background Interactive Live Wallpaper Google Map */}
      <View style={styles.mapLayer}>
        <InteractiveMap 
          center={location.coords} 
          userLocation={location.coords}
          showControls={false}
          theme={isBright ? 'light' : 'dark'}
          onSelectCab={(cab) => navigate('/user/ride-comparison', { state: { selectedProvider: cab.type } })}
        />
      </View>

      {/* Floating Glassmorphic Top Header */}
      <View style={[styles.topBar, isBright && styles.topBarLight]}>
        <Pressable 
          onPress={() => navigate('/user/welcome')} 
          style={[styles.backBtn, isBright && styles.backBtnLight]}
          accessibilityLabel="Back to Welcome"
        >
          <ArrowLeft size={16} color={isBright ? '#0284C7' : '#00D8FF'} />
        </Pressable>

        <View style={styles.greetingCol}>
          <View style={styles.greetingBadgeRow}>
            <View style={styles.pulseDot} />
            <Text style={[styles.greetingText, isBright && styles.greetingTextLight]}>{getGreeting()}</Text>
          </View>
          <Text numberOfLines={1} style={[styles.userNameText, isBright && styles.userNameTextLight]}>
            {(user?.name && user.name !== 'Google Rider' && user.name !== 'Google User') ? user.name : 'Bhumana Narasimha'}
          </Text>
        </View>
        
        {/* Compact Location Badge (Tap to pick area) */}
        <Pressable onPress={() => navigate('/user/map-picker')} style={[styles.locationBadge, isBright && styles.locationBadgeLight]}>
          <MapPin size={12} color={isBright ? '#0284C7' : '#00D8FF'} />
          <Text numberOfLines={1} style={[styles.locationAddressText, isBright && styles.locationAddressTextLight]}>{formatShortAddress(location.address)}</Text>
          <ChevronRight size={12} color={isBright ? '#64748B' : '#94A3B8'} />
        </Pressable>

        {/* Quick Bright / Dark Mode Switcher */}
        <Pressable 
          onPress={toggleTheme} 
          style={[styles.themeToggleBtn, isBright && styles.themeToggleBtnLight]}
          accessibilityLabel={isBright ? "Switch to Dark Mode" : "Switch to Bright Mode"}
          title={isBright ? "Active: Bright Mode (Tap for Dark Mode)" : "Active: Dark Mode (Tap for Bright Mode)"}
        >
          {isBright ? (
            <Sun size={15} color="#D97706" />
          ) : (
            <Moon size={15} color="#00D8FF" />
          )}
        </Pressable>
      </View>

      {/* Dynamic Map Viewport Spacer */}
      <View style={[styles.mapSpacer, { height: getMapSpacerHeight() }]}>
        {/* Floating Controls Dock on Map (Only rendered in peek & fullmap modes) */}
        {sheetMode !== 'expanded' && (
          <View style={styles.mapFloatingDock}>
            {/* Live Fleet Radar Pill on Bottom Left */}
            <View style={[styles.fleetStatusBadge, isBright && styles.fleetStatusBadgeLight]}>
              <Radio size={11} color={isBright ? '#0284C7' : '#00D8FF'} />
              <Text style={[styles.fleetStatusText, isBright && styles.fleetStatusTextLight]}>LIVE RADAR • 5 CABS</Text>
            </View>

            {/* Floating Map Action Buttons on Bottom Right */}
            <View style={styles.mapControlsCol}>
              {/* Recenter GPS Button */}
              <Pressable 
                onPress={() => location.refresh()} 
                style={[styles.mapFloatingBtn, isBright && styles.mapFloatingBtnLight]}
                accessibilityLabel="Recenter GPS"
                title="Recenter GPS"
              >
                <Navigation size={17} color={isBright ? '#0284C7' : '#00D8FF'} />
              </Pressable>

              {/* Toggle Full Live Wallpaper / Rides Sheet Button */}
              <Pressable 
                onPress={() => setSheetMode(prev => prev === 'fullmap' ? 'peek' : 'fullmap')} 
                style={[
                  styles.mapFloatingBtn, 
                  isBright && styles.mapFloatingBtnLight,
                  sheetMode === 'fullmap' && (isBright ? styles.mapFloatingBtnActiveLight : styles.mapFloatingBtnActive)
                ]}
                accessibilityLabel="Toggle Full Map"
                title={sheetMode === 'fullmap' ? "Exit Full Map" : "Full Map Wallpaper"}
              >
                {sheetMode === 'fullmap' ? (
                  <Minimize2 size={17} color={isBright ? '#0284C7' : '#00D8FF'} />
                ) : (
                  <Maximize2 size={17} color={isBright ? '#0284C7' : '#00D8FF'} />
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Main Bottom Content Sheet */}
      <View style={[
        styles.sheetContainer, 
        isBright && styles.sheetContainerLight,
        sheetMode === 'fullmap' && styles.sheetContainerMinimized
      ]}>
        {/* Interactive Handle / Drag Bar */}
        <Pressable 
          onPress={() => setSheetMode(prev => prev === 'expanded' ? 'peek' : (prev === 'fullmap' ? 'peek' : 'expanded'))} 
          style={styles.handleArea}
        >
          <View style={[styles.handleBar, isBright && styles.handleBarLight]} />
          <View style={styles.handleTextRow}>
            {sheetMode === 'expanded' ? (
              <>
                <ChevronDown size={13} color={isBright ? '#0284C7' : '#00D8FF'} />
                <Text style={[styles.handleHintText, isBright && styles.handleHintTextLight]}>Tap to show live map</Text>
              </>
            ) : sheetMode === 'fullmap' ? (
              <>
                <ChevronUp size={13} color={isBright ? '#0284C7' : '#00D8FF'} />
                <Text style={[styles.handleHintText, isBright && styles.handleHintTextLight]}>Tap to open ride options</Text>
              </>
            ) : (
              <>
                <ChevronUp size={13} color={isBright ? '#0284C7' : '#00D8FF'} />
                <Text style={[styles.handleHintText, isBright && styles.handleHintTextLight]}>Pull up for options • Live map active</Text>
              </>
            )}
          </View>
        </Pressable>

        {sheetMode === 'fullmap' ? (
          /* Minimized Quick Bar in Full Map mode */
          <Pressable onPress={() => setSheetMode('peek')} style={[styles.minimizedSearchBar, isBright && styles.minimizedSearchBarLight]}>
            <View style={[styles.searchIconBox, isBright && styles.searchIconBoxLight]}>
              <Search size={16} color={isBright ? '#0284C7' : '#00D8FF'} />
            </View>
            <Text style={[styles.minimizedSearchText, isBright && styles.minimizedSearchTextLight]}>Where do you want to go?</Text>
            <View style={[styles.minimizedBadge, isBright && styles.minimizedBadgeLight]}>
              <ChevronUp size={14} color={isBright ? '#0284C7' : '#00D8FF'} />
            </View>
          </Pressable>
        ) : (
          /* Full Sheet ScrollView in peek / expanded mode */
          <ScrollView contentContainerStyle={styles.scrollContent} style={{ flex: 1 }}>
            {/* Search Bar - Quick Ride Entry */}
            <Pressable onPress={() => navigate('/user/search')} style={[styles.searchBar, isBright && styles.searchBarLight]}>
              <View style={[styles.searchIconBox, isBright && styles.searchIconBoxLight]}>
                <Search size={16} color={isBright ? '#0284C7' : '#00D8FF'} />
              </View>
              <Text style={[styles.searchText, isBright && styles.searchTextLight]}>Where do you want to go?</Text>
              <View style={[styles.timeBadge, isBright && styles.timeBadgeLight]}>
                <Clock size={12} color={isBright ? '#64748B' : '#9CA3AF'} />
                <Text style={[styles.timeText, isBright && styles.timeTextLight]}>Now</Text>
              </View>
            </Pressable>

            {/* AI Recommendation Card */}
            <Pressable onPress={() => navigate('/user/ride-comparison')} style={[styles.aiCard, isBright && styles.aiCardLight]}>
              <View style={styles.aiHeader}>
                <View style={[styles.aiBadge, isBright && styles.aiBadgeLight]}>
                  <Text style={[styles.aiBadgeText, isBright && styles.aiBadgeTextLight]}>Ask Chubby AI</Text>
                </View>
                <View style={[styles.savingsTag, isBright && styles.savingsTagLight]}>
                  <Text style={styles.savingsText}>Save up to 42%</Text>
                </View>
              </View>

              <View style={styles.routeRow}>
                <View style={styles.routeDots}>
                  <View style={styles.cyanDot} />
                  <View style={[styles.line, isBright && styles.lineLight]} />
                  <View style={styles.indigoDot} />
                </View>

                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={[styles.routeLabel, isBright && styles.routeLabelLight]}>PICKUP</Text>
                    <Text numberOfLines={1} style={[styles.routeText, isBright && styles.routeTextLight]}>{location.address}</Text>
                  </View>

                  <View>
                    <Text style={[styles.routeLabel, isBright && styles.routeLabelLight]}>DESTINATION</Text>
                    <Text numberOfLines={1} style={[styles.routeText, isBright && styles.routeTextLight]}>
                      {currentCity.toLowerCase() === 'bangalore' ? 'Google BLR HQ' : 
                       currentCity.toLowerCase() === 'chennai' ? 'Marina Beach Office Hub' : 
                       'Central Business District'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.goBtn, isBright && styles.goBtnLight]}>
                  <ChevronRight size={20} color={isBright ? '#FFFFFF' : '#080C14'} strokeWidth={2.5} />
                </View>
              </View>
            </Pressable>

            {/* Quick Places Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
              {quickPlaces.map(p => (
                <Pressable 
                  key={p} 
                  onPress={() => navigate('/user/ride-comparison', { state: { dropoff: p.split(' ')[1] || p } })}
                  style={[styles.quickPill, isBright && styles.quickPillLight]}
                >
                  <Text style={[styles.quickPillText, isBright && styles.quickPillTextLight]}>{p}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Smart Commute Entry Point */}
            <Pressable 
              onPress={() => navigate(commuteMatch ? '/user/commute/results' : '/user/commute')}
              style={[styles.commuteCard, isBright && styles.commuteCardLight]}
            >
              <View style={[styles.commuteAvatar, isBright && styles.commuteAvatarLight]}>
                {commuteMatch ? (
                  <Image source={{ uri: commuteMatch.image }} style={styles.commuteImage} />
                ) : (
                  <Users size={22} color={isBright ? '#4F46E5' : '#00D8FF'} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.commuteTitle, isBright && styles.commuteTitleLight]}>
                  {commuteMatch ? `Ride with ${commuteMatch.name.split(' ')[0]}` : 'Smart Commute'}
                </Text>
                <Text style={[styles.commuteSubtitle, isBright && styles.commuteSubtitleLight]}>
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
                    <MapPin size={14} color={isBright ? '#0284C7' : '#00D8FF'} />
                    <Text style={[styles.nearbyTitle, isBright && styles.nearbyTitleLight]}>Nearby Famous Places</Text>
                  </View>
                  <Text style={[styles.nearbySubtitle, isBright && styles.nearbySubtitleLight]}>Places within 20 km · Tap to book</Text>
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
                    style={[styles.placeCard, isBright && styles.placeCardLight]}
                  >
                    <Image source={{ uri: place.image }} style={styles.placeImage} />
                    <View style={styles.placeBody}>
                      <Text style={[styles.placeName, isBright && styles.placeNameLight]}>{place.name}</Text>
                      <Text style={[styles.placeCategory, isBright && styles.placeCategoryLight]}>{place.emoji} {place.category}</Text>
                      <View style={styles.ratingRow}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={[styles.ratingText, isBright && styles.ratingTextLight]}>{place.rating} ({place.reviews})</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </View>

    <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
    position: 'relative',
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  topBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 14, 24, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.22)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 216, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    cursor: 'pointer',
  },
  greetingCol: {
    flex: 1,
    marginRight: 8,
  },
  greetingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  greetingText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: -0.2,
  },
  locationBadge: {
    backgroundColor: 'rgba(0, 216, 255, 0.08)',
    borderColor: 'rgba(0, 216, 255, 0.22)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: 130,
    cursor: 'pointer',
  },
  locationAddressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F1F5F9',
    flex: 1,
  },
  mapSpacer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    pointerEvents: 'box-none',
  },
  mapFloatingDock: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    pointerEvents: 'box-none',
  },
  fleetStatusBadge: {
    backgroundColor: 'rgba(9, 14, 24, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  fleetStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00D8FF',
    letterSpacing: 0.4,
  },
  mapControlsCol: {
    flexDirection: 'column',
    gap: 8,
  },
  mapFloatingBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(12, 18, 30, 0.92)',
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
    elevation: 5,
    cursor: 'pointer',
  },
  mapFloatingBtnActive: {
    backgroundColor: 'rgba(0, 216, 255, 0.25)',
    borderColor: '#00D8FF',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 26, 0.95)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.2)',
    overflow: 'hidden',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 15,
    zIndex: 15,
  },
  sheetContainerMinimized: {
    flex: 0,
    height: 72,
    minHeight: 72,
    maxHeight: 72,
  },
  handleArea: {
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  handleBar: {
    width: 38,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    marginBottom: 4,
  },
  handleTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  handleHintText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00D8FF',
    letterSpacing: 0.3,
  },
  minimizedSearchBar: {
    marginHorizontal: 14,
    marginTop: 4,
    backgroundColor: '#141C2E',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
  },
  minimizedSearchText: {
    fontSize: 13,
    color: '#F1F5F9',
    fontWeight: '600',
    flex: 1,
  },
  minimizedBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 216, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 90,
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
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#00D8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    shadowColor: '#00D8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBar: {
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 14,
    backgroundColor: '#141C2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
  },
  searchIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 216, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
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
    justifyContent: 'space-between',
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
  // --- Bright / Light Mode Theme Styles ---
  themeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 216, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    cursor: 'pointer',
  },
  themeToggleBtnLight: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  containerLight: {
    backgroundColor: '#F8FAFC',
  },
  topBarLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  backBtnLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  greetingTextLight: {
    color: '#64748B',
  },
  userNameTextLight: {
    color: '#0F172A',
  },
  locationBadgeLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  locationAddressTextLight: {
    color: '#0F172A',
  },
  fleetStatusBadgeLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(2, 132, 199, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
  },
  fleetStatusTextLight: {
    color: '#0284C7',
  },
  mapFloatingBtnLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  mapFloatingBtnActiveLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderColor: '#0284C7',
  },
  sheetContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
  },
  handleBarLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  handleHintTextLight: {
    color: '#0284C7',
  },
  minimizedSearchBarLight: {
    backgroundColor: '#F1F5F9',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  minimizedSearchTextLight: {
    color: '#0F172A',
  },
  minimizedBadgeLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  searchBarLight: {
    backgroundColor: '#F1F5F9',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  searchIconBoxLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  searchTextLight: {
    color: '#64748B',
  },
  timeBadgeLight: {
    backgroundColor: '#E2E8F0',
  },
  timeTextLight: {
    color: '#334155',
  },
  aiCardLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
    borderColor: 'rgba(2, 132, 199, 0.18)',
    shadowColor: 'rgba(2, 132, 199, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  aiBadgeLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  aiBadgeTextLight: {
    color: '#0284C7',
  },
  savingsTagLight: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  routeLabelLight: {
    color: '#64748B',
  },
  routeTextLight: {
    color: '#0F172A',
  },
  lineLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  goBtnLight: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
  },
  quickPillLight: {
    backgroundColor: '#F1F5F9',
    borderColor: 'rgba(0, 0, 0, 0.07)',
  },
  quickPillTextLight: {
    color: '#334155',
  },
  commuteCardLight: {
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
    borderColor: 'rgba(79, 70, 229, 0.15)',
  },
  commuteAvatarLight: {
    backgroundColor: '#EEF2FF',
  },
  commuteTitleLight: {
    color: '#0F172A',
  },
  commuteSubtitleLight: {
    color: '#64748B',
  },
  nearbyTitleLight: {
    color: '#0F172A',
  },
  nearbySubtitleLight: {
    color: '#64748B',
  },
  placeCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  placeNameLight: {
    color: '#0F172A',
  },
  placeCategoryLight: {
    color: '#0284C7',
  },
  ratingTextLight: {
    color: '#64748B',
  },
});

export default Home;
