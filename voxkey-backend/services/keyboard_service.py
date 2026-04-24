import numpy as np
from utils.features import analyze_keyboard_features

def analyze_keyboard(times: list[float]) -> dict:
    """Analyse les timestamps de frappes."""
    return analyze_keyboard_features(times)

def create_keyboard_profile(times: list[float]) -> dict:
    """Cree un profil de reference pour l'utilisateur."""
    features = analyze_keyboard_features(times)
    return {
        "avg_delay": features["avg_delay"],
        "std_delay": features["std_delay"],
        "delays": features["delays"]
    }

def verify_keyboard(stored_profile, current_times):
    """Compare la frappe actuelle avec le profil stocke."""
    current_features = analyze_keyboard_features(current_times)
    
    # Simple distance-based score (normalized)
    # We compare average delay and standard deviation
    stored_avg = stored_profile["avg_delay"]
    current_avg = current_features["avg_delay"]
    
    if stored_avg == 0: 
        return {"score": 0.0, "avg_delay": 0.0}
    
    diff = abs(stored_avg - current_avg)
    # A difference of the same magnitude as the average is considered 0 score
    score = max(0, 1 - (diff / stored_avg))
    
    return {
        "score": float(score),
        "avg_delay": current_avg
    }
