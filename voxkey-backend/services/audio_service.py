"""Services de capture et sauvegarde audio."""

from pathlib import Path

import numpy as np
import scipy.io.wavfile as wav
import sounddevice as sd

from utils.features import extract_voice_features


DEFAULT_AUDIO_PATH = Path(__file__).resolve().parent.parent / "data" / "samples" / "audio.wav"


def record_audio(duration: int = 5, fs: int = 44100) -> tuple[np.ndarray, int]:
    """Capture l'audio micro en temps reel."""
    print("Recording...")

    audio = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype="float32")
    sd.wait()

    print("Done recording")

    return np.squeeze(audio), fs


def save_audio(audio: np.ndarray, fs: int = 44100, filename: str | None = None) -> str:
    """Sauvegarde un enregistrement audio au format WAV."""
    output_path = Path(filename) if filename else DEFAULT_AUDIO_PATH
    output_path.parent.mkdir(parents=True, exist_ok=True)
    wav.write(str(output_path), fs, audio)
    return str(output_path)


def analyze_audio_file(file: str) -> dict:
    """Extrait les features DSP d'un fichier audio."""
    return extract_voice_features(file)
