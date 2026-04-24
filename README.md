# VoxKey

VoxKey is a full-stack continuous authentication prototype that combines voice biometrics and keystroke dynamics.

It includes:
- A React + TypeScript frontend dashboard for enrollment, monitoring, and manual biometric capture
- A Flask backend with SQLite storage, biometric processing services, and JSON APIs

## Table of Contents
1. Overview
2. Architecture
3. Features
4. Tech Stack
5. Repository Structure
6. Prerequisites
7. Environment Configuration
8. Run Locally
9. API Reference
10. Data Model
11. Security Notes
12. Troubleshooting
13. Current Limitations
14. Next Improvements

## Overview
VoxKey continuously evaluates whether the active user matches previously enrolled behavior.

Two modalities are used:
- Voice identity (DSP features from microphone audio)
- Keyboard dynamics (inter-keystroke timing behavior)

The dashboard displays live confidence, logs, and system status.

## Architecture
High-level flow:
1. User registers or logs in from frontend
2. Frontend stores mock auth token in localStorage
3. User submits voice and keyboard samples from Dashboard
4. Backend either enrolls baseline profile (first sample) or verifies against baseline
5. Backend saves attempts/logs to SQLite
6. Frontend polls dashboard + ML decision endpoints and updates UI cards/charts

Components:
- `voxkey-frontend`: React SPA with simple browser-history routing
- `voxkey-backend`: Flask API with route blueprints and services
- `voxkey-backend/voxkey.db`: SQLite database file

## Features
- Authentication:
  - Register and login endpoints
  - Local auth state via React context
- Voice biometrics:
  - Enrollment (first voice sample)
  - Verification with MFCC + spectral centroid + ZCR similarity
  - WebM-to-WAV conversion via ffmpeg
- Keyboard biometrics:
  - Enrollment from timing baseline
  - Verification from average delay similarity
- Dashboard:
  - Current auth score and decision
  - Voice and keyboard charts
  - Activity log and system status
  - Manual start/stop capture controls
- Navigation:
  - SPA navigation using `history.pushState`
  - Section scrolling support in dashboard nav

## Tech Stack
Frontend:
- React 19
- TypeScript
- Chart.js + react-chartjs-2
- boxicons

Backend:
- Flask
- Flask-CORS
- SQLAlchemy
- python-dotenv
- librosa
- numpy
- scipy
- imageio-ffmpeg
- sounddevice (used by audio capture routes)

Database:
- SQLite (local file)

## Repository Structure
```text
VoxKey/
├─ README.md
├─ voxkey-frontend/
│  ├─ package.json
│  ├─ public/
│  └─ src/
│     ├─ components/
│     ├─ context/
│     ├─ hooks/
│     ├─ pages/
│     └─ services/api.ts
└─ voxkey-backend/
   ├─ app.py
   ├─ config.py
   ├─ .env.example
   ├─ db/
   │  ├─ database.py
   │  └─ init_db.py
   ├─ models/
   ├─ routes/
   ├─ services/
   ├─ utils/
   └─ data/
      ├─ uploads/
      └─ temp/
```

## Prerequisites
- Node.js 18+
- npm 9+
- Python 3.10+ (3.11 recommended)
- pip
- ffmpeg available (required for WebM conversion in voice pipeline)

Optional (for `/api/audio/record` route):
- OS audio input permissions
- sounddevice-compatible audio drivers

## Environment Configuration
### Backend env
Example file exists at `voxkey-backend/.env.example`.

Create a `.env` in `voxkey-backend/`:
```env
DEBUG=true
SECRET_KEY=voxkey-dev-secret
```

Notes:
- Current backend uses SQLite from `config.py`
- Postgres keys in `.env.example` are not used by current code

### Frontend env
Optional file: `voxkey-frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

If unset, frontend defaults to `http://localhost:5000/api`.

## Run Locally
### 1) Start backend
From project root:
```powershell
cd voxkey-backend
python -m venv .venv
.\.venv\Scripts\activate
pip install flask flask-cors sqlalchemy python-dotenv librosa numpy scipy imageio-ffmpeg sounddevice
python db/init_db.py
python app.py
```

Backend runs on: `http://localhost:5000`
Health check: `GET http://localhost:5000/health`

### 2) Start frontend
Open a second terminal:
```powershell
cd voxkey-frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

## API Reference
Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/register`
  - body: `{ "username": string, "email": string, "password": string }`
- `POST /auth/login`
  - body: `{ "username": string, "password": string }`

### Biometrics
- `POST /biometrics/voice/submit`
  - multipart form-data:
    - `audio` (required, Blob/File)
    - `features_json` (optional)
  - behavior:
    - no baseline => enroll
    - baseline exists => verify
- `POST /biometrics/keyboard/submit`
  - body accepts `keystrokeTimings` list
  - behavior:
    - no baseline => enroll
    - baseline exists => verify
- `GET /biometrics/voice`
- `GET /biometrics/keyboard`

### Dashboard / System
- `GET /dashboard`
- `GET /dashboard/auth-score`
- `GET /dashboard/realtime-scores`
- `GET /dashboard/activities`
- `GET /ml/decision`
- `GET /system/status`
- `GET /analytics`
- `GET /settings`
- `GET /user/profile`

### Extra utility routes
- `POST /audio/record`
- `POST /audio/features`
- `POST /keyboard/analyze`

### Global
- `GET /health` (outside `/api`)

## Data Model
SQLite tables initialized by `db/init_db.py`:
- `users`
- `voice_logs`
- `keyboard_logs`
- `auth_attempts`

Model files are in `voxkey-backend/models/`:
- `user.py`
- `audio_log.py`
- `keyboard_log.py`
- `auth_attempt.py`

## Security Notes
Important: this repository is currently a prototype and not production-safe.

Current security limitations include:
- Plain-text password comparison/storage pattern in auth route (`password_hash` is not actually hashed)
- Static mock token (`mock-token-123`)
- Most endpoints infer current user as the first user in DB
- No real JWT/session validation middleware
- Wide-open CORS defaults

Do not deploy this version to production without hardening.

## Troubleshooting
- `Voice sample submission failed`
  - Ensure backend is running on port 5000
  - Confirm `REACT_APP_API_URL` points to backend
  - Verify ffmpeg is accessible (via `imageio_ffmpeg` package)
- `No user found to update`
  - Register/login first so a user record exists
- `Invalid credentials`
  - Confirm username/password exactly match stored values
- Microphone issues
  - Check browser microphone permission
  - Check OS device availability

## Current Limitations
- Single-user assumptions in several backend routes
- No robust model lifecycle or training orchestration
- Some route/service naming is legacy (references to ML modules even when logic is DSP + heuristics)
- Existing repo includes large local data artifacts (`data/uploads`, temp audio, sqlite files)

## Next Improvements
1. Add proper password hashing (`bcrypt`) and JWT auth
2. Enforce per-user auth context on all protected routes
3. Add `requirements.txt` or `pyproject.toml` for deterministic backend installs
4. Add backend tests (unit + API integration)
5. Add CI with linting/type checks
6. Add cleanup policy for stored audio artifacts



