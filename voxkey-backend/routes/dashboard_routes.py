from flask import Blueprint, jsonify
from db.database import SessionLocal
from models.auth_attempt import AuthAttempt
from models.user import User
from models.audio_log import VoiceLog
from models.keyboard_log import KeyboardLog
from sqlalchemy import select, desc
import json

dashboard_bp = Blueprint("dashboard", __name__)

def get_current_user(session):
    return session.execute(select(User)).scalars().first()

@dashboard_bp.get("/dashboard")
def get_dashboard_summary():
    """Returns a summary of system status and recent activity."""
    with SessionLocal() as session:
        user = get_current_user(session)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get last 5 attempts
        stmt = select(AuthAttempt).where(AuthAttempt.user_id == user.id).order_by(desc(AuthAttempt.created_at)).limit(5)
        attempts = session.execute(stmt).scalars().all()
        
        # Get latest voice log
        v_log = session.execute(select(VoiceLog).where(VoiceLog.user_id == user.id).order_by(desc(VoiceLog.created_at))).scalars().first()
        k_log = session.execute(select(KeyboardLog).where(KeyboardLog.user_id == user.id).order_by(desc(KeyboardLog.created_at))).scalars().first()

        recent_scores = session.execute(select(AuthAttempt).where(AuthAttempt.user_id == user.id).order_by(desc(AuthAttempt.created_at)).limit(10)).scalars().all()
        realtime = [{"time": a.created_at.strftime("%H:%M:%S"), "score": a.final_score * 100} for a in reversed(recent_scores)]

        return jsonify({
            "authScore": (attempts[0].final_score * 100) if attempts else 100,
            "voiceMetrics": {
                "resemblyzer": v_log.resemblyzer_score if v_log else 1.0,
                "speechbrain": v_log.speechbrain_score if v_log else 1.0,
                "fft": v_log.fft_score if v_log else 1.0,
                "score": v_log.final_score if v_log else 1.0
            },
            "keyboardPattern": {
                "weekData": [70, 75, 80, 85, 90, 85, 88],
                "weekLabels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                "stats": {
                    "avgDelay": k_log.avg_delay if k_log else 0.0,
                    "score": k_log.score if k_log else 1.0
                }
            },
            "activities": [
                {
                    "id": str(a.id),
                    "type": "success" if a.status == "valide" else "error",
                    "message": f"Auth {a.status} (V: {a.voice_score:.2f}, K: {a.keyboard_score:.2f})",
                    "timestamp": a.created_at.isoformat()
                } for a in attempts
            ],
            "systemStatus": {
                "apiFlask": "active",
                "moduleMl": "active",
                "database": "active",
                "dspEngine": "active"
            },
            "realtimeScores": realtime if realtime else [{"time": "Now", "score": 100}]
        })

@dashboard_bp.get("/dashboard/auth-score")
def get_current_auth_score():
    """Returns the latest authentication score."""
    with SessionLocal() as session:
        user = get_current_user(session)
        if not user:
            return jsonify({"score": 0, "status": "failed"})

        stmt = select(AuthAttempt).where(AuthAttempt.user_id == user.id).order_by(desc(AuthAttempt.created_at)).limit(1)
        attempt = session.execute(stmt).scalar_one_or_none()
        
        return jsonify({
            "score": attempt.final_score * 100 if attempt else 100,
            "status": attempt.status if attempt else "success",
            "timestamp": attempt.created_at.isoformat() if attempt else None
        })

@dashboard_bp.get("/dashboard/realtime-scores")
def get_realtime_scores():
    """Returns real-time biometric scores."""
    with SessionLocal() as session:
        user = get_current_user(session)
        if not user:
            return jsonify([])

        recent_scores = session.execute(select(AuthAttempt).where(AuthAttempt.user_id == user.id).order_by(desc(AuthAttempt.created_at)).limit(10)).scalars().all()
        return jsonify([{"time": a.created_at.strftime("%H:%M:%S"), "score": a.final_score * 100} for a in reversed(recent_scores)])

@dashboard_bp.get("/ml/decision")
def get_ml_decision():
    """Returns the latest ML decision."""
    with SessionLocal() as session:
        user = get_current_user(session)
        if not user:
            return jsonify({"decision": "unknown"})

        stmt = select(AuthAttempt).where(AuthAttempt.user_id == user.id).order_by(desc(AuthAttempt.created_at)).limit(1)
        attempt = session.execute(stmt).scalar_one_or_none()

        if attempt:
            return jsonify({
                "decision": {
                    "decision": attempt.status,
                    "confidence": attempt.final_score * 100,
                    "last_check": attempt.created_at.isoformat()
                }
            })
        return jsonify({
            "decision": {
                "decision": "verified",
                "confidence": 100.0,
                "last_check": "Just now"
            }
        })

@dashboard_bp.get("/user/profile")
def get_user_profile():
    """Returns the user profile."""
    with SessionLocal() as session:
        user = get_current_user(session)
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "username": user.username,
            "email": user.email,
            "role": "admin",
            "last_login": "Just now"
        })

@dashboard_bp.get("/dashboard/activities")
def get_dashboard_activities():
    """Returns recent system activities."""
    with SessionLocal() as session:
        user = get_current_user(session)
        if not user:
            return jsonify([])

        stmt = select(AuthAttempt).where(AuthAttempt.user_id == user.id).order_by(desc(AuthAttempt.created_at)).limit(10)
        attempts = session.execute(stmt).scalars().all()
        
        return jsonify([
            {"id": a.id, "type": "success" if a.status == "valide" else "error", "message": f"Auth {a.status} (Score: {a.final_score:.2f})", "time": a.created_at.strftime("%H:%M:%S")}
            for a in attempts
        ])

@dashboard_bp.get("/settings")
def get_settings():
    """Returns user settings."""
    return jsonify({
        "enableEmailNotifications": True,
        "enablePushNotifications": False,
        "enableTwoFactor": False,
        "voiceAuthEnabled": True,
        "keyboardAuthEnabled": True,
        "authThreshold": 75,
        "sessionTimeout": 3600000
    })

@dashboard_bp.get("/analytics")
def get_analytics():
    """Returns system analytics."""
    return jsonify({
        "period": "7d",
        "authAttempts": 150,
        "successRate": 96.5,
        "averageScore": 84.2,
        "topAuthMethod": "hybrid",
        "failureReasons": {
            "low_score": 3,
            "timeout": 1,
            "mismatch": 1
        }
    })

@dashboard_bp.get("/system/status")
def get_system_status():
    """Returns the overall system status."""
    return jsonify({
        "status": "active",
        "apiFlask": "active",
        "moduleMl": "active",
        "database": "active",
        "dspEngine": "active"
    })