from flask import Blueprint, request, jsonify
from db.database import SessionLocal
from models.user import User
from sqlalchemy import select
import os

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
def register():
    """Route to register a new user."""
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all([username, password]):
        return jsonify({"error": "Missing username or password"}), 400

    with SessionLocal() as session:
        # Check if user exists
        exists = session.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if exists:
            return jsonify({"error": "User already exists"}), 409

        new_user = User(
            username=username,
            email=email,
            password_hash=password # Should be hashed
        )
        session.add(new_user)
        session.commit()
        return jsonify({
            "message": "Registration successful",
            "user": {"id": new_user.id, "username": username},
            "token": "mock-token-123"
        }), 201

@auth_bp.post("/login")
def login():
    """Route to login."""
    data = request.json
    username = data.get("username")
    password = data.get("password")

    with SessionLocal() as session:
        user = session.execute(select(User).where(User.username == username, User.password_hash == password)).scalar_one_or_none()
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        return jsonify({
            "message": "Login successful",
            "token": "mock-token-123",
            "user": {"id": user.id, "username": username}
        }), 200
