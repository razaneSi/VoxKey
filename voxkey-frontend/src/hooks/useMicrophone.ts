import { useState, useRef, useCallback } from "react";

export interface AudioMetrics {
  duration: number;
  energy: number;
  dominant_frequency: number;
  fft_mean: number;
  fourier_series: number[];
  mfcc: number[];
  sample_rate: number;
}

interface StartRecordingOptions {
  onChunk?: (audioBlob: Blob, metrics: AudioMetrics) => void;
  timesliceMs?: number;
}

export const useMicrophone = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [metrics, setMetrics] = useState<AudioMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);

  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);

  const startTime = useRef<number>(0);
  const raf = useRef<number | null>(null);

  const computeMetrics = useCallback((): AudioMetrics | null => {
    if (!analyser.current || !audioContext.current) return null;

    const bufferLength = analyser.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.current.getByteFrequencyData(dataArray);

    const normalized = Array.from(dataArray).map((v) => v / 255);

    // Energy (RMS) → stable biometric feature
    const energy =
      Math.sqrt(normalized.reduce((a, v) => a + v * v, 0) / normalized.length);

    // FFT mean
    const fft_mean =
      normalized.reduce((a, b) => a + b, 0) / normalized.length;

    // Dominant frequency
    const maxIndex = normalized.indexOf(Math.max(...normalized));
    const binHz = audioContext.current.sampleRate / (2 * bufferLength);
    const dominant_frequency = maxIndex * binHz;

    // Stable pseudo-MFCC (band energy summary, NOT fake raw bins)
    const mfcc = Array.from({ length: 13 }, (_, i) => {
      const start = Math.floor((i * normalized.length) / 13);
      const end = Math.floor(((i + 1) * normalized.length) / 13);
      const slice = normalized.slice(start, end);
      return (
        slice.reduce((a, b) => a + b, 0) / (slice.length || 1)
      ) * 100;
    });

    // Fourier envelope (reduced noise)
    const fourier_series = normalized
      .slice(0, 128)
      .map((v) => Number(v.toFixed(6)));

    const duration = (Date.now() - startTime.current) / 1000;

    return {
      duration,
      energy: Number(energy.toFixed(6)),
      dominant_frequency: Number(dominant_frequency.toFixed(2)),
      fft_mean: Number(fft_mean.toFixed(6)),
      fourier_series,
      mfcc,
      sample_rate: audioContext.current.sampleRate,
    };
  }, []);

  const loop = useCallback(() => {
    const m = computeMetrics();
    if (m) setMetrics(m);
    raf.current = requestAnimationFrame(loop);
  }, [computeMetrics]);

  const startRecording = useCallback(
    async (options?: StartRecordingOptions) => {
      try {
        setError(null);

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        stream.current = mediaStream;
        chunks.current = [];
        startTime.current = Date.now();

        const context = new AudioContext();
        audioContext.current = context;

        const source = context.createMediaStreamSource(mediaStream);

        const node = context.createAnalyser();
        node.fftSize = 2048;
        node.smoothingTimeConstant = 0.3;

        analyser.current = node;
        source.connect(node);

        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const recorder = new MediaRecorder(mediaStream, { mimeType: mime });

        recorder.ondataavailable = async (e) => {
          if (!e.data.size) return;

          chunks.current.push(e.data);

          const m = computeMetrics();
          if (m && options?.onChunk) {
            // NO await → avoids blocking recorder
            options.onChunk(e.data, m);
          }
        };

        mediaRecorder.current = recorder;
        recorder.start(options?.timesliceMs ?? 1000);

        setIsRecording(true);
        raf.current = requestAnimationFrame(loop);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Microphone error"
        );
      }
    },
    [computeMetrics, loop]
  );

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || !stream.current) {
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, {
          type: mediaRecorder.current?.mimeType || "audio/webm",
        });

        setAudioBlob(blob);

        const m = computeMetrics();
        if (m) setMetrics(m);

        stream.current?.getTracks().forEach((t) => t.stop());

        if (raf.current) cancelAnimationFrame(raf.current);

        setIsRecording(false);
        resolve(blob);
      };

      mediaRecorder.current.stop();
    });
  }, [computeMetrics]);

  const clearRecording = useCallback(() => {
    chunks.current = [];
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