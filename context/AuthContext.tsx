import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/models/User';
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
    user: User | null;
    userToken: string | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
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
                    setUserToken(token);
                }
                if (token) {
                    const decodedToken: {
                        user: User;
                        exp: number;
                        iat: number;
                    } = jwtDecode(token);
                    setUser(decodedToken.user);
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (token: string) => {
        setUserToken(token);
        const decodedToken : {
            user: User;
            exp: number;
            iat: number;
        } = jwtDecode(token);

        await AsyncStorage.setItem('userToken', token);
        setUser(decodedToken.user);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('userToken');
        setUserToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, userToken, isLoading, login, logout }}>
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