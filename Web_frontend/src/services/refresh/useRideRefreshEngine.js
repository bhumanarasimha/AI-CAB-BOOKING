import { useState, useEffect, useRef, useCallback } from 'react';
import { UberProvider } from '../providers/UberProvider';
import { OlaProvider } from '../providers/OlaProvider';
import { RapidoProvider } from '../providers/RapidoProvider';
import { NammaYatriProvider } from '../providers/NammaYatriProvider';
import { SmartRideProvider } from '../providers/SmartRideProvider';
import { normalizeRideData } from '../normalization/normalizeRideData';
import { EMMDEDecisionEngine } from '../agents/EMMDEDecisionEngine';

const DEFAULT_CONTEXT = { weather: 'clear', urgency: 'normal' };

export const useRideRefreshEngine = ({
  origin,
  destination,
  activeCategory = 'cab4',
  userPreferences = 'balanced',
  refreshIntervalMs = 10000,
  contextInputs = DEFAULT_CONTEXT,
}) => {
  const [rawRideOptions, setRawRideOptions] = useState([]);
  const [processedResult, setProcessedResult] = useState({
    rankedOptions: [],
    topPick: null,
    decisionExplanation: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const previousOptionsRef = useRef(new Map());

  const originLat = origin?.lat;
  const originLng = origin?.lng;
  const weather = contextInputs?.weather || 'clear';
  const urgency = contextInputs?.urgency || 'normal';

  const fetchAndProcess = useCallback(async (isManualTrigger = false) => {
    if (isManualTrigger) {
      setIsRefreshing(true);
    }

    try {
      const [uberData, olaData, rapidoData, nammaData, smartData] = await Promise.all([
        UberProvider.fetchOptions({ origin, destination, isLiveMode }),
        OlaProvider.fetchOptions({ origin, destination, isLiveMode }),
        RapidoProvider.fetchOptions({ origin, destination, isLiveMode }),
        NammaYatriProvider.fetchOptions({ origin, destination, isLiveMode }),
        SmartRideProvider.fetchOptions({ origin, destination, isLiveMode }),
      ]);

      const allRaw = [...uberData, ...olaData, ...rapidoData, ...nammaData, ...smartData];
      setRawRideOptions(allRaw);

      const now = new Date();
      const newPrevMap = new Map();

      const normalizedList = allRaw.map(raw => {
        const tempId = `${raw.rawProvider.toLowerCase()}_${raw.type.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const previousItem = previousOptionsRef.current.get(tempId) || null;

        const normalized = normalizeRideData(raw, previousItem, now);
        newPrevMap.set(normalized.id, normalized);
        return normalized;
      });

      previousOptionsRef.current = newPrevMap;
      setLastUpdatedTime(now);
      setSecondsAgo(0);

      const categoryFiltered = activeCategory === 'all' 
        ? normalizedList 
        : normalizedList.filter(o => o.category === activeCategory);

      const decisionResult = EMMDEDecisionEngine.process({
        rideOptions: categoryFiltered.length > 0 ? categoryFiltered : normalizedList,
        userPreferences,
        contextInputs: { weather, urgency },
      });

      setProcessedResult(decisionResult);
    } catch (error) {
      console.error('Error fetching ride data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originLat, originLng, destination, isLiveMode, activeCategory, userPreferences, weather, urgency]);

  useEffect(() => {
    fetchAndProcess();
  }, [fetchAndProcess]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAndProcess();
      }
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [refreshIntervalMs, fetchAndProcess]);

  useEffect(() => {
    const ticker = setInterval(() => {
      setLastUpdatedTime(prev => {
        const diffSec = Math.max(0, Math.floor((new Date() - prev) / 1000));
        setSecondsAgo(diffSec);
        return prev;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  return {
    rawRideOptions,
    rankedOptions: processedResult.rankedOptions,
    topPick: processedResult.topPick,
    decisionExplanation: processedResult.decisionExplanation,
    isLoading,
    isRefreshing,
    isLiveMode,
    setIsLiveMode,
    lastUpdatedTime,
    secondsAgo,
    manualRefresh: () => fetchAndProcess(true),
  };
};
