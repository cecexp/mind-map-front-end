import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://mind-map-back-end.vercel.app/api'
    : 'http://localhost:5000/api';

export const login = async (username: string, password: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            username,
            password
        }, { withCredentials: true });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { success: false, message: error.message || 'Network error' };
    }
};

export const register = async (username: string, email: string, password: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            username,
            email,
            password
        }, { withCredentials: true });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { success: false, message: error.message || 'Network error' };
    }
};

export const checkPasswordStrength = async (password: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/check-password-strength`, {
            password
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { success: false, message: error.message || 'Network error' };
    }
};
