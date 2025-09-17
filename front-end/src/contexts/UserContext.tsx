import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { User } from '../services/authService';
import { localStorageService } from '../services/localStorage';

interface UserContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    updateUser: (user: User) => void;
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

interface UserProviderProps {
    children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const checkAuthStatus = async () => {
        setIsLoading(true);
        try {
            const currentUser = authService.getCurrentUser();
            const token = authService.getToken();

            console.log('🔍 CheckAuthStatus - Current user:', currentUser);
            console.log('🔍 CheckAuthStatus - Token exists:', !!token);

            if (currentUser && token) {
                // Verify token is still valid by fetching profile
                try {
                    console.log('🔍 Fetching profile to verify token...');
                    const profile = await authService.getProfile();
                    console.log('🔍 Profile fetch result:', profile);

                    if (profile) {
                        console.log('✅ Profile valid, setting authenticated state');
                        setUser(profile);
                        setIsAuthenticated(true);
                    } else {
                        console.log('❌ Profile invalid, clearing auth data');
                        // Token invalid, clear auth data
                        await authService.logout();
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    console.error('❌ Profile fetch error:', error);
                    await authService.logout();
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                console.log('🔍 No user or token found, setting unauthenticated');
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('❌ Auth check error:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = (newUser: User) => {
        setUser(newUser);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const value: UserContextType = {
        user,
        isAuthenticated,
        isLoading,
        updateUser,
        logout,
        checkAuthStatus
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};