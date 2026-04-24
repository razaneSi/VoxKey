import json
from db.database import SessionLocal
from models.user import User
from services.voice_identity_service import create_voice_profile, verify_voice_identity
from services.keyboard_service import create_keyboard_profile, verify_keyboard
from sqlalchemy import select

from models.audio_log import VoiceLog
from models.keyboard_log import KeyboardLog
from models.auth_attempt import AuthAttempt

def enroll_user(username, email, password_hash, audio_path, keyboard_times):
    """Enroll a new user with voice and keyboard baselines."""
    voice_profile = create_voice_profile(audio_path)
    keyboard_profile = create_keyboard_profile(keyboard_times)

    with SessionLocal() as session:
        new_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            voice_embeddings=json.dumps({
                "resemblyzer": voice_profile["resemblyzer"],
                "speechbrain": voice_profile["speechbrain"]
            }),
            voice_fft=json.dumps(voice_profile["fft"]),
            keyboard_baseline=json.dumps(keyboard_profile)
        )
        session.add(new_user)
        session.commit()
        return new_user.id

def authenticate_user(username, audio_path, keyboard_times):
    """Authenticate a user by comparing current input with stored baseline and log the results."""
    with SessionLocal() as session:
        user = session.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if not user:
            return {"error": "User not found", "authenticated": False}

        stored_voice = json.loads(user.voice_embeddings)
        stored_voice["fft"] = json.loads(user.voice_fft)
        stored_keyboard = json.loads(user.keyboard_baseline)

        voice_results = verify_voice_identity(stored_voice, audio_path)
        keyboard_results = verify_keyboard(stored_keyboard, keyboard_times)

        voice_score = voice_results["combined_score"]
        keyboard_score = keyboard_results["score"]

        # Weighted final score
        final_score = (voice_score * 0.7) + (keyboard_score * 0.3)
        threshold = 0.75
        is_authenticated = final_score >= threshold

        # Logging to DB
        v_log = VoiceLog(
            user_id=user.id,
            resemblyzer_score=voice_results["resemblyzer_score"],
            speechbrain_score=voice_results["speechbrain_score"],
            fft_score=voice_results["fft_score"],
            final_score=voice_score
        )
        k_log = KeyboardLog(
            user_id=user.id,
            avg_delay=keyboard_results["avg_delay"],
            score=keyboard_score
        )
        auth_log = AuthAttempt(
            user_id=user.id,
            voice_score=voice_score,
            keyboard_score=keyboard_score,
            final_score=final_score,
            status="success" if is_authenticated else "failed"
        )
        
        session.add(v_log)
        session.add(k_log)
        session.add(auth_log)
        session.commit()

        return {
            "username": username,
            "voice_score": voice_score,
            "keyboard_score": keyboard_score,
            "final_score": final_score,
            "authenticated": is_authenticated,
            "details": {
                "voice": voice_results,
                "keyboard": keyboard_results
            }
        }
