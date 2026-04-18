"""API REST unifiee connectee a SQLite/PostgreSQL."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import uuid

from flask import Blueprint, jsonify, request
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session
from werkzeug.security import check_password_hash, generate_password_hash

from db.database import SessionLocal
from models.auth_session import AuthSession
from models.audio_log import VoiceLog
from models.keyboard_log import KeyboardLog
from models.user import User
from services.audio_service import analyze_audio_file

from services.keyboard_service import analyze_keyboard
from services.voice_identity_service import (
    build_voice_signature,
    compare_with_reference,
    update_reference_profile,
)


api_bp = Blueprint("api", __name__, url_prefix="/api")

DEFAULT_SETTINGS = {
    "authThreshold": 85,
    "enableEmailNotifications": True,
    "enablePushNotifications": True,
    "enableTwoFactor": False,
    "keyboardAuthEnabled": True,
    "sessionTimeout": 180,
    "voiceAuthEnabled": True,
}
VOICE_ENROLLMENT_MIN_SAMPLES = 3


def _get_current_time() -> datetime:
    """Get current UTC time with timezone awareness."""
    return datetime.now(timezone.utc)


def _clamp(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    return max(minimum, min(maximum, value))


def _normalize_energy(energy: float) -> float:
    return _clamp(energy * 10000)


def _normalize_fft(fft_mean: float) -> float:
    return _clamp(fft_mean * 10)


def _normalize_mfcc(mfcc_values: list[float]) -> float:
    if not mfcc_values:
        return 0.0
    absolute_mean = sum(abs(v) for v in mfcc_values) / len(mfcc_values)
    return _clamp(absolute_mean)


def _parse_settings(settings_json: str | None) -> dict:
    if not settings_json:
        return DEFAULT_SETTINGS.copy()
    try:
        decoded = json.loads(settings_json)
        if isinstance(decoded, dict):
            merged = DEFAULT_SETTINGS.copy()
            merged.update(decoded)
            return merged
    except json.JSONDecodeError:
        pass
    return DEFAULT_SETTINGS.copy()


def _save_settings(user: User, settings: dict) -> None:
    user.settings_json = json.dumps(settings)


def _build_behavior_profile(db: Session, user: User, max_samples: int = 40) -> dict | None:
    """Apprend/maj le profil comportemental utilisateur depuis les logs persistes."""
    voice_rows = db.scalars(
        select(VoiceLog)
        .where(VoiceLog.user_id == user.id)
        .order_by(desc(VoiceLog.created_at), desc(VoiceLog.id))
        .limit(max_samples)
    ).all()
    keyboard_rows = db.scalars(
        select(KeyboardLog)
        .where(KeyboardLog.user_id == user.id)
        .order_by(desc(KeyboardLog.created_at), desc(KeyboardLog.id))
        .limit(max_samples)
    ).all()

    usable = min(len(voice_rows), len(keyboard_rows))
    if usable < 3:
        return None

    voice_rows = list(reversed(voice_rows[:usable]))
    keyboard_rows = list(reversed(keyboard_rows[:usable]))
    vectors: list[list[float]] = []

    for v, k in zip(voice_rows, keyboard_rows):
        voice_vector = build_voice_vector(
            mfcc=v.mfcc if isinstance(v.mfcc, list) else [],
            energy=float(v.energy or 0.0),
            pitch=float(v.pitch or 0.0),
            score=float(v.score or 0.0),
        )
        keyboard_vector = build_keyboard_vector(
            avg_delay=float(k.avg_delay or 0.0),
            avg_duration=float(k.avg_duration or 0.0),
            score=float(k.score or 0.0),
            rhythm=k.rhythm if isinstance(k.rhythm, list) else [],
        )
        vectors.append(build_behavior_vector(voice_vector, keyboard_vector))

    trained = train_profile(vectors)
    if trained is None:
        return None

    settings = _parse_settings(user.settings_json)
    settings["behaviorProfile"] = trained
    settings["behaviorProfileUpdatedAt"] = _get_current_time().isoformat()
    _save_settings(user, settings)
    db.commit()
    return trained


def _load_behavior_profile(user: User) -> dict | None:
    settings = _parse_settings(user.settings_json)
    profile = settings.get("behaviorProfile")
    if isinstance(profile, dict):
        return profile
    return None


def _evaluate_latest_behavior(db: Session, user: User) -> tuple[dict | None, str | None]:
    """Evalue le dernier comportement voix+clavier contre le profil appris."""
    latest_voice = db.scalar(
        select(VoiceLog).where(VoiceLog.user_id == user.id).order_by(desc(VoiceLog.created_at), desc(VoiceLog.id))
    )
    latest_keyboard = db.scalar(
        select(KeyboardLog).where(KeyboardLog.user_id == user.id).order_by(desc(KeyboardLog.created_at), desc(KeyboardLog.id))
    )
    if latest_voice is None or latest_keyboard is None:
        return None, "missing_modalities"

    profile = _load_behavior_profile(user)
    if profile is None:
        profile = _build_behavior_profile(db, user)
    if profile is None:
        return None, "insufficient_training_data"

    settings = _parse_settings(user.settings_json)
    threshold = float(settings.get("authThreshold", 85))

    voice_vector = build_voice_vector(
        mfcc=latest_voice.mfcc if isinstance(latest_voice.mfcc, list) else [],
        energy=float(latest_voice.energy or 0.0),
        pitch=float(latest_voice.pitch or 0.0),
        score=float(latest_voice.score or 0.0),
    )
    keyboard_vector = build_keyboard_vector(
        avg_delay=float(latest_keyboard.avg_delay or 0.0),
        avg_duration=float(latest_keyboard.avg_duration or 0.0),
        score=float(latest_keyboard.score or 0.0),
        rhythm=latest_keyboard.rhythm if isinstance(latest_keyboard.rhythm, list) else [],
    )
    behavior_vector = build_behavior_vector(voice_vector, keyboard_vector)
    decision = score_against_profile(behavior_vector, profile, threshold=threshold)
    decision["threshold"] = threshold
    decision["profileSampleCount"] = int(profile.get("sample_count", 0))
    return decision, None


def _evaluate_voice_identity(user: User, voice_features: dict) -> tuple[dict, dict]:
    """Analyse la voix et detecte si elle correspond au profil vocal de l'utilisateur."""
    settings = _parse_settings(user.settings_json)
    threshold = float(settings.get("authThreshold", 85))
    current_signature = build_voice_signature(voice_features)
    voice_profile = settings.get("voiceProfile")
    voice_profile = voice_profile if isinstance(voice_profile, dict) else None

    # Phase d'enrolement: on construit le profil avec les premiers echantillons.
    if voice_profile is None or int(voice_profile.get("sample_count", 0)) < VOICE_ENROLLMENT_MIN_SAMPLES:
        updated = update_reference_profile(voice_profile, current_signature)
        settings["voiceProfile"] = updated
        settings["voiceEnrollmentStatus"] = "enrolling"
        remaining = max(0, VOICE_ENROLLMENT_MIN_SAMPLES - int(updated.get("sample_count", 0)))
        decision = {
            "confidence": None,
            "decision": "enrolling",
            "is_same_user": True,
            "message": "Collecting baseline voice profile.",
            "remaining_samples": remaining,
            "threshold": threshold,
        }
        return decision, settings

    decision = compare_with_reference(current_signature, voice_profile, threshold=threshold)
    settings["voiceEnrollmentStatus"] = "ready"
    settings["lastVoiceDecision"] = decision
    return decision, settings


