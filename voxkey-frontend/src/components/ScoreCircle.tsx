import React, { useEffect, useState } from 'react';
import '../Components.css';

interface ScoreCircleProps {
  score: number;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let start = 0;

    const targetScore = Math.min(100, Math.max(0, Number(score) || 0));
    const duration = 800; // animation duration in ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);

      const current = Math.floor(start + (targetScore - start) * progress);

      setDisplayScore(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [score]);

  const circumference = 2 * Math.PI * 95;
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="score-circle-container">
      <div className="score-circle-square">
        <svg
          className="score-circle-svg"
          viewBox="0 0 220 220"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle
            cx="110"
            cy="110"
            r="95"
            fill="none"
            stroke="rgba(0, 255, 200, 0.1)"
            strokeWidth="3"
          />

          {/* Progress circle */}
          <circle
            cx="110"
            cy="110"
            r="95"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(0, 255, 200, 0.6))',
              transition: 'stroke-dashoffset 0.2s linear'
            }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ffc8" />
              <stop offset="50%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#00ffc8" />
            </linearGradient>
          </defs>
        </svg>

        <div className="score-circle-content">
          <div className="score-shield">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="score-value">{displayScore}%</div>
        </div>
      </div>

      <div className="score-label">Authentifié</div>

      {/* Decorative elements */}
      <div className="score-glow"></div>
      <div className="score-pulse"></div>
    </div>
  );
};

export default ScoreCircle;