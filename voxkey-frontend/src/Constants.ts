/**
 * Application Constants
 */

// Environment
export const ENV = process.env.NODE_ENV || 'development';
export const IS_DEV = ENV === 'development';
export const IS_PROD = ENV === 'production';

// API Configuration
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const API_TIMEOUT = 30000; // 30 seconds

// Authentication
export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_DATA_KEY = 'user_data';
export const AUTH_HEADER_PREFIX = 'Bearer';

// Features
export const ENABLE_AUDIO = process.env.REACT_APP_ENABLE_AUDIO !== 'false';
export const ENABLE_KEYBOARD = process.env.REACT_APP_ENABLE_KEYBOARD !== 'false';
export const ENABLE_ANALYTICS = process.env.REACT_APP_ENABLE_ANALYTICS !== 'false';

// Polling intervals (milliseconds)
export const POLL_INTERVAL = parseInt(process.env.REACT_APP_POLL_INTERVAL || '5000');
export const SCORE_UPDATE_INTERVAL = 3000;
export const ACTIVITY_UPDATE_INTERVAL = 10000;

// Audio settings
export const AUDIO_SAMPLE_RATE = parseInt(process.env.REACT_APP_AUDIO_SAMPLE_RATE || '16000');
export const AUDIO_CHANNELS = parseInt(process.env.REACT_APP_AUDIO_CHANNELS || '1');
export const AUDIO_MIME_TYPE = 'audio/webm;codecs=opus';

// Keyboard tracking
export const KEYBOARD_SAMPLE_WINDOW = 5000; // 5 seconds
export const MIN_KEYSTROKES_FOR_ANALYSIS = 5;

// Session management
export const SESSION_TIMEOUT = parseInt(process.env.REACT_APP_SESSION_TIMEOUT || '3600000'); // 1 hour
export const SESSION_WARNING_TIME = SESSION_TIMEOUT - 600000; // Warn 10 mins before timeout

// Authentication thresholds
export const MIN_AUTH_SCORE = 75; // Minimum authentication score
export const HIGH_RISK_SCORE = 50; // Score below this triggers alerts
export const EXCELLENT_SCORE = 90; // Score above this is excellent

// Rate limiting
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_ATTEMPT_WINDOW = 300000; // 5 minutes
export const RATE_LIMIT_DELAY = 1000; // ms between requests

// Analytics
export const ANALYTICS_BATCH_SIZE = 10;
export const ANALYTICS_FLUSH_INTERVAL = 60000; // 1 minute

// Debug
export const DEBUG_MODE = process.env.REACT_APP_DEBUG === 'true';
export const LOG_REQUESTS = DEBUG_MODE;
export const LOG_RESPONSES = DEBUG_MODE;

// URLs
export const DOCS_URL = 'https://docs.bioauth.local';
export const SUPPORT_URL = 'https://support.bioauth.local';
export const TERMS_URL = '/terms';
export const PRIVACY_URL = '/privacy';

// Color scheme
export const COLORS = {
  primary: '#00ffc8',
  secondary: '#00d4ff',
  accent: '#ff00ff',
  success: '#00ff88',
  warning: '#ffa500',
  danger: '#ff4444',
  info: '#00d4ff',
  bg_dark: '#0a0e27',
  bg_darker: '#050811',
  bg_surface: '#1a1f3a',
  bg_card: '#0f1422',
} as const;

// Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',

  // Dashboard
  DASHBOARD: '/dashboard',
  DASHBOARD_SCORE: '/dashboard/auth-score',
  DASHBOARD_ACTIVITIES: '/dashboard/activities',
  DASHBOARD_REALTIME: '/dashboard/realtime-scores',

  // Biometrics
  VOICE_METRICS: '/biometrics/voice',
  VOICE_SUBMIT: '/biometrics/voice/submit',
  KEYBOARD_METRICS: '/biometrics/keyboard',
  KEYBOARD_SUBMIT: '/biometrics/keyboard/submit',

  // System
  SYSTEM_STATUS: '/system/status',

  // User
  USER_PROFILE: '/user/profile',
  USER_CHANGE_PASSWORD: '/user/change-password',

  // Settings
  SETTINGS: '/settings',

  // Analytics
  ANALYTICS: '/analytics',
} as const;

