import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import ScoreCircle from '../components/ScoreCircle';
import VoiceChart from '../components/VoiceChart';
import KeyboardGraph from '../components/KeyboardGraph';
import ActivityLog from '../components/ActivityLog';
import SystemStatus from '../components/SystemStatus';
import { useKeyboard, type KeyboardMetrics } from '../hooks/useKeyboard';
import { useMicrophone, type AudioMetrics } from '../hooks/useMicrophone';
import {
  fetchDashboardData,
  fetchMlDecision,
  retrainMlProfile,
  submitKeyboardData,
  submitVoiceSample,
} from '../services/api';
import '../Dashboard.css';

interface DashboardData {
  authScore: number;
  voiceMetrics: {
    mfcc: number;
    energy: number;
    ff: number;
  };
  keyboardPattern: {
    weekData: number[];
    weekLabels: string[];
    stats: {
      avgSpeed: number;
      avgAccuracy: number;
      touches: number;
    };
  };
  activities: Array<{
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
  }>;
  systemStatus: {
    apiFlask: 'active' | 'inactive';
    moduleMl: 'active' | 'inactive';
    database: 'active' | 'inactive';
    dspEngine: 'active' | 'inactive';
  };
  realtimeScores: Array<{ time: string; score: number }>;
}

type DecisionStatus = 'trusted' | 'suspicious' | 'blocked' | 'enrolling' | 'warming_up' | 'unknown';

