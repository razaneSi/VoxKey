import sys
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes.audio_routes import audio_bp
from routes.keyboard_routes import keyboard_bp
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.biometrics_routes import biometrics_bp


def create_app() -> Flask:
    """Construit une application Flask minimale."""
    app = Flask(__name__)
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["DEBUG"] = Config.DEBUG
    app.config["SQLALCHEMY_DATABASE_URI"] = Config.SQLALCHEMY_DATABASE_URI

    CORS(app)
    app.register_blueprint(audio_bp, url_prefix="/api/audio")
    app.register_blueprint(keyboard_bp, url_prefix="/api/keyboard")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/api")
    app.register_blueprint(biometrics_bp, url_prefix="/api/biometrics")

    @app.get("/health")
    def health_check():
        return jsonify(
            {
                "database": "sqlite",
                "modules": ["auth", "audio", "keyboard", "analytics"],
                "status": "ok",
            }
        )

    return app


if __name__ == "__main__":
    application = create_app()
    # Disable reloader to prevent Werkzeug from scanning LazyModules
    application.run(host="0.0.0.0", port=5000, use_reloader=False)
