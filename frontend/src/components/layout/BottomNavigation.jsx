import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  {
    path: '/user/home',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--brand-cyan, #00D8FF)' : 'none'} stroke={active ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-muted, #9CA3AF)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9" fill={active ? 'var(--brand-cyan, #00D8FF)' : 'none'} stroke={active ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-muted, #9CA3AF)'}/>
      </svg>
    ),
  },
  {
    path: '/user/commute',
    label: 'Commute',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--brand-cyan, #00D8FF)' : 'none'} stroke={active ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-muted, #9CA3AF)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: '/user/parcel',
    label: 'Parcel',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-muted, #9CA3AF)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="17"/>
        <line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
      </svg>
    ),
  },
  {
    path: '/user/activity',
    label: 'Activity',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-muted, #9CA3AF)'} strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    path: '/user/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--brand-cyan, #00D8FF)' : 'var(--text-muted, #9CA3AF)'} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
];

const BottomNavigation = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {navItems.map(item => {
          const active = pathname.startsWith(item.path);
          return (
            <Pressable
              key={item.path}
              onPress={() => navigate(item.path)}
              style={[styles.item, active && styles.activeItem]}
            >
              {item.icon(active)}
              <Text style={[styles.label, active && styles.activeLabel]}>
                {item.label}
              </Text>
              {active && <View style={styles.indicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    width: '100%',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'var(--bg-surface, #0F1623)',
    borderTopColor: 'var(--border-ui, rgba(255, 255, 255, 0.12))',
    borderTopWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 0,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  activeItem: {
    backgroundColor: 'rgba(0, 216, 255, 0.08)',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: 'var(--text-muted, #9CA3AF)',
    marginTop: 4,
  },
  activeLabel: {
    color: 'var(--brand-cyan, #00D8FF)',
    fontWeight: '800',
  },
  indicator: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 3,
    borderRadius: 99,
    backgroundColor: 'var(--brand-cyan, #00D8FF)',
  },
});

export default BottomNavigation;
