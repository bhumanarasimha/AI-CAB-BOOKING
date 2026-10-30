import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '../../lib/AuthContext';

const desktopNavSections = [
  { path: '/user/home', label: 'Rides & Fares', icon: '🚖' },
  { path: '/user/commute', label: 'Smart Commute', icon: '👥' },
  { path: '/user/parcel', label: 'Parcel Express', icon: '📦' },
  { path: '/user/activity', label: 'My Activity', icon: '📊' },
  { path: '/user/ai-insights', label: 'Explainable AI', icon: '🧠' },
  { path: '/user/saved-places', label: 'Saved Places', icon: '📍' },
  { path: '/user/famous-places', label: 'Famous Places', icon: '🏛️' },
  { path: '/user/emergency', label: 'Emergency & SOS', icon: '🆘' },
  { path: '/user/invite', label: 'Refer & Earn', icon: '🎁' },
  { path: '/user/reviews', label: 'Reviews', icon: '⭐' },
  { path: '/user/settings', label: 'Settings', icon: '⚙️' },
  { path: '/user/profile', label: 'Profile', icon: '👤' },
];

const MobileContainer = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [hideBottomNavFromChild, setHideBottomNavFromChild] = useState(false);

  useEffect(() => {
    // Reset child-requested hidden state on route change
    setHideBottomNavFromChild(false);
  }, [pathname]);

  // Detect Android Native App / WebView vs Desktop Web Browser
  const isNativeAndroid = typeof window !== 'undefined' && (
    Boolean(window.AndroidApp) ||
    window.navigator?.userAgent?.includes('Android') ||
    window.location?.hostname === 'appassets.androidplatform.net'
  );

  const [isDesktopScreen, setIsDesktopScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 768 && !isNativeAndroid : false
  );

  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlView = searchParams.get('view');
      if (urlView === 'mobile' || urlView === 'phone') return 'mobile';
      if (urlView === 'desktop' || urlView === 'web') return 'desktop';

      if (window.location.hash.includes('view=')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          const hashView = hashParams.get('view');
          if (hashView === 'mobile' || hashView === 'phone') return 'mobile';
          if (hashView === 'desktop' || hashView === 'web') return 'desktop';
        }
      }

      return localStorage.getItem('smartride_view_mode') || 'desktop';
    }
    return 'desktop';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkUrlView = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlView = searchParams.get('view');
      if (urlView === 'mobile' || urlView === 'phone') {
        setViewMode('mobile');
        return;
      }
      if (urlView === 'desktop' || urlView === 'web') {
        setViewMode('desktop');
        return;
      }
      if (window.location.hash.includes('view=')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          const hashView = hashParams.get('view');
          if (hashView === 'mobile' || hashView === 'phone') {
            setViewMode('mobile');
            return;
          }
          if (hashView === 'desktop' || hashView === 'web') {
            setViewMode('desktop');
            return;
          }
        }
      }
    };
    checkUrlView();
    window.addEventListener('popstate', checkUrlView);
    window.addEventListener('hashchange', checkUrlView);
    return () => {
      window.removeEventListener('popstate', checkUrlView);
      window.removeEventListener('hashchange', checkUrlView);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsDesktopScreen(window.innerWidth > 768 && !isNativeAndroid);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isNativeAndroid]);

  const toggleViewMode = (mode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartride_view_mode', mode);
    }
  };

  const isDesktopLayout = isDesktopScreen && viewMode === 'desktop';

  // Show Bottom Navigation on mobile device layouts only; on desktop, the top navigation bar is used
  const isUserRoute = pathname.startsWith('/user/');
  const hideBottomNavRoutes = ['/user/welcome'];
  const showBottomNav = isUserRoute && !hideBottomNavRoutes.includes(pathname) && !hideBottomNavFromChild && !isDesktopLayout;

  return (
    <div className={`mobile-outer-wrapper no-scrollbar ${isDesktopLayout ? 'desktop-mode' : ''}`}>
      {/* Desktop View Switcher Header (Visible on Desktop screens only, hidden on Android) */}
      {isDesktopScreen && (
        <aside className="desktop-view-switcher" aria-label="Device View Switcher">
          <div className="view-switcher-pill">
            <span className="view-switcher-label">View:</span>
            <button
              onClick={() => toggleViewMode('desktop')}
              className={`switcher-btn ${isDesktopLayout ? 'active' : ''}`}
              title="Full Desktop Web View"
            >
              <Monitor size={14} style={{ marginRight: 6 }} />
              Desktop View
            </button>
            <button
              onClick={() => toggleViewMode('mobile')}
              className={`switcher-btn ${!isDesktopLayout ? 'active' : ''}`}
              title="Mobile Device Preview"
            >
              <Smartphone size={14} style={{ marginRight: 6 }} />
              Phone View
            </button>
          </div>
        </aside>
      )}

      <div className={`mobile-phone-frame no-scrollbar ${isDesktopLayout ? 'desktop-frame' : ''}`}>
        {/* Desktop Web Application Top Header & Navigation Bar */}
        {isDesktopLayout && (
          <header className="desktop-top-header" role="banner">
            <div className="desktop-header-row">
              <div className="desktop-brand" onClick={() => navigate('/user/home')} role="button" tabIndex={0}>
                <span style={{ fontSize: '24px' }}>⚡</span>
                <div>
                  <div className="desktop-brand-title">SmartRide<span style={{ color: 'var(--brand-cyan, #00D8FF)' }}>AI</span></div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Multi-Provider Mobility & Carpooling Hub</div>
                </div>
                <span className="desktop-brand-badge">Desktop Web</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', padding: '5px 12px', borderRadius: '14px', border: '1px solid var(--border-ui)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800, fontSize: '13px' }}>
                    {(user?.name ? user.name.charAt(0).toUpperCase() : 'R')}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {user?.name || 'Verified Rider'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '6px 14px', borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Desktop Navigation Links to All Sections */}
            <nav className="desktop-nav-scroller no-scrollbar" role="navigation" aria-label="Desktop Web Sections">
              {desktopNavSections.map((item) => {
                const isActive = pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`desktop-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </header>
        )}

        <div className="mobile-content-area no-scrollbar">
          <Outlet context={{ setHideBottomNav: setHideBottomNavFromChild }} />
        </div>
        {showBottomNav && (
          <div className={`bottom-nav-wrapper ${isDesktopLayout ? 'desktop-bottom-nav' : ''}`}>
            <BottomNavigation />
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileContainer;
