import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  Navigation, 
  Loader2, 
  Train, 
  Bike, 
  Car, 
  RefreshCw, 
  Brain, 
  ArrowDown, 
  ArrowUp,
  Clock,
  TrendingDown,
  Layers,
  CheckCircle2,
  Bell,
  Edit3,
  MapPin,
  Search,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Target,
  Footprints,
  CloudRain
} from 'lucide-react';
import RouteMap from '../../components/ui/RouteMap';
import VehicleLoader from '../../components/ui/VehicleLoader';
import { useAuth } from '../../lib/AuthContext';
import AIChatBot from '../../components/ui/AIChatBot';
import { useRideRefreshEngine } from '../../services/refresh/useRideRefreshEngine';
import { 
  resolveRouteDistanceKm, 
  generateMultimodalRoutes, 
  predictFuturePrices,
  computeCrossAppPriceComparison 
} from '../../services/ai/SmartMobilityAIEngine';
import {
  loadSniperForRoute,
  saveSniperForRoute,
  removeSniperForRoute,
  evaluateSniperAgainstQuotes,
  playSniperAlertSound,
  fireSniperNotification,
  requestSniperNotificationPermission,
  syncSniperToBackend,
} from '../../services/ai/PriceSniperEngine';
import {
  VOICE_LANGUAGES,
  WEATHER_SIM_MODES,
  generateSurgeEscapeSpots,
  fetchLiveWeather,
  buildWeatherComfortAdvisory,
  parseVoiceCommand,
  buildVoiceResponseMessage,
  speakChubbyText,
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
} from '../../services/ai/ChubbyNextGenEngine';
import { runRealTimeAIAnalysis, buildProjectFutureForecast } from '../../services/ai/RealTimeAIEngine';

const createRideRequest = (_userId, _rideData) => Promise.resolve('ride_' + Date.now());

const POPULAR_ROUTES = [
  { label: 'KG Apts ➔ Marina Beach', pickup: 'KG Apartments, Poonamallee', dropoff: 'Marina Beach' },
  { label: 'Koramangala ➔ Whitefield', pickup: 'Koramangala Sony World', dropoff: 'Whitefield Kadugodi' },
  { label: 'Central ➔ Airport', pickup: 'Chennai Central Station', dropoff: 'Chennai Airport' },
  { label: 'Bandra ➔ Andheri', pickup: 'Bandra Linking Road', dropoff: 'Andheri Metro Station' },
  { label: 'Connaught Place ➔ Cyber City', pickup: 'Connaught Place, Delhi', dropoff: 'DLF Cyber City, Gurgaon' },
  { label: 'Hitec City ➔ Secunderabad', pickup: 'HITEC City Cyber Towers', dropoff: 'Secunderabad Junction' }
];

const CATEGORIES = [
  { id: 'all', label: 'All Rides', emoji: '⚡' },
  { id: 'bike', label: 'Bike', emoji: '🏍️' },
  { id: 'auto', label: 'Auto', emoji: '🛺' },
  { id: 'cab4', label: 'Cab (4-Seater)', emoji: '🚗' },
  { id: 'cab7', label: 'SUV (7-Seater)', emoji: '🚐' },
];

const PREFERENCE_FILTERS = [
  { id: 'balanced', label: 'AI Best Overall', emoji: '✨' },
  { id: 'cheapest', label: 'Cheapest', emoji: '💰' },
  { id: 'fastest', label: 'Fastest', emoji: '⚡' },
  { id: 'reliable', label: 'Most Reliable', emoji: '🛡️' },
];

