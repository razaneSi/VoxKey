import type {
  DashboardData,
  UserProfile,
  UserSettings,
  AuthResponse,
} from '../Types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DEMO_DASHBOARD_DATA: DashboardData = {
  authScore: 94,
  voiceMetrics: {
    mfcc: 87,
    energy: 76,
    ff: 91,
  },
  keyboardPattern: {
    weekData: [45, 52, 38, 61, 48, 55, 42],
    weekLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    stats: {
      avgSpeed: 673,
      avgAccuracy: 98,
      touches: 1240,
    },
  },
  activities: [
    {
      id: '1',
      type: 'success',
      message: 'Voice signature validated successfully',
      timestamp: '14:22:08',
    },
    {
      id: '2',
      type: 'info',
      message: 'Keyboard pattern updated with latest session',
      timestamp: '14:20:15',
    },
    {
      id: '3',
      type: 'warning',
      message: 'Minor rhythm deviation detected and accepted',
      timestamp: '14:18:02',
    },
  ],
  systemStatus: {
    apiFlask: 'active',
    moduleMl: 'active',
    database: 'active',
    dspEngine: 'active',
  },
  realtimeScores: [
    { time: '14:10', score: 82 },
    { time: '14:11', score: 84 },
    { time: '14:12', score: 83 },
    { time: '14:13', score: 87 },
    { time: '14:14', score: 89 },
    { time: '14:15', score: 91 },
    { time: '14:16', score: 90 },
    { time: '14:17', score: 93 },
    { time: '14:18', score: 94 },
    { time: '14:19', score: 92 },
    { time: '14:20', score: 95 },
    { time: '14:21', score: 94 },
  ],
};

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
    try {
      return await this.request<DashboardData>('/dashboard', {
        method: 'GET',
      });
    } catch (error) {
      console.warn('Using demo dashboard data because backend is unavailable.', error);
      return DEMO_DASHBOARD_DATA;
    }
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
  async submitVoiceSample(audioData: Blob) {
    const formData = new FormData();
    formData.append('audio', audioData);

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
export const submitVoiceSample = (audioData: Blob) => apiClient.submitVoiceSample(audioData);
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

export default apiClient;
