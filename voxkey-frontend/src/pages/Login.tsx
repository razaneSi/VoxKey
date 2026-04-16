import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../Auth.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(username, password);
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new Event('voxkey:navigate'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background"></div>

      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
            
              <div className="logo-icon-auth">
                <i className="bx bx-wifi" />
              </div>
              <h1>VoxKey</h1>
            </div>
            <p className="auth-subtitle">Authentification Comportementale Continu</p>
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
                  placeholder="Entrez votre username"
                  disabled={isLoading}
                  required
                  autoComplete="username"
                />
                <span className="input-icon"><i className="bx bx-user bx-wiggle" /></span>
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
                  placeholder="Entrez votre mot de passe"
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
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
            </div>

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn-login"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <span className="loading-text">
                  <span className="spinner"></span> Connexion...
                </span>
              ) : (
                'Se Connecter'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Pas encore de compte?{' '}
              <a href="/register" className="auth-link">
                S'inscrire
              </a>
            </p>
          </div>

          <div className="auth-features">
  <div className="feature-item">
    <span className="feature-icon">
      <i className="bx bx-microphone" />
    </span>
    <p>Authentification Vocale</p>
  </div>

  <div className="feature-item">
    <span className="feature-icon">
<i className="bx bx-dialpad" />    </span>
    <p>Pattern Clavier</p>
  </div>

  <div className="feature-item">
    <span className="feature-icon">
      <i className="bx bx-shield-quarter" />
    </span>
    <p>Sécurité Continue</p>
  </div>
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

export default Login;
