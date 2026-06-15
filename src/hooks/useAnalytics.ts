import { useState, useEffect, useMemo, useRef } from 'react';
import { getAnalytics, type AnalyticsData } from '../services/analyticsService';
import { THREAT_COLORS } from '../constants/analyticsUtils';
import { useConnection } from '../context/ConnectionContext';

/**
 * Custom hook for fetching and aggregating analytics data.
 * Implements polling mechanism to keep metrics current, and manages
 * time range filter state. Uses useMemo for optimizing threat distribution calculations.
 */
export function useAnalytics() {
  const [timeRange, setTimeRange] = useState('24h');
  const [appliedStart, setAppliedStart] = useState('');
  const [appliedEnd, setAppliedEnd] = useState('');

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [inputStart, setInputStart] = useState('');
  const [inputEnd, setInputEnd] = useState('');

  const { isOnline } = useConnection();
  const previousIsOnline = useRef(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const fetchAnalyticsData = (isInitial = false) => {
      if (isInitial) setLoading(true);

      getAnalytics(timeRange, appliedStart, appliedEnd)
        .then(setData)
        .catch((err) => console.error('Analytics load error:', err))
        .finally(() => {
          if (isInitial) setLoading(false);
        });
    };

    fetchAnalyticsData(true);

    const intervalId = setInterval(() => {
      fetchAnalyticsData(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [timeRange, appliedStart, appliedEnd]);

  // Rehydrate data when connection is restored (false -> true transition)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!previousIsOnline.current && isOnline) {
      console.log('Connection restored, rehydrating analytics data');
      setLoading(true);
      getAnalytics(timeRange, appliedStart, appliedEnd)
        .then(setData)
        .catch((err) => console.error('Analytics load error:', err))
        .finally(() => {
          setLoading(false);
        });
    }

    previousIsOnline.current = isOnline;
  }, [isOnline, timeRange, appliedStart, appliedEnd]);

  const handleStandardRangeChange = (range: string) => {
    setShowDatePicker(false);
    if (range === timeRange) return;
    setTimeRange(range);
  };

  const handleCustomRangeApply = () => {
    if (!inputStart || !inputEnd) return;
    setAppliedStart(inputStart);
    setAppliedEnd(inputEnd);
    setTimeRange('custom');
  };

  const distributionData = useMemo(() => {
    if (!data?.threatDistribution) return [];
    return data.threatDistribution.map(item => ({
      ...item,
      color: THREAT_COLORS[item.name] || '#6b7280'
    })).sort((a, b) => b.value - a.value);
  }, [data]);

  const mostFrequent = distributionData[0] ?? null;

  return {
    data,
    loading,
    timeRange,
    showDatePicker,
    setShowDatePicker,
    inputStart,
    setInputStart,
    inputEnd,
    setInputEnd,
    handleStandardRangeChange,
    handleCustomRangeApply,
    distributionData,
    mostFrequent,
  };
}