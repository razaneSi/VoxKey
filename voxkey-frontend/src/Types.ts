// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Biometric Types
export interface VoiceMetrics {
  mfcc: number;
  energy: number;
  ff: number;
  timestamp?: string;
}

export interface KeyboardMetrics {
  totalKeystrokes: number;
  averageSpeed: number;
  averageAccuracy: number;
  keyPattern?: Map<string, number>;
  keystrokeTimings?: KeystrokeMetrics[];
}

export interface KeystrokeMetrics {
  timestamp: number;
  key: string;
  duration: number;
  interval: number;
}

export interface KeyboardPattern {
  weekData: number[];
  weekLabels: string[];
  stats: {
    avgSpeed: number;
    avgAccuracy: number;
    touches: number;
  };
}

// Dashboard Types
export interface DashboardData {
  authScore: number;
  voiceMetrics: VoiceMetrics;
  keyboardPattern: KeyboardPattern;
  activities: Activity[];
  systemStatus: SystemStatus;
  realtimeScores: RealtimeScore[];
}

export interface RealtimeScore {
  time: string;
  score: number;
}

export interface Activity {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export interface SystemStatus {
  apiFlask: 'active' | 'inactive';
  moduleMl: 'active' | 'inactive';
  database: 'active' | 'inactive';
  dspEngine: 'active' | 'inactive';
}

// Settings Types
export interface UserSettings {
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  enableTwoFactor: boolean;
  voiceAuthEnabled: boolean;
  keyboardAuthEnabled: boolean;
  authThreshold: number;
  sessionTimeout: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
}

// API Types
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  message?: string;
}

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Analytics Types
export interface AnalyticsData {
  period: string;
  authAttempts: number;
  successRate: number;
  averageScore: number;
  topAuthMethod: 'voice' | 'keyboard' | 'hybrid';
  failureReasons: {
    [key: string]: number;
  };
}

// Chart Data Types
export interface ChartDataPoint {
  time: string;
  value: number;
  label?: string;
}

export interface ChartData {
  datasets: {
    label: string;
    data: ChartDataPoint[];
    color: string;
  }[];
}

// Component Props Types
export interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: string;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  device: string;
  ipAddress: string;
  location: string;
  lastActive: Date;
  createdAt: Date;
  expiresAt: Date;
}

