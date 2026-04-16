"""Routes de capture et d'analyse audio."""

from flask import Blueprint, jsonify, request

from services.audio_service import analyze_audio_file, record_audio, save_audio


audio_bp = Blueprint("audio", __name__, url_prefix="/audio")


@audio_bp.post("/record")
def record_audio_route():
    """Enregistre un extrait audio depuis le microphone."""
    payload = request.get_json(silent=True) or {}
    duration = int(payload.get("duration", 5))
    sample_rate = int(payload.get("fs", 44100))
    filename = payload.get("filename")

    audio, fs = record_audio(duration=duration, fs=sample_rate)
    saved_path = save_audio(audio, fs=fs, filename=filename)

    return jsonify(
        {
            "duration": duration,
            "features": analyze_audio_file(saved_path),
            "path": saved_path,
            "sample_rate": fs,
            "status": "recorded",
        }
    )


@audio_bp.post("/features")
def extract_audio_features_route():
    """Extrait MFCC et Fourier depuis un fichier audio existant."""
    payload = request.get_json(silent=True) or {}
    file = payload.get("file")

    if not file:
        return jsonify({"error": "Missing 'file' in request body."}), 400

    return jsonify(
        {
            "file": file,
            "features": analyze_audio_file(file),
            "status": "analyzed",
        }
    )