const RideComparison = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentLocation } = useAuth();

  const [showChubbyAIModal, setShowChubbyAIModal] = useState(Boolean(location.state?.openFuturePrice));
  const [chubbyAITab, setChubbyAITab] = useState(location.state?.openFuturePrice ? 'future' : 'multimodal'); // 'multimodal' | 'future' | 'escape' | 'voice' | 'weather' | 'sniper'
  const [activeCategory, setActiveCategory] = useState('cab4');
  const [userPreferences, setUserPreferences] = useState('balanced');
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [notifiedPriceDrop, setNotifiedPriceDrop] = useState(false);
  const [selectedForecastIdx, setSelectedForecastIdx] = useState(1);
  const [customForecastTime, setCustomForecastTime] = useState('');

  // Dynamic Route States
  const savedPickup = typeof localStorage !== 'undefined' ? localStorage.getItem('smartride_user_pickup') : null;
  const savedDropoff = typeof localStorage !== 'undefined' ? localStorage.getItem('smartride_user_dropoff') : null;
  const [pickup, setPickup] = useState(location.state?.pickup || currentLocation?.address || savedPickup || 'KG Apartments');
  const [destination, setDestination] = useState(location.state?.dropoff || savedDropoff || 'Marina Beach');
  const [showRouteEditor, setShowRouteEditor] = useState(false);
  const [inputPickup, setInputPickup] = useState(pickup);
  const [inputDest, setInputDest] = useState(destination);

  useEffect(() => {
    if (location.state?.pickup) {
      setPickup(location.state.pickup);
      setInputPickup(location.state.pickup);
    }
    if (location.state?.dropoff) {
      setDestination(location.state.dropoff);
      setInputDest(location.state.dropoff);
    }
  }, [location.state]);

  const handleApplyRoute = (newPickup, newDest) => {
    const p = (newPickup || '').trim() || 'KG Apartments';
    const d = (newDest || '').trim() || 'Marina Beach';
    setPickup(p);
    setDestination(d);
    setInputPickup(p);
    setInputDest(d);
    setShowRouteEditor(false);
  };

  // ── REAL-TIME MULTI-API + ML AI ORCHESTRATOR (OSRM + Open-Meteo + OSM Photon + ML Surge) ──
  const [rtAnalysis, setRtAnalysis] = useState(null);
  const [rtLoading, setRtLoading] = useState(false);

  const triggerRealTimeAnalysis = async (p = pickup, d = destination) => {
    setRtLoading(true);
    try {
      const result = await runRealTimeAIAnalysis(p, d, currentLocation?.coords || null);
      setRtAnalysis(result);
      if (result?.weather?.isRealTime) {
        setLiveWeather(result.weather);
      }
    } catch (err) {
      console.warn('Real-Time AI Analysis fallback:', err);
    } finally {
      setRtLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setRtLoading(true);
    runRealTimeAIAnalysis(pickup, destination, currentLocation?.coords || null)
      .then((res) => {
        if (!active) return;
        setRtAnalysis(res);
        if (res?.weather?.isRealTime) {
          setLiveWeather(res.weather);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setRtLoading(false);
      });
    return () => { active = false; };
  }, [pickup, destination, currentLocation?.coords?.lat, currentLocation?.coords?.lng]);

  // Live Distance & Duration (prefers live OSRM street network, falls back to local resolver)
  const distanceKm = useMemo(() => {
    return rtAnalysis?.routeInfo?.distanceKm || resolveRouteDistanceKm(pickup, destination);
  }, [rtAnalysis, pickup, destination]);

  const liveDrivingMins = useMemo(() => {
    return rtAnalysis?.routeInfo?.liveDurationMins || Math.round(distanceKm * 1.5 + 8);
  }, [rtAnalysis, distanceKm]);

  // Real-Time Multimodal routes (prefers live OSM discovered Bus Stops & Metro Stations)
  const multimodalData = useMemo(() => {
    if (rtAnalysis?.multimodalData?.routes?.length > 0) {
      return rtAnalysis.multimodalData;
    }
    return generateMultimodalRoutes(pickup, destination, distanceKm);
  }, [rtAnalysis, pickup, destination, distanceKm]);

  const [selectedMultimodalId, setSelectedMultimodalId] = useState('rt_multimodal_1');
  const activeMultimodalRoute = useMemo(() => {
    return multimodalData.routes.find(r => r.id === selectedMultimodalId) || multimodalData.routes[0];
  }, [multimodalData, selectedMultimodalId]);

  // Real-Time Refresh & Multi-Agent EMMDE Engine Hook
  const {
    rankedOptions,
    topPick,
    decisionExplanation,
    isLoading,
    isRefreshing,
    secondsAgo,
    manualRefresh,
  } = useRideRefreshEngine({
    origin: currentLocation?.coords || pickup,
    destination,
    activeCategory,
    userPreferences,
    refreshIntervalMs: 10000,
  });

  // ── NEXT-LEVEL CHUBBY AI STATE ────────────────────────────────────────────
  // 1. Walk-2-Mins Surge Escape state
  const [appliedEscapeSpot, setAppliedEscapeSpot] = useState(null);

  // 2. Live Weather & Comfort state
  const [liveWeather, setLiveWeather] = useState(null);
  const [weatherSimMode, setWeatherSimMode] = useState('live');

  useEffect(() => {
    let active = true;
    const lat = currentLocation?.coords?.lat || 13.0827;
    const lng = currentLocation?.coords?.lng || 80.2707;
    fetchLiveWeather(lat, lng).then((w) => {
      if (active) setLiveWeather(w);
    });
    return () => { active = false; };
  }, [currentLocation?.coords?.lat, currentLocation?.coords?.lng]);

  const weatherAdvisory = useMemo(() => {
    return buildWeatherComfortAdvisory(liveWeather, weatherSimMode);
  }, [liveWeather, weatherSimMode]);

  // 3. Voice-First Multilingual Chubby AI state
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceInputDraft, setVoiceInputDraft] = useState('');
  const [voiceReply, setVoiceReply] = useState('');
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognizerRef = useRef(null);

  // 4. Target Price Sniper state
  const [activeSniper, setActiveSniper] = useState(() => loadSniperForRoute(pickup, destination));
  const [sniperInputPrice, setSniperInputPrice] = useState('');
  const [sniperProvider, setSniperProvider] = useState('all');
  const [sniperHitBanner, setSniperHitBanner] = useState(null);
  const lastSniperAlertIdRef = useRef(null);

  // Sync persisted sniper whenever route changes
  useEffect(() => {
    const saved = loadSniperForRoute(pickup, destination);
    setActiveSniper(saved);
    if (saved) {
      setSniperInputPrice(String(saved.targetPrice));
      setSniperProvider(saved.provider || 'all');
    } else {
      setSniperInputPrice('');
    }
    setSniperHitBanner(null);
    lastSniperAlertIdRef.current = null;
    setAppliedEscapeSpot(null);
  }, [pickup, destination]);

  // Real-Time Future Price & Surge Predictor (prefers live ML Surge Decay Curve)
  const futurePricing = useMemo(() => {
    if (rtAnalysis?.futurePricing?.timeline?.length > 0) {
      return rtAnalysis.futurePricing;
    }
    const currentCabFare = rankedOptions?.find(o => o.category === 'cab4')?.fare 
      || multimodalData.directCabComparison?.bestDirectCab 
      || 699;
    return predictFuturePrices(currentCabFare, distanceKm);
  }, [rtAnalysis, rankedOptions, multimodalData, distanceKm]);

  // Dynamic sorting + Live OSRM/ML Fare Calibration + Weather Comfort + Surge Escape discount
  const displayOptions = useMemo(() => {
    if (!rankedOptions || rankedOptions.length === 0) return [];
    const adjustments = weatherAdvisory?.categoryAdjustments || {};
    const liveFares = rtAnalysis?.providerFares || null;
    const liveMult = rtAnalysis?.mlSurge?.multiplier || 1.0;

    const list = rankedOptions.map((opt) => {
      const cat = opt.category || 'cab4';
      const weatherDelta = adjustments[cat] || 0;

      // Calibrate base fare from live OSRM road distance + live ML surge multiplier
      let calibratedFare = opt.fare;
      if (liveFares && cat === 'cab4') {
        const pk = (opt.providerKey || opt.provider || '').toLowerCase();
        if (opt.isSmart || pk.includes('smart')) calibratedFare = liveFares.smartride;
        else if (pk.includes('namma')) calibratedFare = liveFares.nammayatri;
        else if (pk.includes('uber')) calibratedFare = liveFares.uber;
        else if (pk.includes('ola')) calibratedFare = liveFares.ola;
        else if (pk.includes('rapido')) calibratedFare = liveFares.rapidoCab;
      } else if (rtAnalysis?.routeInfo?.isRealTime) {
        const catScale = cat === 'bike' ? 0.36 : cat === 'auto' ? 0.62 : cat === 'cab7' ? 1.38 : 1.0;
        const baseCab = liveFares?.uber || opt.fare;
        calibratedFare = Math.max(30, Math.round(baseCab * catScale * (opt.isSmart ? 0.85 : 1.0)));
      }

      const escapedFare = appliedEscapeSpot
        ? Math.max(35, Math.round(calibratedFare * (1 - appliedEscapeSpot.dropPct)))
        : calibratedFare;

      const weatherTag =
        weatherAdvisory.severity === 'rain' && (cat === 'cab4' || cat === 'cab7')
          ? '🌧️ Rain-Safe'
          : weatherAdvisory.severity === 'rain' && cat === 'bike'
            ? '⚠️ Wet Road'
            : weatherAdvisory.severity === 'heat' && (cat === 'cab4' || cat === 'cab7')
              ? '❄️ Heat-Safe AC'
              : weatherAdvisory.severity === 'night' && (cat === 'cab4' || cat === 'cab7')
                ? '🛡️ Night-Safe'
                : null;
      return {
        ...opt,
        originalFareBeforeEscape: calibratedFare,
        fare: escapedFare,
        eta: rtAnalysis?.routeInfo?.isRealTime ? Math.max(2, Math.min(18, Math.round((opt.eta || 5) * Math.min(1.3, liveMult)))) : opt.eta,
        overallScore: (opt.overallScore || 70) + weatherDelta * 0.4,
        weatherTag,
      };
    });

    switch (userPreferences) {
      case 'cheapest':
        return list.sort((a, b) => a.fare - b.fare);
      case 'fastest':
        return list.sort((a, b) => a.eta - b.eta);
      case 'reliable':
        return list.sort((a, b) => b.stabilityScore - a.stabilityScore);
      case 'balanced':
      default:
        return list.sort((a, b) => b.overallScore - a.overallScore);
    }
  }, [rankedOptions, userPreferences, weatherAdvisory, appliedEscapeSpot, rtAnalysis]);

  // Project-Synchronized Future Price Prediction (anchored to exact live displayOptions & activeCategory)
  const projectForecast = useMemo(() => {
    let customDate = null;
    if (customForecastTime && /^\d{2}:\d{2}$/.test(customForecastTime)) {
      const [hh, mm] = customForecastTime.split(':').map(Number);
      const d = new Date();
      d.setHours(hh, mm, 0, 0);
      if (d.getTime() < Date.now() - 60000) d.setDate(d.getDate() + 1);
      customDate = d;
    }
    return buildProjectFutureForecast({
      quotes: displayOptions,
      category: activeCategory === 'all' ? 'cab4' : activeCategory,
      rtAnalysis,
      customDate,
    });
  }, [displayOptions, activeCategory, rtAnalysis, customForecastTime]);

  // Surge Escape Advisor spots computed from live unescaped fare
  const surgeEscapeData = useMemo(() => {
    const baseLiveFare = rankedOptions?.[0]?.fare || multimodalData.directCabComparison?.bestDirectCab || 350;
    return generateSurgeEscapeSpots(pickup, baseLiveFare, distanceKm);
  }, [pickup, rankedOptions, multimodalData, distanceKm]);

  // Live Target Price Sniper evaluation
  const sniperEval = useMemo(() => {
    return evaluateSniperAgainstQuotes(activeSniper, displayOptions, futurePricing);
  }, [activeSniper, displayOptions, futurePricing]);

  // Default suggested sniper input when empty
  useEffect(() => {
    if (!sniperInputPrice && displayOptions.length > 0) {
      const bestFare = Math.min(...displayOptions.map(o => o.fare));
      const suggested = Math.max(40, Math.round(bestFare * 0.88));
      setSniperInputPrice(String(suggested));
    }
  }, [displayOptions, sniperInputPrice]);

  // Auto-fire Sniper Alert when live quote hits target!
  useEffect(() => {
    if (activeSniper && sniperEval.isHit && sniperEval.matchedOption) {
      const triggerKey = `${activeSniper.id}_${sniperEval.matchedOption.id}_${sniperEval.matchedOption.fare}`;
      if (lastSniperAlertIdRef.current !== triggerKey) {
        lastSniperAlertIdRef.current = triggerKey;
        playSniperAlertSound();
        fireSniperNotification(
          `🎯 Chubby AI Price Sniper Hit: ₹${sniperEval.matchedOption.fare}!`,
          `${sniperEval.matchedOption.provider} (${sniperEval.matchedOption.rideType}) dropped to or below your ₹${activeSniper.targetPrice} target.`
        );
        setSniperHitBanner({
          option: sniperEval.matchedOption,
          targetPrice: activeSniper.targetPrice,
          savedVsTarget: Math.max(0, activeSniper.targetPrice - sniperEval.matchedOption.fare),
        });
      }
    }
  }, [activeSniper, sniperEval]);

  const handleArmSniper = (customPrice = null) => {
    const numericPrice = Math.max(1, parseInt(customPrice ?? sniperInputPrice, 10) || 100);
    const sniperObj = {
      id: `sniper_${Date.now()}`,
      userId: user?.uid || 'demo-user',
      pickup,
      dropoff: destination,
      targetPrice: numericPrice,
      provider: sniperProvider,
      category: activeCategory,
      armedAt: new Date().toISOString(),
    };
    setSniperInputPrice(String(numericPrice));
    setActiveSniper(sniperObj);
    lastSniperAlertIdRef.current = null;
    saveSniperForRoute(sniperObj);
    requestSniperNotificationPermission();
    const currentBest = displayOptions[0]?.fare || 300;
    syncSniperToBackend(sniperObj, currentBest);
  };

  const handleDisarmSniper = () => {
    setActiveSniper(null);
    setSniperHitBanner(null);
    lastSniperAlertIdRef.current = null;
    removeSniperForRoute(pickup, destination);
  };

  const handleSimulateSniperHit = () => {
    const targetVal = Math.max(1, parseInt(activeSniper?.targetPrice || sniperInputPrice, 10) || 150);
    const baseOpt = displayOptions[0] || {
      id: 'sim_smart',
      rideType: 'SmartRide AI EV',
      provider: 'SmartRide AI',
      providerKey: 'smartride',
      eta: 3,
      isSmart: true,
    };
    const simulatedOpt = { ...baseOpt, fare: Math.max(1, targetVal - 2) };
    playSniperAlertSound();
    fireSniperNotification(
      `🎯 Target Price Hit: ₹${simulatedOpt.fare}!`,
      `${simulatedOpt.provider} dropped below your ₹${targetVal} target!`
    );
    setSniperHitBanner({
      option: simulatedOpt,
      targetPrice: targetVal,
      savedVsTarget: 2,
      isSimulated: true,
    });
  };

  // Voice Command Execution Handler (Multilingual EN / HI / TA / TE)
  const executeVoiceTranscript = (text, lang = voiceLang) => {
    const cleaned = (text || '').trim();
    if (!cleaned) return;
    setVoiceTranscript(cleaned);
    setVoiceError('');

    const parsed = parseVoiceCommand(cleaned, lang);
    if (parsed.detectedPickup || parsed.detectedDest) {
      const nextP = parsed.detectedPickup || pickup;
      const nextD = parsed.detectedDest || destination;
      setPickup(nextP);
      setInputPickup(nextP);
      setDestination(nextD);
      setInputDest(nextD);
    }
    if (parsed.category) setActiveCategory(parsed.category);
    if (parsed.strategy) setUserPreferences(parsed.strategy);
    if (parsed.sniperTarget) {
      handleArmSniper(parsed.sniperTarget);
    }
    if (parsed.targetTab && parsed.targetTab !== 'voice') {
      setChubbyAITab(parsed.targetTab);
    }

    const bestOpt = displayOptions[0] || topPick;
    const mmBest = multimodalData.routes[0];
    const reply = buildVoiceResponseMessage(parsed, bestOpt, mmBest, lang);
    setVoiceReply(reply);
    if (!voiceMuted) {
      speakChubbyText(reply, lang);
    }
  };

  const toggleVoiceListening = () => {
    if (isListening) {
      try {
        recognizerRef.current?.stop();
      } catch {
        // Ignore stop errors when speech recognizer is inactive
      }
      setIsListening(false);
      return;
    }
    if (!isSpeechRecognitionSupported()) {
      setVoiceError('Live mic API is unavailable in this WebView — tap any multilingual command below or type a command!');
      return;
    }
    setVoiceError('');
    setVoiceTranscript('');
    const rec = createSpeechRecognizer(voiceLang, {
      onResult: ({ finalText, interimText }) => {
        setVoiceTranscript(finalText || interimText);
        if (finalText) {
          executeVoiceTranscript(finalText, voiceLang);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setVoiceError(
          err === 'not-allowed'
            ? 'Mic permission denied — tap a sample command or type below.'
            : 'Could not hear clearly — try speaking again or tap a quick phrase.'
        );
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
    if (rec) {
      recognizerRef.current = rec;
      setIsListening(true);
      try {
        rec.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const effectiveSelectedId = (selectedOptionId && displayOptions.some(o => o.id === selectedOptionId))
    ? selectedOptionId
    : (displayOptions[0]?.id || null);

  const selectedOption = useMemo(() => {
    return displayOptions.find(o => o.id === effectiveSelectedId) || displayOptions[0] || topPick;
  }, [displayOptions, effectiveSelectedId, topPick]);

  const handleBooking = async (optionToBook = null) => {
    const opt = optionToBook || selectedOption;
    if (!opt) return;

    const pickupAddress = pickup || "Current Location";
    const dropoffAddress = destination || "Marina Beach";

    // External competitor ride deep links (Uber, Ola, Rapido, Namma Yatri) with live coordinates
    if (!opt.isSmart) {
      let appDeepLink = opt.deepLink;
      let webBookingUrl = opt.url;
      const encDrop = encodeURIComponent(dropoffAddress);
      const encPick = encodeURIComponent(pickupAddress);
      const pLat = rtAnalysis?.originCoord?.lat ?? currentLocation?.lat ?? 13.0827;
      const pLng = rtAnalysis?.originCoord?.lng ?? currentLocation?.lng ?? 80.2707;
      const dLat = rtAnalysis?.destCoord?.lat ?? 13.0500;
      const dLng = rtAnalysis?.destCoord?.lng ?? 80.2824;
      const cat = String(opt.category || activeCategory || 'cab4').toLowerCase();
      const olaCat = cat === 'bike' ? 'bike' : cat === 'auto' ? 'auto' : cat === 'cab7' ? 'prime' : 'mini';

      if (opt.providerKey === 'uber') {
        appDeepLink = `uber://?action=setPickup&pickup[latitude]=${pLat}&pickup[longitude]=${pLng}&pickup[nickname]=${encPick}&dropoff[latitude]=${dLat}&dropoff[longitude]=${dLng}&dropoff[nickname]=${encDrop}`;
        webBookingUrl = `https://m.uber.com/looking?pickup[latitude]=${pLat}&pickup[longitude]=${pLng}&pickup[formatted_address]=${encPick}&dropoff[latitude]=${dLat}&dropoff[longitude]=${dLng}&dropoff[formatted_address]=${encDrop}`;
      } else if (opt.providerKey === 'ola') {
        appDeepLink = `olacabs://app/launch?landing_page=bk&lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}&pickup_name=${encPick}&drop_name=${encDrop}&category=${olaCat}`;
        webBookingUrl = `https://book.olacabs.com/?lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}&pickup_name=${encPick}&drop_name=${encDrop}&category=${olaCat}&utm_source=smartride_ai`;
      } else if (opt.providerKey === 'rapido') {
        appDeepLink = `rapido://ride?pickup=${encPick}&drop=${encDrop}&lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}`;
        webBookingUrl = `https://www.rapido.bike/?pickup=${encPick}&drop=${encDrop}&lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}`;
      } else if (opt.providerKey === 'nammayatri') {
        appDeepLink = `nammayatri://ride?pickup=${encPick}&drop=${encDrop}&lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}`;
        webBookingUrl = `https://nammayatri.in/?pickup=${encPick}&drop=${encDrop}`;
      }

      // Android native app bridge
      if (typeof window !== 'undefined' && window.AndroidApp && typeof window.AndroidApp.openExternalApp === 'function') {
        window.AndroidApp.openExternalApp(appDeepLink || webBookingUrl, webBookingUrl);
        return;
      }

      // Browser fallback
      const targetUrl = webBookingUrl || opt.url;
      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // SmartRide AI In-App Booking Flow
    try {
      setIsBooking(true);
      const rideData = {
        rideType: opt.rideType,
        provider: opt.provider,
        price: opt.fare,
        pickup: pickupAddress,
        dropoff: dropoffAddress,
        eta: `${opt.eta} min`,
        category: opt.category || activeCategory,
        isSmart: true,
      };

      const fallbackId = 'ride_' + Math.floor(Math.random() * 1000000);
      let rideId;
      try {
        rideId = await createRideRequest(user?.uid || 'demo-user-123', rideData);
      } catch (err) {
        console.warn('Backend ride creation fallback:', err);
        rideId = fallbackId;
      }

      navigate('/user/activity', { 
        state: { 
          rideId: rideId || fallbackId, 
          confirmed: true,
          rideDetails: {
            ...opt,
            pickup: pickupAddress,
            dropoff: dropoffAddress,
          }
        } 
      });
    } catch (err) {
      console.error('Booking failed:', err);
      navigate('/user/activity', { state: { confirmed: true } });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />

      {/* Google Maps Section with Real Driving / Transit Polylines */}
      <div style={{ height: '30%', position: 'relative', overflow: 'hidden' }}>
        <RouteMap 
          origin={pickup} 
          destination={destination} 
          travelMode={showChubbyAIModal && chubbyAITab === 'multimodal' ? 'TRANSIT' : 'DRIVING'}
          multimodalRoute={showChubbyAIModal && chubbyAITab === 'multimodal' ? activeMultimodalRoute : null}
        />
        
        {/* Floating Top Nav */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
          <button 
            onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/user/home'))} 
            className="btn-icon" 
            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-surface)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-ui)' }} 
            aria-label="Back"
          >
            <ArrowLeft size={18} color="var(--text-main)" />
          </button>
          
          <button 
            onClick={() => setShowChubbyAIModal(true)} 
            className="btn-icon" 
            style={{
              height: '40px', padding: '0 14px', borderRadius: '999px',
              background: 'linear-gradient(135deg, #00D8FF 0%, #6366F1 60%, #EC4899 100%)',
              border: '1.5px solid rgba(255, 255, 255, 0.5)',
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#080C14', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0, 216, 255, 0.35)'
            }} 
            aria-label="Open Chubby AI Assistant"
          >
            <Sparkles size={14} color="#080C14" /> Chubby AI
            {activeSniper && (
              <span style={{ background: '#080C14', color: '#10B981', fontSize: '0.6rem', fontWeight: 900, padding: '1px 6px', borderRadius: '99px' }}>
                🎯 ₹{activeSniper.targetPrice}
              </span>
            )}
          </button>
        </div>

        {/* Floating Route Badge - Click to Change Route */}
        <div 
          onClick={() => setShowRouteEditor(!showRouteEditor)}
          style={{ 
            position: 'absolute', bottom: '12px', left: '16px', right: '16px', zIndex: 40,
            background: 'var(--bg-surface)', backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-ui)', borderRadius: '14px', padding: '8px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)', cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#00D8FF' }} />
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pickup} ➔ {destination}
              </p>
              <p style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                {distanceKm} km · ~{liveDrivingMins}m road · <span style={{ color: '#00D8FF', fontWeight: 700 }}>Tap to Change Route ✏️</span>
              </p>
            </div>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: rtLoading ? '#F59E0B' : '#10B981', background: rtLoading ? 'rgba(245,158,11,0.14)' : 'rgba(16,185,129,0.14)', padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>
            {rtLoading ? 'SYNCING AI...' : (rtAnalysis?.telemetry?.isLive ? '🟢 LIVE OSRM' : 'LIVE GPS')}
          </span>
        </div>

        {/* Interactive Route Editor Overlay */}
        <AnimatePresence>
          {showRouteEditor && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: 'absolute', top: '65px', left: '16px', right: '16px', zIndex: 100,
                background: 'var(--bg-surface)', backdropFilter: 'blur(25px)',
                border: '1px solid var(--border-ui)', borderRadius: '20px', padding: '16px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={16} color="#00D8FF" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>Change Route Anywhere</span>
                </div>
                <button 
                  onClick={() => setShowRouteEditor(false)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Text Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>PICKUP LOCATION</label>
                  <input
                    type="text"
                    value={inputPickup}
                    onChange={(e) => setInputPickup(e.target.value)}
                    placeholder="Enter pickup place (e.g. Koramangala, KG Apts, Bandra)"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '10px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)',
                      color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>DROP-OFF DESTINATION</label>
                  <input
                    type="text"
                    value={inputDest}
                    onChange={(e) => setInputDest(e.target.value)}
                    placeholder="Enter destination (e.g. Marina Beach, Whitefield, Airport)"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '10px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)',
                      color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Popular Benchmark Preset Chips */}
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>QUICK PRESETS</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {POPULAR_ROUTES.map((route, i) => (
                    <button
                      key={i}
                      onClick={() => handleApplyRoute(route.pickup, route.dropoff)}
                      style={{
                        padding: '4px 8px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700,
                        background: 'rgba(0,216,255,0.08)', border: '1px solid rgba(0,216,255,0.25)',
                        color: 'var(--text-main)', cursor: 'pointer'
                      }}
                    >
                      {route.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Route Button */}
              <button
                onClick={() => handleApplyRoute(inputPickup, inputDest)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #00D8FF, #6366F1)',
                  border: 'none', color: '#080C14', fontSize: '0.8rem', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Sparkles size={14} color="#080C14" /> Compute Real-Time AI Route
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Bottom Sheet */}
      <div style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', 
        background: 'var(--bg-surface)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', 
        borderTop: '1px solid var(--border-ui)', position: 'relative', zIndex: 10,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', overflow: 'hidden' 
      }}>

        {/* Pull Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'var(--border-ui)' }} />
        </div>

        {/* Status & Preference Chips */}
        <div style={{ padding: '4px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: '6px', overflowX: 'auto' }} className="no-scrollbar">
                {PREFERENCE_FILTERS.map(pref => {
                  const isActive = userPreferences === pref.id;
                  return (
                    <button
                      key={pref.id}
                      onClick={() => setUserPreferences(pref.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '5px 10px', borderRadius: '10px',
                        border: isActive ? '1px solid #6366F1' : '1px solid var(--border-ui)',
                        background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
                        color: isActive ? '#818CF8' : 'var(--text-muted)',
                        fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      <span>{pref.emoji}</span>
                      <span>{pref.label}</span>
                    </button>
                  );
                })}
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => { manualRefresh(); triggerRealTimeAnalysis(); }}
                disabled={isRefreshing || rtLoading}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)',
                  borderRadius: '10px', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '4px',
                  cursor: 'pointer', fontSize: '0.68rem', color: 'var(--text-main)', fontWeight: 700, flexShrink: 0
                }}
              >
                <RefreshCw size={11} className={(isRefreshing || rtLoading) ? 'animate-spin' : ''} color="var(--brand-cyan)" />
                <span>{secondsAgo}s</span>
              </motion.button>
            </div>

            {/* Vehicle Category Bar */}
            <div style={{ padding: '0 16px 8px' }}>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }} className="no-scrollbar">
                {CATEGORIES.map(cat => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', borderRadius: '12px',
                        border: isActive ? '1px solid #00D8FF' : '1px solid var(--border-ui)',
                        background: isActive ? 'rgba(0, 216, 255, 0.15)' : 'var(--bg-card)',
                        color: isActive ? '#00D8FF' : 'var(--text-muted)',
                        fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact Live Real-Time OSRM + Future Price + Weather / Surge-Escape Status Strip */}
            <div style={{ padding: '0 16px 6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setChubbyAITab('future'); setShowChubbyAIModal(true); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
                  padding: '5px 10px', borderRadius: '10px', cursor: 'pointer',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#10B981', fontSize: '0.67rem', fontWeight: 800,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {rtAnalysis?.telemetry?.isLive ? '🟢 LIVE OSRM' : '⚡ LIVE AI'} · {distanceKm}km · 📈 Future: ₹{projectForecast.bestWindow?.fare}
                </span>
                <span style={{ fontSize: '0.62rem', opacity: 0.9, flexShrink: 0 }}>Forecast ›</span>
              </button>
              {weatherAdvisory.severity !== 'clear' && (
                <button
                  onClick={() => { setChubbyAITab('weather'); setShowChubbyAIModal(true); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
                    padding: '5px 10px', borderRadius: '10px', cursor: 'pointer',
                    background: `${weatherAdvisory.badgeColor}18`,
                    border: `1px solid ${weatherAdvisory.badgeColor}55`,
                    color: weatherAdvisory.badgeColor, fontSize: '0.68rem', fontWeight: 800,
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {weatherAdvisory.weather.icon} {weatherAdvisory.weather.tempC}°C {weatherAdvisory.weather.condition} · {weatherAdvisory.recommendedLabel}
                  </span>
                  <span style={{ fontSize: '0.62rem', opacity: 0.85 }}>Details ›</span>
                </button>
              )}
              {appliedEscapeSpot && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '5px 10px', borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.45)',
                    color: '#10B981', fontSize: '0.68rem', fontWeight: 800,
                  }}
                >
                  <span>🚶 Surge Escaped (-{appliedEscapeSpot.savingsPct}%)</span>
                  <button
                    onClick={() => setAppliedEscapeSpot(null)}
                    style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', fontWeight: 900, fontSize: '0.72rem', padding: 0 }}
                    title="Reset pickup"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* App Comparison List */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 145px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="no-scrollbar">
              {isLoading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VehicleLoader />
                </div>
              ) : (
                displayOptions.map((opt) => {
                  const isActive = effectiveSelectedId === opt.id;
                  const isTopPick = topPick && topPick.id === opt.id;

                  return (
                    <motion.div
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ 
                        width: '100%', textAlign: 'left', cursor: 'pointer', 
                        background: isActive ? 'rgba(0, 216, 255, 0.08)' : 'var(--bg-card)', 
                        border: `1px solid ${isTopPick ? '#00D8FF' : isActive ? 'rgba(0, 216, 255, 0.4)' : 'var(--border-ui)'}`, 
                        borderRadius: '16px', padding: '12px 14px', position: 'relative',
                        transition: 'all 0.2s',
                        boxShadow: isTopPick ? '0 0 16px rgba(0, 216, 255, 0.15)' : 'none'
                      }}
                    >
                      {isTopPick && (
                        <div style={{ 
                          position: 'absolute', top: 0, right: 0, 
                          background: 'linear-gradient(135deg, #00D8FF, #6366F1)',
                          color: '#080C14', fontSize: '0.55rem', fontWeight: 900,
                          padding: '2px 8px', borderBottomLeftRadius: '10px',
                          letterSpacing: '0.06em', textTransform: 'uppercase'
                        }}>
                          ✨ AI #1 PICK
                        </div>
                      )}

                      {/* TIER 1: IDENTITY & PRICING (NO SQUEEZING, NO ISOLATED WORD WRAPS) */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: isTopPick ? '4px' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '12px', 
                            background: isTopPick ? 'linear-gradient(135deg, #00D8FF, #6366F1)' : 'var(--bg-elevated)', 
                            border: isTopPick ? 'none' : '1px solid var(--border-ui)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {opt.category === 'bike' ? (
                              <Bike size={19} color={isTopPick ? '#05070A' : 'var(--brand-cyan)'} />
                            ) : (
                              <Car size={19} color={isTopPick ? '#05070A' : 'var(--brand-cyan)'} />
                            )}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ 
                                fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', 
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                              }}>
                                {opt.rideType}
                              </span>
                              <span style={{ 
                                fontSize: '0.55rem', fontWeight: 800, color: '#10B981', 
                                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', 
                                padding: '1px 5px', borderRadius: '4px', flexShrink: 0 
                              }}>
                                LIVE
                              </span>
                              {opt.weatherTag && (
                                <span style={{ 
                                  fontSize: '0.55rem', fontWeight: 800, 
                                  color: opt.weatherTag.includes('⚠️') ? '#F59E0B' : '#38BDF8', 
                                  background: opt.weatherTag.includes('⚠️') ? 'rgba(245,158,11,0.14)' : 'rgba(56,189,248,0.14)', 
                                  padding: '1px 5px', borderRadius: '4px', flexShrink: 0 
                                }}>
                                  {opt.weatherTag}
                                </span>
                              )}
                            </div>
                            <p style={{ 
                              fontSize: '0.70rem', color: 'var(--text-muted)', fontWeight: 600, 
                              marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                            }}>
                              {opt.provider} · ETA {opt.eta} min · {opt.pickupDistance}m away
                            </p>
                          </div>
                        </div>

                        {/* Price Block (Formatted with proper commas, bold typography) */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {appliedEscapeSpot && opt.originalFareBeforeEscape > opt.fare && (
                            <span style={{ fontSize: '0.64rem', color: '#EF4444', textDecoration: 'line-through', fontWeight: 700, display: 'block' }}>
                              ₹{Number(opt.originalFareBeforeEscape).toLocaleString('en-IN')}
                            </span>
                          )}
                          <div style={{ 
                            fontSize: '1.22rem', fontWeight: 900, 
                            color: appliedEscapeSpot ? '#10B981' : 'var(--text-main)', 
                            letterSpacing: '-0.02em', lineHeight: 1.1 
                          }}>
                            ₹{Number(opt.fare).toLocaleString('en-IN')}
                          </div>
                          {opt.savingsVsMax > 0 && (
                            <span style={{ fontSize: '0.60rem', color: '#10B981', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                              Save ₹{opt.savingsVsMax}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* TIER 2: SPECS ROW & PROPERLY PLACED BOOK BUTTON */}
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        marginTop: '9px', paddingTop: '7px', 
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)', gap: '8px' 
                      }}>
                        {/* Specs Chips */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                          <span style={{ 
                            fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', 
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-ui)', 
                            padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap' 
                          }}>
                            ⏱️ {opt.eta}m
                          </span>
                          <span style={{ 
                            fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', 
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-ui)', 
                            padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap' 
                          }}>
                            🚶 {opt.pickupDistance}m
                          </span>
                          {opt.cancellationRisk < 0.05 && (
                            <span style={{ 
                              fontSize: '0.64rem', fontWeight: 700, color: '#10B981', 
                              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', 
                              padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap' 
                            }}>
                              ✓ Zero Cancel
                            </span>
                          )}
                        </div>

                        {/* Dedicated 1-Tap Booking Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBooking(opt);
                          }}
                          style={{
                            padding: '5px 11px',
                            background: opt.isSmart 
                              ? 'linear-gradient(135deg, #00D8FF, #6366F1)' 
                              : opt.providerKey === 'uber' 
                                ? '#FFFFFF' 
                                : opt.providerKey === 'ola' 
                                  ? '#10B981' 
                                  : opt.providerKey === 'rapido' 
                                    ? '#FBBF24' 
                                    : '#F59E0B',
                            color: (opt.providerKey === 'uber' || opt.providerKey === 'rapido' || opt.providerKey === 'nammayatri') 
                              ? '#080C14' 
                              : (opt.isSmart ? '#080C14' : '#FFFFFF'),
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.70rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                          }}
                        >
                          {opt.isSmart ? '⚡ Book' : `Book ${opt.provider}`}
                          <Navigation size={10} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            BOTTOM ACTION BAR - CONFIRM & BOOK SELECTED CAR/AUTO/BIKE
            ═══════════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: '12px 16px 20px', borderTop: '1px solid var(--border-ui)' }}>
          <motion.button 
            whileTap={{ scale: 0.98 }}
            disabled={isBooking || isLoading || !selectedOption}
            onClick={() => handleBooking(selectedOption)}
            className="btn-primary" 
            style={{ 
              width: '100%', height: '50px', fontSize: '0.96rem', fontWeight: 900, 
              borderRadius: '16px', gap: '8px', display: 'flex', flexDirection: 'row',
              alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap',
              opacity: (isBooking || isLoading || !selectedOption) ? 0.7 : 1,
              background: selectedOption?.isSmart
                ? 'linear-gradient(135deg, #00D8FF, #6366F1)'
                : selectedOption?.providerKey === 'uber'
                  ? '#FFFFFF'
                  : selectedOption?.providerKey === 'ola'
                    ? '#10B981'
                    : selectedOption?.providerKey === 'rapido'
                      ? '#FBBF24'
                      : '#F59E0B',
              color: (selectedOption?.isSmart || selectedOption?.providerKey === 'uber' || selectedOption?.providerKey === 'rapido' || selectedOption?.providerKey === 'nammayatri')
                ? '#080C14'
                : '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}
          >
            {isBooking ? (
              <Loader2 className="animate-spin" size={18} />
            ) : selectedOption?.isSmart ? (
              <>⚡ Book Now · SmartRide AI · ₹{Number(selectedOption.fare).toLocaleString('en-IN')} <ChevronRight size={18} /></>
            ) : (
              <>🚀 Book on {selectedOption?.provider || 'App'} · ₹{Number(selectedOption?.fare || 0).toLocaleString('en-IN')} <Navigation size={15} /></>
            )}
          </motion.button>
        </div>
      </div>

      {/* 🎯 TARGET PRICE SNIPER HIT ALERT BANNER */}
      <AnimatePresence>
        {sniperHitBanner && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            style={{
              position: 'absolute', top: '64px', left: '14px', right: '14px', zIndex: 130,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.96), rgba(6, 182, 212, 0.96))',
              borderRadius: '18px', padding: '12px 14px', color: '#080C14',
              boxShadow: '0 14px 36px rgba(16, 185, 129, 0.5)',
              border: '1.5px solid rgba(255,255,255,0.65)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div>
                <p style={{ fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  🎯 CHUBBY AI SNIPER LOCKED {sniperHitBanner.isSimulated ? '(DEMO TEST)' : '(LIVE)'}
                </p>
                <p style={{ fontSize: '0.9rem', fontWeight: 900, marginTop: '2px' }}>
                  {sniperHitBanner.option.provider} hit ₹{sniperHitBanner.option.fare} (Target: ₹{sniperHitBanner.targetPrice})!
                </p>
              </div>
              <button
                onClick={() => setSniperHitBanner(null)}
                style={{ background: 'rgba(8,12,20,0.18)', border: 'none', borderRadius: '8px', width: '26px', height: '26px', cursor: 'pointer', color: '#080C14', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => {
                  const matched = sniperHitBanner.option;
                  setSniperHitBanner(null);
                  handleBooking(matched);
                }}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '10px', border: 'none',
                  background: '#080C14', color: '#00D8FF', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer'
                }}
              >
                ⚡ Lock & Book Now · ₹{sniperHitBanner.option.fare}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chubby AI entry lives cleanly in the top header without overlapping bottom quote cards */}

      {/* 🌟 CHUBBY AI FULL MODAL / BOTTOM SHEET (Contained Inside Viewport/Frame) */}
      <AnimatePresence>
        {showChubbyAIModal && (
          <div 
            onClick={() => setShowChubbyAIModal(false)}
            style={{
              position: 'absolute', inset: 0, zIndex: 120,
              background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxHeight: '86vh', display: 'flex', flexDirection: 'column',
                background: 'var(--bg-surface)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px',
                borderTop: '1px solid var(--border-ui)', boxShadow: '0 -15px 50px rgba(0, 0, 0, 0.7)',
                overflow: 'hidden'
              }}
            >
              {/* Pull Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
                <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'var(--border-ui)' }} />
              </div>

              {/* Modal Header */}
              <div style={{ padding: '0 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-ui)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #00D8FF, #6366F1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(0, 216, 255, 0.4)'
                  }}>
                    <Sparkles size={20} color="#080C14" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Chubby AI Intelligence
                    </h3>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pickup} ➔ {destination} ({distanceKm} km)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowChubbyAIModal(false)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-muted)'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* 🟢 LIVE REAL-TIME AI TELEMETRY STRIP (OSRM + Open-Meteo + ML Surge + InDrive Bid) */}
              <div style={{ padding: '7px 16px', background: 'rgba(16, 185, 129, 0.08)', borderBottom: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', overflowX: 'auto' }} className="no-scrollbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', fontSize: '0.64rem', fontWeight: 800 }}>
                  <span style={{ color: '#10B981' }}>
                    {rtLoading ? '⏳ Syncing Live APIs...' : (rtAnalysis?.telemetry?.isLive ? '🟢 LIVE AI' : '⚡ HYBRID AI')}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    🛣️ {distanceKm}km · {liveDrivingMins}m
                  </span>
                  {rtAnalysis?.mlSurge && (
                    <span style={{ color: '#F59E0B' }}>
                      🧠 Surge {rtAnalysis.mlSurge.multiplier}x ({rtAnalysis.mlSurge.confidencePct}%)
                    </span>
                  )}
                  {rtAnalysis?.inDriveFairBid && (
                    <span style={{ color: '#00D8FF' }}>
                      🤝 InDrive Bid: ₹{rtAnalysis.inDriveFairBid}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => triggerRealTimeAnalysis()}
                  style={{ background: 'none', border: 'none', color: '#00D8FF', fontSize: '0.64rem', fontWeight: 900, cursor: 'pointer', flexShrink: 0 }}
                  title="Re-fetch live OSRM, Open-Meteo & OSM Transit telemetry"
                >
                  ↻ Sync
                </button>
              </div>

              {/* 7 Next-Level AI Sub-Tabs (Scrollable Pills) */}
              <div style={{ padding: '10px 16px 8px', overflowX: 'auto', display: 'flex', gap: '6px' }} className="no-scrollbar">
                {[
                  { id: 'chat', icon: '💬', label: 'AI Chat' },
                  { id: 'voice', icon: '🎙️', label: 'Voice AI' },
                  { id: 'future', icon: '📈', label: 'Future Prices' },
                  { id: 'escape', icon: '🚶', label: 'Surge Escape' },
                  { id: 'multimodal', icon: '🚇', label: 'Smart Routes' },
                  { id: 'weather', icon: weatherAdvisory.weather.icon, label: 'Weather AI' },
                  { id: 'sniper', icon: '🎯', label: activeSniper ? `Sniper ₹${activeSniper.targetPrice}` : 'Price Sniper' },
                ].map((t) => {
                  const active = chubbyAITab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (t.id === 'chat') {
                          setShowChubbyAIModal(false);
                          setChatOpen(true);
                        } else {
                          setChubbyAITab(t.id);
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '7px 11px', borderRadius: '12px', whiteSpace: 'nowrap', flexShrink: 0,
                        background: active ? 'linear-gradient(135deg, rgba(0, 216, 255, 0.22), rgba(99, 102, 241, 0.28))' : 'var(--bg-elevated)',
                        border: active ? '1px solid #00D8FF' : '1px solid var(--border-ui)',
                        color: active ? '#00D8FF' : 'var(--text-muted)',
                        fontSize: '0.73rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: active ? '0 0 12px rgba(0, 216, 255, 0.2)' : 'none',
                      }}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modal Content Body */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="no-scrollbar">
                
                {/* ═════════════════════════════════════════════════════════════════
                    SUB-TAB 1: SMART MULTIMODAL SPLIT ROUTES (Goal 1: Bus + Metro + Rapido)
                    ═════════════════════════════════════════════════════════════════ */}
                {chubbyAITab === 'multimodal' && (
                  <>
                    {/* Direct Cab vs Multimodal Savings Banner */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(0, 216, 255, 0.12))', 
                      border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '16px', padding: '12px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Direct Cab: ₹{multimodalData.directCabComparison.rapido} (Rapido) / ₹{multimodalData.directCabComparison.ola} (Ola)
                        </p>
                        <p style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                          Smart Multimodal: From <span style={{ color: '#10B981' }}>₹{multimodalData.routes[0]?.totalFare}</span> (Save up to ₹{multimodalData.routes[0]?.savingsFare}!)
                        </p>
                      </div>
                      <span style={{ fontSize: '1.4rem' }}>💡</span>
                    </div>

                    {/* Multimodal Option Cards */}
                    {multimodalData.routes.map(route => {
                      const isSelected = selectedMultimodalId === route.id;
                      return (
                        <div
                          key={route.id}
                          onClick={() => setSelectedMultimodalId(route.id)}
                          style={{
                            background: isSelected ? 'rgba(0, 216, 255, 0.08)' : 'var(--bg-card)',
                            border: `1.5px solid ${isSelected ? '#00D8FF' : 'var(--border-ui)'}`,
                            borderRadius: '18px', padding: '14px', cursor: 'pointer',
                            transition: 'all 0.2s', boxShadow: isSelected ? '0 0 20px rgba(0, 216, 255, 0.18)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{ 
                                fontSize: '0.58rem', fontWeight: 900, 
                                background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', 
                                padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' 
                              }}>
                                {route.badge}
                              </span>
                              <h4 style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>
                                {route.title}
                              </h4>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                ⏱️ ~{route.totalDurationMinutes} mins · 🌱 {route.co2SavedKg} kg CO₂ saved
                              </p>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>₹{route.totalFare}</p>
                              <span style={{ fontSize: '0.62rem', color: '#EF4444', textDecoration: 'line-through', display: 'block' }}>
                                ₹{route.directCabFare} Direct Cab
                              </span>
                              <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#10B981' }}>
                                Save ₹{route.savingsFare} ({route.savingsPercent}%)
                              </span>
                            </div>
                          </div>

                          {/* Step-by-Step Leg Badges */}
                          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-ui)', paddingTop: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {route.legs.map((leg, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{leg.icon}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{leg.label}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>({leg.duration})</span>
                                  </div>
                                  <span style={{ fontWeight: 800, color: leg.fare === 0 ? '#38BDF8' : 'var(--text-main)' }}>
                                    {leg.fare === 0 ? 'Free' : `₹${leg.fare}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-ui)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: '#00D8FF', fontWeight: 700 }}>
                              {isSelected ? '✓ Selected on map' : 'Tap to preview route'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowChubbyAIModal(false);
                                navigate('/user/activity', { 
                                  state: { 
                                    confirmed: true, 
                                    rideDetails: {
                                      rideType: route.title,
                                      provider: 'Multimodal Transit',
                                      price: route.totalFare,
                                      pickup,
                                      dropoff: destination,
                                      isSmart: true
                                    } 
                                  } 
                                });
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #10B981, #00D8FF)',
                                color: '#080C14', border: 'none', borderRadius: '8px',
                                padding: '6px 14px', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer'
                              }}
                            >
                              Start Journey · ₹{route.totalFare}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* ═════════════════════════════════════════════════════════════════
                    SUB-TAB 2: WALK-2-MINS SURGE ESCAPE ADVISOR
                    ═════════════════════════════════════════════════════════════════ */}
                {chubbyAITab === 'escape' && (
                  <>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(0, 216, 255, 0.12))',
                      border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '16px', padding: '12px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#10B981', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          🚶 MICRO-ZONE HEX SURGE RADAR ({surgeEscapeData.currentSurge}x ACTIVE)
                        </span>
                        <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '3px', lineHeight: 1.35 }}>
                          Walk just 2–4 mins outside the hotspot to save up to <span style={{ color: '#10B981' }}>₹{surgeEscapeData.spots[2]?.savings}</span>!
                        </p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {surgeEscapeData.hotspotReason}
                        </p>
                      </div>
                      <Footprints size={26} color="#10B981" style={{ flexShrink: 0 }} />
                    </div>

                    {surgeEscapeData.spots.map((spot) => {
                      const isApplied = appliedEscapeSpot?.id === spot.id;
                      return (
                        <div
                          key={spot.id}
                          style={{
                            background: isApplied ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)',
                            border: `1.5px solid ${isApplied ? '#10B981' : 'var(--border-ui)'}`,
                            borderRadius: '16px', padding: '13px',
                            boxShadow: isApplied ? '0 0 18px rgba(16, 185, 129, 0.2)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div>
                              <span style={{ fontSize: '0.58rem', fontWeight: 900, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 7px', borderRadius: '6px' }}>
                                {spot.tag}
                              </span>
                              <h4 style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '5px' }}>
                                📍 {spot.name}
                              </h4>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                🚶 {spot.walkMeters}m ({spot.walkMins} min walk) · {spot.direction}
                              </p>
                              <p style={{ fontSize: '0.66rem', color: '#38BDF8', fontWeight: 700, marginTop: '2px' }}>
                                ✓ Surge drops {spot.currentSurge}x ➔ {spot.escapedSurge}x · {spot.pickupConfidence}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>₹{spot.escapedFare}</p>
                              <span style={{ fontSize: '0.64rem', color: '#EF4444', textDecoration: 'line-through', display: 'block' }}>
                                ₹{spot.originalFare}
                              </span>
                              <span style={{ fontSize: '0.66rem', fontWeight: 900, color: '#10B981' }}>
                                Save ₹{spot.savings} ({spot.savingsPct}%)
                              </span>
                            </div>
                          </div>

                          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-ui)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {isApplied ? (
                              <button
                                onClick={() => setAppliedEscapeSpot(null)}
                                style={{
                                  padding: '6px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)', color: '#EF4444',
                                  fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer'
                                }}
                              >
                                Reset Original Pin
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setAppliedEscapeSpot(spot);
                                  setPickup(spot.name);
                                  setInputPickup(spot.name);
                                  setShowChubbyAIModal(false);
                                }}
                                style={{
                                  padding: '7px 14px', borderRadius: '9px', border: 'none',
                                  background: 'linear-gradient(135deg, #10B981, #00D8FF)',
                                  color: '#080C14', fontSize: '0.74rem', fontWeight: 900, cursor: 'pointer'
                                }}
                              >
                                🚶 Switch Pickup & Save ₹{spot.savings}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* ═════════════════════════════════════════════════════════════════
                    SUB-TAB 3: VOICE-FIRST MULTILINGUAL CHUBBY AI (EN / HI / TA / TE)
                    ═════════════════════════════════════════════════════════════════ */}
                {chubbyAITab === 'voice' && (
                  <>
                    {/* Language Selector */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }} className="no-scrollbar">
                        {VOICE_LANGUAGES.map((lang) => {
                          const active = voiceLang === lang.code;
                          return (
                            <button
                              key={lang.code}
                              onClick={() => setVoiceLang(lang.code)}
                              style={{
                                padding: '6px 10px', borderRadius: '10px', whiteSpace: 'nowrap', cursor: 'pointer',
                                background: active ? 'rgba(0, 216, 255, 0.18)' : 'var(--bg-elevated)',
                                border: active ? '1px solid #00D8FF' : '1px solid var(--border-ui)',
                                color: active ? '#00D8FF' : 'var(--text-muted)',
                                fontSize: '0.7rem', fontWeight: 800
                              }}
                            >
                              {lang.label}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setVoiceMuted((m) => !m)}
                        title={voiceMuted ? 'Unmute Voice Reply' : 'Mute Voice Reply'}
                        style={{
                          padding: '6px 9px', borderRadius: '10px', background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-ui)', color: voiceMuted ? '#EF4444' : '#00D8FF',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0
                        }}
                      >
                        {voiceMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                      </button>
                    </div>

                    {/* Central Voice Orb Button */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(0, 216, 255, 0.12))',
                      border: '1px solid rgba(0, 216, 255, 0.35)', borderRadius: '20px',
                      padding: '18px 14px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                    }}>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        animate={isListening ? { scale: [1, 1.12, 1], boxShadow: ['0 0 0 0 rgba(239,68,68,0.6)', '0 0 0 18px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0)'] } : {}}
                        transition={{ repeat: isListening ? Infinity : 0, duration: 1.4 }}
                        onClick={toggleVoiceListening}
                        style={{
                          width: '68px', height: '68px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                          background: isListening
                            ? 'linear-gradient(135deg, #EF4444, #F97316)'
                            : 'linear-gradient(135deg, #00D8FF, #6366F1)',
                          color: '#080C14', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 10px 28px rgba(0, 216, 255, 0.45)'
                        }}
                      >
                        {isListening ? <MicOff size={28} color="#FFF" /> : <Mic size={28} color="#080C14" />}
                      </motion.button>

                      <div>
                        <p style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--text-main)' }}>
                          {isListening ? 'Listening... Speak Now' : 'Tap Mic to Speak to Chubby AI'}
                        </p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Supports English, हिन्दी, தமிழ் & తెలుగు · Auto-sets route, vehicle & alerts
                        </p>
                      </div>

                      {voiceTranscript && (
                        <div style={{ width: '100%', padding: '8px 12px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', textAlign: 'left' }}>
                          <span style={{ fontSize: '0.6rem', color: '#00D8FF', fontWeight: 900, textTransform: 'uppercase' }}>YOU SAID</span>
                          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>"{voiceTranscript}"</p>
                        </div>
                      )}

                      {voiceReply && (
                        <div style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.14)', border: '1px solid rgba(16, 185, 129, 0.4)', textAlign: 'left' }}>
                          <span style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 900, textTransform: 'uppercase' }}>✨ CHUBBY AI VOICE VERDICT</span>
                          <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px', lineHeight: 1.4 }}>{voiceReply}</p>
                        </div>
                      )}

                      {voiceError && (
                        <p style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 700 }}>{voiceError}</p>
                      )}
                    </div>

                    {/* Type-to-Voice Fallback Bar */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={voiceInputDraft}
                        onChange={(e) => setVoiceInputDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && voiceInputDraft.trim()) {
                            executeVoiceTranscript(voiceInputDraft, voiceLang);
                            setVoiceInputDraft('');
                          }
                        }}
                        placeholder="Or type voice command (e.g. 'Cheapest auto to Airport')..."
                        style={{
                          flex: 1, padding: '10px 12px', borderRadius: '12px',
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)',
                          color: 'var(--text-main)', fontSize: '0.76rem', fontWeight: 700, outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => {
                          if (voiceInputDraft.trim()) {
                            executeVoiceTranscript(voiceInputDraft, voiceLang);
                            setVoiceInputDraft('');
                          }
                        }}
                        style={{
                          padding: '0 14px', borderRadius: '12px', border: 'none',
                          background: 'linear-gradient(135deg, #00D8FF, #6366F1)',
                          color: '#080C14', fontWeight: 900, fontSize: '0.76rem', cursor: 'pointer'
                        }}
                      >
                        Run
                      </button>
                    </div>

                    {/* 1-Tap Multilingual Voice Command Presets */}
                    <div>
                      <p style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                        1-Tap Multilingual Voice Commands
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {[
                          { label: '🇬🇧 "Cheapest way to Marina Beach"', cmd: 'Cheapest way to Marina Beach', lang: 'en-IN' },
                          { label: '🇮🇳 "Airport jaane ka sabse sasta auto"', cmd: 'Airport jaane ka sabse sasta auto', lang: 'hi-IN' },
                          { label: '🇮🇳 "Central Station poga kammi rate cab"', cmd: 'Central Station poga kammi rate cab', lang: 'ta-IN' },
                          { label: '🇮🇳 "Marina Beach velladaniki takkuva rate"', cmd: 'Marina Beach velladaniki takkuva rate', lang: 'te-IN' },
                          { label: '🎯 "Set price sniper alert below 150"', cmd: 'Set price sniper alert below 150', lang: 'en-IN' },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setVoiceLang(item.lang);
                              executeVoiceTranscript(item.cmd, item.lang);
                            }}
                            style={{
                              textAlign: 'left', padding: '9px 12px', borderRadius: '12px',
                              background: 'var(--bg-card)', border: '1px solid var(--border-ui)',
                              color: 'var(--text-main)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                          >
                            <span>{item.label}</span>
                            <span style={{ color: '#00D8FF', fontSize: '0.68rem', fontWeight: 900 }}>Try ›</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ═════════════════════════════════════════════════════════════════
                    SUB-TAB 4: LIVE WEATHER & COMFORT-AWARE AI
                    ═════════════════════════════════════════════════════════════════ */}
                {chubbyAITab === 'weather' && (
                  <>
                    {/* Live Weather Summary Card */}
                    <div style={{
                      background: `linear-gradient(135deg, ${weatherAdvisory.badgeColor}22, rgba(99, 102, 241, 0.14))`,
                      border: `1.5px solid ${weatherAdvisory.badgeColor}66`,
                      borderRadius: '18px', padding: '14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.6rem', fontWeight: 900, color: weatherAdvisory.badgeColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {weatherAdvisory.weather.source}
                          </span>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                            {weatherAdvisory.weather.icon} {weatherAdvisory.weather.tempC}°C · {weatherAdvisory.weather.condition}
                          </h4>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            💧 Humidity {weatherAdvisory.weather.humidity}% · 💨 Wind {weatherAdvisory.weather.windKmh} km/h
                            {weatherAdvisory.weather.precipitationMm > 0 ? ` · 🌧️ ${weatherAdvisory.weather.precipitationMm} mm/h` : ''}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 10px', borderRadius: '99px', fontSize: '0.66rem', fontWeight: 900,
                          background: `${weatherAdvisory.badgeColor}25`, color: weatherAdvisory.badgeColor
                        }}>
                          {weatherAdvisory.badgeText}
                        </span>
                      </div>

                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-ui)' }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 900, color: 'var(--text-main)' }}>
                          {weatherAdvisory.headline}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                          {weatherAdvisory.detail}
                        </p>
                      </div>
                    </div>

                    {/* Weather Comfort Impact by Vehicle */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '12px 14px' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                        AI Vehicle Comfort Scoring
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                          { id: 'cab4', icon: '🚗', label: 'AC Cab (4S)' },
                          { id: 'cab7', icon: '🚐', label: 'AC SUV (7S)' },
                          { id: 'auto', icon: '🛺', label: 'Auto Rickshaw' },
                          { id: 'bike', icon: '🏍️', label: 'Bike Taxi' },
                        ].map((veh) => {
                          const delta = weatherAdvisory.categoryAdjustments[veh.id] || 0;
                          const isAvoid = weatherAdvisory.avoidCategories.includes(veh.id);
                          return (
                            <button
                              key={veh.id}
                              onClick={() => { setActiveCategory(veh.id); setShowChubbyAIModal(false); }}
                              style={{
                                padding: '9px 10px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer',
                                background: isAvoid ? 'rgba(239, 68, 68, 0.1)' : delta > 0 ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-elevated)',
                                border: `1px solid ${isAvoid ? 'rgba(239, 68, 68, 0.4)' : delta > 0 ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-ui)'}`
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                  {veh.icon} {veh.label}
                                </span>
                                <span style={{ fontSize: '0.66rem', fontWeight: 900, color: isAvoid ? '#EF4444' : delta > 0 ? '#10B981' : 'var(--text-muted)' }}>
                                  {delta > 0 ? `+${delta}` : delta}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.62rem', color: isAvoid ? '#EF4444' : delta > 0 ? '#10B981' : 'var(--text-muted)', marginTop: '3px', fontWeight: 700 }}>
                                {isAvoid ? '⚠️ Not ideal right now' : delta > 10 ? '✓ AI Priority Pick' : 'Standard comfort'}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Weather Condition Simulator (For Live Demo & Testing) */}
                    <div>
                      <p style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Test Weather Adaptation Mode
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {WEATHER_SIM_MODES.map((m) => {
                          const active = weatherSimMode === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => setWeatherSimMode(m.id)}
                              style={{
                                padding: '6px 10px', borderRadius: '10px', cursor: 'pointer',
                                background: active ? 'rgba(0, 216, 255, 0.18)' : 'var(--bg-elevated)',
                                border: active ? '1px solid #00D8FF' : '1px solid var(--border-ui)',
                                color: active ? '#00D8FF' : 'var(--text-muted)',
                                fontSize: '0.7rem', fontWeight: 800
                              }}
                            >
                              {m.icon} {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* ═════════════════════════════════════════════════════════════════
                    SUB-TAB 2: PROJECT-SYNCHRONIZED FUTURE PRICE PREDICTION
                    ═════════════════════════════════════════════════════════════════ */}
                {chubbyAITab === 'future' && (() => {
                  const slots = projectForecast.timeline || [];
                  const activeSlot = projectForecast.customSlot || slots[selectedForecastIdx] || slots[0];
                  const fares = slots.map((s) => s.fare);
                  const minF = Math.min(...fares, 1);
                  const maxF = Math.max(...fares, minF + 10);
                  const svgW = 320;
                  const svgH = 92;
                  const pts = slots.map((s, idx) => {
                    const x = 18 + (idx / Math.max(1, slots.length - 1)) * (svgW - 36);
                    const y = svgH - 18 - ((s.fare - minF) / Math.max(1, maxF - minF)) * (svgH - 36);
                    return { x, y, slot: s, idx };
                  });
                  const polylineStr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                  const areaStr = `18,${svgH - 12} ${polylineStr} ${svgW - 18},${svgH - 12}`;

                  return (
                    <>
                      {/* AI Book Now vs Wait Verdict */}
                      <div style={{
                        background: projectForecast.shouldWait
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(0, 216, 255, 0.12))'
                          : 'linear-gradient(135deg, rgba(0, 216, 255, 0.16), rgba(99, 102, 241, 0.14))',
                        border: `1.5px solid ${projectForecast.shouldWait ? 'rgba(16, 185, 129, 0.5)' : 'rgba(0, 216, 255, 0.45)'}`,
                        borderRadius: '18px', padding: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: 900, color: projectForecast.shouldWait ? '#10B981' : '#00D8FF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            📈 AI FUTURE PRICE PREDICTION · {(activeCategory === 'all' ? 'CAB 4S' : activeCategory).toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.62rem', fontWeight: 900, padding: '2px 7px', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.18)', color: '#10B981' }}>
                            {projectForecast.confidencePct}% ML Confidence
                          </span>
                        </div>
                        <p style={{ fontSize: '0.84rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.38 }}>
                          {projectForecast.verdict}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.68rem', fontWeight: 800 }}>
                          <span style={{ padding: '3px 8px', borderRadius: '8px', background: 'var(--bg-elevated)', color: 'var(--text-main)' }}>
                            Now: ₹{projectForecast.currentFare} ({projectForecast.currentSurge}x)
                          </span>
                          <span style={{ padding: '3px 8px', borderRadius: '8px', background: 'rgba(16,185,129,0.16)', color: '#10B981' }}>
                            Best: ₹{projectForecast.bestWindow?.fare} @ {projectForecast.bestWindow?.time}
                          </span>
                          <span style={{ padding: '3px 8px', borderRadius: '8px', background: 'rgba(239,68,68,0.14)', color: '#EF4444' }}>
                            Peak: ₹{projectForecast.peakWindow?.avgFare} @ {projectForecast.peakWindow?.time}
                          </span>
                        </div>
                      </div>

                      {/* Interactive SVG Trend Curve */}
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            6-Hour Route Price Curve ({distanceKm} km)
                          </span>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                            Tap any slot below
                          </span>
                        </div>
                        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: '94px', overflow: 'visible' }}>
                          <defs>
                            <linearGradient id="reactFpGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00D8FF" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#00D8FF" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          <polygon points={areaStr} fill="url(#reactFpGrad)" />
                          <polyline points={polylineStr} fill="none" stroke="#00D8FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {pts.map((p) => {
                            const isSel = !projectForecast.customSlot && selectedForecastIdx === p.idx;
                            const isBest = p.slot.offsetMinutes === projectForecast.bestWindow?.offsetMinutes;
                            return (
                              <g key={p.idx} style={{ cursor: 'pointer' }} onClick={() => { setCustomForecastTime(''); setSelectedForecastIdx(p.idx); }}>
                                <circle cx={p.x} cy={p.y} r={isSel ? 5.5 : 4} fill={isBest ? '#10B981' : isSel ? '#00D8FF' : '#6366F1'} stroke="#080C14" strokeWidth="1.5" />
                                <text x={p.x} y={p.y - 8} textAnchor="middle" fill={isBest ? '#10B981' : '#E2E8F0'} fontSize="8.5" fontWeight="800">₹{p.slot.fare}</text>
                                <text x={p.x} y={svgH - 2} textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="700">{p.slot.label}</text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Time-Slot Selector */}
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
                        {slots.map((s, idx) => {
                          const isSel = !projectForecast.customSlot && selectedForecastIdx === idx;
                          const isBest = s.offsetMinutes === projectForecast.bestWindow?.offsetMinutes;
                          return (
                            <button
                              key={idx}
                              onClick={() => { setCustomForecastTime(''); setSelectedForecastIdx(idx); }}
                              style={{
                                minWidth: '68px', flexShrink: 0, padding: '8px 6px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                                background: isSel ? 'rgba(0, 216, 255, 0.18)' : isBest ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-elevated)',
                                border: `1.5px solid ${isSel ? '#00D8FF' : isBest ? '#10B981' : 'var(--border-ui)'}`,
                              }}
                            >
                              <div style={{ fontSize: '0.64rem', fontWeight: 800, color: isSel ? '#00D8FF' : 'var(--text-muted)' }}>{s.label}</div>
                              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{s.time}</div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 900, color: isBest ? '#10B981' : 'var(--text-main)', marginTop: '2px' }}>₹{s.fare}</div>
                              <div style={{ fontSize: '0.56rem', fontWeight: 800, color: s.surge >= 1.3 ? '#EF4444' : s.surge > 1.08 ? '#F59E0B' : '#10B981' }}>{s.surge}x</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Departure Time Picker */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '8px 12px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)' }}>🕒 Predict Custom Time:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="time"
                            value={customForecastTime}
                            onChange={(e) => setCustomForecastTime(e.target.value)}
                            style={{ padding: '5px 8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-ui)', color: 'var(--text-main)', fontSize: '0.74rem', fontWeight: 800 }}
                          />
                          {customForecastTime && (
                            <button onClick={() => setCustomForecastTime('')} style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer' }}>✕</button>
                          )}
                        </div>
                      </div>

                      {/* Per-Provider Predicted Fare Breakdown (Synced to Project Apps) */}
                      {activeSlot && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 900, color: 'var(--text-main)' }}>
                              Predicted App Fares @ {activeSlot.time} ({activeSlot.label})
                            </span>
                            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: activeSlot.surge >= 1.3 ? '#EF4444' : '#10B981' }}>
                              {activeSlot.demandLabel} · {activeSlot.surge}x
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {activeSlot.providers.map((p, i) => (
                              <div key={p.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: i === 0 ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)', border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.35)' : 'var(--border-ui)'}` }}>
                                <div>
                                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                    {i === 0 ? '🏆 ' : ''}{p.rideType} <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>({p.name})</span>
                                  </div>
                                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                                    Now: ₹{p.currentFare} · Est. Surge: {p.surge}x
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: i === 0 ? '#10B981' : 'var(--text-main)' }}>₹{p.predictedFare}</div>
                                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: p.deltaVsNow < 0 ? '#10B981' : p.deltaVsNow > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                                    {p.deltaVsNow < 0 ? `Save ₹${Math.abs(p.deltaVsNow)}` : p.deltaVsNow > 0 ? `+₹${p.deltaVsNow} higher` : 'Same as now'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 1-Tap Arm Price Sniper at Predicted Lowest Price */}
                      <button
                        onClick={() => {
                          const targetVal = projectForecast.bestWindow?.fare || projectForecast.currentFare;
                          setSniperInputPrice(String(targetVal));
                          setChubbyAITab('sniper');
                        }}
                        style={{
                          width: '100%', padding: '11px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                          background: 'linear-gradient(135deg, #10B981, #00D8FF)', color: '#080C14',
                          fontSize: '0.78rem', fontWeight: 900
                        }}
                      >
                        🎯 Arm Price Sniper at Predicted Lowest (₹{projectForecast.bestWindow?.fare})
                      </button>
                    </>
                  );
                })()}

                {/* ═════════════════════════════════════════════════════════════════
                    SUB-TAB 6: TARGET PRICE SNIPER + FUTURE SURGE PREDICTOR
                    ═════════════════════════════════════════════════════════════════ */}
                {chubbyAITab === 'sniper' && (
                  <>
                    {/* 🎯 TARGET PRICE SNIPER CARD */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(0, 216, 255, 0.12))',
                      border: `1.5px solid ${activeSniper ? '#10B981' : 'rgba(0, 216, 255, 0.4)'}`,
                      borderRadius: '18px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#10B981', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                            🎯 AUTOMATED TARGET PRICE SNIPER
                          </span>
                          <h4 style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                            {activeSniper
                              ? `Watching Live · Target ≤ ₹${activeSniper.targetPrice}`
                              : 'Set Your Target Fare Budget'}
                          </h4>
                        </div>
                        {activeSniper && (
                          <span style={{ padding: '3px 8px', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', fontSize: '0.64rem', fontWeight: 900 }}>
                            ● ARMED
                          </span>
                        )}
                      </div>

                      {/* Target Price Input + Provider Selector */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)' }}>TARGET PRICE (₹)</label>
                          <input
                            type="number"
                            min="1"
                            value={sniperInputPrice}
                            onChange={(e) => setSniperInputPrice(e.target.value)}
                            placeholder="e.g. 47, 150, 580"
                            style={{
                              width: '100%', marginTop: '3px', padding: '8px 10px', borderRadius: '10px',
                              background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)',
                              color: 'var(--text-main)', fontSize: '0.92rem', fontWeight: 900, outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)' }}>WATCH APP</label>
                          <select
                            value={sniperProvider}
                            onChange={(e) => setSniperProvider(e.target.value)}
                            style={{
                              width: '100%', marginTop: '3px', padding: '9px 8px', borderRadius: '10px',
                              background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)',
                              color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 800, outline: 'none'
                            }}
                          >
                            <option value="all">All Apps (Fastest Hit)</option>
                            <option value="smartride">SmartRide AI</option>
                            <option value="nammayatri">Namma Yatri</option>
                            <option value="uber">Uber</option>
                            <option value="ola">Ola</option>
                            <option value="rapido">Rapido</option>
                          </select>
                        </div>
                      </div>

                      {/* Quick Discount Target Chips */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[5, 10, 15, 20].map((pct) => {
                          const liveMin = displayOptions[0]?.fare || 200;
                          const val = Math.max(10, Math.round(liveMin * (1 - pct / 100)));
                          return (
                            <button
                              key={pct}
                              onClick={() => setSniperInputPrice(String(val))}
                              style={{
                                padding: '4px 9px', borderRadius: '8px', cursor: 'pointer',
                                background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)',
                                color: '#00D8FF', fontSize: '0.68rem', fontWeight: 800
                              }}
                            >
                              -{pct}% (₹{val})
                            </button>
                          );
                        })}
                      </div>

                      {/* Live Sniper Evaluation Box */}
                      {activeSniper && (
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '10px 12px', border: '1px solid var(--border-ui)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Live Best: <strong style={{ color: 'var(--text-main)' }}>₹{sniperEval.bestCurrentFare}</strong></span>
                            <span style={{ color: sniperEval.isHit ? '#10B981' : '#F59E0B' }}>
                              {sniperEval.isHit ? '🎯 HIT!' : `₹${sniperEval.gapAmount} away · ${sniperEval.probabilityPercent}% odds`}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.35 }}>
                            {sniperEval.statusText}
                          </p>
                        </div>
                      )}

                      {/* Arm / Disarm / Test Trigger Actions */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleArmSniper()}
                          style={{
                            flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #10B981, #00D8FF)',
                            color: '#080C14', fontWeight: 900, fontSize: '0.78rem'
                          }}
                        >
                          {activeSniper ? `🔄 Update Sniper (₹${sniperInputPrice})` : `🎯 Arm Price Sniper (₹${sniperInputPrice || '...'})`}
                        </button>
                        {activeSniper && (
                          <button
                            onClick={handleDisarmSniper}
                            style={{
                              padding: '10px 12px', borderRadius: '12px', cursor: 'pointer',
                              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#EF4444', fontWeight: 800, fontSize: '0.74rem'
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <button
                        onClick={handleSimulateSniperHit}
                        style={{
                          width: '100%', padding: '7px', borderRadius: '10px', cursor: 'pointer',
                          background: 'transparent', border: '1px dashed rgba(0, 216, 255, 0.4)',
                          color: '#00D8FF', fontSize: '0.68rem', fontWeight: 800
                        }}
                      >
                        ⚡ Test Sniper Alert Chime & 1-Tap Book Popup
                      </button>
                    </div>

                    {/* Surge Drop Advisory Card */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(99, 102, 241, 0.12))', 
                      border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '18px', padding: '14px',
                      display: 'flex', alignItems: 'flex-start', gap: '10px'
                    }}>
                      <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '10px', flexShrink: 0 }}>
                        <Clock size={20} color="#F59E0B" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          SURGE COOLING ADVISOR
                        </span>
                        <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px', lineHeight: '1.4' }}>
                          {futurePricing.advice}
                        </p>
                        {futurePricing.savingsIn15 > 0 && (
                          <p style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800, marginTop: '4px' }}>
                            💡 Potential Savings: ₹{futurePricing.savingsIn15} by waiting 15–20 minutes
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Projected Timeline Cards */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          Projected Price Curve
                        </h4>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          Base: ₹{futurePricing.baseFare} (1.0x)
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                        {futurePricing.timeline.map((slot, idx) => {
                          const isNow = slot.offsetMinutes === 0;
                          const is15m = slot.offsetMinutes === 15;
                          return (
                            <div 
                              key={idx}
                              style={{
                                background: isNow 
                                  ? 'rgba(239, 68, 68, 0.12)' 
                                  : is15m 
                                    ? 'rgba(16, 185, 129, 0.15)' 
                                    : 'var(--bg-elevated)',
                                border: `1px solid ${isNow ? 'rgba(239, 68, 68, 0.4)' : is15m ? '#10B981' : 'var(--border-ui)'}`,
                                borderRadius: '14px', padding: '10px 4px', textAlign: 'center',
                                position: 'relative'
                              }}
                            >
                              {is15m && (
                                <div style={{ position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)', background: '#10B981', color: '#080C14', fontSize: '0.5rem', fontWeight: 900, padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                  SAVE ₹{slot.savings}
                                </div>
                              )}
                              <p style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                {slot.label}
                              </p>
                              <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                {slot.time}
                              </p>
                              <p style={{ fontSize: '0.98rem', fontWeight: 900, color: is15m ? '#10B981' : isNow ? '#EF4444' : 'var(--text-main)', marginTop: '4px' }}>
                                ₹{slot.fare}
                              </p>
                              <span style={{ fontSize: '0.58rem', fontWeight: 800, color: slot.surge > 1.05 ? '#F59E0B' : '#10B981' }}>
                                {slot.surge}x
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notification / Alert Button */}
                    <button
                      onClick={() => setNotifiedPriceDrop(true)}
                      disabled={notifiedPriceDrop}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '14px',
                        background: notifiedPriceDrop ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
                        border: `1px solid ${notifiedPriceDrop ? '#10B981' : 'var(--border-ui)'}`,
                        color: notifiedPriceDrop ? '#10B981' : 'var(--text-main)',
                        fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }}
                    >
                      {notifiedPriceDrop ? (
                        <>
                          <CheckCircle2 size={16} color="#10B981" />
                          Alert Set: We'll ping you when fare drops to ₹{futurePricing.projectedFareIn15}!
                        </>
                      ) : (
                        <>
                          <Bell size={16} color="var(--brand-cyan)" />
                          Notify Me When Price Drops to ₹{futurePricing.projectedFareIn15}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AIChatBot 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        pickup={pickup} 
        dropoff={destination} 
        competitors={displayOptions}
        selectedRide={selectedOption}
        onSelectTransitMode={() => {
          setShowChubbyAIModal(true);
          setChubbyAITab('multimodal');
          setChatOpen(false);
        }}
      />
    </div>
  );
};

export default RideComparison;