def _build_user_payload(user: User) -> dict:
    return {
        "createdAt": user.created_at.isoformat() if user.created_at else _get_current_time().isoformat(),
        "email": user.email,
        "firstName": user.first_name,
        "id": str(user.id),
        "lastName": user.last_name,
        "phone": user.phone,
        "username": user.username,
    }


def _verify_user_password(user: User, raw_password: str) -> bool:
    stored = user.password_hash or ""
    try:
        if check_password_hash(stored, raw_password):
            return True
    except ValueError:
        pass
    return stored == raw_password


def _resolve_user_from_token(db: Session) -> tuple[User | None, AuthSession | None, tuple[dict, int] | None]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, None, ({"message": "Missing Bearer token."}, 401)

    token = auth_header.replace("Bearer ", "", 1).strip()
    if not token:
        return None, None, ({"message": "Invalid token."}, 401)

    session_row = db.scalar(
        select(AuthSession).where(
            AuthSession.token == token,
            AuthSession.is_active.is_(True),
        )
    )
    if session_row is None:
        return None, None, ({"message": "Invalid or expired token."}, 401)

    expires_at = session_row.expires_at
    if expires_at is None:
        return None, None, ({"message": "Invalid or expired token."}, 401)

    # Handle both timezone-aware and naive datetimes
    now = _get_current_time()
    if expires_at.tzinfo is None:
        # If stored as naive, assume UTC
        from datetime import timezone as tz
        expires_at = expires_at.replace(tzinfo=tz.utc)

    if expires_at <= now:
        session_row.is_active = False
        db.commit()
        return None, None, ({"message": "Invalid or expired token."}, 401)

    user = db.get(User, session_row.user_id)
    if user is None:
        return None, None, ({"message": "Invalid token user."}, 401)

    return user, session_row, None


