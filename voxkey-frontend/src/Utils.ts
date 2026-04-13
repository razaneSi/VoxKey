/**
 * Format a date to a readable string
 */
export const formatDate = (date: Date | string, locale = 'fr-FR'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format a date and time to a readable string
 */
export const formatDateTime = (
  date: Date | string,
  locale = 'fr-FR'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format time relative to now (e.g., "2 hours ago")
 */
export const formatTimeAgo = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;

  return formatDate(d);
};

/**
 * Format a number as a percentage
 */
export const formatPercent = (value: number, decimals = 0): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format a number with thousands separator
 */
export const formatNumber = (value: number, decimals = 0): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Debounce a function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle a function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Check if a string is a valid email
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Check if a string is a strong password
 */
export const isStrongPassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
};

/**
 * Get color based on status or value
 */
export const getStatusColor = (
  status: 'success' | 'warning' | 'error' | 'info' | 'pending'
): string => {
  const colors = {
    success: '#00ff88',
    warning: '#ffa500',
    error: '#ff4444',
    info: '#00d4ff',
    pending: '#ffff00',
  };
  return colors[status] || colors.info;
};

/**
 * Get authentication score color gradient
 */
export const getScoreColor = (score: number): string => {
  if (score >= 90) return '#00ff88';
  if (score >= 75) return '#00ffc8';
  if (score >= 60) return '#ffa500';
  return '#ff4444';
};

/**
 * Get score status text
 */
export const getScoreStatus = (
  score: number
): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
};

/**
 * Clone a deep object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Merge two objects recursively
 */
export const mergeObjects = <T extends object>(
  target: T,
  source: Partial<T>
): T => {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const targetValue = target[key];
      const sourceValue = source[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = mergeObjects(
          targetValue as object,
          sourceValue as object
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
};

/**
 * Generate a random string
 */
export const generateRandomString = (length = 16): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * UUID v4 generator
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Safe localStorage getter
 */
export const getLocalStorage = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : (defaultValue ?? null);
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue ?? null;
  }
};

/**
 * Safe localStorage setter
 */
export const setLocalStorage = <T>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Remove from localStorage
 */
export const removeLocalStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Slugify a string
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Truncate a string with ellipsis
 */
export const truncate = (str: string, length = 50): string => {
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return /mobile|android|iphone|ipad|ipod|phone/i.test(ua);
};

/**
 * Get browser name
 */
export const getBrowserName = (): string => {
  const ua = navigator.userAgent;
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  if (ua.indexOf('Opera') > -1) return 'Opera';
  return 'Unknown';
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
};

/**
 * Sleep/delay utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxAttempts - 1) {
        await sleep(delayMs * Math.pow(2, i));
      }
    }
  }

  throw lastError;
};