import librosa
import os
import numpy as np
import subprocess
import imageio_ffmpeg
import sys
import tempfile

def ensure_wav(audio_path, header_to_prepend=None):
    """Converts non-wav files to wav using ffmpeg if necessary."""
    sys.stdout.write(f"DEBUG: ensuring wav for {audio_path}\n")
    sys.stdout.flush()
    
    if audio_path.lower().endswith(".wav"):
        return audio_path
        
    # Check if header is missing and we have one to prepend
    if os.path.exists(audio_path):
        with open(audio_path, "rb") as f:
            head = f.read(4)
            if head != b"\x1aE\xdf\xa3" and header_to_prepend:
                sys.stdout.write("DEBUG: WebM header missing, prepending cached header...\n")
                sys.stdout.flush()
                temp_with_head = audio_path + "_with_head.webm"
                with open(temp_with_head, "wb") as f_out:
                    f_out.write(header_to_prepend)
                    f_out.seek(0, 2)
                    f.seek(0)
                    f_out.write(f.read())
                audio_path = temp_with_head

    # Create a persistent temp file in the app's directory to avoid cleanup too early
    temp_dir = os.path.join(os.getcwd(), "data", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    wav_path = os.path.join(temp_dir, os.path.basename(audio_path).rsplit(".", 1)[0] + ".wav")
    
    if os.path.exists(wav_path) and not header_to_prepend:
         return wav_path
         
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    try:
        # Simple ffmpeg command to convert to 16kHz mono wav
        process = subprocess.Popen([
            ffmpeg_exe, "-i", audio_path, 
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", 
            wav_path, "-y"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate()
        
        if os.path.exists(wav_path):
             return wav_path
        return audio_path
    except Exception:
        return audio_path

def cosine(a, b):
    a = np.array(a)
    b = np.array(b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0: return 0.0
    return np.dot(a, b) / (norm_a * norm_b)

def extract_dsp_features(audio_path):
    """Extract standard voice features (MFCC, Spectral Centroid, ZCR)."""
    audio_path = ensure_wav(audio_path)
    try:
        y, sr = librosa.load(audio_path, sr=16000)
    except Exception:
        return {"mfcc": [0.0]*20, "centroid": 0.0, "zcr": 0.0}
        
    # MFCC (Highly discriminating for voice identity)
    mfcc = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20), axis=1)
    
    # Spectral Centroid (Pitch-related)
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    
    # Zero Crossing Rate (Noise-related)
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))
    
    return {
        "mfcc": mfcc.tolist(),
        "centroid": centroid,
        "zcr": zcr
    }

# 🔹 ENROLL USER
def create_voice_profile(audio_path):
    """Creates a DSP voice profile."""
    voice_header = None
    if audio_path.lower().endswith(".webm") and os.path.exists(audio_path):
        with open(audio_path, "rb") as f:
            voice_header = f.read(8192)

    features = extract_dsp_features(audio_path)

    return {
        "mfcc": features["mfcc"],
        "centroid": features["centroid"],
        "zcr": features["zcr"],
        "voice_header": voice_header
    }


# 🔹 VERIFY USER
def verify_voice_identity(stored_profile, audio_path, voice_header=None):
    audio_path = ensure_wav(audio_path, header_to_prepend=voice_header)
    cur = extract_dsp_features(audio_path)

    # Compare MFCC vectors using cosine similarity
    mfcc_sim = float(cosine(stored_profile["mfcc"], cur["mfcc"]))
    
    # Compare scalar features using ratio
    def scalar_sim(a, b):
        if a == 0 or b == 0: return 0.0
        # More sensitive comparison
        diff = abs(a - b)
        scale = max(a, b)
        return max(0.0, 1.0 - (diff / (scale * 0.15))) # 15% diff is 0 score

    cent_sim = scalar_sim(stored_profile["centroid"], cur["centroid"])
    zcr_sim = scalar_sim(stored_profile["zcr"], cur["zcr"])

    # High sensitivity combined score
    # MFCC is 80% because it's the strongest identity signal
    combined = (mfcc_sim * 0.8) + (cent_sim * 0.15) + (zcr_sim * 0.05)
    
    # Scale score to be more "visibly" different
    display_score = (combined - 0.4) / 0.6 # Map 0.4-1.0 to 0.0-1.0
    display_score = max(0.0, min(1.0, display_score))

    return {
        "resemblyzer_score": mfcc_sim, 
        "speechbrain_score": cent_sim,
        "fft_score": zcr_sim,
        "combined_score": display_score
    }