def _latest_voice_metrics(db: Session, user_id: int) -> dict:
    latest_voice = db.scalar(
        select(VoiceLog).where(VoiceLog.user_id == user_id).order_by(desc(VoiceLog.created_at), desc(VoiceLog.id))
    )
    if latest_voice is None:
        return {"energy": 0.0, "ff": 0.0, "mfcc": 0.0}

    mfcc_values: list[float] = []
    if isinstance(latest_voice.mfcc, list):
        mfcc_values = [float(x) for x in latest_voice.mfcc if isinstance(x, (int, float))]

    return {
        "energy": round(_normalize_energy(float(latest_voice.energy or 0.0)), 2),
        "ff": round(_normalize_fft(float(latest_voice.score or 0.0)), 2),
        "mfcc": round(_normalize_mfcc(mfcc_values), 2),
    }


def _latest_keyboard_metrics(db: Session, user_id: int) -> dict:
    latest_keyboard = db.scalar(
        select(KeyboardLog).where(KeyboardLog.user_id == user_id).order_by(desc(KeyboardLog.created_at), desc(KeyboardLog.id))
    )
    if latest_keyboard is None:
        return {
            "avgAccuracy": 95,
            "avgSpeed": 0,
            "touches": 0,
            "weekData": [0, 0, 0, 0, 0, 0, 0],
            "weekLabels": ["L", "M", "M", "J", "V", "S", "D"],
        }

    avg_delay = float(latest_keyboard.avg_delay or 0.0)
    avg_speed = int(round(60000 / avg_delay)) if avg_delay > 0 else 0
    touches = 0
    if isinstance(latest_keyboard.rhythm, list):
        touches = len(latest_keyboard.rhythm)
    week_value = max(0, min(100, int(round(avg_speed / 10))))

    return {
        "avgAccuracy": 95,
        "avgSpeed": avg_speed,
        "touches": touches,
        "weekData": [week_value] * 7,
        "weekLabels": ["L", "M", "M", "J", "V", "S", "D"],
    }


def _build_activity_feed(db: Session, user_id: int) -> list[dict]:
    voice_rows = db.scalars(
        select(VoiceLog).where(VoiceLog.user_id == user_id).order_by(desc(VoiceLog.created_at), desc(VoiceLog.id)).limit(10)
    ).all()
    keyboard_rows = db.scalars(
        select(KeyboardLog).where(KeyboardLog.user_id == user_id).order_by(desc(KeyboardLog.created_at), desc(KeyboardLog.id)).limit(10)
    ).all()

    items: list[dict] = []
    for row in voice_rows:
        ts = row.created_at or _get_current_time()
        items.append(
            {
                "id": f"voice-{row.id}",
                "message": "Voice sample analyzed.",
                "timestamp": ts.strftime("%H:%M:%S"),
                "type": "success",
                "when": ts,
            }
        )
    for row in keyboard_rows:
        ts = row.created_at or _get_current_time()
        items.append(
            {
                "id": f"keyboard-{row.id}",
                "message": "Keyboard behavior updated.",
                "timestamp": ts.strftime("%H:%M:%S"),
                "type": "info",
                "when": ts,
            }
        )

    items.sort(key=lambda x: x["when"], reverse=True)
    trimmed = items[:20]
    for item in trimmed:
        item.pop("when", None)
    return trimmed


