"""Services d'authentification continue et de verification."""

from services.ml_service import predict_identity_score


def verify_continuous_identity(voice_features: dict, keyboard_features: dict) -> dict:
    """Verifie si les features courantes ressemblent au profil appris."""
    return predict_identity_score(voice_features, keyboard_features)
