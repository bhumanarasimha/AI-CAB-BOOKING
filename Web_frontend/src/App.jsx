import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MobileContainer from './components/layout/MobileContainer';

// Auth Pages
import Splash from './pages/auth/Splash';
import Onboarding from './pages/auth/Onboarding';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import TermsOfService from './pages/auth/TermsOfService';
import PrivacyPolicy from './pages/auth/PrivacyPolicy';

// User Flow Pages
import Home from './pages/user/Home';
import RideComparison from './pages/user/RideComparison';
import ExplainableAI from './pages/user/ExplainableAI';
import Profile from './pages/user/Profile';
import EmergencyContacts from './pages/user/EmergencyContacts';
import ThemeSettings from './pages/user/ThemeSettings';
import InviteFriend from './pages/user/InviteFriend';
import SafetyPrivacy from './pages/user/SafetyPrivacy';
import Parcel from './pages/user/Parcel';
import SavedPlaces from './pages/user/SavedPlaces';
import Activity from './pages/user/Activity';
import FamousPlaces from './pages/user/FamousPlaces';
import Search from './pages/user/Search';
import MapPicker from './pages/user/MapPicker';
import Settings from './pages/user/Settings';
import PerformanceTest from './pages/user/PerformanceTest';
import HelpCenter from './pages/user/HelpCenter';
import Reviews from './pages/user/Reviews';
import Welcome from './pages/user/Welcome';
import CommuteDashboard from './pages/user/commute/CommuteDashboard';
import CreateCommuteProfile from './pages/user/commute/CreateCommuteProfile';
import CommuteMatchResults from './pages/user/commute/CommuteMatchResults';
import CommuteCompatibility from './pages/user/commute/CommuteCompatibility';
import CommuteChat from './pages/user/commute/CommuteChat';
import CommuteSafety from './pages/user/commute/CommuteSafety';
import CommuteSavings from './pages/user/commute/CommuteSavings';
import { LanguageProvider } from './context/LanguageContext';
import { useAuth } from './lib/AuthContext';

// Theme Data for Loading
const themeVars = {
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
    '--icon-invert': 'invert(1)'
  },
  'midnight': {
    '--bg-base': '#000000',
    '--bg-surface': '#0A0A0A',
    '--bg-card': '#111111',
    '--bg-elevated': '#1A1A1A',
    '--brand-cyan': '#FFFFFF',
    '--brand-cyan-rgb': '255, 255, 255',
    '--brand-indigo': '#FFFFFF',
    '--brand-indigo-rgb': '255, 255, 255',
    '--brand-glow': 'rgba(255,255,255,0.2)',
    '--cyan-glow': 'rgba(255,255,255,0.2)',
    '--border-ui': 'rgba(255,255,255,0.1)',
    '--text-main': '#FFFFFF',
    '--text-muted': '#A3A3A3',
    '--text-inverse': '#000000',
    '--icon-invert': 'invert(1)'
  },
  'aurora': {
    '--bg-base': '#0D1B2A',
    '--bg-surface': '#132336',
    '--bg-card': '#1B2E46',
    '--bg-elevated': '#243B55',
    '--brand-cyan': '#00FFC8',
    '--brand-cyan-rgb': '0, 255, 200',
    '--brand-indigo': '#A855F7',
    '--brand-indigo-rgb': '168, 85, 247',
    '--brand-glow': 'rgba(168,85,247,0.4)',
    '--cyan-glow': 'rgba(0,255,200,0.3)',
    '--border-ui': 'rgba(0,255,200,0.1)',
    '--text-main': '#F1F5F9',
    '--text-muted': '#94A3B8',
    '--text-inverse': '#0D1B2A',
    '--icon-invert': 'invert(1)'
  },
  'ocean': {
    '--bg-base': '#0A1929',
    '--bg-surface': '#0F2133',
    '--bg-card': '#14293D',
    '--bg-elevated': '#1A334D',
    '--brand-cyan': '#38BDF8',
    '--brand-cyan-rgb': '56, 189, 248',
    '--brand-indigo': '#0EA5E9',
    '--brand-indigo-rgb': '14, 165, 233',
    '--brand-glow': 'rgba(14,165,233,0.4)',
    '--cyan-glow': 'rgba(56,189,248,0.3)',
    '--border-ui': 'rgba(56,189,248,0.1)',
    '--text-main': '#F1F5F9',
    '--text-muted': '#94A3B8',
    '--text-inverse': '#0A1929',
    '--icon-invert': 'invert(1)'
  },
  'sunset': {
    '--bg-base': '#1A0A0A',
    '--bg-surface': '#261212',
    '--bg-card': '#331A1A',
    '--bg-elevated': '#402222',
    '--brand-cyan': '#F97316',
    '--brand-cyan-rgb': '249, 115, 22',
    '--brand-indigo': '#EC4899',
    '--brand-indigo-rgb': '236, 72, 153',
    '--brand-glow': 'rgba(236,72,153,0.4)',
    '--cyan-glow': 'rgba(249,115,22,0.3)',
    '--border-ui': 'rgba(249,115,22,0.1)',
    '--text-main': '#F1F5F9',
    '--text-muted': '#A3A3A3',
    '--text-inverse': '#1A0A0A',
    '--icon-invert': 'invert(1)'
  },
  'light': {
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
    '--icon-invert': 'invert(0)'
  }
};

