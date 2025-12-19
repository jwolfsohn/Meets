import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

interface User {
    id: number;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    profileComplete: boolean;
    login: (token: string, user: User, profileComplete: boolean) => void;
    logout: () => void;
    refresh: () => Promise<void>;
    isAuthenticated: boolean;
    isReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [profileComplete, setProfileComplete] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedProfileComplete = localStorage.getItem('profileComplete');
        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                // invalid user json
                logout();
            }
        }
        if (storedProfileComplete) setProfileComplete(storedProfileComplete === 'true');
    }, []);

    const login = (newToken: string, newUser: User, nextProfileComplete: boolean) => {
        setToken(newToken);
        setUser(newUser);
        setProfileComplete(!!nextProfileComplete);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('profileComplete', String(!!nextProfileComplete));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setProfileComplete(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('profileComplete');
    };

    const refresh = async () => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) return;
        try {
            const res = await api.get('/api/auth/me');
            setUser(res.data.user);
            setProfileComplete(!!res.data.profileComplete);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            localStorage.setItem('profileComplete', String(!!res.data.profileComplete));
        } catch {
            logout();
        }
    };

    useEffect(() => {
        // Validate stored token (and fetch profile completion state) once on boot.
        (async () => {
            try {
                await refresh();
            } finally {
                setIsReady(true);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = useMemo(
        () => ({
            user,
            token,
            profileComplete,
            login,
            logout,
            refresh,
            isAuthenticated: !!token,
            isReady,
        }),
        [user, token, profileComplete, isReady]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
