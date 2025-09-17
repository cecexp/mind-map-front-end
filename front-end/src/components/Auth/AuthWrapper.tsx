import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { useUser } from '../../contexts/UserContext';

interface AuthWrapperProps {
    children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
    const { isAuthenticated, isLoading, checkAuthStatus } = useUser();
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

    const handleAuthSuccess = async () => {
        // Trigger a re-check of auth status to update the context
        await checkAuthStatus();
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1.2rem'
            }}>
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        if (authMode === 'login') {
            return (
                <Login
                    onSuccess={handleAuthSuccess}
                    onSwitchToRegister={() => setAuthMode('register')}
                />
            );
        } else {
            return (
                <Register
                    onSuccess={handleAuthSuccess}
                    onSwitchToLogin={() => setAuthMode('login')}
                />
            );
        }
    }

    // Pass user data and logout function to children
    return (
        <div>
            {children}
        </div>
    );
};

export default AuthWrapper;