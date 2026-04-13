import React, { useState, useMemo, useCallback } from 'react';
import '../Components.css';

interface DataPoint {
  time: string;
  score: number;
}

interface RealtimeChartProps {
  voiceData?: DataPoint[];
  keyboardData?: DataPoint[];
}

const RealtimeChart: React.FC<RealtimeChartProps> = ({ voiceData = [], keyboardData = [] }) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'keyboard'>('voice');

  const chartData = useMemo(() => {
    const data = activeTab === 'voice' ? voiceData : keyboardData;
    if (data.length === 0) {
      // Generate mock data with different patterns
      return Array.from({ length: 12 }, (_, i) => ({
        time: `14:${String(20 + i).padStart(2, '0')}`,
        score: activeTab === 'voice' 
          ? 65 + Math.sin(i / 2) * 20 + Math.random() * 10
          : 72 + Math.cos(i / 1.5) * 15 + Math.random() * 8 + 5, // Different pattern for keyboard
      }));
    }
    return data;
  }, [voiceData, keyboardData, activeTab]);

  const handleVoiceClick = useCallback(() => setActiveTab('voice'), []);
  const handleKeyboardClick = useCallback(() => setActiveTab('keyboard'), []);

  const minScore = Math.min(...chartData.map((d) => d.score));
  const maxScore = Math.max(...chartData.map((d) => d.score));
  const range = maxScore - minScore || 1;
  const padding = 40;
  const width = 800;
  const height = 200;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding;

  // Generate SVG path for the line
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * chartWidth + padding;
    const y = height - padding + ((minScore - d.score) / range) * chartHeight;
    return { x, y, score: d.score };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Generate area path
  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="voice-chart-container">
      <div className="chart-header">
        <h3>Score Temps Réel</h3>
        <div className="chart-toggles">
          <button 
            className={`toggle-btn ${activeTab === 'voice' ? 'active' : ''}`} 
            onClick={handleVoiceClick}
          >
            Voice
          </button>
          <button 
            className={`toggle-btn ${activeTab === 'keyboard' ? 'active' : ''}`} 
            onClick={handleKeyboardClick}
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
          {/* Grid lines */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={activeTab === 'voice' ? "rgba(0, 255, 200, 0.3)" : "rgba(255, 0, 255, 0.3)"} />
              <stop offset="100%" stopColor={activeTab === 'voice' ? "rgba(0, 255, 200, 0.05)" : "rgba(255, 0, 255, 0.05)"} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal grid lines */}
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

          {/* Area under curve */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Main line */}
          <path 
            d={pathD} 
            strokeWidth="2" 
            fill="none" 
            filter="url(#glow)"
            stroke={activeTab === 'voice' ? "#00ffc8" : "#ff00ff"}
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={`point-${i}`}
              cx={p.x}
              cy={p.y}
              r="3"
              fill={activeTab === 'voice' ? "#00ffc8" : "#ff00ff"}
              className="chart-point"
            />
          ))}

          {/* Axes */}
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
              left: `calc(${(i / (points.length - 1)) * 100}% - 50%)`,
            }}
          >
            <span className="time">{chartData[i].time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealtimeChart;