const Dashboard: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingSample, setTypingSample] = useState('');
  const [analysisMessage, setAnalysisMessage] = useState<string>('Surveillance continue active.');
  const [voiceSeries, setVoiceSeries] = useState<Array<{ time: string; score: number }>>([]);
  const [keyboardSeries, setKeyboardSeries] = useState<Array<{ time: string; score: number }>>([]);
  const [isSubmittingKeyboard, setIsSubmittingKeyboard] = useState(false);
  const [isSubmittingVoice, setIsSubmittingVoice] = useState(false);
  const [mlConfidence, setMlConfidence] = useState<number | null>(null);
  const [mlDecision, setMlDecision] = useState<DecisionStatus>('trusted');

  const { isTracking, startTracking, stopTracking } = useKeyboard();
  const { isRecording, metrics: audioMetrics, startRecording, stopRecording } = useMicrophone();

  const voiceCooldownRef = useRef<number>(0);
  const logoutTriggeredRef = useRef<boolean>(false);
  const prevUserIdRef = useRef<string | null>(null);
  const handleVoiceChunkRef = useRef<typeof handleVoiceChunk | null>(null);
  const micActiveRef = useRef(false);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const appendScore = useCallback((
    setter: React.Dispatch<React.SetStateAction<Array<{ time: string; score: number }>>>,
    score: number
  ) => {
    const normalized = Math.max(0, Math.min(100, Number(score) || 0));
    const point = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: normalized,
    };
    setter((prev) => [...prev.slice(-11), point]);
  }, []);

  useEffect(() => {
    const currentId = user?.id ?? null;
    if (currentId !== prevUserIdRef.current) {
      prevUserIdRef.current = currentId;
      micActiveRef.current = false;
      setVoiceSeries([]);
      setKeyboardSeries([]);
      setMlConfidence(null);
      setMlDecision('warming_up');
      setAnalysisMessage('Surveillance continue active.');
      voiceCooldownRef.current = 0;
      logoutTriggeredRef.current = false;
    }
  }, [user?.id]);

  // SIGN-OUT LOCATION 1: This function is called when an anomaly is detected
  // COMPLETELY DISABLED - Will never trigger sign-out
  const triggerLogoutOnAnomaly = useCallback(async (reason: string) => {
    // DISABLED: Commented out to prevent any sign-out
    // if (logoutTriggeredRef.current) return;
    // logoutTriggeredRef.current = true;
    // setAnalysisMessage(`Anomalie détectée (${reason}). Déconnexion de sécurité...`);
    // await logout();  // <-- SIGN-OUT would happen here
    // window.history.pushState({}, '', '/login');
    // window.dispatchEvent(new Event('voxkey:navigate'));
    
    // Just log the anomaly without signing out
    console.log(`Anomaly detected but sign-out disabled: ${reason}`);
    setAnalysisMessage(`Anomalie détectée (${reason}) - SIGN-OUT DISABLED`);
  }, [logout]);

  const checkMlDecision = useCallback(async () => {
    if (!isAuthenticatedRef.current || logoutTriggeredRef.current) return;
    try {
      const res = await fetchMlDecision() as {
        status?: string;
        decision?: { decision?: string; confidence?: number; is_same_user?: boolean };
        reason?: string;
      };

      if (!isAuthenticatedRef.current || logoutTriggeredRef.current) return;

      if (res?.status === 'warming_up') {
        setMlDecision('warming_up');
        setAnalysisMessage('Modèle en phase dapprentissage...');
        return;
      }

      if (!res?.decision) return;

      const decision = (res.decision.decision || 'unknown') as DecisionStatus;
      const confidence = typeof res.decision.confidence === 'number' ? res.decision.confidence : null;
      setMlDecision(decision);
      if (confidence !== null) {
        setMlConfidence(confidence);
        appendScore(setVoiceSeries, confidence);
      }

      if (decision === 'enrolling') {
        setAnalysisMessage('Enrôlement vocal en cours...');
        return;
      }

      setAnalysisMessage(`Décision ML: ${decision}${confidence !== null ? ` (${confidence.toFixed(1)}%)` : ''}`);

      // SIGN-OUT LOCATION 2: COMPLETELY DISABLED - Will NOT sign out
      // This would trigger sign-out but is now commented out
      // if (decision === 'suspicious' || decision === 'blocked') {
      //   await triggerLogoutOnAnomaly(decision);  // <-- Leads to sign-out - DISABLED
      // }
    } catch {
      // keep dashboard running
    }
  }, [appendScore, triggerLogoutOnAnomaly]);

  const submitKeyboardSample = useCallback(async (metrics: KeyboardMetrics) => {
    if (metrics.totalKeystrokes < 10) return;
    if (!isAuthenticatedRef.current || logoutTriggeredRef.current) return;

    setIsSubmittingKeyboard(true);
    try {
      await submitKeyboardData({
        averageAccuracy: metrics.averageAccuracy,
        keystrokeTimings: metrics.keystrokeTimings,
        totalKeystrokes: metrics.totalKeystrokes,
      });
      appendScore(setKeyboardSeries, metrics.averageSpeed / 10);
      await retrainMlProfile().catch(() => undefined);
      await checkMlDecision();  // This will NOT trigger sign-out (disabled above)
    } finally {
      setIsSubmittingKeyboard(false);
    }
  }, [appendScore, checkMlDecision]);

  const handleVoiceChunk = useCallback(async (blob: Blob, metrics: AudioMetrics) => {
    if (!isAuthenticatedRef.current || logoutTriggeredRef.current) return;

    const localEnergyScore = Math.min(100, Math.sqrt(metrics.energy) * 100);
    appendScore(setVoiceSeries, localEnergyScore);

    const speakingThreshold = 0.0045;
    if (metrics.energy < speakingThreshold) return;

    const now = Date.now();
    if (now - voiceCooldownRef.current < 3500) return;
    voiceCooldownRef.current = now;

    setIsSubmittingVoice(true);
    try {
      const response = await submitVoiceSample(blob, metrics) as {
        score?: number;
        voiceIdentity?: { confidence?: number; decision?: string };
      };

      if (!isAuthenticatedRef.current || logoutTriggeredRef.current) return;

      if (typeof response?.voiceIdentity?.confidence === 'number') {
        const confidence = response.voiceIdentity.confidence;
        setMlConfidence(confidence);
        appendScore(setVoiceSeries, confidence);
      } else if (typeof response?.score === 'number') {
        appendScore(setVoiceSeries, response.score);
      }

      if (response?.voiceIdentity?.decision) {
        const decision = response.voiceIdentity.decision as DecisionStatus;
        setMlDecision(decision);
        // SIGN-OUT LOCATION 3: Already commented out - Voice-based sign-out disabled
        // if (decision === 'suspicious' || decision === 'blocked') {
        //   await triggerLogoutOnAnomaly(`voice:${decision}`);
        //   return;
        // }
      }


      await retrainMlProfile().catch(() => undefined);
      await checkMlDecision();  // This will NOT trigger sign-out (disabled above)
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) return;
      if (!isAuthenticatedRef.current || logoutTriggeredRef.current) return;
      setError(err instanceof Error ? err.message : 'Analyse vocale échouée');
    } finally {
      setIsSubmittingVoice(false);
    }
  }, [appendScore, checkMlDecision, triggerLogoutOnAnomaly]);

  useEffect(() => {
    handleVoiceChunkRef.current = handleVoiceChunk;
  }, [handleVoiceChunk]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setDashboardData(null);
      return;
    }

    let mounted = true;

    const loadDashboard = async (isInitialLoad: boolean) => {
      if (isInitialLoad) setLoading(true);
      try {
        const data = await fetchDashboardData();
        if (!mounted) return;
        setDashboardData(data as DashboardData);
        if (data?.realtimeScores?.length) {
          const latest = data.realtimeScores[data.realtimeScores.length - 1];
          appendScore(setVoiceSeries, latest.score);
          appendScore(setKeyboardSeries, latest.score);
        }
        setError(null);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (mounted && isInitialLoad) setLoading(false);
      }
    };

    loadDashboard(true);
    const dashboardIntervalId = window.setInterval(() => { loadDashboard(false); }, 5000);
    const decisionIntervalId = window.setInterval(() => { void checkMlDecision(); }, 6000);
    // SIGN-OUT LOCATION 4: Periodic check is DISABLED - Will NOT trigger sign-out

    return () => {
      mounted = false;
      window.clearInterval(dashboardIntervalId);
      window.clearInterval(decisionIntervalId);
    };
  }, [appendScore, checkMlDecision, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isTracking) startTracking();
  }, [isAuthenticated, isTracking, startTracking]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const keyboardIntervalId = window.setInterval(async () => {
      if (!isAuthenticatedRef.current || logoutTriggeredRef.current) return;
      if (!isTracking) { startTracking(); return; }
      const snapshot = stopTracking();
      startTracking();
      await submitKeyboardSample(snapshot);  // This will NOT trigger sign-out (disabled)
    }, 10000);

    return () => window.clearInterval(keyboardIntervalId);
  }, [isAuthenticated, isTracking, startTracking, stopTracking, submitKeyboardSample]);

  useEffect(() => {
    if (!isAuthenticated) {
      micActiveRef.current = false;
      if (isRecording) void stopRecording();
      return;
    }

    if (micActiveRef.current) return;
    micActiveRef.current = true;

    const startAutoVoice = async () => {
      try {
        await startRecording({
          onChunk: async (blob, metrics) => {
            await handleVoiceChunkRef.current?.(blob, metrics);  // This will NOT trigger sign-out
          },
          timesliceMs: 1200,
        });
        setAnalysisMessage('Microphone actif: détection automatique de la parole.');
      } catch (err) {
        micActiveRef.current = false;
        setError(err instanceof Error ? err.message : 'Unable to start microphone monitoring');
      }
    };

    void startAutoVoice();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, startRecording, stopRecording]);

  if (!isAuthenticated) {
    return (
      <div className="dashboard-container">
        <div className="not-authenticated">
          <h1>Please authenticate first</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header"><Navigation /></header>
        <main className="dashboard-content">
          <div className="dashboard-skeleton">
            <div className="skeleton-grid">
              <div className="skeleton-card skeleton-score"></div>
              <div className="skeleton-card skeleton-chart"></div>
              <div className="skeleton-card skeleton-voice"></div>
              <div className="skeleton-card skeleton-keyboard"></div>
              <div className="skeleton-card skeleton-activity"></div>
              <div className="skeleton-card skeleton-status"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const effectiveScore = mlConfidence ?? dashboardData?.authScore ?? 0;
  const scoreLabel =
    mlDecision === 'trusted' ? 'Même utilisateur' :
    mlDecision === 'suspicious' ? 'Suspect' :
    mlDecision === 'blocked' ? 'Utilisateur différent' :
    mlDecision === 'enrolling' ? 'Enrôlement vocal' : 'Analyse en cours';

  const waveValues = audioMetrics?.fourier_series?.slice(0, 70) || Array.from({ length: 70 }, () => 0.05);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header"><Navigation /></header>
      <main className="dashboard-content">
        <div className="dashboard-grid">
          <div className="score-card">
            <ScoreCircle score={effectiveScore} label={scoreLabel} />
          </div>
          <div className="chart-card">
            <VoiceChart voiceData={voiceSeries} keyboardData={keyboardSeries} />
          </div>
          <div className="voice-card">
            <div className="card-header">
              <h3>Analyse Vocale</h3>
              <span className="metric-label">Micro auto • MFCC • FFT • Identité</span>
            </div>
            <div className="metric-label" style={{ marginBottom: '0.8rem' }}>
              {isRecording ? 'Écoute active (détection automatique de la parole).' : 'Microphone inactif.'}
              {' '}
              {isSubmittingVoice ? 'Analyse vocale...' : analysisMessage}
            </div>
            <div className="voice-metrics">
              <div className="metric-item">
                <span className="metric-name">ML Score</span>
                <span className="metric-value">{effectiveScore.toFixed(2)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Énergie</span>
                <span className="metric-value">{(audioMetrics?.energy ?? 0).toFixed(4)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Freq. Dominante</span>
                <span className="metric-value">{(audioMetrics?.dominant_frequency ?? 0).toFixed(1)} Hz</span>
              </div>
            </div>
            <div className="wave-visualizer">
              {waveValues.map((v, i) => (
                <div
                  key={i}
                  className="wave-bar"
                  style={{ height: `${8 + (Math.max(0, Math.min(1, v)) * 92)}%`, '--i': i } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
          <div className="keyboard-card">
            <KeyboardGraph
              data={dashboardData?.keyboardPattern ?? null}
              typingValue={typingSample}
              onTypingChange={setTypingSample}
              onTypingFocus={() => { if (!isTracking) startTracking(); }}
              onTypingBlur={async () => {
                if (!isTracking) return;
                const sample = stopTracking();
                startTracking();
                await submitKeyboardSample(sample);  // This will NOT trigger sign-out
              }}
              isAnalyzing={isSubmittingKeyboard}
            />
          </div>
          <div className="activity-card">
            <ActivityLog activities={dashboardData?.activities ?? []} />
          </div>
          <div className="status-card">
            <SystemStatus
              status={dashboardData?.systemStatus ?? {
                apiFlask: 'inactive',
                moduleMl: 'inactive',
                database: 'inactive',
                dspEngine: 'inactive',
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;