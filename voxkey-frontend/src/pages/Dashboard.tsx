import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import ScoreCircle from '../components/ScoreCircle';
import VoiceChart from '../components/VoiceChart';
import KeyboardGraph from '../components/KeyboardGraph';
import ActivityLog from '../components/ActivityLog';
import SystemStatus from '../components/SystemStatus';
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

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setDashboardData(null);
      return;
    }

    setLoading(true);

    const timer = setTimeout(() => {
      setDashboardData({
        authScore: 92,
        voiceMetrics: { mfcc: 0.87, energy: 0.92, ff: 0.78 },
        keyboardPattern: {
          weekData: [45, 52, 38, 61, 48, 55, 42],
          weekLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
          stats: { avgSpeed: 673, avgAccuracy: 209, touches: 20 }
        },
        activities: [
          {
            id: '1',
            type: 'success',
            message: 'Authentification vocale réussie',
            timestamp: '14:32'
          },
          {
            id: '2',
            type: 'warning',
            message: 'Pattern clavier différent détecté',
            timestamp: '14:28'
          }
        ],
        systemStatus: {
          apiFlask: 'active',
          moduleMl: 'active',
          database: 'active',
          dspEngine: 'active'
        },
        realtimeScores: []
      });

      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardData(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          authScore: 85 + Math.random() * 10,
          realtimeScores: Array.from({ length: 12 }, (_, i) => ({
            time: `14:${String(20 + i).padStart(2, '0')}`,
            score: 65 + Math.sin(i / 2) * 20 + Math.random() * 10
          }))
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
        <header className="dashboard-header">
          <Navigation />
        </header>
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

            <div
             style={{
  position: 'absolute',
  inset: 0,
  margin: 'auto',
  width: '60px',
  height: '60px',
  border: '3px solid rgba(0, 255, 200, 0.2)',
  borderTopColor: '#00ffc8',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
}}
            />
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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <Navigation />
      </header>

      <main className="dashboard-content">
        <div className="dashboard-grid">
          <div className="score-card">
            <ScoreCircle score={dashboardData?.authScore ?? 92} />
          </div>

          <div className="chart-card">
            <VoiceChart />
          </div>

          <div className="voice-card">
            <div className="card-header">
              <h3>Analyse Vocale</h3>
              <span className="metric-label">MFCC • Énergie • FFT</span>
            </div>

            <div className="voice-metrics">
              <div className="metric-item">
                <span className="metric-name">MFCC</span>
                <span className="metric-value">
                  {dashboardData?.voiceMetrics?.mfcc?.toFixed(2) ?? '0.00'}
                </span>
              </div>

              <div className="metric-item">
                <span className="metric-name">Énergie</span>
                <span className="metric-value">
                  {dashboardData?.voiceMetrics?.energy?.toFixed(2) ?? '0.00'}
                </span>
              </div>

              <div className="metric-item">
                <span className="metric-name">FFT</span>
                <span className="metric-value">
                  {dashboardData?.voiceMetrics?.ff?.toFixed(2) ?? '0.00'}
                </span>
              </div>
            </div>

            <div className="wave-visualizer">
  {Array.from({ length: 70 }).map((_, i) => (
    <div
      key={i}
      className="wave-bar"
      style={{ height: `${20 + Math.random() * 80}%`, '--i': i } as React.CSSProperties}
    />
  ))}
</div>
          </div>

          <div className="keyboard-card">
            <KeyboardGraph data={dashboardData?.keyboardPattern ?? null} />
          </div>

          <div className="activity-card">
            <ActivityLog activities={dashboardData?.activities ?? []} />
          </div>

          <div className="status-card">
            <SystemStatus
              status={
                dashboardData?.systemStatus ?? {
                  apiFlask: 'inactive',
                  moduleMl: 'inactive',
                  database: 'inactive',
                  dspEngine: 'inactive'
                }
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;