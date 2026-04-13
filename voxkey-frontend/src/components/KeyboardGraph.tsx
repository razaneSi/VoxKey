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
}

const KeyboardGraph: React.FC<KeyboardGraphProps> = ({ data }) => {
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

  const maxValue = Math.max(...graphData.weekData);
  const chartHeight = 120;

  return (
    <div className="keyboard-graph-container">
      <div className="card-header">
        <h3>Pattern Clavier</h3>
        <div className="header-actions">
          <span className="metric-label">Interval • Vitesse • Rythme</span>
          <button className="btn-debarquer">Déboguer</button>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="keyboard-chart">
        <svg
          viewBox={`0 0 ${graphData.weekData.length * 40 + 20} ${chartHeight + 30}`}
          xmlns="http://www.w3.org/2000/svg"
          className="bars-svg"
        >
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00ffc8" />
              <stop offset="100%" stopColor="#00a88a" />
            </linearGradient>
            <filter id="barGlow">
              <feGaussianBlur stdDeviation="1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`grid-${i}`}
              x1="10"
              y1={chartHeight - (i * chartHeight) / 4}
              x2={graphData.weekData.length * 40 + 10}
              y2={chartHeight - (i * chartHeight) / 4}
              stroke="rgba(0, 255, 200, 0.1)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          ))}

          {/* Bars */}
          {graphData.weekData.map((value, i) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = i * 40 + 15;
            const y = chartHeight - barHeight;

            return (
              <g key={`bar-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width="24"
                  height={barHeight}
                  fill="url(#barGradient)"
                  rx="2"
                  className="bar-item"
                  filter="url(#barGlow)"
                  style={{
                    opacity: 0.9,
                  }}
                />
                {/* Bar hover effect */}
                <rect
                  x={x}
                  y={y}
                  width="24"
                  height={barHeight}
                  fill="none"
                  stroke="rgba(0, 255, 200, 0.3)"
                  strokeWidth="1"
                  rx="2"
                  className="bar-outline"
                />
              </g>
            );
          })}

          {/* Labels */}
          {graphData.weekLabels.map((label, i) => (
            <text
              key={`label-${i}`}
              x={i * 40 + 27}
              y={chartHeight + 18}
              textAnchor="middle"
              className="chart-text"
              fill="rgba(0, 255, 200, 0.6)"
              fontSize="11"
            >
              {label}
            </text>
          ))}
        </svg>
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
