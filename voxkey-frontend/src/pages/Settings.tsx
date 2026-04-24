import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, changePassword, fetchSettings, updateSettings } from '../services/api';
import '../Settings.css';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
}

interface UserSettings {
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  enableTwoFactor: boolean;
  voiceAuthEnabled: boolean;
  keyboardAuthEnabled: boolean;
  authThreshold: number;
  sessionTimeout: number;
}

const DEMO_PROFILE: UserProfile = {
  id: 'demo-user',
  username: 'demo_user',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  phone: '+1-234-567-8900',
  createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
};

const DEMO_SETTINGS: UserSettings = {
  enableEmailNotifications: true,
  enablePushNotifications: true,
  enableTwoFactor: false,
  voiceAuthEnabled: true,
  keyboardAuthEnabled: true,
  authThreshold: 85,
  sessionTimeout: 180,
};

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isDemoProfile, setIsDemoProfile] = useState(false);
  const [isDemoSettings, setIsDemoSettings] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Always sync profile with the authenticated session user.
      if (user) {
        const sessionProfile: UserProfile = {
          id: user.id,
          username: user.username,
          email: user.email || '',
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          createdAt: user.createdAt || new Date().toISOString(),
        };
        setProfile(sessionProfile);
        setProfileForm(sessionProfile);
        setIsDemoProfile(false);
      } else {
        setProfile(DEMO_PROFILE);
        setProfileForm(DEMO_PROFILE);
        setIsDemoProfile(true);
      }

      // Load settings with fallback
      try {
        const settingsData = await fetchSettings();
        setSettings(settingsData);
        setIsDemoSettings(false);
      } catch (settingsErr) {
        console.warn('Settings API failed, using demo:', settingsErr);
        setSettings(DEMO_SETTINGS);
        setIsDemoSettings(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveProfile = async () => {
    try {
      setError(null);
      await updateUserProfile(profileForm);
      const merged = { ...(profile || {}), ...profileForm } as UserProfile;
      setProfile(merged);
      localStorage.setItem('user', JSON.stringify(merged));
      setEditingProfile(false);
      setSuccess('Profil mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setError(null);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
      setSuccess('Mot de passe changé avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) {
      return;
    }

    try {
      setError(null);
      await updateSettings(settings);
      setSuccess('Préférences mises à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  if (loading) {
    return <div className="settings-loading">Chargement des paramètres...</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button 
            onClick={() => window.history.back()} 
            className="btn-secondary"
            style={{ marginRight: '1rem' }}
          >
            ← Retour
          </button>
          <h1>Paramètres</h1>
        </div>
        <p>Gérez votre profil et vos préférences</p>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon"><i className="bx bx-user-circle" /></span>
            Profil
          </button>
          <button
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="tab-icon"><i className="bx bx-fingerprint" /></span>
            Sécurité
          </button>
          <button
            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <span className="tab-icon"><i className="bx bx-cog" /></span>
            Préférences
          </button>
        </div>

        <div className="settings-panel">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Profile Tab */}        
           {activeTab === 'profile' && profile && 
           ( <div className="tab-content"> 
           <h2>Information du Profil {isDemoProfile && 
            <span className="demo-badge">(Mode Démo)</span>}
            </h2>

              {!editingProfile ? (
                <div className="profile-view">
                  <div className="profile-item">
                    <label>Nom d'utilisateur</label>
                    <p>{profile.username}</p>
                  </div>
                  <div className="profile-item">
                    <label>Email</label>
                    <p>{profile.email}</p>
                  </div>
                  <div className="profile-item">
                    <label>Prénom</label>
                    <p>{profile.firstName || '-'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Nom</label>
                    <p>{profile.lastName || '-'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Téléphone</label>
                    <p>{profile.phone || '-'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Compte créé le</label>
                    <p>{new Date(profile.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => setEditingProfile(true)}
                  >
                    Modifier le profil
                  </button>
                </div>
              ) : (
                <div className="profile-edit">
                  <div className="form-group">
                    <label>Prénom</label>
                    <input
                      type="text"
                      value={profileForm.firstName || ''}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, firstName: e.target.value })
                      }
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      value={profileForm.lastName || ''}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, lastName: e.target.value })
                      }
                      placeholder="Votre nom"
                    />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      type="tel"
                      value={profileForm.phone || ''}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phone: e.target.value })
                      }
                      placeholder="Votre téléphone"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-primary" onClick={handleSaveProfile}>
                      Enregistrer
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {                         setEditingProfile(false);                         setProfileForm({ ...profile! });                       }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>Sécurité</h2>

              {!changingPassword ? (
                <div className="security-view">
                  <div className="security-item">
                    <div className="security-info">
                      <h3>Mot de passe</h3>
                      <p>Changez votre mot de passe pour plus de sécurité</p>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => setChangingPassword(true)}
                    >
                      Modifier
                    </button>
                  </div>

                  <div className="security-item">
                    <div className="security-info">
                      <h3>Authentification à deux facteurs</h3>
                      <p>Activez 2FA pour plus de sécurité</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings?.enableTwoFactor || false}
                        onChange={(e) =>
                          setSettings({
                            ...settings!,
                            enableTwoFactor: e.target.checked,
                          })
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="security-item">
                    <div className="security-info">
                      <h3>Sessions actives</h3>
                      <p>Gérez vos sessions ouvertes</p>
                    </div>
                    <button className="btn-secondary">Voir les sessions</button>
                  </div>

                  <button className="btn-primary" onClick={handleSaveSettings}>
                    Enregistrer les modifications
                  </button>
                </div>
              ) : (
                <div className="password-change">
                  <div className="form-group">
                    <label>Mot de passe actuel</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="Entrez votre mot de passe actuel"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Entrez votre nouveau mot de passe"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      className="btn-primary"
                      onClick={handleChangePassword}
                      disabled={
                        !passwordForm.currentPassword ||
                        !passwordForm.newPassword ||
                        !passwordForm.confirmPassword
                      }
                    >
                      Changer le mot de passe
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setChangingPassword(false);
                        setPasswordForm({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}           {activeTab === 'preferences' && settings && (             <div className="tab-content">               <h2>Préférences {isDemoSettings && <span className="demo-badge">(Mode Démo)</span>}</h2>

              <div className="preferences-list">
                <div className="preference-item">
                  <div className="preference-info">
                    <h3>Notifications par email</h3>
                    <p>Recevez les alertes de sécurité par email</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.enableEmailNotifications}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          enableEmailNotifications: e.target.checked,
                        })
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <h3>Notifications push</h3>
                    <p>Recevez les notifications en temps réel</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.enablePushNotifications}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          enablePushNotifications: e.target.checked,
                        })
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <h3>Authentification vocale</h3>
                    <p>Activer l'authentification par reconnaissance vocale</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.voiceAuthEnabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          voiceAuthEnabled: e.target.checked,
                        })
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <h3>Authentification clavier</h3>
                    <p>Activer l'authentification par pattern clavier</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.keyboardAuthEnabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          keyboardAuthEnabled: e.target.checked,
                        })
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <h3>Seuil d'authentification</h3>
                    <p>Score minimum requis: {settings.authThreshold}%</p>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={settings.authThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        authThreshold: parseInt(e.target.value),
                      })
                    }
                    className="slider-input"
                  />
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <h3>Timeout de session</h3>
                    <p>Durée: {settings.sessionTimeout / 60} minutes</p>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="480"
                    step="15"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sessionTimeout: parseInt(e.target.value),
                      })
                    }
                    className="slider-input"
                  />
                </div>
              </div>

              <button className="btn-primary" onClick={handleSaveSettings}>
                Enregistrer les préférences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
