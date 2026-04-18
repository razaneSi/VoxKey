import type {
  DashboardData,
  UserProfile,
  UserSettings,
  AuthResponse,
} from '../Types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: this.getHeaders(!endpoint.includes('/public')),
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}`,
      }));

      throw new Error(error.message || error.error || 'API request failed');
    }

    return response.json();
  }

  // Authentication endpoints
  async login(username: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Dashboard endpoints
  async fetchDashboardData(): Promise<DashboardData> {
    return this.request<DashboardData>('/dashboard', {
      method: 'GET',
    });
  }

  async fetchAuthScore() {
    return this.request('/dashboard/auth-score', {
      method: 'GET',
    });
  }

  async fetchVoiceMetrics() {
    return this.request('/biometrics/voice', {
      method: 'GET',
    });
  }

  async fetchKeyboardPattern() {
    return this.request('/biometrics/keyboard', {
      method: 'GET',
    });
  }

  async fetchRealtimeScores() {
    return this.request('/dashboard/realtime-scores', {
      method: 'GET',
    });
  }

  async fetchActivities() {
    return this.request('/dashboard/activities', {
      method: 'GET',
    });
  }

  async fetchSystemStatus() {
    return this.request('/system/status', {
      method: 'GET',
    });
  }

  // Biometric data endpoints
  async submitVoiceSample(audioData: Blob, features?: object) {
    const formData = new FormData();
    const ext = audioData.type.includes('wav') ? 'wav' : 'webm';
    formData.append('audio', audioData, `voice-sample.${ext}`);
    if (features) {
      formData.append('features_json', JSON.stringify(features));
    }

    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/biometrics/voice/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Voice sample submission failed');
    }

    return response.json();
  }

  async submitKeyboardData(keyboardMetrics: object) {
    return this.request('/biometrics/keyboard/submit', {
      method: 'POST',
      body: JSON.stringify(keyboardMetrics),
    });
  }

  // User endpoints
  async getUserProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/user/profile', {
      method: 'GET',
    });
  }

  async updateUserProfile(profileData: object): Promise<UserProfile> {
    return this.request<UserProfile>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Settings endpoints
  async fetchSettings(): Promise<UserSettings> {
    return this.request<UserSettings>('/settings', {
      method: 'GET',
    });
  }

  async updateSettings(settings: UserSettings): Promise<UserSettings> {
    return this.request<UserSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Analytics endpoints
  async fetchAnalytics(timeRange: string = '7d') {
    return this.request(`/analytics?range=${timeRange}`, {
      method: 'GET',
    });
  }

  // ML decision endpoints
  async fetchMlDecision() {
    return this.request('/ml/decision', {
      method: 'GET',
    });
  }

  async retrainMlProfile() {
    return this.request('/ml/profile/retrain', {
      method: 'POST',
    });
  }
}

const apiClient = new ApiClient();

// Export individual functions for convenience
export const fetchDashboardData = () => apiClient.fetchDashboardData();
export const fetchAuthScore = () => apiClient.fetchAuthScore();
export const fetchVoiceMetrics = () => apiClient.fetchVoiceMetrics();
export const fetchKeyboardPattern = () => apiClient.fetchKeyboardPattern();
export const fetchRealtimeScores = () => apiClient.fetchRealtimeScores();
export const fetchActivities = () => apiClient.fetchActivities();
export const fetchSystemStatus = () => apiClient.fetchSystemStatus();
export const submitVoiceSample = (audioData: Blob, features?: object) =>
  apiClient.submitVoiceSample(audioData, features);
export const submitKeyboardData = (metrics: object) => apiClient.submitKeyboardData(metrics);
export const login = (username: string, password: string) => apiClient.login(username, password);
export const register = (username: string, email: string, password: string) =>
  apiClient.register(username, email, password);
export const logout = () => apiClient.logout();
export const getUserProfile = () => apiClient.getUserProfile();
export const updateUserProfile = (profileData: object) => apiClient.updateUserProfile(profileData);
export const changePassword = (currentPassword: string, newPassword: string) =>
  apiClient.changePassword(currentPassword, newPassword);
export const fetchSettings = () => apiClient.fetchSettings();
export const updateSettings = (settings: UserSettings) => apiClient.updateSettings(settings);
export const fetchAnalytics = (timeRange?: string) => apiClient.fetchAnalytics(timeRange);
export const fetchMlDecision = () => apiClient.fetchMlDecision();
export const retrainMlProfile = () => apiClient.retrainMlProfile();

export default apiClient;
