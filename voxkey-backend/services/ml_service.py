"""Services d'inference et de scoring machine learning."""

from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier


MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "model.pkl"


def build_feature_vector(voice_features: dict, keyboard_features: dict) -> list[float]:
    """Construit un vecteur numerique unique a partir des features DSP et clavier."""
    mfcc_values = voice_features.get("mfcc", [0.0] * 13)
    padded_mfcc = list(mfcc_values[:13]) + [0.0] * max(0, 13 - len(mfcc_values))

    fourier_series = voice_features.get("fourier_series", [])
    fft_slice = list(fourier_series[:10]) + [0.0] * max(0, 10 - len(fourier_series))

    rhythm_pattern = keyboard_features.get("delays", [])
    rhythm_slice = list(rhythm_pattern[:10]) + [0.0] * max(0, 10 - len(rhythm_pattern))

    feature_vector = [
        *[float(value) for value in padded_mfcc],
        float(voice_features.get("energy", 0.0)),
        float(voice_features.get("fft_mean", 0.0)),
        float(voice_features.get("dominant_frequency", 0.0)),
        *[float(value) for value in fft_slice],
        float(keyboard_features.get("avg_delay", 0.0)),
        float(keyboard_features.get("std_delay", 0.0)),
        float(keyboard_features.get("min_delay", 0.0)),
        float(keyboard_features.get("max_delay", 0.0)),
        float(keyboard_features.get("keystroke_count", 0.0)),
        *[float(value) for value in rhythm_slice],
    ]

    return feature_vector


def train_model(X_train: list[list[float]], y_train: list[int], model_path: str | None = None) -> str:
    """Entraine un RandomForestClassifier puis sauvegarde le modele."""
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    output_path = Path(model_path) if model_path else MODEL_PATH
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_path)
    return str(output_path)


def predict(features: list[float], model_path: str | None = None) -> float:
    """Retourne la probabilite que l'echantillon corresponde au bon utilisateur."""
    input_path = Path(model_path) if model_path else MODEL_PATH
    model = joblib.load(input_path)
    score = model.predict_proba([features])[0][1]
    return float(score)


def predict_identity_score(
    voice_features: dict, keyboard_features: dict, model_path: str | None = None
) -> dict:
    """Calcule un score de similarite utilisateur a partir des features combinees."""
    feature_vector = build_feature_vector(voice_features, keyboard_features)
    score = predict(feature_vector, model_path=model_path)

    return {
        "feature_vector": feature_vector,
        "is_same_user": score >= 0.5,
        "score": score,
    }
