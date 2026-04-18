import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useKeyboard, type KeyboardMetrics } from '../hooks/useKeyboard';
import { useMicrophone } from '../hooks/useMicrophone';
import { submitKeyboardData, submitVoiceSample } from '../services/api';
import '../Auth.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [typingSample, setTypingSample] = useState('');
  const [capturedKeyboardMetrics, setCapturedKeyboardMetrics] = useState<KeyboardMetrics | null>(null);
  const [registrationDone, setRegistrationDone] = useState(false);

  const { register } = useAuth();
  const {
    isTracking,
    startTracking,
    stopTracking,
  } = useKeyboard();
  const {
    isRecording,
    audioBlob,
    metrics: audioMetrics,
    error: audioError,
    startRecording,
    stopRecording,
  } = useMicrophone();

  const validateForm = (): string | null => {
    if (!username || username.length < 3) {
      return 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }
    if (!email || !email.includes('@')) {
      return 'Veuillez entrer une adresse email valide';
    }
    if (!password || password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (password !== confirmPassword) {
      return 'Les mots de passe ne correspondent pas';
    }
    if (!termsAccepted) {
      return 'Vous devez accepter les conditions d\'utilisation';
    }
    if (!audioBlob) {
      return 'Veuillez enregistrer un échantillon vocal.';
    }
    if (!capturedKeyboardMetrics || capturedKeyboardMetrics.totalKeystrokes < 3) {
      return 'Veuillez saisir un court texte pour analyser votre pattern clavier.';
    }
    return null;
  };

  const uploadBiometrics = async () => {
    if (!audioBlob || !capturedKeyboardMetrics) {
      throw new Error('Biometric samples are not ready');
    }
    await submitVoiceSample(audioBlob, audioMetrics || undefined);
    await submitKeyboardData(capturedKeyboardMetrics);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    let accountCreated = registrationDone;

    try {
      if (!accountCreated) {
        await register(username, email, password);
        accountCreated = true;
        setRegistrationDone(true);
      }

      await uploadBiometrics();
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new Event('voxkey:navigate'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (accountCreated) {
        setError(`Compte créé, mais l'enregistrement biométrique a échoué: ${message}`);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = password ? calculatePasswordStrength(password) : 0;

  return (
    <div className="auth-container">
      <div className="auth-background"></div>

      <div className="auth-content">
        <div className="auth-card auth-card-register">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon-auth">
                <i className="bx bx-wifi" />
              </div>
              <h1>VoxKey</h1>
            </div>
            <p className="auth-subtitle">Créer votre compte de sécurité</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <div className="input-wrapper">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choisissez un username"
                  disabled={isLoading}
                  required
                  autoComplete="username"
                />
                <span className="input-icon"><i className="bx bx-user bx-wiggle" /></span>
              </div>
              <small className="input-hint">3 caractères minimum</small>
            </div>

            <div className="form-group">
              <label htmlFor="email">Adresse Email</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
                <span className="input-icon"><i className="bx bx-envelope" /></span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez un mot de passe"
                  disabled={isLoading}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                 {showPassword ? (
  <i className="bx bx-hide" />
) : (
  <i className="bx bx-show" />
)}
                </button>
              </div>
              
              {password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className={`strength-fill strength-${passwordStrength}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    ></div>
                  </div>
                  <small className={`strength-text strength-text-${passwordStrength}`}>
                    {getPasswordStrengthText(passwordStrength)}
                  </small>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  disabled={isLoading}
                  required
                  autoComplete="new-password"
                />
                <span className="input-icon"><i className="bx bx-lock-open" /></span>
              </div>
            </div>

            <div className="form-checkbox">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={isLoading}
              />
              <label htmlFor="terms">
                J'accepte les{' '}
                <a href="/terms" className="auth-link">
                  conditions d'utilisation
                </a>
              </label>
            </div>

            <div className="form-group">
              <label>Échantillon vocal</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isRecording ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => startRecording()}
                    disabled={isLoading}
                  >
                    Démarrer l'écoute
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => stopRecording()}
                    disabled={isLoading}
                  >
                    Arrêter l'écoute
                  </button>
                )}
              </div>
              <small className="input-hint">
                {audioBlob ? 'Échantillon vocal prêt.' : 'Enregistrez 3 à 5 secondes de voix.'}
              </small>
              {audioError && <small className="input-hint" style={{ color: '#ff7b7b' }}>{audioError}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="typingSample">Analyse du pattern clavier</label>
              <textarea
                id="typingSample"
                value={typingSample}
                onFocus={() => {
                  if (!isTracking) {
                    startTracking();
                  }
                }}
                onBlur={() => {
                  if (isTracking) {
                    const captured = stopTracking();
                    setCapturedKeyboardMetrics(captured);
                  }
                }}
                onChange={(e) => setTypingSample(e.target.value)}
                placeholder="Tapez une phrase naturelle ici pour capturer votre rythme..."
                disabled={isLoading}
                rows={4}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <small className="input-hint">
                {capturedKeyboardMetrics
                  ? `Pattern capturé: ${capturedKeyboardMetrics.totalKeystrokes} frappes`
                  : 'Cliquez puis tapez; quittez le champ pour finaliser la capture.'}
              </small>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn-login"
              disabled={
                isLoading ||
                !username ||
                !email ||
                !password ||
                !confirmPassword ||
                !termsAccepted ||
                !audioBlob
              }
            >
              {isLoading ? (
                <span className="loading-text">
                  <span className="spinner"></span> Création du compte...
                </span>
              ) : (
                'Créer un compte'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Vous avez déjà un compte?{' '}
              <a href="/login" className="auth-link">
                Se connecter
              </a>
            </p>
            {registrationDone && (
              <p>
                Compte créé. Si besoin, relancez l'enregistrement biométrique puis cliquez sur
                {' '}
                <strong>Créer un compte</strong>.
              </p>
            )}
          </div>
        </div>

        <div className="auth-decorative">
          <div className="glow-ball glow-1"></div>
          <div className="glow-ball glow-2"></div>
          <div className="glow-ball glow-3"></div>
        </div>
      </div>
    </div>
  );
};

function calculatePasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;
  return Math.min(strength, 4);
}
function getPasswordStrengthText(strength: number): React.ReactElement {
  switch (strength) {
    case 0:
    case 1:
      return (
        <span>
          <i className="bx bx-error-circle" style={{ color: "#ff4d4d" }} /> Faible
        </span>
      );

    case 2:
      return (
        <span>
          <i className="bx bx-shield-quarter" style={{ color: "#ffb84d" }} /> Moyen
        </span>
      );

    case 3:
      return (
        <span>
          <i className="bx bx-shield-alt-2" style={{ color: "#4dff88" }} /> Bon
        </span>
      );

    case 4:
      return (
        <span>
          <i className="bx bx-shield-check" style={{ color: "#00ffc8" }} /> Excellent
        </span>
      );

    default:
      return (
        <span>
          <i className="bx bx-question-mark" /> Inconnu
        </span>
      );
  }
}

export default Register;