def _build_realtime_scores(db: Session, user_id: int) -> list[dict]:
    combined_rows: list[tuple[datetime, float]] = []

    voice_rows = db.scalars(
        select(VoiceLog).where(VoiceLog.user_id == user_id).order_by(desc(VoiceLog.created_at), desc(VoiceLog.id)).limit(12)
    ).all()
    for row in voice_rows:
        ts = row.created_at or _get_current_time()
        value = _clamp(float(row.score or 0.0))
        combined_rows.append((ts, value))

    keyboard_rows = db.scalars(
        select(KeyboardLog).where(KeyboardLog.user_id == user_id).order_by(desc(KeyboardLog.created_at), desc(KeyboardLog.id)).limit(12)
    ).all()
    for row in keyboard_rows:
        ts = row.created_at or _get_current_time()
        value = _clamp(float(row.score or 0.0))
        combined_rows.append((ts, value))

    combined_rows.sort(key=lambda item: item[0], reverse=True)
    return [{"time": ts.strftime("%H:%M"), "score": round(score, 2)} for ts, score in combined_rows[:12]]


def _get_dashboard_payload(db: Session, user_id: int) -> dict:
    voice = _latest_voice_metrics(db, user_id)
    keyboard = _latest_keyboard_metrics(db, user_id)
    realtime = _build_realtime_scores(db, user_id)

    auth_score = round(_clamp((voice["mfcc"] + voice["energy"] + voice["ff"]) / 3))
    if realtime:
        auth_score = round(_clamp((auth_score + float(realtime[0]["score"])) / 2))

    return {
        "activities": _build_activity_feed(db, user_id),
        "authScore": auth_score,
        "keyboardPattern": {
            "stats": {
                "avgAccuracy": keyboard["avgAccuracy"],
                "avgSpeed": keyboard["avgSpeed"],
                "touches": keyboard["touches"],
            },
            "weekData": keyboard["weekData"],
            "weekLabels": keyboard["weekLabels"],
        },
        "realtimeScores": realtime,
        "systemStatus": {
            "apiFlask": "active",
            "database": "active",
            "dspEngine": "active",
            "moduleMl": "active",
        },
        "voiceMetrics": voice,
    }


# ============= ROUTES =============

@api_bp.post("/auth/register")
def register():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", "")).strip()

    if len(username) < 3:
        return jsonify({"message": "Username must contain at least 3 characters."}), 400
    if "@" not in email:
        return jsonify({"message": "Invalid email address."}), 400
    if len(password) < 8:
        return jsonify({"message": "Password must contain at least 8 characters."}), 400

    with SessionLocal() as db:
        existing = db.scalar(select(User).where(or_(User.username == username, User.email == email)))
        if existing:
            if existing.username == username:
                return jsonify({"message": "Username already exists."}), 409
            return jsonify({"message": "Email already exists."}), 409

        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            settings_json=json.dumps(DEFAULT_SETTINGS),
        )
        db.add(new_user)
        db.flush()

        token = str(uuid.uuid4())
        db.add(
            AuthSession(
                user_id=new_user.id,
                token=token,
                is_active=True,
                created_at=_get_current_time(),
                expires_at=_get_current_time() + timedelta(days=7),
            )
        )
        db.commit()
        db.refresh(new_user)

        return jsonify({"token": token, "user": _build_user_payload(new_user)}), 201


@api_bp.post("/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", "")).strip()

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.username == username))
        if user is None or not _verify_user_password(user, password):
            return jsonify({"message": "Invalid credentials."}), 401

        if user.password_hash == password:
            user.password_hash = generate_password_hash(password)

        token = str(uuid.uuid4())
        db.add(
            AuthSession(
                user_id=user.id,
                token=token,
                is_active=True,
                created_at=_get_current_time(),
                expires_at=_get_current_time() + timedelta(days=7),
            )
        )
        db.commit()
        return jsonify({"token": token, "user": _build_user_payload(user)})