function App() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('app-theme') || 'dark-ai';
    const vars = themeVars[savedTheme];
    if (vars) {
      Object.entries(vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }

    // Load saved text size
    const savedSize = localStorage.getItem('app-text-size') || '2';
    document.body.style.fontSize = savedSize === '1' ? '14px' : savedSize === '3' ? '18px' : savedSize === '4' ? '20px' : '16px';
  }, []);

  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<MobileContainer />}>
          {/* Auth Flow */}
          <Route path="/" element={
            loading ? <Splash /> : (user ? <Navigate to="/user/welcome" replace /> : <Navigate to="/splash" replace />)
          } />
          <Route path="/splash" element={
            !loading && user ? <Navigate to="/user/welcome" replace /> : <Splash />
          } />
          <Route path="/onboarding" element={
            !loading && user ? <Navigate to="/user/welcome" replace /> : <Onboarding />
          } />
          <Route path="/login" element={
            !loading && user ? <Navigate to="/user/welcome" replace /> : <Login />
          } />
          <Route path="/signup" element={
            !loading && user ? <Navigate to="/user/welcome" replace /> : <SignUp />
          } />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* User App Flow */}
          <Route path="/user/welcome" element={<Welcome />} />
          <Route path="/user/home" element={<Home />} />
          <Route path="/user/search" element={<Search />} />
          <Route path="/user/map-picker" element={<MapPicker />} />
          <Route path="/user/ride-comparison" element={<RideComparison />} />
          <Route path="/user/ai-insights" element={<ExplainableAI />} />
          <Route path="/user/profile" element={<Profile />} />
          <Route path="/user/emergency" element={<EmergencyContacts />} />
          <Route path="/user/theme" element={<ThemeSettings />} />
          <Route path="/user/invite" element={<InviteFriend />} />
          <Route path="/user/safety" element={<SafetyPrivacy />} />
          <Route path="/user/parcel" element={<Parcel />} />
          <Route path="/user/saved-places" element={<SavedPlaces />} />
          <Route path="/user/famous-places" element={<FamousPlaces />} />
          <Route path="/user/settings" element={<Settings />} />
          <Route path="/user/performance" element={<PerformanceTest />} />
          <Route path="/user/help" element={<HelpCenter />} />
          <Route path="/user/reviews" element={<Reviews />} />
          
          <Route path="/user/rides" element={<CommuteDashboard />} />
          <Route path="/user/activity" element={<Activity />} />

          {/* Commute Flow */}
          <Route path="/user/commute" element={<CommuteDashboard />} />
          <Route path="/user/commute/create-profile" element={<CreateCommuteProfile />} />
          <Route path="/user/commute/results" element={<CommuteMatchResults />} />
          <Route path="/user/commute/compatibility" element={<CommuteCompatibility />} />
          <Route path="/user/commute/chat" element={<CommuteChat />} />
          <Route path="/user/commute/safety" element={<CommuteSafety />} />
          <Route path="/user/commute/savings" element={<CommuteSavings />} />

        </Route>
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
