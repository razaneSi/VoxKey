from flask import Blueprint, request, jsonify
from services.auth_service import authenticate_user
from services.voice_identity_service import create_voice_profile, verify_voice_identity
from services.keyboard_service import create_keyboard_profile, verify_keyboard
import json
import os
import base64
import numpy as np

biometrics_bp = Blueprint("biometrics", __name__)

from db.database import SessionLocal
from models.user import User
from sqlalchemy import select

from models.audio_log import VoiceLog
from models.keyboard_log import KeyboardLog
from models.auth_attempt import AuthAttempt
from sqlalchemy import desc

def get_current_user(session):
    return session.execute(select(User)).scalars().first()

@biometrics_bp.post("/voice/submit")
def submit_voice():
    """Endpoint to process and save voice baseline or verify voice."""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
        
    audio_file = request.files['audio']
    ext = audio_file.filename.split('.')[-1] if '.' in audio_file.filename else 'wav'
    upload_dir = os.path.join(os.getcwd(), "data", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"voice_{os.urandom(4).hex()}.{ext}")
    audio_file.save(file_path)

    try:
        with SessionLocal() as session:
            user = get_current_user(session)
            if not user:
                return jsonify({"error": "No user found to update"}), 404

            # If no baseline, ENROLL
            if not user.voice_embeddings:
                profile = create_voice_profile(file_path)
                voice_payload = {
                    "mfcc": profile["mfcc"],
                    "centroid": profile["centroid"],
                    "zcr": profile["zcr"]
                }
                # Backward-compatible storage: keep WebM header in JSON payload
                # so we do not depend on a dedicated DB column.
                if profile.get("voice_header"):
                    voice_payload["voice_header_b64"] = base64.b64encode(
                        profile["voice_header"]
                    ).decode("ascii")
                user.voice_embeddings = json.dumps(voice_payload)
                
                session.commit()
                return jsonify({
                    "status": "enrolled",
                    "message": "Voice baseline established (DSP)."
                })

            # If baseline exists, VERIFY
            stored_voice = json.loads(user.voice_embeddings)
            # Legacy compatibility: migrate/repair old profiles that do not have DSP keys.
            if not all(k in stored_voice for k in ("mfcc", "centroid", "zcr")):
                profile = create_voice_profile(file_path)
                migrated_payload = {
                    "mfcc": profile["mfcc"],
                    "centroid": profile["centroid"],
                    "zcr": profile["zcr"]
                }
                if profile.get("voice_header"):
                    migrated_payload["voice_header_b64"] = base64.b64encode(
                        profile["voice_header"]
                    ).decode("ascii")
                user.voice_embeddings = json.dumps(migrated_payload)
                session.commit()
                return jsonify({
                    "status": "enrolled",
                    "message": "Legacy voice profile migrated. Please submit again to verify."
                })

            # Prefer dedicated attribute when available; fallback to payload storage.
            voice_header = getattr(user, "voice_header", None)
            if not voice_header:
                header_b64 = stored_voice.get("voice_header_b64")
                if isinstance(header_b64, str) and header_b64:
                    try:
                        voice_header = base64.b64decode(header_b64)
                    except Exception:
                        voice_header = None

            voice_results = verify_voice_identity(
                stored_voice,
                file_path,
                voice_header=voice_header
            )
            voice_score = voice_results["combined_score"]

            v_log = VoiceLog(
                user_id=user.id,
                resemblyzer_score=voice_results["resemblyzer_score"],
                speechbrain_score=voice_results["speechbrain_score"],
                fft_score=voice_results["fft_score"],
                final_score=voice_score
            )
            session.add(v_log)

            # Auth score is now JUST voice (separated from keyboard as requested)
            final_score = voice_score
            
            is_authenticated = final_score >= 0.75
            session.add(AuthAttempt(
                user_id=user.id,
                voice_score=float(voice_score),
                keyboard_score=0.0,
                final_score=float(final_score),
                status="valide" if is_authenticated else "suspect"
            ))
            session.commit()

            return jsonify({
                "status": "success",
                "message": "Voice verified",
                "score": float(voice_score),
                "voiceIdentity": {
                    "confidence": float(voice_score) * 100,
                    "decision": "valide" if is_authenticated else "suspect"
                },
                "mlDecision": "valide" if is_authenticated else "suspect",
                "mlDecisionReason": f"Voice score {voice_score:.2f}."
            })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@biometrics_bp.post("/keyboard/submit")
def submit_keyboard():
    """Endpoint to process and save keyboard baseline or verify."""
    data = request.json
    raw_timings = data.get("keystrokeTimings") or data.get("keyboard_times")
    
    if not raw_timings:
        return jsonify({"error": "Missing keyboard data"}), 400
        
    # Extract timestamps from list of objects if needed
    timings = []
    for item in raw_timings:
        if isinstance(item, dict):
            # The frontend sends {timestamp: ..., duration: ...}
            t = item.get("timestamp")
            if t is not None:
                timings.append(float(t))
        elif isinstance(item, (int, float)):
            timings.append(float(item))

    if not timings:
        return jsonify({"error": "Invalid keyboard data format"}), 400

    try:
        with SessionLocal() as session:
            user = get_current_user(session)
            if not user:
                return jsonify({"error": "No user found to update"}), 404

            # If no baseline, ENROLL
            if not user.keyboard_baseline:
                profile = create_keyboard_profile(timings)
                user.keyboard_baseline = json.dumps(profile)
                session.commit()
                return jsonify({"status": "success", "message": "Keyboard baseline updated", "metrics": profile, "mlDecisionReason": "Baseline created"})

            # If baseline exists, VERIFY
            stored_keyboard = json.loads(user.keyboard_baseline)
            keyboard_results = verify_keyboard(stored_keyboard, timings)
            
            keyboard_score = keyboard_results.get("score", 0.0)
            avg_delay = keyboard_results.get("avg_delay", 0.0)

            # Log the keyboard attempt
            k_log = KeyboardLog(
                user_id=user.id,
                avg_delay=float(avg_delay),
                score=float(keyboard_score)
            )
            session.add(k_log)

            # Auth score for keyboard attempts is now independent
            final_score = keyboard_score
            
            is_authenticated = final_score >= 0.75
            session.add(AuthAttempt(
                user_id=user.id,
                voice_score=0.0,
                keyboard_score=float(keyboard_score),
                final_score=float(final_score),
                status="valide" if is_authenticated else "suspect"
            ))
            session.commit()

            # Safely prepare features for JSON
            features_clean = {}
            for k, v in keyboard_results.items():
                if isinstance(v, (int, float, np.number)):
                    features_clean[k] = float(v)

            return jsonify({
                "status": "success",
                "message": "Keyboard verified",
                "score": float(keyboard_score) * 100,
                "features": features_clean,
                "mlDecision": "valide" if is_authenticated else "suspect",
                "mlDecisionReason": f"Keyboard score {keyboard_score:.2f}."
            })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@biometrics_bp.get("/voice")
def get_voice_metrics():
    """Returns baseline voice metrics for the user."""
    return jsonify({"baseline": "established", "model": "ECAPA-TDNN"})

@biometrics_bp.get("/keyboard")
def get_keyboard_metrics():
    """Returns baseline keyboard metrics for the user."""
    return jsonify({"baseline": "established", "type": "dwell-time"})