import React from 'react';
import RealtimeChart from './RealtimeChart';
import '../Components.css';

interface DataPoint {
  time: string;
  score: number;
}

interface VoiceChartProps {
  voiceData?: DataPoint[];
  keyboardData?: DataPoint[];
}

const VoiceChart: React.FC<VoiceChartProps> = ({ voiceData = [], keyboardData = [] }) => {
  return <RealtimeChart voiceData={voiceData} keyboardData={keyboardData} />;
};

export default VoiceChart;