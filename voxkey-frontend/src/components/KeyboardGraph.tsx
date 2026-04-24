import React, { useMemo } from 'react';
import '../Components.css';

interface KeyboardData {
  weekData: number[];
  weekLabels: string[];
  stats: {
    avgSpeed: number;
    avgAccuracy: number;
    touches: number;
  };
}

interface KeyboardGraphProps {
  data?: KeyboardData | null;
  typingValue?: string;
  onTypingChange?: (value: string) => void;
  onTypingFocus?: () => void;
  onTypingBlur?: () => void | Promise<void>;
  isAnalyzing?: boolean;
}

const KeyboardGraph: React.FC<KeyboardGraphProps> = ({
  data,
  typingValue = '',
  onTypingChange,
  onTypingFocus,
  onTypingBlur,
  isAnalyzing = false,
}) => {
  const graphData = useMemo(() => {
    if (!data) {
      return {
        weekData: [45, 52, 38, 61, 48, 55, 42],
        weekLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
        stats: {
          avgSpeed: 673,
          avgAccuracy: 209,
          touches: 20,
        },
      };
    }
    return data;
  }, [data]);

  return (
    <div className="keyboard-graph-container">
      <div className="card-header">
        <h3>Pattern Clavier</h3>
        <div className="header-actions">
          <span className="metric-label">Saisie • Vitesse • Rythme</span>
        </div>
      </div>

      <div className="keyboard-chart">
        <label htmlFor="keyboardPatternInput" className="metric-label">
          Zone de frappe en temps réel
        </label>
        <textarea
          id="keyboardPatternInput"
          value={typingValue}
          onChange={(e) => onTypingChange?.(e.target.value)}
          onFocus={() => onTypingFocus?.()}
          onBlur={() => onTypingBlur?.()}
          placeholder="Tapez ici pour analyser votre pattern clavier..."
          rows={5}
          style={{
            width: '100%',
            resize: 'vertical',
            marginTop: '0.5rem',
            background: 'rgba(10, 16, 30, 0.6)',
            color: '#d9fdf6',
            border: '1px solid rgba(0,255,200,0.25)',
            borderRadius: '8px',
            padding: '0.7rem',
            height: '80px',
          }}
        />
        <div className="metric-label" style={{ marginTop: '0.35rem' }}>
          {isAnalyzing ? 'Analyse clavier...' : 'La saisie est envoyée automatiquement pour analyse.'}
        </div>
      </div>

      {/* Stats Row */}
      <div className="keyboard-stats">
        <div className="stat-block">
          <span className="stat-label">Moy. Vitesse</span>
          <span className="stat-value">{graphData.stats.avgSpeed}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-block">
          <span className="stat-label">Moy. Précision</span>
          <span className="stat-value">{graphData.stats.avgAccuracy}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-block">
          <span className="stat-label">Touches</span>
          <span className="stat-value">{graphData.stats.touches}</span>
        </div>
      </div>
    </div>
  );
};

export default KeyboardGraph;