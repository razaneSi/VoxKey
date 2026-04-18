"""Services lies a l'analyse du rythme de frappe."""

from utils.features import analyze_keyboard_features


def analyze_keyboard(times: list[int | float]) -> dict:
    """Calcule les stats principales du rythme clavier."""
    return analyze_keyboard_features(times)
