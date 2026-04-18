import React, { useState, useMemo } from 'react';
import '../Components.css';

interface DataPoint {
  time: string;
  score: number;
}

interface RealtimeChartProps {
  voiceData?: DataPoint[];
  keyboardData?: DataPoint[];
}

const RealtimeChart: React.FC<RealtimeChartProps> = ({
  voiceData = [],
  keyboardData = [],
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'keyboard'>('voice');

  const chartData = useMemo(() => {
    const data = activeTab === 'voice' ? voiceData : keyboardData;

    if (data.length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({
        time: `14:${String(20 + i).padStart(2, '0')}`,
        score:
          activeTab === 'voice'
            ? 65 + Math.sin(i / 2) * 20 + Math.random() * 10
            : 72 + Math.cos(i / 1.5) * 15 + Math.random() * 8 + 5,
      }));
    }

    return data;
  }, [voiceData, keyboardData, activeTab]);

  const scores = chartData.map((d) => d.score);
  const minScore = scores.length ? Math.min(...scores) : 0;
  const maxScore = scores.length ? Math.max(...scores) : 1;
  const range = Math.max(maxScore - minScore, 5); // always at least 5 to avoid flat line

  const padding = 40;
  const width = 800;
  const height = 200;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding;

  const gradientId = useMemo(
    () => `areaGradient-${Math.random().toString(36).slice(2)}`,
    []
  );
  const glowId = useMemo(
    () => `glow-${Math.random().toString(36).slice(2)}`,
    []
  );

  const points = useMemo(() => {
    return chartData.map((d, i) => {
      const x =
        chartData.length > 1
          ? (i / (chartData.length - 1)) * chartWidth + padding
          : padding;

      const y =
        padding + ((maxScore - d.score) / range) * chartHeight;

      return { x, y, score: d.score };
    });
  }, [chartData, chartWidth, chartHeight, padding, maxScore, range]);

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`
      : '';

  return (
    <div className="voice-chart-container">
      <div className="chart-header">
        <h3>Score Temps Réel</h3>

        <div className="chart-toggles">
          <button
            className={`toggle-btn ${activeTab === 'voice' ? 'active' : ''}`}
            onClick={() => setActiveTab('voice')}
          >
            Voice
          </button>

          <button
            className={`toggle-btn ${
              activeTab === 'keyboard' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('keyboard')}
          >
            Clavier
          </button>
        </div>
      </div>

      <div className="chart-wrapper">
        <svg
          className="chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={
                  activeTab === 'voice'
                    ? 'rgba(0, 255, 200, 0.3)'
                    : 'rgba(255, 0, 255, 0.3)'
                }
              />
              <stop
                offset="100%"
                stopColor={
                  activeTab === 'voice'
                    ? 'rgba(0, 255, 200, 0.05)'
                    : 'rgba(255, 0, 255, 0.05)'
                }
              />
            </linearGradient>

            <filter id={glowId}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + (i * chartHeight) / 4}
              x2={width - padding}
              y2={padding + (i * chartHeight) / 4}
              stroke="rgba(0, 255, 200, 0.1)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

          {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

          {pathD && (
            <path
              d={pathD}
              strokeWidth="2"
              fill="none"
              filter={`url(#${glowId})`}
              stroke={activeTab === 'voice' ? '#00ffc8' : '#ff00ff'}
            />
          )}

          {points.map((p, i) => (
            <circle
              key={`point-${i}`}
              cx={p.x}
              cy={p.y}
              r="3"
              fill={activeTab === 'voice' ? '#00ffc8' : '#ff00ff'}
              className="chart-point"
            />
          ))}

          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="rgba(0, 255, 200, 0.3)"
            strokeWidth="1"
          />

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="rgba(0, 255, 200, 0.3)"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div className="chart-labels">
        {points.map((_, i) => (
          <div
            key={`label-${i}`}
            className="chart-label"
            style={{
              left: `${(i / (points.length - 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="time">{chartData[i]?.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealtimeChart;