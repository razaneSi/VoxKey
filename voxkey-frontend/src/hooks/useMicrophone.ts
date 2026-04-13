import { useState, useRef, useCallback } from 'react';

export interface AudioMetrics {
  duration: number;
  volume: number;
  frequency: number;
  mfcc: number[];
}

export const useMicrophone= () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [metrics, setMetrics] = useState<AudioMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const stream = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Get user media
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      stream.current = mediaStream;
      audioChunks.current = [];

      // Create audio context and analyser
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContext.current = context;

      const analyzerNode = context.createAnalyser();
      analyzerNode.fftSize = 2048;
      analyser.current = analyzerNode;

      const source = context.createMediaStreamSource(mediaStream);
      source.connect(analyzerNode);

      // Create MediaRecorder
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || !stream.current) {
        setError('No recording in progress');
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        // Process audio
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);

        // Extract metrics
        if (analyser.current && audioContext.current) {
          const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
          analyser.current.getByteFrequencyData(dataArray);

          const volume =
            dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
          const frequency = dataArray.findIndex((v) => v > 100) * 23.4375; // Rough frequency calculation

          setMetrics({
            duration: audioChunks.current.reduce((sum, chunk) => sum + chunk.size, 0) / 32000,
            volume: Math.round(volume * 100),
            frequency: Math.round(frequency),
            mfcc: Array.from({ length: 13 }, () => Math.random() * 100), // Placeholder
          });
        }

        // Stop all tracks
        stream.current?.getTracks().forEach((track) => track.stop());

        setIsRecording(false);
        resolve(blob);
      };

      mediaRecorder.current.stop();
    });
  }, []);

  const clearRecording = useCallback(() => {
    audioChunks.current = [];
    setAudioBlob(null);
    setMetrics(null);
    setError(null);
  }, []);

  return {
    isRecording,
    audioBlob,
    metrics,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  };
};
