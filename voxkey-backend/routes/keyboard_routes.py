"""Routes de collecte et d'analyse clavier."""

from flask import Blueprint, jsonify, request

from services.keyboard_service import analyze_keyboard


keyboard_bp = Blueprint("keyboard", __name__, url_prefix="/keyboard")


@keyboard_bp.post("/analyze")
def analyze_keyboard_route():
    """Analyse une serie de timestamps de frappes."""
    payload = request.get_json(silent=True) or {}
    times = payload.get("times", [])

    if not isinstance(times, list):
        return jsonify({"error": "Field 'times' must be a list of timestamps."}), 400

    return jsonify(
        {
            "features": analyze_keyboard(times),
            "status": "analyzed",
        }
    )