@api_bp.post("/auth/logout")
def logout():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"status": "logged_out"})

    token = auth_header.replace("Bearer ", "", 1).strip()
    with SessionLocal() as db:
        session_row = db.scalar(select(AuthSession).where(AuthSession.token == token, AuthSession.is_active.is_(True)))
        if session_row:
            session_row.is_active = False
            db.commit()
    return jsonify({"status": "logged_out"})


@api_bp.get("/dashboard")
def dashboard():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code
        return jsonify(_get_dashboard_payload(db, user.id))


@api_bp.get("/dashboard/auth-score")
def dashboard_auth_score():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code
        payload = _get_dashboard_payload(db, user.id)
        return jsonify({"authScore": payload["authScore"]})


@api_bp.get("/dashboard/realtime-scores")
def dashboard_realtime_scores():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code
        payload = _get_dashboard_payload(db, user.id)
        return jsonify(payload["realtimeScores"])


@api_bp.get("/dashboard/activities")
def dashboard_activities():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code
        payload = _get_dashboard_payload(db, user.id)
        return jsonify(payload["activities"])


@api_bp.get("/system/status")
def system_status():
    return jsonify(
        {
            "apiFlask": "active",
            "database": "active",
            "dspEngine": "active",
            "moduleMl": "active",
        }
    )


@api_bp.get("/biometrics/voice")
def biometrics_voice():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code
        return jsonify(_latest_voice_metrics(db, user.id))


@api_bp.post("/biometrics/voice/submit")
def biometrics_voice_submit():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code

        audio_file = request.files.get("audio")
        if not audio_file:
            return jsonify({"message": "Missing audio file in multipart form data."}), 400

        uploads_dir = Path(__file__).resolve().parent.parent / "data" / "uploads"
        uploads_dir.mkdir(parents=True, exist_ok=True)
        original_name = (audio_file.filename or "").strip()
        if not original_name:
            ext = ".webm"
            if audio_file.mimetype == "audio/wav":
                ext = ".wav"
            elif audio_file.mimetype == "audio/mpeg":
                ext = ".mp3"
            original_name = f"voice_sample{ext}"

        saved_file = uploads_dir / f"{uuid.uuid4()}_{original_name}"
        audio_file.save(saved_file)

        parsing_error: str | None = None
        frontend_features_raw = request.form.get("features_json")

        voice_features: dict | None = None
        if frontend_features_raw:
            try:
                parsed = json.loads(frontend_features_raw)
                if isinstance(parsed, dict):
                    voice_features = {
                        "dominant_frequency": float(parsed.get("dominant_frequency", 0.0)),
                        "energy": float(parsed.get("energy", 0.0)),
                        "fft_mean": float(parsed.get("fft_mean", 0.0)),
                        "fourier_series": [
                            float(v) for v in (parsed.get("fourier_series", []) or []) if isinstance(v, (int, float))
                        ][:256],
                        "mfcc": [
                            float(v) for v in (parsed.get("mfcc", []) or []) if isinstance(v, (int, float))
                        ][:13],
                        "sample_rate": int(parsed.get("sample_rate", 0)),
                    }
                else:
                    parsing_error = "Invalid features_json format."
            except Exception as exc:
                parsing_error = f"Failed to parse features_json: {exc}"

        try:
            if voice_features is None:
                suffix = saved_file.suffix.lower()
                if suffix == ".wav":
                    voice_features = analyze_audio_file(str(saved_file))
                else:
                    parsing_error = (
                        parsing_error
                        or f"Server-side DSP skipped for '{suffix or 'unknown'}'. "
                        "Provide frontend features_json or upload WAV for full analysis."
                    )
                    voice_features = {
                        "dominant_frequency": 0.0,
                        "energy": 0.0,
                        "fft_mean": 0.0,
                        "fourier_series": [],
                        "mfcc": [0.0] * 13,
                        "sample_rate": 0,
                    }

            mfcc_values = voice_features.get("mfcc", [])
            energy_raw = float(voice_features.get("energy", 0.0))
            dominant_frequency = float(voice_features.get("dominant_frequency", 0.0))
            fft_mean = float(voice_features.get("fft_mean", 0.0))
        except Exception as exc:
            parsing_error = str(exc)
            voice_features = {
                "dominant_frequency": 0.0,
                "energy": 0.0,
                "fft_mean": 0.0,
                "fourier_series": [],
                "mfcc": [0.0] * 13,
                "sample_rate": 0,
            }
            mfcc_values = voice_features["mfcc"]
            energy_raw = 0.0
            dominant_frequency = 0.0
            fft_mean = 0.0

        voice_decision, next_settings = _evaluate_voice_identity(user, voice_features)

        score = round(_clamp((_normalize_mfcc(mfcc_values) + _normalize_energy(energy_raw) + _normalize_fft(fft_mean)) / 3), 2)
        db.add(
            VoiceLog(
                user_id=user.id,
                mfcc=mfcc_values,
                energy=energy_raw,
                pitch=dominant_frequency,
                score=score,
                created_at=_get_current_time(),
            )
        )
        _save_settings(user, next_settings)
        db.commit()

        ml_decision, ml_reason = _evaluate_latest_behavior(db, user)

        return jsonify(
            {
                "features": voice_features,
                "fourier": {
                    "dominant_frequency": voice_features.get("dominant_frequency"),
                    "fft_mean": voice_features.get("fft_mean"),
                },
                "mlDecision": ml_decision,
                "mlDecisionReason": ml_reason,
                "metrics": _latest_voice_metrics(db, user.id),
                "score": score,
                "status": "accepted",
                "warning": (
                    f"Audio saved but DSP extraction failed: {parsing_error}" if parsing_error else None
                ),
                "voiceIdentity": voice_decision,
            }
        )


