import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // 앱 시작할 때 저장된 토큰으로 사용자 정보 불러오기
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        api.get('/auth/me')
            .then(res => setUser(res.data.user))
            .catch(() => {
                localStorage.removeItem('accessToken');
                setUser(null);
            });
    }, []);

    // 로그인 함수
    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { accessToken, data: { user } } = res.data;
        localStorage.setItem('accessToken', accessToken);
        setUser(user);
        return res;
    };

    // 로그아웃 함수
    const logout = async () => {
        await api.post('/auth/logout'); // 서버에 로그아웃 알리기
        localStorage.removeItem('accessToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};