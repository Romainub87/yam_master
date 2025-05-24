import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/models/User';
import {jwtDecode} from "jwt-decode";
import { API_URL } from '@env';

interface AuthContextType {
    user: User | null;
    userToken: string | null;
    isLoading: boolean;
    login: (token: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    const decodedToken: { user: User; exp: number; iat: number } = jwtDecode(token);
                    if (decodedToken.exp * 1000 > Date.now()) {
                        setUserToken(token);
                        setUser(decodedToken.user);
                    } else {
                        await refreshToken();
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (token: string, refreshToken: string) => {
        setUserToken(token);
        const decodedToken: { user: User; exp: number; iat: number } = jwtDecode(token);

        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        setUser(decodedToken.user);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('refreshToken');
        setUserToken(null);
        setUser(null);
    };

    const refreshToken = async () => {
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
            await logout();
            return;
        }

        try {
            const response = await fetch(API_URL+'auth/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: storedRefreshToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            await login(data.token, storedRefreshToken);
        } catch (error) {
            console.error('Error refreshing token:', error);
            await logout();
        }
    };

    return (
        <AuthContext.Provider value={{ user, userToken, isLoading, login, logout, refreshToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