@api_bp.get("/biometrics/keyboard")
def biometrics_keyboard():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code
        return jsonify(_latest_keyboard_metrics(db, user.id))


@api_bp.post("/biometrics/keyboard/submit")
def biometrics_keyboard_submit():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code

        payload = request.get_json(silent=True) or {}
        timings = payload.get("keystrokeTimings", []) if isinstance(payload, dict) else []
        if not isinstance(timings, list):
            return jsonify({"message": "keystrokeTimings must be a list."}), 400

        timestamps = [
            item.get("timestamp")
            for item in timings
            if isinstance(item, dict) and item.get("timestamp") is not None
        ]
        if len(timestamps) < 2:
            return jsonify({"message": "Not enough keystrokes for analysis."}), 400

        features = analyze_keyboard(timestamps)
        avg_delay = float(features.get("avg_delay", 0.0))
        score = round(_clamp(100 - (avg_delay / 10 if avg_delay > 0 else 100)), 2)

        durations = [
            float(item.get("duration", 0.0))
            for item in timings
            if isinstance(item, dict) and isinstance(item.get("duration", 0), (int, float))
        ]
        avg_duration = float(sum(durations) / len(durations)) if durations else 0.0

        db.add(
            KeyboardLog(
                user_id=user.id,
                avg_delay=avg_delay,
                avg_duration=avg_duration,
                rhythm=features.get("delays", []),
                score=score,
                created_at=_get_current_time(),
            )
        )
        db.commit()

        ml_decision, ml_reason = _evaluate_latest_behavior(db, user)

        return jsonify(
            {
                "features": features,
                "metrics": _latest_keyboard_metrics(db, user.id),
                "mlDecision": ml_decision,
                "mlDecisionReason": ml_reason,
                "status": "accepted",
            }
        )


@api_bp.get("/user/profile")
def user_profile():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code
        return jsonify(_build_user_payload(user))


@api_bp.put("/user/profile")
def update_user_profile():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code

        payload = request.get_json(silent=True) or {}
        user.first_name = payload.get("firstName", user.first_name)
        user.last_name = payload.get("lastName", user.last_name)
        user.phone = payload.get("phone", user.phone)
        db.commit()
        return jsonify(_build_user_payload(user))


