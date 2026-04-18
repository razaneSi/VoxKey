from resemblyzer import VoiceEncoder, preprocess_wav
from speechbrain.pretrained import EncoderClassifier
import numpy as np

# Load models ONCE
encoder = VoiceEncoder()

classifier = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb"
)

def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


# 🔹 ENROLL USER
def create_voice_profile(audio_path):
    wav = preprocess_wav(audio_path)

    embed_r = encoder.embed_utterance(wav)
    embed_s = classifier.encode_batch(wav).squeeze().numpy()

    return {
        "resemblyzer": embed_r.tolist(),
        "speechbrain": embed_s.tolist()
    }


# 🔹 VERIFY USER
def verify_voice(stored_profile, audio_path):
    wav = preprocess_wav(audio_path)

    new_r = encoder.embed_utterance(wav)
    new_s = classifier.encode_batch(wav).squeeze().numpy()

    r_sim = cosine(np.array(stored_profile["resemblyzer"]), new_r)
    s_sim = cosine(np.array(stored_profile["speechbrain"]), new_s)

    return r_sim, s_sim