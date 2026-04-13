import React from 'react';
import RealtimeChart from './RealtimeChart';
import '../Components.css';

interface DataPoint {
  time: string;
  score: number;
}

interface VoiceChartProps {
  data?: DataPoint[];
}

const VoiceChart: React.FC = () => {
  return <RealtimeChart voiceData={[]} keyboardData={[]} />;
};

export default VoiceChart;