@api_bp.post("/user/change-password")
def user_change_password():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code

        payload = request.get_json(silent=True) or {}
        current_password = str(payload.get("currentPassword", ""))
        new_password = str(payload.get("newPassword", ""))

        if not check_password_hash(user.password_hash, current_password):
            return jsonify({"message": "Current password is incorrect."}), 400
        if len(new_password) < 8:
            return jsonify({"message": "New password must contain at least 8 characters."}), 400

        user.password_hash = generate_password_hash(new_password)
        db.commit()
        return jsonify({"status": "updated"})


@api_bp.get("/settings")
def settings():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code
        return jsonify(_parse_settings(user.settings_json))


@api_bp.put("/settings")
def update_settings():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code

        payload = request.get_json(silent=True) or {}
        current = _parse_settings(user.settings_json)
        current.update(
            {
                "authThreshold": int(payload.get("authThreshold", current["authThreshold"])),
                "enableEmailNotifications": bool(payload.get("enableEmailNotifications", current["enableEmailNotifications"])),
                "enablePushNotifications": bool(payload.get("enablePushNotifications", current["enablePushNotifications"])),
                "enableTwoFactor": bool(payload.get("enableTwoFactor", current["enableTwoFactor"])),
                "keyboardAuthEnabled": bool(payload.get("keyboardAuthEnabled", current["keyboardAuthEnabled"])),
                "sessionTimeout": int(payload.get("sessionTimeout", current["sessionTimeout"])),
                "voiceAuthEnabled": bool(payload.get("voiceAuthEnabled", current["voiceAuthEnabled"])),
            }
        )
        user.settings_json = json.dumps(current)
        db.commit()
        return jsonify(current)


@api_bp.post("/ml/profile/retrain")
def retrain_behavior_profile():
    """Recalcule le profil comportemental utilisateur depuis les logs DB."""
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code

        profile = _build_behavior_profile(db, user)
        if profile is None:
            return jsonify(
                {
                    "message": "Need at least 3 paired voice/keyboard samples to train profile.",
                    "status": "insufficient_data",
                }
            )

        return jsonify(
            {
                "featureCount": profile.get("feature_count"),
                "sampleCount": profile.get("sample_count"),
                "status": "trained",
            }
        )


@api_bp.get("/ml/decision")
def get_ml_decision():
    """Retourne la decision continue a partir des derniers echantillons voix+clavier."""
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code

        decision, reason = _evaluate_latest_behavior(db, user)
        if decision is None:
            settings = _parse_settings(user.settings_json)
            last_voice_decision = settings.get("lastVoiceDecision")
            if isinstance(last_voice_decision, dict):
                return jsonify({"decision": last_voice_decision, "status": "voice_only"})

            return jsonify(
                {
                    "decision": None,
                    "reason": reason,
                    "status": "warming_up",
                    "message": "Not enough behavioral data yet. Continue capturing voice and keyboard samples.",
                }
            )

        return jsonify({"decision": decision, "status": "ok"})


@api_bp.get("/analytics")
def analytics():
    with SessionLocal() as db:
        user, _, auth_error = _resolve_user_from_token(db)
        if auth_error:
            payload, status_code = auth_error
            return jsonify(payload), status_code

        period = request.args.get("range", "7d")
        voice_count = db.scalar(select(func.count()).select_from(VoiceLog).where(VoiceLog.user_id == user.id)) or 0
        keyboard_count = db.scalar(select(func.count()).select_from(KeyboardLog).where(KeyboardLog.user_id == user.id)) or 0
        avg_voice_score = db.scalar(select(func.avg(VoiceLog.score)).where(VoiceLog.user_id == user.id)) or 0.0
        avg_keyboard_score = db.scalar(select(func.avg(KeyboardLog.score)).where(KeyboardLog.user_id == user.id)) or 0.0
        average_score = round(_clamp((float(avg_voice_score) + float(avg_keyboard_score)) / 2), 2)

        auth_attempts = int(voice_count + keyboard_count)
        return jsonify(
            {
                "authAttempts": auth_attempts,
                "averageScore": average_score,
                "failureReasons": {"keyboard_drift": 0, "voice_noise": 0},
                "period": period,
                "successRate": average_score,
                "topAuthMethod": "hybrid" if voice_count and keyboard_count else ("voice" if voice_count else "keyboard"),
            }
        )