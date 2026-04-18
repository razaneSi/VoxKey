import { useState, useCallback, useRef, useEffect } from "react";

export interface KeystrokeMetrics {
  timestamp: number;
  duration: number;
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
    averageAccuracy: 95,
    keyPattern: new Map(),
    keystrokeTimings: [],
  });

  const keyPressData = useRef<Record<string, number>>({});
  const keystrokeTiming = useRef<KeystrokeMetrics[]>([]);
  const lastTime = useRef<number>(0);

  const startTracking = useCallback(() => {
    setIsTracking(true);
    keystrokeTiming.current = [];
    keyPressData.current = {};
    lastTime.current = performance.now();
  }, []);

  const stopTracking = useCallback((): KeyboardMetrics => {
    setIsTracking(false);

    const totalKeystrokes = keystrokeTiming.current.length;

    const intervals = keystrokeTiming.current
      .map((_, i, arr) =>
        i === 0 ? 0 : arr[i].timestamp - arr[i - 1].timestamp
      )
      .slice(1)
      .filter((v) => v > 0);

    const avgInterval =
      intervals.length > 0
        ? intervals.reduce((a, b) => a + b, 0) / intervals.length
        : 0;

    const averageSpeed =
      avgInterval > 0 ? 60000 / avgInterval : 0; // WPM approx

    const keyPattern = new Map<string, number>();

    keystrokeTiming.current.forEach((k) => {
      keyPattern.set("keys", (keyPattern.get("keys") || 0) + 1);
    });

    const result: KeyboardMetrics = {
      totalKeystrokes,
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      averageAccuracy: 95,
      keyPattern,
      keystrokeTimings: keystrokeTiming.current,
    };

    setMetrics(result);
    return result;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isTracking) return;

      const key = event.key;
      if (keyPressData.current[key]) return; // prevent repeat spam

      keyPressData.current[key] = performance.now();
    },
    [isTracking]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!isTracking) return;

      const key = event.key;
      const now = performance.now();

      const pressTime = keyPressData.current[key];
      if (!pressTime) return;

      const duration = now - pressTime;

      keystrokeTiming.current.push({
        timestamp: now,
        duration,
      });

      lastTime.current = now;

      // lightweight real-time update (no Map rebuild every time)
      setMetrics((prev) => ({
        ...prev,
        totalKeystrokes: keystrokeTiming.current.length,
        keystrokeTimings: keystrokeTiming.current,
      }));

      delete keyPressData.current[key];
    },
    [isTracking]
  );

  useEffect(() => {
    if (!isTracking) return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isTracking, handleKeyDown, handleKeyUp]);

  const clearMetrics = useCallback(() => {
    keystrokeTiming.current = [];
    keyPressData.current = {};

    setMetrics({
      totalKeystrokes: 0,
      averageSpeed: 0,
      averageAccuracy: 95,
      keyPattern: new Map(),
      keystrokeTimings: [],
    });
  }, []);

  return {
    isTracking,
    metrics,
    startTracking,
    stopTracking,
    clearMetrics,
  };
};