// Activity types
export const ACTIVITY_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
} as const;

// System status values
export const SYSTEM_STATUS_VALUES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DEGRADED: 'degraded',
  ERROR: 'error',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Erreur de connexion. Veuillez vérifier votre connexion Internet.',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action.',
  FORBIDDEN: 'Accès refusé.',
  NOT_FOUND: 'La ressource demandée n\'a pas été trouvée.',
  SERVER_ERROR: 'Une erreur serveur s\'est produite. Veuillez réessayer plus tard.',
  TIMEOUT: 'La requête a expiré. Veuillez réessayer.',
  INVALID_CREDENTIALS: 'Nom d\'utilisateur ou mot de passe incorrect.',
  EMAIL_EXISTS: 'Un compte avec cet email existe déjà.',
  USERNAME_EXISTS: 'Ce nom d\'utilisateur est déjà pris.',
  WEAK_PASSWORD: 'Le mot de passe ne répond pas aux critères de sécurité.',
  SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
  DEVICE_NOT_SUPPORTED: 'Votre appareil ne supporte pas cette fonctionnalité.',
  MICROPHONE_PERMISSION: 'Accès au microphone refusé. Veuillez autoriser l\'accès.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Connexion réussie.',
  REGISTER: 'Inscription réussie. Bienvenue!',
  LOGOUT: 'Déconnexion réussie.',
  PROFILE_UPDATED: 'Profil mis à jour avec succès.',
  PASSWORD_CHANGED: 'Mot de passe changé avec succès.',
  SETTINGS_SAVED: 'Paramètres enregistrés avec succès.',
  VOICE_SUBMITTED: 'Exemple vocal soumis avec succès.',
  KEYBOARD_SUBMITTED: 'Données clavier soumises avec succès.',
} as const;

// Validation rules
export const VALIDATION_RULES = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PHONE_PATTERN: /^[\d\s\-\+\(\)]+$/,
} as const;

// Biometric thresholds
export const BIOMETRIC_THRESHOLDS = {
  MFCC_MIN: 0,
  MFCC_MAX: 100,
  ENERGY_MIN: 0,
  ENERGY_MAX: 100,
  FF_MIN: 0,
  FF_MAX: 100,
  VOICE_THRESHOLD: 75,
  KEYBOARD_THRESHOLD: 75,
} as const;

// Analytics dimensions
export const ANALYTICS_DIMENSIONS = {
  TIME_RANGE_7D: '7d',
  TIME_RANGE_30D: '30d',
  TIME_RANGE_90D: '90d',
  AUTH_METHOD_VOICE: 'voice',
  AUTH_METHOD_KEYBOARD: 'keyboard',
  AUTH_METHOD_HYBRID: 'hybrid',
} as const;

// Cache settings
export const CACHE_DURATION = {
  SHORT: 300000, // 5 minutes
  MEDIUM: 900000, // 15 minutes
  LONG: 3600000, // 1 hour
} as const;

// Responsive breakpoints
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1440,
  ULTRA_WIDE: 1920,
} as const;

// Animation durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 600,
} as const;

// Z-index layers
export const Z_INDEX = {
  DROPDOWN: 100,
  MODAL: 500,
  TOAST: 1000,
  HEADER: 100,
} as const;

// Default pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Export all constants
export default {
  ENV,
  IS_DEV,
  IS_PROD,
  API_BASE_URL,
  API_TIMEOUT,
  AUTH_TOKEN_KEY,
  ENABLE_AUDIO,
  ENABLE_KEYBOARD,
  COLORS,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};