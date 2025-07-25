import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);

	// 앱 시작할 때 저장된 토큰으로 사용자 정보 불러오기
	useEffect(() => {
		const token = localStorage.getItem("accessToken");
		if (!token) return;
		api.get("/auth/me")
			.then((res) => setUser(res.data.user))
			.catch(() => {
				localStorage.removeItem("accessToken");
				setUser(null);
			});
	}, []);

	// 로그인 함수
	const login = async (email, password) => {
		const res = await api.post("/auth/login", { email, password });
		const {
			accessToken,
			refreshToken,
			data: { user },
		} = res.data;
		localStorage.setItem("accessToken", accessToken);
		localStorage.setItem("refreshToken", refreshToken);
		setUser(user);
		return res;
	};

	// 로그아웃 함수
	const logout = async () => {
		try {
			// 토큰이 있을 때만 서버에 로그아웃 알리기
			const token = localStorage.getItem("accessToken");
			if (token) {
				await api.post("/auth/logout");
			}
		} catch (error) {
			// 서버 에러가 있어도 로컬에서는 로그아웃 진행
			console.warn("서버 로그아웃 실패, 로컬 로그아웃 진행:", error);
		} finally {
			// 어떤 경우든 로컬 상태는 정리
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			setUser(null);
		}
	};

	return (
		<AuthContext.Provider value={{ user, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
