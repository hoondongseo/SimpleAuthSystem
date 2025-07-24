import React, { useState, useContext } from "react";
import { AuthContext } from "./components/context/AuthContext";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import Dashboard from "./components/Dashboard/Dashboard";
import "./App.css";

function App() {
	const [currentView, setCurrentView] = useState("login");
	const { user } = useContext(AuthContext); // 🔑 핵심! 로그인 상태 확인

	// 로그인되어 있으면 대시보드 보여주기
	if (user) {
		return <Dashboard />;
	}

	// 로그인 안되어 있으면 로그인/회원가입 폼 보여주기
	return (
		<div className="App">
			{currentView === "login" ? (
				<LoginForm
					onSwitchToRegister={() => setCurrentView("register")}
				/>
			) : (
				<RegisterForm onSwitchToLogin={() => setCurrentView("login")} />
			)}
		</div>
	);
}

export default App;
