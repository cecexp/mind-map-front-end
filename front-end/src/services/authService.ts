import axios from 'axios';
import Cookies from 'js-cookie';
import { localStorageService } from './localStorage';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        // En producción, usar la nueva URL del back-end en Vercel
        return 'https://mind-map-back-end.vercel.app/api';
    } else {
        // En desarrollo, usar localhost o variable de entorno
        return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    }
};

const API_BASE_URL = getApiBaseUrl();

// Configure axios defaults
axios.defaults.withCredentials = true;

export interface User {
    id: string;
    username: string;
    email: string;
    isEmailVerified: boolean;
    twoFactorEnabled: boolean;
    lastActivity?: string;
    createdAt?: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    data?: {
        user: User;
        token: string;
    };
    requiresTwoFactor?: boolean;
    userId?: string;
    errors?: any[];
}

export interface PasswordStrength {
    isValid: boolean;
    score: number;
    criteria: {
        minLength: boolean;
        hasLowercase: boolean;
        hasUppercase: boolean;
        hasNumber: boolean;
        hasSpecialChar: boolean;
    };
    strength: 'weak' | 'medium' | 'strong';
}

class AuthService {
    private token: string | null = null;
    private user: User | null = null;
    private sessionTimer: NodeJS.Timeout | null = null;

    constructor() {
        this.token = Cookies.get('auth_token') || null;
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                this.user = JSON.parse(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
            }
        }

