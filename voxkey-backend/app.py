"""Point d'entree principal du backend VoxKey."""

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from routes.audio_routes import audio_bp
from routes.keyboard_routes import keyboard_bp


def create_app() -> Flask:
    """Construit une application Flask minimale."""
    app = Flask(__name__)
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["DEBUG"] = Config.DEBUG
    app.config["SQLALCHEMY_DATABASE_URI"] = Config.SQLALCHEMY_DATABASE_URI

    CORS(app)
    app.register_blueprint(audio_bp)
    app.register_blueprint(keyboard_bp)

    @app.get("/health")
    def health_check():
        return jsonify(
            {
                "database": Config.POSTGRES_DB,
                "modules": ["auth", "audio", "keyboard", "analytics"],
                "status": "ok",
            }
        )

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="0.0.0.0", port=5000)
