import { useState, useCallback, useRef, useEffect } from 'react';

export interface KeystrokeMetrics {
  timestamp: number;
  key: string;
  duration: number;
  interval: number;
}

export interface KeyboardMetrics {
  totalKeystrokes: number;
  averageSpeed: number;
  averageAccuracy: number;
  keyPattern: Map<string, number>;
  keystrokeTimings: KeystrokeMetrics[];
}

export const useKeyboard = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [metrics, setMetrics] = useState<KeyboardMetrics>({
    totalKeystrokes: 0,
    averageSpeed: 0,
    averageAccuracy: 0,
    keyPattern: new Map(),
    keystrokeTimings: [],
  });

  const [error, setError] = useState<string | null>(null);

  const keyPressData = useRef<{
    [key: string]: { pressTime: number; releaseTime?: number };
  }>({});

  const lastKeystrokeTime = useRef<number>(0);
  const keystrokeTiming = useRef<KeystrokeMetrics[]>([]);

  const startTracking = useCallback(() => {
    setIsTracking(true);
    keystrokeTiming.current = [];
    keyPressData.current = {};
    lastKeystrokeTime.current = Date.now();
    setError(null);
  }, []);

  const stopTracking = useCallback((): KeyboardMetrics => {
    setIsTracking(false);

    // Calculate metrics
    const totalKeystrokes = keystrokeTiming.current.length;
    const intervals = keystrokeTiming.current
      .slice(1)
      .map((k) => k.interval)
      .filter((i) => i > 0);

    const averageSpeed = intervals.length > 0 ? 60000 / (intervals.reduce((a, b) => a + b) / intervals.length) : 0; // WPM
    const keyPattern = new Map<string, number>();

    keystrokeTiming.current.forEach((k) => {
      keyPattern.set(k.key, (keyPattern.get(k.key) || 0) + 1);
    });

    const newMetrics: KeyboardMetrics = {
      totalKeystrokes,
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      averageAccuracy: 95, // Placeholder - would be calculated from comparisons
      keyPattern,
      keystrokeTimings: keystrokeTiming.current,
    };

    setMetrics(newMetrics);
    return newMetrics;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isTracking) return;

      const key = event.key;
      const now = Date.now();

      keyPressData.current[key] = {
        pressTime: now,
      };
    },
    [isTracking]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!isTracking) return;

      const key = event.key;
      const now = Date.now();

      if (keyPressData.current[key]) {
        const pressTime = keyPressData.current[key].pressTime;
        const duration = now - pressTime;
        const interval = now - lastKeystrokeTime.current;

        keystrokeTiming.current.push({
          timestamp: now,
          key,
          duration,
          interval,
        });

        lastKeystrokeTime.current = now;

        // Update real-time metrics
        setMetrics((prev) => ({
          ...prev,
          totalKeystrokes: prev.totalKeystrokes + 1,
          keystrokeTimings: keystrokeTiming.current,
        }));

        delete keyPressData.current[key];
      }
    },
    [isTracking]
  );

  // Attach keyboard listeners
  useEffect(() => {
    if (!isTracking) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isTracking, handleKeyDown, handleKeyUp]);

  const clearMetrics = useCallback(() => {
    keystrokeTiming.current = [];
    keyPressData.current = {};
    setMetrics({
      totalKeystrokes: 0,
      averageSpeed: 0,
      averageAccuracy: 0,
      keyPattern: new Map(),
      keystrokeTimings: [],
    });
    setError(null);
  }, []);

  return {
    isTracking,
    metrics,
    error,
    startTracking,
    stopTracking,
    clearMetrics,
  };
};