        // Set up axios interceptor for adding auth token
        axios.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Set up axios interceptor for handling auth errors
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    console.warn('Authentication failed - redirecting to login');
                    this.logout();
                    window.location.href = '/login';
                } else if (error.response?.status === 403) {
                    // Access denied - user doesn't have permission
                    console.warn('Access denied - insufficient permissions');
                    // Don't logout for 403, just show error to user
                }
                return Promise.reject(error);
            }
        );

        // Start session timeout if user is logged in
        if (this.token && this.user) {
            this.startSessionTimeout();
        }
    }

    // Start session timeout (30 minutes)
    private startSessionTimeout = () => {
        this.clearSessionTimeout();
        this.sessionTimer = setTimeout(() => {
            this.logout();
            alert('Session expired due to inactivity');
            window.location.href = '/login';
        }, 30 * 60 * 1000); // 30 minutes
    };

    // Clear session timeout
    private clearSessionTimeout = () => {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    };

    // Reset session timeout (call on user activity)
    resetSessionTimeout = () => {
        if (this.token) {
            this.startSessionTimeout();
        }
    };

    // Register new user
    register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
        try {
            console.log('🚀 Starting registration request:', { username, email });
            console.log('📍 API URL:', `${API_BASE_URL}/auth/register`);

            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                username,
                email,
                password
            });

            console.log('✅ Registration response received:', response.data);

            if (response.data.success && response.data.data) {
                this.setAuthData(response.data.data.token, response.data.data.user);
                console.log('✅ Registration successful, user stored');
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Registration error:', error);
            console.error('❌ Response data:', error.response?.data);
            console.error('❌ Response status:', error.response?.status);

            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed',
                errors: error.response?.data?.errors
            };
        }
    };

    // Login user
    login = async (username: string, password: string, twoFactorCode?: string): Promise<AuthResponse> => {
        try {
            console.log('🔐 Starting login request:', { username });
            console.log('📍 API URL:', `${API_BASE_URL}/auth/login`);

            const requestData = {
                username,
                password,
                twoFactorCode
            };

            console.log('📦 Login request data:', { username, twoFactorCode });

            const response = await axios.post(`${API_BASE_URL}/auth/login`, requestData);

            console.log('✅ Login response received:', response.data);

            if (response.data.success && response.data.data) {
                this.setAuthData(response.data.data.token, response.data.data.user);
                console.log('✅ Login successful, user stored');
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Login error:', error);
            console.error('❌ Response data:', error.response?.data);
            console.error('❌ Response status:', error.response?.status);

            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    // Logout user
    logout = async () => {
        console.log(`🚪 LOGOUT STARTED for user: ${this.user?.username} (id: ${this.user?.id})`);

        // BEFORE logout - check localStorage content
        if (this.user) {
            const userKey = `mindmaps_local_storage_${this.user.id}`;
            const userMaps = localStorage.getItem(userKey);
            console.log(`📦 BEFORE LOGOUT - ${userKey}:`, userMaps ? JSON.parse(userMaps).length + ' maps' : 'no maps');
        }

        try {
            if (this.token) {
                await axios.post(`${API_BASE_URL}/auth/logout`);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuthData();
            console.log('🚪 LOGOUT COMPLETED, auth data cleared');

            // AFTER logout - check if localStorage still has the data
            const allKeys = Object.keys(localStorage).filter(key => key.includes('mindmaps'));
            console.log('📦 AFTER LOGOUT - remaining localStorage keys:', allKeys);
            allKeys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const maps = JSON.parse(data);
                        console.log(`  ${key}: ${maps.length} maps remaining`);
                    } catch (e) {
                        console.log(`  ${key}: invalid data`);
                    }
                }
            });
        }
    };

    // Check password strength
    checkPasswordStrength = async (password: string): Promise<PasswordStrength | null> => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/check-password-strength`, {
                password
            });
            return response.data.data;
        } catch (error) {
            console.error('Password strength check error:', error);
            return null;
        }
    };

    // Get user profile
    getProfile = async (): Promise<User | null> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/profile`);
            if (response.data.success) {
                this.user = response.data.data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                return this.user;
            }
            return null;
        } catch (error) {
            console.error('Get profile error:', error);
            return null;
        }
    };

    // Setup two-factor authentication
    setupTwoFactor = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/2fa/setup`);
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to setup 2FA'
            };
        }
    };

    // Verify two-factor authentication
    verifyTwoFactor = async (token: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/2fa/verify`, { token });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to verify 2FA'
            };
        }
    };

    // Disable two-factor authentication
    disableTwoFactor = async (password: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/2fa/disable`, { password });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to disable 2FA'
            };
        }
    };

    // Set authentication data and migrate maps
    private setAuthData = (token: string, user: User) => {
        console.log(`🔐 LOGIN STARTED: user ${user.username} (id: ${user.id})`);

        // BEFORE setting auth data - check what's in localStorage
        const allKeys = Object.keys(localStorage).filter(key => key.includes('mindmaps'));
        console.log('📦 BEFORE LOGIN - existing localStorage keys:', allKeys);
        allKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const maps = JSON.parse(data);
                    console.log(`  ${key}: ${maps.length} maps`);
                } catch (e) {
                    console.log(`  ${key}: invalid data`);
                }
            }
        });

        this.token = token;
        this.user = user;

        // Store token in httpOnly cookie (secure)
        Cookies.set('auth_token', token, {
            expires: 7, // 7 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user));

        // AFTER setting auth data - check user's specific storage
        const userKey = `mindmaps_local_storage_${user.id}`;
        const userMaps = localStorage.getItem(userKey);
        console.log(`📦 AFTER LOGIN - ${userKey}:`, userMaps ? JSON.parse(userMaps).length + ' maps' : 'no maps found');

        // Migrate old global maps (one-time migration)
        const globalMigrated = localStorageService.migrateOldGlobalMaps();
        if (globalMigrated > 0) {
            console.log(`✅ Successfully migrated ${globalMigrated} old maps to your account!`);
        }

        // Migrate anonymous maps to this user account
        const migratedCount = localStorageService.migrateAnonymousMaps();
        if (migratedCount > 0) {
            console.log(`✅ Successfully migrated ${migratedCount} anonymous maps to your account!`);
        }

        // Start session timeout
        this.startSessionTimeout();
    };

    // Clear authentication data and cleanup
    private clearAuthData = () => {
        console.log(`🧹 clearAuthData: cleaning up for user ${this.user?.username} (id: ${this.user?.id})`);

        // Important: Cleanup user-specific localStorage data BEFORE clearing user
        // so that getUserStorageKey() can still access the current user
        localStorageService.cleanupUserData();

        // Now clear authentication data
        this.token = null;
        this.user = null;
        Cookies.remove('auth_token');
        localStorage.removeItem('user');
        this.clearSessionTimeout();

        console.log('🧹 clearAuthData: cleanup completed');
    };

    // Get current user
    getCurrentUser = (): User | null => {
        return this.user;
    };

    // Check if user is authenticated
    isAuthenticated = (): boolean => {
        return !!(this.token && this.user);
    };

    // Get auth token
    getToken = (): string | null => {
        return this.token;
    };
}

// Create singleton instance
const authService = new AuthService();

// Add event listeners for user activity to reset session timeout
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
activityEvents.forEach(event => {
    document.addEventListener(event, () => {
        authService.resetSessionTimeout();
    }, { passive: true });
});

export default authService;