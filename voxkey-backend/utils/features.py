"""Extraction de features audio et clavier."""

import librosa
import numpy as np


def extract_voice_features(file: str) -> dict:
    """Extrait des features vocales basees sur MFCC et Fourier."""
    y, sr = librosa.load(file, sr=None)

    # Analyse spectrale complete via transformee de Fourier.
    fft = np.abs(np.fft.fft(y))
    fft_frequencies = np.fft.fftfreq(len(y), d=1 / sr)

    # Partie positive du spectre, plus utile pour l'analyse audio.
    positive_mask = fft_frequencies >= 0
    positive_fft = fft[positive_mask]
    positive_frequencies = fft_frequencies[positive_mask]

    # Signature vocale MFCC.
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

    # Energie moyenne du signal.
    energy = np.mean(y**2)

    # Frequence dominante de la serie de Fourier.
    dominant_frequency = 0.0
    if len(positive_fft) > 0:
        dominant_frequency = float(positive_frequencies[int(np.argmax(positive_fft))])

    return {
        "mfcc": np.mean(mfcc, axis=1).tolist(),
        "energy": float(energy),
        "fft_mean": float(np.mean(positive_fft)) if len(positive_fft) > 0 else 0.0,
        "dominant_frequency": dominant_frequency,
        "fourier_series": positive_fft[:256].tolist(),
        "sample_rate": int(sr),
    }


def analyze_keyboard_features(times: list[int | float]) -> dict:
    """Analyse les timestamps de frappe clavier."""
    if len(times) < 2:
        return {
            "avg_delay": 0.0,
            "std_delay": 0.0,
            "delays": [],
            "keystroke_count": len(times),
        }

    timestamps = np.array(times, dtype=np.float64)
    delays = np.diff(timestamps)

    return {
        "avg_delay": float(np.mean(delays)),
        "std_delay": float(np.std(delays)),
        "min_delay": float(np.min(delays)),
        "max_delay": float(np.max(delays)),
        "delays": delays.tolist(),
        "keystroke_count": int(len(times)),
    }
